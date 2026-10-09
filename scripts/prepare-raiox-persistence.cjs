'use strict';
// Deterministic source patch. Only the isolated work branch runs this.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const expected = {
  'raiox01/raiox01.js': '370e5749a1d8300cd85931b2af201448f80a7c69',
  'raiox02/raiox02.js': '72ab4e5c146c1855f3e64518ebf8ac3e0a5f1d7e',
  'raiox01/index.html': 'ef7d7f2d69c3544c123b865d6aac9628d83cb35d',
  'raiox02/index.html': '74d4ef841e9372dbb307333de46243e331445f9d'
};
const originals = {};
for (const [path, sha] of Object.entries(expected)) {
  const bytes = fs.readFileSync(path);
  const actual = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(actual, sha, `Source changed: ${path}. Reconcile before patching.`);
  originals[path] = bytes.toString('utf8');
}
function once(text, old, replacement) {
  assert.equal(text.split(old).length - 1, 1, `Expected exactly one patch target: ${old.slice(0, 100)}`);
  return text.replace(old, replacement);
}
function section(text, start, end, replacement) {
  assert.equal(text.split(start).length - 1, 1, `Ambiguous start: ${start}`);
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert(b > a, `Missing end: ${end}`);
  return text.slice(0, a) + replacement.trimEnd() + '\n\n' + text.slice(b);
}
const persistence = String.raw`let leadSavePromise = null;
let leadSaveInFlight = false;
let leadPersistenceBlocked = false;

function requireStoredAck(result) {
  if (!result || result.ok !== true || result.stored !== true) throw new Error("persistence_not_confirmed");
  return result;
}

function attemptLeadSave(honey = "") {
  if (leadSaveInFlight && leadSavePromise) return leadSavePromise;
  if (!state.lead) return Promise.resolve(false);
  leadPersistenceBlocked = Boolean(String(honey || "").trim());
  leadSaveInFlight = true;
  const submittedLead = {...state.lead};
  // RX preserves event IDs for retries and resolves only after a matching ACK.
  // No detached retries that could acknowledge edited form data.
  leadSavePromise = Promise.resolve()
    .then(() => RX.saveLead(submittedLead, honey))
    .then(result => {
      requireStoredAck(result);
      state.leadSaved = true;
      return true;
    })
    .catch(() => {
      state.leadSaved = false;
      RX.emit("rx_form_submit_error", {error_code:leadPersistenceBlocked ? "invalid_form" : "save_failed"});
      return false;
    })
    .finally(() => { leadSaveInFlight = false; });
  return leadSavePromise;
}

async function ensureLeadSaved() {
  if (state.leadSaved) return true;
  if (leadSaveInFlight && leadSavePromise && await leadSavePromise) return true;
  throw new Error("lead_not_confirmed");
}

// Each preceding operation is acknowledged before this finalization boundary.
async function flushOperationalSaves() {
  await ensureLeadSaved();
}`;
const answer = String.raw`async function answerStep(step, optionIndex, button) {
  if (button.disabled || STEPS[state.stepIndex]?.id !== step.id) return;
  const option = step.options[optionIndex];
  if (!option) return;
  const buttons = [...document.querySelectorAll(".option")];
  buttons.forEach(item => item.disabled = true);
  button.classList.add("selected");
  button.setAttribute("aria-busy", "true");
  clearSaveError();
  const stepIndex = state.stepIndex + 1;
  const completed = state.completedSteps.includes(step.id) ? [...state.completedSteps] : [...state.completedSteps, step.id];
  const details = {question_id:step.id,option_index:optionIndex,answer_label:option.label,selected_profile:option.profile||undefined,step_index:stepIndex,option_count:step.options.length,completed_steps:completed};
  try {
    await ensureLeadSaved();
    requireStoredAck(await RX.saveProgress("quiz_answer", details));
    if (option.profile) state.profile = option.profile;
    state.answers[step.id] = option.label;
    state.answerIndexes[step.id] = optionIndex;
    markStepCompleted(step.id);
    RX.emit("quiz_step_complete", {step_id:step.id,step_index:stepIndex,step_type:step.type});
    state.stepIndex += 1;
    if (state.stepIndex >= STEPS.length) state.screen = "loading";
    RX.saveCheckpoint(state);
    render();
  } catch (_) {
    button.classList.remove("selected");
    buttons.forEach(item => item.disabled = false);
    showSaveError("Não conseguimos confirmar esta resposta. Confira sua conexão e clique novamente; você continua nesta pergunta.");
  } finally {
    button.removeAttribute("aria-busy");
  }
}`;
const insightOld = String.raw`  document.querySelector("#continue-button").addEventListener("click", () => {
    const button=document.querySelector("#continue-button");button.disabled=true;clearSaveError();
    const stepIndex=state.stepIndex+1;
    const details={step_id:step.id,step_index:stepIndex,step_type:step.type};
    markStepCompleted(step.id);
    state.stepIndex+=1;
    const checkpoint=makeAcknowledgedCheckpoint();
    queueOperationalSave("insight:"+step.id,"quiz_insight_continue",details,checkpoint);
    render();
  });`;
