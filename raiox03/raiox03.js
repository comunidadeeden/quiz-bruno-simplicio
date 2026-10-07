const RAIOX_CONFIG = {
  checkoutUrl: "https://pay.hub.la/XhmUngrBMRpSh984fDuG",
  leadWebhookUrl: window.RX_CONFIG.webhookUrl,
  source: "quiz_raiox03",
  workshopDateText: "13 e 14 de Outubro, às 20h · ao vivo",
  priceText: "R$37",
  ctaDelaySeconds: 60
};

function checkoutPrefillKey() {
  return `rx03_checkout_prefill_${state?.submissionId || window.RX.getSessionId()}`;
}

function saveCheckoutPrefill(lead) {
  if (!lead) return;
  try {
    sessionStorage.setItem(checkoutPrefillKey(), JSON.stringify({
      name: String(lead.name || "").trim(),
      email: String(lead.email || "").trim().toLowerCase(),
      phone: String(lead.phone || "").trim()
    }));
  } catch (_) {}
}

function getCheckoutPrefill() {
  if (state?.lead?.email) return state.lead;
  try {
    const raw = sessionStorage.getItem(checkoutPrefillKey());
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return null;
    const email = String(saved.email || "").trim().toLowerCase();
    const name = String(saved.name || "").trim();
    const phone = String(saved.phone || "").trim();
    if (!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { name, email, phone };
  } catch (_) {
    return null;
  }
}

function splitBrazilPhoneForCheckout(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (digits.length !== 10 && digits.length !== 11) return null;
  return { areaCode: digits.slice(0, 2), number: digits.slice(2) };
}

const VSL_PLAYERS = {
  terapeuta: {
    id: "vid-6abe93baef1e567f6a5759c7",
    scriptUrl: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6abe93baef1e567f6a5759c7/v4/player.js"
  },
  nao_terapeuta: {
    id: "vid-6abe93baef1e567f6a5759c7",
    scriptUrl: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6abe93baef1e567f6a5759c7/v4/player.js"
  }
};

const STEPS = [
  {
    id: "profile",
    type: "question",
    label: "Perfil",
    text: "Em qual situação seria mais valioso compreender uma pessoa antes da primeira conversa?",
    options: [
      { label: "Antes ou durante um atendimento terapêutico.", profile: "terapeuta" },
      { label: "Para começar uma nova atuação como terapeuta.", profile: "futuro_terapeuta" },
      { label: "Ao contratar, liderar, negociar, vender ou trabalhar com pessoas.", profile: "profissional_de_pessoas" },
      { label: "Antes de confiar, me envolver ou tomar decisões na vida pessoal.", profile: "vida_pessoal" }
    ]
  },
  {
    id: "body_reading",
    type: "question",
    label: "Seu olhar hoje",
    text: "Hoje, apenas olhando para o corpo de uma pessoa, você conseguiria identificar se ela tende a ser mais racional, emocional, estratégica, resistente ou perfeccionista?",
    options: [
      { label: "Sim, consigo identificar com alguma precisão." },
      { label: "Às vezes tenho uma impressão, mas não sei explicar de onde ela vem." },
      { label: "Consigo perceber algumas características, mas ainda tenho muitas dúvidas." },
      { label: "Não. Eu nem sabia que o formato do corpo poderia revelar esses traços." }
    ]
  },
  {
    id: "insight_body",
    type: "insight",
    title: "O corpo não mostra apenas aparência.",
    body: "Na metodologia apresentada no Workshop Raio-X Humano, diferentes formatos, proporções e características corporais são organizados em cinco grandes traços de caráter.",
    bullets: ["forças naturais", "dores emocionais", "mecanismos de defesa", "maneira de pensar", "forma de se relacionar", "tendências de comportamento"],
    footer: "Isso permite começar uma leitura antes mesmo de ouvir a história da pessoa.",
    button: "Continuar"
  },
  {
    id: "desired_reading",
    type: "question",
    label: "O que você busca",
    text: "O que você mais gostaria de conseguir identificar antes de uma pessoa falar?",
    options: [
      { label: "Como ela tende a reagir diante de pressão, críticas e conflitos." },
      { label: "Como ela se relaciona, demonstra afeto e cria vínculos." },
      { label: "Seus pontos fortes, suas dificuldades e a forma como toma decisões." },
      { label: "Possíveis marcas emocionais e mecanismos de defesa que ela carrega." }
    ]
  },
  {
    id: "face_reading",
    type: "question",
    label: "Leitura do rosto",
    text: "Se você recebesse agora a fotografia do rosto de uma pessoa, o que saberia observar?",
    options: [
      { label: "Diferenças entre o lado materno e o lado paterno do rosto." },
      { label: "Sinais na região dos olhos relacionados a peso, ausência ou manipulação." },
      { label: "Assimetrias que podem indicar experiências emocionais diferentes." },
      { label: "Sinceramente, eu não saberia por onde começar." }
    ]
  },
  {
    id: "insight_face",
    type: "insight",
    title: "O rosto também pode ser analisado por regiões.",
    body: "No Workshop, você vai conhecer uma leitura que divide o rosto em:",
    bullets: ["lado direito, relacionado à referência paterna", "lado esquerdo, relacionado à referência materna"],
    footer: "Você também vai aprender a observar indícios na região dos olhos que a metodologia associa a experiências como peso, ausência e manipulação. Não é apenas olhar para uma pessoa e sentir alguma coisa. É saber onde olhar e o que comparar.",
    button: "Quero continuar"
  },
  {
    id: "consequence",
    type: "question",
    label: "O erro que você evita",
    text: "Se você aprendesse a identificar personalidade e tendências de comportamento antes da primeira palavra, qual erro gostaria de evitar?",
    options: [
      { label: "Perder tempo confiando ou me envolvendo com a pessoa errada." },
      { label: "Conduzir um atendimento sem perceber o que existe por trás do relato." },
      { label: "Contratar, negociar ou construir uma parceria baseado apenas no discurso." },
      { label: "Repetir escolhas nos relacionamentos e só enxergar os sinais tarde demais." }
    ]
  }
];

const RESULTS = {
  terapeuta: {
    badge: "Perfil: terapeuta",
    title: "Seu atendimento pode começar antes da primeira pergunta.",
    paragraphs: [
      "Hoje, boa parte da sua compreensão provavelmente depende do que o paciente conta, da forma como ele se comporta durante a sessão e da sua experiência clínica.",
      "Mas o rosto e o corpo podem oferecer novos indícios antes mesmo do relato.",
      "Desenvolver esse olhar pode ajudar você a identificar traços de caráter, mecanismos de defesa, forças e possíveis dores emocionais para conduzir o atendimento com mais precisão."
    ]
  },
  futuro_terapeuta: {
    badge: "Perfil: nova atuação",
    title: "Você pode começar sua trajetória aprendendo a enxergar o que a maioria ainda não observa.",
    paragraphs: [
      "Suas respostas mostram que você não quer apenas acumular teoria sobre comportamento humano.",
      "Você deseja desenvolver uma habilidade prática: olhar para o rosto e para o corpo e saber quais características observar para levantar hipóteses sobre personalidade, traços de caráter e comportamento.",
      "Esse pode ser o primeiro passo para descobrir se essa habilidade faz sentido na sua futura atuação."
    ]
  },
  profissional_de_pessoas: {
    badge: "Perfil: leitura aplicada",
    title: "Você toma decisões sobre pessoas todos os dias — muitas vezes baseado apenas no que elas dizem.",
    paragraphs: [
      "Em contratações, negociações, vendas e liderança, o discurso é apenas uma parte da informação.",
      "Uma pessoa pode apresentar determinadas tendências no formato do corpo, no rosto e na maneira como sua estrutura física se organiza.",
      "Aprender a observar esses sinais pode trazer mais discernimento antes de contratar, delegar, negociar ou construir uma parceria."
    ]
  },
  vida_pessoal: {
    badge: "Perfil: escolhas e relacionamentos",
    title: "Talvez os sinais que você percebeu tarde demais já estivessem visíveis desde o início.",
    paragraphs: [
      "Suas respostas mostram que uma leitura mais treinada poderia ajudar você a escolher melhor quem entra na sua vida, compreender pessoas próximas e reconhecer determinados padrões antes de se envolver profundamente.",
      "A proposta não é viver desconfiando. É desenvolver critérios para enxergar além da primeira impressão e do discurso."
    ]
  }
};

const root = document.querySelector("#quiz-root");
const progressLabel = document.querySelector("#progress-label");
let state = createState();
// Resume only the state whose previous requests were acknowledged; no PII is restored.
const resumed=RX.getCheckpoint();
if(resumed && resumed.leadSaved && resumed.completedSteps.every((id,i)=>STEPS[i]?.id===id)){
  const count=resumed.completedSteps.length;
  const consistent=STEPS.filter(s=>s.type==='question'&&resumed.completedSteps.includes(s.id))
    .every(s=>Number.isInteger(resumed.answerIndexes[s.id])&&resumed.answerIndexes[s.id]>=0&&resumed.answerIndexes[s.id]<s.options.length);
  if(consistent){
    state={...state,...resumed,lead:null,stepIndex:count,screen:count<7?'step':resumed.screen==='result'?'result':'loading'};
    for(const step of STEPS.filter(s=>s.type==='question')){
      const idx=state.answerIndexes[step.id];if(Number.isInteger(idx)&&step.options[idx])state.answers[step.id]=step.options[idx].label;
    }
    state.profile=STEPS[0].options[state.answerIndexes.profile]?.profile||'';
  }
}


function createState() {
  const startedAt = new Date().toISOString();
  return {
    screen: "opening",
    stepIndex: 0,
    lead: null,
    leadSaved: false,
    answers: {},
    answerIndexes: {},
    completedSteps: [], // Etapas efetivamente respondidas/continuadas nesta tentativa.
    profile: "",
    utms: getTrackingParams(),
    submissionId: window.RX.getSessionId(),
    firstSentAt: startedAt,
    captureViewed: false,
    resultViewed: false,
    checkoutClicked: false
  };
}

let leadSavePromise = null;
let leadSaveInFlight = false;
let leadRetryTimer = null;
let leadRetryAttempt = 0;
let leadSaveErrorReported = false;
let leadPersistenceBlocked = false;
const LEAD_RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 30000, 60000];
const pendingOperationalSaves = new Map();
let lastAcknowledgedCheckpoint = null;

function makeAcknowledgedCheckpoint() {
  return {
    screen: state.screen,
    stepIndex: state.stepIndex,
    leadSaved: true,
    completedSteps: [...state.completedSteps],
    answerIndexes: {...state.answerIndexes},
    resultViewed: state.resultViewed === true,
    checkoutClicked: state.checkoutClicked === true
  };
}

function acknowledgeCheckpoint(snapshot) {
  lastAcknowledgedCheckpoint = snapshot;
  if (state.leadSaved) RX.saveCheckpoint(snapshot);
}

function clearLeadRetryTimer() {
  if (leadRetryTimer) window.clearTimeout(leadRetryTimer);
  leadRetryTimer = null;
}

function markLeadSaved() {
  state.leadSaved = true;
  clearLeadRetryTimer();
  leadRetryAttempt = 0;
  if (lastAcknowledgedCheckpoint) RX.saveCheckpoint(lastAcknowledgedCheckpoint);
}

function scheduleLeadRetry() {
  if (state.leadSaved || leadPersistenceBlocked || !state.lead || leadRetryTimer) return;
  if (leadRetryAttempt >= LEAD_RETRY_DELAYS_MS.length) return;
  const delay = LEAD_RETRY_DELAYS_MS[leadRetryAttempt++];
  leadRetryTimer = window.setTimeout(() => {
    leadRetryTimer = null;
    void attemptLeadSave("");
  }, delay);
}