const insightNew = String.raw`  document.querySelector("#continue-button").addEventListener("click", async () => {
    const button = document.querySelector("#continue-button");
    if (button.disabled || STEPS[state.stepIndex]?.id !== step.id) return;
    const label = button.textContent;
    button.disabled = true; button.textContent = "Salvando..."; button.setAttribute("aria-busy", "true");
    clearSaveError();
    const details = {step_id:step.id,step_index:state.stepIndex+1,step_type:step.type};
    try {
      await ensureLeadSaved();
      requireStoredAck(await RX.saveProgress("quiz_insight_continue", details));
      markStepCompleted(step.id);
      state.stepIndex += 1;
      RX.saveCheckpoint(state);
      render();
    } catch (_) {
      button.disabled = false;
      showSaveError("Não conseguimos confirmar esta etapa. Confira sua conexão e tente novamente.");
    } finally {
      button.textContent = label; button.removeAttribute("aria-busy");
    }
  });`;
const completion = String.raw`let completionInFlight = false;
async function finalizeQuizInBackground() {
  if (completionInFlight || state.screen !== "loading") return;
  completionInFlight = true;
  const retry = document.querySelector("#quiz-save-retry");
  if (retry) { retry.disabled = true; retry.hidden = true; }
  clearSaveError();
  try {
    await ensureLeadSaved();
    await flushOperationalSaves();
    const finalAnswers = STEPS.filter(step => step.type === "question").map(step => {
      const optionIndex = state.answerIndexes[step.id], option = step.options[optionIndex];
      return {question_id:step.id,option_index:optionIndex,answer_label:option?.label||state.answers[step.id]||"",selected_profile:option?.profile||undefined};
    });
    const result = requireStoredAck(await RX.saveProgress("quiz_complete", {step_index:STEPS.length,answers:finalAnswers,completed_steps:[...state.completedSteps]}));
    if (!RX.getTestMode() && (result.quiz_status?.finalizou !== true || result.quiz_status?.status !== "concluido" || Number(result.quiz_status?.perguntas_respondidas) !== 5 || Number(result.quiz_status?.etapas_concluidas) !== 7)) throw new Error("completion_not_confirmed");
    state.screen = "result";
    state.resultViewed = true;
    RX.saveCheckpoint(state);
    window.removeEventListener("online", finalizeQuizInBackground);
    render();
  } catch (_) {
    showSaveError("Não conseguimos confirmar o salvamento final. Suas respostas permanecem nesta página. Confira sua conexão e tente novamente.");
    if (retry) { retry.hidden = false; retry.disabled = false; }
    window.addEventListener("online", finalizeQuizInBackground, {once:true});
  } finally {
    completionInFlight = false;
  }
}

function renderLoading() {
  root.innerHTML = panel('<span class="eyebrow">Seu resultado</span><h2>Confirmando suas respostas</h2><p class="lead" role="status">Estamos salvando sua última etapa.</p><div class="fixed-cta"><button class="button button-primary" id="quiz-save-retry" type="button" hidden>Tentar salvar novamente</button></div>');
  document.querySelector("#quiz-save-retry").addEventListener("click", finalizeQuizInBackground);
  void finalizeQuizInBackground();
}`;
const formOld = String.raw`  button.disabled=true;document.querySelector("#form-error").textContent="";
  state.lead=lead;
  saveCheckoutPrefill(lead);
  const honey=form.get("company_website");
  void attemptLeadSave(honey);`;
const formNew = String.raw`  const label = button.textContent;
  const controls = [...element.querySelectorAll("input,select,textarea")].map(input => ({input,disabled:input.disabled}));
  button.disabled = true; button.textContent = "Salvando..."; button.setAttribute("aria-busy", "true");
  controls.forEach(({input}) => input.disabled = true);
  document.querySelector("#form-error").textContent = "";
  state.lead = lead;
  state.leadSaved = false;
  let saved = false;
  try {
    saved = await attemptLeadSave(form.get("company_website"));
  } finally {
    controls.forEach(({input,disabled}) => input.disabled = disabled);
    button.disabled = false; button.textContent = label; button.removeAttribute("aria-busy");
  }
  if (!saved) {
    document.querySelector("#form-error").textContent = leadPersistenceBlocked
      ? "Não foi possível validar o cadastro. Recarregue a página e preencha novamente."
      : "Não conseguimos salvar seu cadastro. Seus dados continuam preenchidos; confira sua conexão e tente novamente.";
    return;
  }
  saveCheckoutPrefill(lead);`;
const patched = {};
for (const page of ['raiox01','raiox02']) {
  const path = `${page}/${page}.js`;
  let text = originals[path];
  text = section(text, 'let leadSavePromise = null;', 'function getTrackingParams()', persistence);
  text = once(text, 'if(button.disabled)return;', 'if(button.disabled || leadSaveInFlight)return;');
  text = once(text, formOld, formNew);
  text = once(text, '  state.screen="step";\n  render();\n}\n\nfunction validateLead', '  state.screen="step";\n  RX.saveCheckpoint(state);\n  render();\n}\n\nfunction validateLead');
  text = once(text, insightOld, insightNew);
  text = section(text, 'function answerStep(step, optionIndex, button)', 'let completionInFlight=false;', answer);
  text = section(text, 'let completionInFlight=false;', 'function renderResult()', completion);
  text = once(text, "screen:count<7?'step':resumed.screen==='result'?'result':'loading'", "screen:count<7?'step':'loading'");
  assert(!text.includes('queueOperationalSave('));
  assert(!text.includes('void attemptLeadSave('));
  patched[path] = text;
  patched[`${page}/index.html`] = once(originals[`${page}/index.html`], `${page}.js?v=20261006-lead-persistence-v2`, `${page}.js?v=20261009-confirmed-persistence-v3`);
}
// Validate all targets before writing. No database, credentials or other pages.
for (const [path,text] of Object.entries(patched)) fs.writeFileSync(path,text);
console.log(JSON.stringify({changed:Object.keys(patched),build:'20261009-confirmed-persistence-v3'},null,2));