function attemptLeadSave(honey = "") {
  if (state.leadSaved) return Promise.resolve(true);
  if (String(honey || "").trim()) leadPersistenceBlocked = true;
  if (leadPersistenceBlocked || !state.lead) return Promise.resolve(false);
  if (leadSaveInFlight && leadSavePromise) return leadSavePromise;

  leadSaveInFlight = true;
  leadSavePromise = RX.saveLead(state.lead, honey)
    .then(() => {
      markLeadSaved();
      return true;
    })
    .catch(() => {
      if (!leadSaveErrorReported) {
        leadSaveErrorReported = true;
        RX.emit("rx_form_submit_error", {error_code:"save_failed"});
      }
      scheduleLeadRetry();
      return false;
    })
    .finally(() => {
      leadSaveInFlight = false;
    });
  return leadSavePromise;
}

function queueOperationalSave(key, name, details, checkpoint) {
  const item = {name, details, checkpoint, promise: null};
  item.promise = ensureLeadSaved()
    .then(() => RX.saveProgress(name, details))
    .then(() => {
      acknowledgeCheckpoint(checkpoint);
      pendingOperationalSaves.delete(key);
      return true;
    })
    .catch(() => false);
  pendingOperationalSaves.set(key, item);
}

async function ensureLeadSaved() {
  if (state.leadSaved) return true;
  if (leadPersistenceBlocked) throw new Error("lead_not_available");
  if (leadSavePromise) {
    const saved = await leadSavePromise;
    if (saved) return true;
  }
  if (!state.lead) throw new Error("lead_not_available");
  const saved = await attemptLeadSave("");
  if (!saved) throw new Error("lead_not_confirmed");
  return true;
}

async function flushOperationalSaves() {
  await ensureLeadSaved();
  for (const [key, item] of [...pendingOperationalSaves.entries()]) {
    let saved = await item.promise;
    if (!saved) {
      try {
        await ensureLeadSaved();
        await RX.saveProgress(item.name, item.details);
        saved = true;
      } catch (_) {
        saved = false;
      }
    }
    if (!saved) throw new Error("progress_not_confirmed");
    acknowledgeCheckpoint(item.checkpoint);
    pendingOperationalSaves.delete(key);
  }
}

window.addEventListener("online", () => {
  if (state.lead && !state.leadSaved && !leadPersistenceBlocked) void attemptLeadSave("");
  if (pendingOperationalSaves.size) void flushOperationalSaves().catch(() => {});
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && state.lead && !state.leadSaved && !leadPersistenceBlocked) {
    void attemptLeadSave("");
  }
});
window.addEventListener("pagehide", () => {
  if (state.lead && !state.leadSaved && !leadPersistenceBlocked) void attemptLeadSave("");
});

function getTrackingParams() {
  return window.RX.getAttribution();
}


function panel(content) { return `<section class="screen panel"><div class="panel-inner">${content}</div></section>`; }

let resultResourcesPrepared = false;
function prepareResultResources() {
  if (resultResourcesPrepared) return;
  resultResourcesPrepared = true;
  // Download only; the original renderResult still binds and starts the player.
  const hints = [{"href":"https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6abe93baef1e567f6a5759c7/v4/player.js","as":"script"},{"href":"https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js","as":"script"},{"href":"https://cdn.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/6abe931f60218bc6eafa5b96/main.m3u8","as":"fetch"}];
  for (const hint of hints) {
    if ([...document.querySelectorAll('link[rel="preload"]')].some(link => link.href === hint.href)) continue;
    const link = document.createElement("link");
    link.rel = "preload"; link.href = hint.href; link.as = hint.as;
    link.dataset.rxResultPreload = "1";
    document.head.appendChild(link);
  }
}

function render() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateProgress();
  const current=STEPS[state.stepIndex];
  RX.setContext({screen:state.screen,step_index:Math.min(7,state.stepIndex+1),step_id:current?.id,step_type:current?.type});
  if (state.screen === "step" && state.stepIndex >= 5) prepareResultResources();
  if (state.screen === "lead") return renderLead();
  if (state.screen === "opening") return renderOpening();
  if (state.screen === "step") return renderStep();
  if (state.screen === "loading") return renderLoading();
  return renderResult();
}

function updateProgress() {
  progressLabel.textContent = state.screen === "step" ? `Etapa ${state.stepIndex + 1} de ${STEPS.length}` : "";
}

function renderLead() {
  const lead = state.lead || {};
  root.innerHTML = panel(`
    <span class="eyebrow">Workshop Raio-X Humano</span>
    <h1>Preencha seus dados para começar.</h1>
    <p class="lead">Você receberá o seu resultado e os próximos passos do Workshop Raio-X Humano.</p>
    <form class="form" id="lead-form" novalidate>
      <div class="field"><label for="name">Nome completo</label><input id="name" name="name" autocomplete="name" placeholder="Seu nome completo" maxlength="160" value="${escapeHtml(lead.name || "")}" required></div>
      <div class="field"><label for="email">Digite seu melhor e-mail:</label><input id="email" name="email" type="email" maxlength="254" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(lead.email || "")}" required></div>
      <div class="field"><label for="phone">Telefone ( Whatsapp):</label><input id="phone" name="phone" type="tel" inputmode="tel" maxlength="30" autocomplete="tel" placeholder="+55 11 99999-9999" value="${escapeHtml(lead.phone || "")}" required></div>
      <div class="rx-honey" aria-hidden="true"><label>Site<input name="company_website" tabindex="-1" autocomplete="off"></label></div>
      <div class="error" id="form-error" role="alert"></div>
      <div class="fixed-cta"><button class="button button-primary" type="submit">Continuar</button></div>
    </form>
    <p class="fine-print">Ao continuar, você solicita o cadastro no quiz e o uso dos dados e respostas para entregar o resultado e os próximos passos deste workshop. ${window.RX_CONFIG.privacyPolicyUrl ? `<a href="${escapeHtml(window.RX_CONFIG.privacyPolicyUrl)}" target="_blank" rel="noopener noreferrer">Política de privacidade</a>` : ""}</p>
  `);
  document.querySelector("#lead-form").addEventListener("submit", handleLeadSubmit);
  document.querySelector("#lead-form").addEventListener("input", () => RX.emit("rx_form_start", {screen:"lead"}), {once:true});
  RX.emit("rx_form_view", {screen:"lead"});
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const element=event.currentTarget, button=element.querySelector('button[type="submit"]');
  if(button.disabled)return;
  RX.emit("rx_form_submit_attempt", {screen:"lead"});
  const form=new FormData(element);
  const lead={name:String(form.get("name")||"").trim().replace(/\s+/g," "),email:String(form.get("email")||"").trim().toLowerCase(),phone:RX.normalizePhone(form.get("phone")),marketing_contact:false};
  const error=validateLead(lead);
  if(error){document.querySelector("#form-error").textContent=error.message;RX.emit("rx_form_error",{error_code:error.code});return;}
  button.disabled=true;document.querySelector("#form-error").textContent="";
  state.lead=lead;
  saveCheckoutPrefill(lead);
  const honey=form.get("company_website");
  void attemptLeadSave(honey);
  state.screen="step";
  render();
}

function validateLead(lead) {
  if(lead.name.length<4||lead.name.length>160||lead.name.split(/\s+/).length<2||/[<>@]/.test(lead.name))return {code:"invalid_full_name",message:"Informe seu nome completo, com nome e sobrenome."};
  if(lead.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(lead.email))return {code:"invalid_email",message:"Informe um e-mail válido."};
  if(!/^\+[1-9]\d{7,14}$/.test(lead.phone))return {code:"invalid_phone",message:"Informe seu WhatsApp com DDD. Para outro país, inclua + e o código do país."};
  return null;
}

function renderOpening() {
  if (root.dataset.rxPrerendered !== "opening-v1" || !root.querySelector("#start-button")) {
    root.innerHTML = panel(`
    <span class="eyebrow">Workshop Raio-X Humano</span>
    <h1 class="opening-title">VOU TE ENSINAR COMO ENXERGAR OS TRAUMAS DAS PESSOAS EM SEGUNDOS APENAS OLHANDO O ROSTO E O CORPO.</h1>
    <figure class="raiox-hero-visual">
      <img src="/raiox01/raio-x-hero-960.webp" srcset="/raiox01/raio-x-hero-640.webp 640w, /raiox01/raio-x-hero-960.webp 960w, /raiox01/raio-x-hero-1200.webp 1200w, /raiox01/raio-x-hero-wide.webp?v=2 1586w" sizes="(max-width: 520px) calc(100vw - 66px), 440px" fetchpriority="high" loading="eager" decoding="async" alt="Leitura de traços do rosto e comportamento humano" width="1586" height="992">
      <span class="raiox-scan-line" aria-hidden="true"></span>
    </figure>
    <p class="lead opening-promise">Em apenas <strong>2 noites ao vivo</strong>, vou mostrar quais sinais passam despercebidos para a maioria das pessoas e como essa habilidade pode ajudar você a:</p>
    <ul class="opening-list opening-benefits">
      <li>Entender melhor as pessoas antes mesmo da primeira conversa.</li>
      <li>Identificar traços de personalidade e padrões de comportamento.</li>
      <li>Reconhecer sinais no rosto que indicam experiências emocionais marcantes.</li>
      <li>Melhorar seus relacionamentos, atendimentos e comunicação.</li>
    </ul>
    <p class="lead opening-invitation">Antes de reservar sua vaga no workshop, responda algumas perguntas.</p>
    <div class="fixed-cta"><button class="button button-primary" id="start-button" type="button">Fazer Meu Teste Agora!!</button></div>
  `);
  }
  delete root.dataset.rxPrerendered;
  document.querySelector("#start-button").dataset.rxReady = "1";
  document.querySelector("#start-button").removeAttribute("aria-busy");
  document.querySelector("#start-button").addEventListener("click", () => {
    state.captureViewed = true;
    state.screen = "lead";
    RX.emit("quiz_start", {screen:"opening"});
    render();
  });
  // A click during the non-blocking download is replayed exactly once.
  if (window.__RX03_START_PENDING) {
    window.__RX03_START_PENDING = false;
    document.querySelector("#start-button").click();
  }
}

function renderStep() {
  const step = STEPS[state.stepIndex];
  const progress = ((state.stepIndex + 1) / STEPS.length) * 100;
  RX.emit("quiz_step_view", {step_id:step.id,step_index:state.stepIndex+1,step_type:step.type});
  if (step.type === "insight") return renderInsight(step, progress);
  root.innerHTML = panel(`
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <div class="question-number">${step.label} · etapa ${state.stepIndex + 1} de ${STEPS.length}</div>
    <h2 class="question-title">${step.text}</h2>
    <div class="options" role="radiogroup" aria-label="${step.text}">
      ${step.options.map((option, index) => `<button class="option" type="button" data-index="${index}">${option.label}</button>`).join("")}
    </div>
  `);
  document.querySelectorAll(".option").forEach((button) => button.addEventListener("click", () => answerStep(step, Number(button.dataset.index), button)));
}

function markStepCompleted(stepId) {
  if (!state.completedSteps.includes(stepId)) state.completedSteps.push(stepId);
}

function renderInsight(step, progress) {
  root.innerHTML = panel(`
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <span class="eyebrow">Ponto de observação</span>
    <h2>${step.title}</h2>
    <div class="insight-card">
      <p>${step.body}</p>
      <ul class="opening-list">${step.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
      <p><strong>${step.footer}</strong></p>
    </div>
    <div class="fixed-cta"><button class="button button-primary" id="continue-button" type="button">${step.button}</button></div>
  `);
  RX.emit("quiz_insight_view", {step_id:step.id,step_index:state.stepIndex+1});
  document.querySelector("#continue-button").addEventListener("click", () => {
    const button=document.querySelector("#continue-button");button.disabled=true;clearSaveError();
    const stepIndex=state.stepIndex+1;
    const details={step_id:step.id,step_index:stepIndex,step_type:step.type};
    markStepCompleted(step.id);
    state.stepIndex+=1;
    const checkpoint=makeAcknowledgedCheckpoint();
    queueOperationalSave("insight:"+step.id,"quiz_insight_continue",details,checkpoint);
    render();
  });
}

function clearSaveError(){document.querySelector("#quiz-save-error")?.remove();}
function showSaveError(message){
  clearSaveError();const box=document.createElement("p");box.id="quiz-save-error";box.className="error";box.setAttribute("role","alert");box.textContent=message;
  const target=document.querySelector(".panel-inner");if(target)target.appendChild(box);
}
function answerStep(step, optionIndex, button) {
  const option=step.options[optionIndex];
  document.querySelectorAll(".option").forEach(item=>item.disabled=true);button.classList.add("selected");clearSaveError();
  const stepIndex=state.stepIndex+1;
  const completed=state.completedSteps.includes(step.id)?[...state.completedSteps]:[...state.completedSteps,step.id];
  const details={question_id:step.id,option_index:optionIndex,answer_label:option.label,selected_profile:option.profile||undefined,step_index:stepIndex,option_count:step.options.length,completed_steps:completed};
  if(option.profile)state.profile=option.profile;
  state.answers[step.id]=option.label;
  state.answerIndexes[step.id]=optionIndex;
  markStepCompleted(step.id);
  const checkpoint=makeAcknowledgedCheckpoint();
  queueOperationalSave("answer:"+step.id,"quiz_answer",details,checkpoint);
  RX.emit("quiz_step_complete",{step_id:step.id,step_index:stepIndex,step_type:step.type});
  state.stepIndex+=1;
  if(state.stepIndex>=STEPS.length)state.screen="loading";
  render();
}

let completionInFlight=false;
async function finalizeQuizInBackground() {
  if(completionInFlight)return;
  completionInFlight=true;
  try {
    await ensureLeadSaved();
    await flushOperationalSaves();
    const finalAnswers=STEPS.filter(step=>step.type==="question").map(step=>{
      const optionIndex=state.answerIndexes[step.id],option=step.options[optionIndex];
      return {question_id:step.id,option_index:optionIndex,answer_label:option?.label||state.answers[step.id]||"",selected_profile:option?.profile||undefined};
    });
    const result=await RX.saveProgress("quiz_complete",{step_index:STEPS.length,answers:finalAnswers,completed_steps:[...state.completedSteps]});
    if(!RX.getTestMode() && (result.quiz_status?.finalizou!==true || result.quiz_status?.status!=="concluido" || Number(result.quiz_status?.perguntas_respondidas)!==5 || Number(result.quiz_status?.etapas_concluidas)!==7))throw new Error("completion_not_confirmed");
    state.leadSaved=true;
    RX.saveCheckpoint({...state,screen:"result",resultViewed:true});
  } catch (_) {
    // A UI permanece livre. A fila usa IDs estáveis e o fluxo volta a tentar
    // em recarregamento/retorno de conexão sem bloquear o usuário.
    window.addEventListener("online", finalizeQuizInBackground, {once:true});
  } finally {
    completionInFlight=false;
  }
}

function renderLoading() {
  state.screen="result";
  state.resultViewed=true;
  render();
  void finalizeQuizInBackground();
}

function renderResult() {
  const result = RESULTS[state.profile] || RESULTS.vida_pessoal;
  const vslProfile = getVslProfile();
  const player = VSL_PLAYERS[vslProfile];
  root.innerHTML = panel(`
    <div class="result-simple">
      <span class="result-badge">${result.badge}</span>
      <h1>${result.title}</h1>
      <div class="video-frame" aria-label="Vídeo do Workshop Raio-X Humano">
        <vturb-smartplayer id="${player.id}" style="display:block;margin:0 auto;width:100%;max-width:400px;">
          <div class="vturb-player-placeholder"></div>
        </vturb-smartplayer>
      </div>
      <div class="workshop-date-card"><span>Workshop Raio-X Humano</span><strong>${RAIOX_CONFIG.workshopDateText}</strong></div>
      <div class="fixed-cta result-fixed-cta" id="checkout-cta">
        <div class="lot-grid" aria-label="Lotes do Workshop Raio-X Humano">
          <div class="lot-card lot-card-current">
            <span class="lot-label">1º lote</span>
            <strong>R$37</strong>
            <small>Encerra em breve</small>
          </div>
          <div class="lot-card">
            <span class="lot-label">2º lote</span>
            <strong>R$79</strong>
            <small>Em breve</small>
          </div>
          <div class="lot-card">
            <span class="lot-label">3º lote</span>
            <strong>R$147</strong>
            <small>Em breve</small>
          </div>
        </div>
        <a class="button button-primary" id="checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Garantir Minha Vaga</a>
      </div>
    </div>
  `);
  RX.bindVturb(document.getElementById(player.id));
  loadVturbPlayer(player);
  RX.emit("quiz_result_view", {screen:"result"});
  RX.emit("view_item", {currency:"BRL",value:37,screen:"result"});
  window.setTimeout(() => {const cta=document.querySelector("#checkout-cta");if(cta){cta.classList.add("visible");RX.emit("rx_cta_view",{element_id:"checkout-button",cta_delay_seconds:RAIOX_CONFIG.ctaDelaySeconds});}}, RAIOX_CONFIG.ctaDelaySeconds * 1000);
  document.querySelector("#checkout-button").addEventListener("click", () => {
    state.checkoutClicked = true;RX.saveCheckpoint(state);
    RX.emit("rx_checkout_click", {element_id:"checkout-button",link_domain:"pay.hub.la",currency:"BRL",value:37});
  });
}

function getVslProfile() {
  return state.profile === "terapeuta" ? "terapeuta" : "nao_terapeuta";
}

function loadVturbPlayer(player) {
  if (!player || document.querySelector(`script[data-vturb-player="${player.id}"]`)) return;
  const script = document.createElement("script");
  script.src = player.scriptUrl;
  script.async = true;
  script.dataset.vturbPlayer = player.id;
  document.head.appendChild(script);
}

function buildCheckoutUrl() {
  const url = new URL(RAIOX_CONFIG.checkoutUrl);
  Object.entries(RX.getAttribution()).forEach(([key, value]) => url.searchParams.set(key, value));
  const pageMarker = "pg_raiox03";
  const currentContent = url.searchParams.get("utm_content") || "";
  if (!currentContent.split("~").filter(Boolean).includes(pageMarker)) url.searchParams.set("utm_content", currentContent ? currentContent + "~" + pageMarker : pageMarker);
  url.searchParams.set("src", RAIOX_CONFIG.source);
  if(RX_CONFIG.correlateCheckout)url.searchParams.set("sck",RX.checkoutSck(url.searchParams.get("sck")));

  const lead = getCheckoutPrefill();
  if (lead) {
    if (lead.name) url.searchParams.set("name", String(lead.name).trim());
    if (lead.email) url.searchParams.set("email", String(lead.email).trim().toLowerCase());

    const phone = splitBrazilPhoneForCheckout(lead.phone);
    if (phone) {
      url.searchParams.set("phoneac", phone.areaCode);
      url.searchParams.set("phonenumber", phone.number);
    }
  }

  return url.toString();
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

render();