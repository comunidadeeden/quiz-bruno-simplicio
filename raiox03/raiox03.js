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
    id: "situation",
    type: "question",
    label: "Pergunta 1",
    text: "Hoje, qual dessas opções mais combina com você?",
    options: [
      { label: "Sou terapeuta e atendo pessoas", profile: "terapeuta" },
      { label: "Trabalho com atendimento, vendas ou liderança", profile: "profissional_de_pessoas" },
      { label: "Ainda não atuo, mas quero entender melhor as pessoas", profile: "futuro_terapeuta" },
      { label: "Quero usar isso principalmente na minha vida pessoal", profile: "vida_pessoal" }
    ]
  },
  {
    id: "judgment_error",
    type: "question",
    label: "Pergunta 2",
    text: "O que mais te incomoda quando você percebe que julgou uma pessoa errado?",
    options: [
      { label: "Descobrir tarde demais quem ela era" },
      { label: "Não ter percebido sinais óbvios" },
      { label: "Ter confiado além do que deveria" },
      { label: "Não saber explicar por que algo parecia estranho" }
    ]
  },
  {
    id: "insight_precision",
    type: "insight",
    eyebrow: "Primeira confirmação",
    progressText: "Seu resultado já começou a tomar forma.",
    title: "Você já deu os primeiros sinais de como observa as pessoas.",
    body: "Agora vamos identificar onde seu olhar vai primeiro e qual dificuldade mais atrapalha sua leitura hoje.",
    bullets: ["onde seu olhar começa", "o que você percebe primeiro", "onde sua interpretação trava"],
    footer: "Leva poucos segundos para continuar.",
    button: "Continuar meu Raio-X"
  },
  {
    id: "attention_focus",
    type: "question",
    label: "Pergunta 3",
    text: "Quando você conhece alguém, qual é a primeira coisa que costuma observar?",
    options: [
      { label: "No que ela fala" },
      { label: "No comportamento" },
      { label: "No rosto e expressões" },
      { label: "Eu ainda não sei exatamente onde olhar" }
    ]
  },
  {
    id: "emotional_value",
    type: "question",
    label: "Pergunta 4",
    text: "Se você conseguisse identificar padrões emocionais rapidamente, onde isso teria mais valor para você?",
    options: [
      { label: "Nos meus atendimentos" },
      { label: "Nos meus relacionamentos" },
      { label: "Na minha vida profissional" },
      { label: "Para entender melhor a mim mesmo" }
    ]
  },
  {
    id: "recurring_signal",
    type: "question",
    label: "Pergunta 5",
    text: "Qual é a sua maior dificuldade hoje ao tentar interpretar os sinais de uma pessoa?",
    options: [
      { label: "Percebo que algo não combina com o que ela fala" },
      { label: "Só entendo o padrão depois de muito tempo" },
      { label: "Percebo sinais, mas não sei o que eles significam" },
      { label: "Fico em dúvida se posso confiar no que percebi" }
    ]
  },
  {
    id: "insight_signals",
    type: "insight",
    eyebrow: "Segunda confirmação",
    progressText: "Seu padrão de percepção ficou mais claro.",
    title: "Você já percebe sinais. O ponto é transformar percepção em leitura.",
    body: "Suas respostas indicam onde você observa melhor e onde ainda falta um mapa claro para interpretar o que está vendo.",
    bullets: ["observar com critério", "interpretar padrões", "reduzir dúvida na leitura"],
    footer: "Agora vamos descobrir o que você mais quer identificar.",
    button: "Quero continuar"
  },
  {
    id: "desired_discovery",
    type: "question",
    label: "Pergunta 6",
    text: "O que você mais gostaria de descobrir olhando uma pessoa?",
    options: [
      { label: "Como ela reage sob pressão" },
      { label: "Quais padrões emocionais ela repete" },
      { label: "Como ela se relaciona com outras pessoas" },
      { label: "O que o corpo e o rosto revelam além do discurso" }
    ]
  },
  {
    id: "first_result",
    type: "question",
    label: "Pergunta 7",
    text: "Se você aprendesse essa habilidade, qual seria o primeiro resultado que gostaria de ter?",
    options: [
      { label: "Atender melhor meus pacientes" },
      { label: "Evitar escolhas ruins em relacionamentos" },
      { label: "Tomar decisões profissionais melhores" },
      { label: "Entender melhor meu próprio comportamento" }
    ]
  },
  {
    id: "intuition_ignored",
    type: "question",
    label: "Pergunta 8",
    text: "Quando sua percepção diz que algo não está certo em alguém, o que costuma acontecer?",
    options: [
      { label: "Confio na minha percepção e observo melhor" },
      { label: "Percebo, mas ainda fico em dúvida" },
      { label: "Costumo ignorar e só confirmo depois" },
      { label: "Raramente percebo esse tipo de sinal" }
    ]
  },
  {
    id: "insight_ready",
    type: "insight",
    eyebrow: "Última confirmação",
    progressText: "Seu Raio-X está quase pronto.",
    title: "Já temos informação suficiente para montar o seu resultado.",
    body: "Vamos cruzar seu contexto, sua forma de observar e a principal dificuldade que apareceu nas suas respostas.",
    bullets: ["seu contexto", "seu padrão de observação", "seu principal ponto de melhoria"],
    footer: "Na próxima tela você verá o seu Raio-X de percepção.",
    button: "Ver meu resultado"
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
    title: "Você toma decisões sobre pessoas todos os dias, muitas vezes baseado apenas no que elas dizem.",
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
    state={...state,...resumed,lead:null,stepIndex:count,screen:count<STEPS.length?'step':resumed.screen==='result'?'result':'loading'};
    for(const step of STEPS.filter(s=>s.type==='question')){
      const idx=state.answerIndexes[step.id];if(Number.isInteger(idx)&&step.options[idx])state.answers[step.id]=step.options[idx].label;
    }
    state.profile=STEPS.find(s=>s.id==='situation')?.options[state.answerIndexes.situation]?.profile||'';
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

function queueOperationalSave(key, name, details, checkpoint, options = {}) {
  const requiresLead = options.requiresLead !== false;
  const item = {name, details, checkpoint, requiresLead, promise: null};
  item.promise = (requiresLead ? ensureLeadSaved() : Promise.resolve(true))
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
        if (item.requiresLead !== false) await ensureLeadSaved();
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


const QUESTION_STEPS = STEPS.filter(step => step.type === "question");
const INSIGHT_STEPS = STEPS.filter(step => step.type === "insight");

function answeredQuestionCount() {
  return QUESTION_STEPS.filter(step => state.completedSteps.includes(step.id)).length;
}

function questionNumberFor(step) {
  return QUESTION_STEPS.findIndex(item => item.id === step.id) + 1;
}

function insightNumberFor(step) {
  return INSIGHT_STEPS.findIndex(item => item.id === step.id) + 1;
}

function questionProgressPercent() {
  return Math.round((answeredQuestionCount() / QUESTION_STEPS.length) * 100);
}

function responseValue(id, fallback = "Ainda não definido") {
  return state.answers[id] || fallback;
}

function deriveResultProfile() {
  const step = STEPS.find(item => item.id === "situation");
  const optionIndex = state.answerIndexes.situation;
  const option = Number.isInteger(optionIndex) ? step?.options?.[optionIndex] : null;
  return option?.profile || state.profile || "vida_pessoal";
}

function confirmationItems(stepId) {
  if (stepId === "insight_precision") {
    return [
      {label:"Onde essa leitura teria mais valor agora", value:responseValue("situation")},
      {label:"O que mais pesa quando você julga alguém errado", value:responseValue("judgment_error")}
    ];
  }
  if (stepId === "insight_signals") {
    return [
      {label:"Onde seu olhar vai primeiro", value:responseValue("attention_focus")},
      {label:"Onde identificar padrões teria mais valor", value:responseValue("emotional_value")},
      {label:"Sua maior dificuldade de interpretação", value:responseValue("recurring_signal")}
    ];
  }
  return [
    {label:"O que você mais quer descobrir", value:responseValue("desired_discovery")},
    {label:"O primeiro resultado que você busca", value:responseValue("first_result")},
    {label:"Como você reage à própria percepção", value:responseValue("intuition_ignored")}
  ];
}

function renderConfirmationItems(items) {
  return items.map(item => `
    <div class="confirmation-answer">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("");
}

function resultHighlights() {
  return [
    {label:"Onde essa habilidade teria mais valor", value:responseValue("emotional_value", responseValue("situation"))},
    {label:"O que você mais quer identificar", value:responseValue("desired_discovery")},
    {label:"Primeiro resultado que você procura", value:responseValue("first_result")}
  ];
}

function renderResultHighlights() {
  return resultHighlights().map(item => `
    <div class="result-highlight">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("");
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
  RX.setContext({screen:state.screen,step_index:Math.min(STEPS.length,state.stepIndex+1),step_id:current?.id,step_type:current?.type});
  if (state.screen === "step" && state.stepIndex >= 8) prepareResultResources();
  if (state.screen === "lead") return renderLead();
  if (state.screen === "opening") return renderOpening();
  if (state.screen === "step") return renderStep();
  if (state.screen === "loading") return renderLoading();
  return renderResult();
}

function updateProgress() {
  if (state.screen !== "step") {
    progressLabel.textContent = "";
    return;
  }
  const step = STEPS[state.stepIndex];
  if (!step) {
    progressLabel.textContent = "";
    return;
  }
  progressLabel.textContent = step.type === "question"
    ? `Pergunta ${questionNumberFor(step)} de ${QUESTION_STEPS.length}`
    : `Análise ${insightNumberFor(step)} de ${INSIGHT_STEPS.length}`;
}

function renderLead() {
  const lead = state.lead || {};
  root.innerHTML = panel(`
    <span class="eyebrow">Seu Raio-X já começou</span>
    <h1>Seu resultado já está tomando forma.</h1>
    <p class="lead">Complete seu e-mail e WhatsApp para continuar o diagnóstico e liberar o seu Raio-X ao final.</p>
    <div class="confirmation-grid lead-previews">
      ${renderConfirmationItems([
        {label:"Qual contexto mais combina com você", value:responseValue("situation")},
        {label:"O que mais incomoda ao julgar alguém errado", value:responseValue("judgment_error")}
      ])}
    </div>
    <form class="form" id="lead-form" novalidate>
      <div class="field"><label for="email">Digite seu melhor e-mail:</label><input id="email" name="email" type="text" inputmode="email" maxlength="254" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(lead.email || "")}" required></div>
      <div class="field">
        <label for="phone">Telefone (WhatsApp):</label>
        <div class="phone-field">
          <select id="country-code" name="country_code" aria-label="País e código DDI">
            <option value="+55" selected>🇧🇷 +55</option>
            <option value="+351">🇵🇹 +351</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+34">🇪🇸 +34</option>
            <option value="+54">🇦🇷 +54</option>
            <option value="+56">🇨🇱 +56</option>
            <option value="+598">🇺🇾 +598</option>
            <option value="+595">🇵🇾 +595</option>
            <option value="+52">🇲🇽 +52</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+39">🇮🇹 +39</option>
            <option value="+33">🇫🇷 +33</option>
            <option value="+49">🇩🇪 +49</option>
            <option value="+41">🇨🇭 +41</option>
            <option value="+43">🇦🇹 +43</option>
          </select>
          <input id="phone" name="phone" type="tel" inputmode="tel" maxlength="24" autocomplete="tel" placeholder="38 99864-4885" value="" required>
        </div>
      </div>
      <div class="rx-honey" aria-hidden="true"><label>Site<input name="company_website" tabindex="-1" autocomplete="off"></label></div>
      <div class="error" id="form-error" role="alert"></div>
      <div class="fixed-cta"><button class="button button-primary" id="lead-submit-button" type="submit">Continuar meu Raio-X</button></div>
    </form>
    <p class="fine-print">Ao continuar, você solicita o cadastro no quiz e o uso dos dados e respostas para entregar o resultado e os próximos passos deste workshop. ${window.RX_CONFIG.privacyPolicyUrl ? `<a href="${escapeHtml(window.RX_CONFIG.privacyPolicyUrl)}" target="_blank" rel="noopener noreferrer">Política de privacidade</a>` : ""}</p>
  `);
  const leadForm=document.querySelector("#lead-form");
  const leadSubmitButton=document.querySelector("#lead-submit-button");
  leadForm.addEventListener("submit", handleLeadSubmit);
  leadForm.addEventListener("input", () => RX.emit("rx_form_start", {screen:"lead"}), {once:true});
  leadSubmitButton.addEventListener("pointerdown", (event) => {
    if (leadSubmitButton.disabled) return;
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      event.preventDefault();
      const active=document.activeElement;
      if(active && typeof active.blur==="function") active.blur();
      leadForm.requestSubmit(leadSubmitButton);
    }
  });
  RX.emit("rx_form_view", {screen:"lead", step_index:state.stepIndex+1});
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const element=event.currentTarget, button=element.querySelector('button[type="submit"]');
  if(button.disabled)return;
  RX.emit("rx_form_submit_attempt", {screen:"lead", step_index:state.stepIndex+1});
  const form=new FormData(element);
  const rawPhone=String(form.get("phone")||"").trim();
  const countryCode=String(form.get("country_code")||"+55").trim();
  const phoneDigits=rawPhone.replace(/\D/g,"");
  const combinedPhone=rawPhone.startsWith("+") ? rawPhone : countryCode + phoneDigits;
  const lead={name:"",email:String(form.get("email")||"").trim().toLowerCase(),phone:RX.normalizePhone(combinedPhone),marketing_contact:false};
  const error=validateLead(lead);
  if(error){document.querySelector("#form-error").textContent=error.message;RX.emit("rx_form_error",{error_code:error.code});return;}
  button.disabled=true;document.querySelector("#form-error").textContent="";
  state.lead=lead;
  saveCheckoutPrefill(lead);
  const honey=form.get("company_website");
  void attemptLeadSave(honey);
  state.captureViewed = true;
  state.screen="step";
  const active=document.activeElement;
  if(active && typeof active.blur==="function") active.blur();
  render();
  window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"auto"}));
}

function validateLead(lead) {
  if(!lead.email)return {code:"email_required",message:"Informe seu e-mail para continuar."};
  if(lead.email.length>254)return {code:"email_too_long",message:"O e-mail informado é muito longo."};
  if(!/^\+[1-9]\d{7,14}$/.test(lead.phone))return {code:"invalid_phone",message:"Confira o país e informe seu WhatsApp com DDD."};
  return null;
}

function renderOpening() {
  const step = STEPS[0];
  root.innerHTML = panel(`
    <span class="eyebrow">Raio-X de Percepção</span>
    <h1 class="opening-title">DESCUBRA O SEU NÍVEL DE PERCEPÇÃO EM <span>8 PERGUNTAS RÁPIDAS</span></h1>
    <p class="lead opening-promise">Veja o quanto você consegue perceber sobre uma pessoa pelo comportamento, rosto e corpo e onde seu olhar ainda pode estar deixando sinais passarem despercebidos.</p>
    <div class="diagnostic-promise">
      <strong>Seu resultado será montado com base nas suas respostas.</strong>
      <span>No final, você recebe o seu Raio-X de percepção.</span>
    </div>
    <div class="quiz-progress-head">
      <span>Pergunta 1 de ${QUESTION_STEPS.length}</span>
      <strong>0% concluído</strong>
    </div>
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:0%"></div></div>
    <div class="start-cue" aria-hidden="true">
      <span class="start-cue-text">Escolha uma opção abaixo para começar</span>
      <span class="start-cue-arrow">↓</span>
    </div>
    <div class="question-number">${step.label}</div>
    <h2 class="question-title">${step.text}</h2>
    <div class="options" role="radiogroup" aria-label="${step.text}">
      ${step.options.map((option,index)=>`<button class="option" type="button" data-index="${index}">${option.label}</button>`).join("")}
    </div>
    <figure class="raiox-hero-visual opening-question-visual">
      <img class="raiox-hero-board" src="/pagina03/assets/38bfd18ce4da5fe1a19c461dbde1db0f-820.webp" srcset="/pagina03/assets/38bfd18ce4da5fe1a19c461dbde1db0f-320.webp 320w, /pagina03/assets/38bfd18ce4da5fe1a19c461dbde1db0f-460.webp 460w, /pagina03/assets/38bfd18ce4da5fe1a19c461dbde1db0f-620.webp 620w, /pagina03/assets/38bfd18ce4da5fe1a19c461dbde1db0f-820.webp 820w, /pagina03/assets/38bfd18ce4da5fe1a19c461dbde1db0f-1400.webp 1400w" sizes="(max-width:560px) calc(100vw - 46px), 590px" loading="eager" decoding="async" alt="Mural de investigação com fotos de rostos, anotações e fios vermelhos" width="1400" height="1010">
      <img class="raiox-hero-specialist" src="/pagina03/assets/f72fdaf603c78ea88126ddcb1c1adde3-840.webp" srcset="/pagina03/assets/f72fdaf603c78ea88126ddcb1c1adde3-200.webp 200w, /pagina03/assets/f72fdaf603c78ea88126ddcb1c1adde3-300.webp 300w, /pagina03/assets/f72fdaf603c78ea88126ddcb1c1adde3-400.webp 400w, /pagina03/assets/f72fdaf603c78ea88126ddcb1c1adde3-840.webp 840w, /pagina03/assets/f72fdaf603c78ea88126ddcb1c1adde3-1420.webp 1420w" sizes="(max-width:560px) 52vw, 330px" loading="eager" decoding="async" alt="Bruno Simplício" width="1420" height="1060">
      <span class="raiox-scan-line" aria-hidden="true"></span>
    </figure>
    <p class="fine-print opening-result-note">Leva poucos minutos. Suas respostas serão usadas para montar o resultado exibido ao final.</p>
  `);
  delete root.dataset.rxPrerendered;
  document.querySelectorAll(".option").forEach((button)=>button.addEventListener("click",()=>{
    if(button.disabled)return;
    state.screen="step";
    RX.emit("quiz_start",{screen:"opening"});
    RX.emit("quiz_step_view",{step_id:step.id,step_index:1,step_type:step.type});
    answerStep(step,Number(button.dataset.index),button);
  }));
}
function renderStep() {
  const step = STEPS[state.stepIndex];
  const qNumber = questionNumberFor(step);
  const progress = Math.max(0, Math.round(((qNumber - 1) / QUESTION_STEPS.length) * 100));
  RX.emit("quiz_step_view", {step_id:step.id,step_index:state.stepIndex+1,step_type:step.type});
  if (step.type === "insight") return renderInsight(step, questionProgressPercent());
  root.innerHTML = panel(`
    <div class="quiz-progress-head">
      <span>Pergunta ${qNumber} de ${QUESTION_STEPS.length}</span>
      <strong>${progress}% concluído</strong>
    </div>
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <div class="question-number">${step.label}</div>
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
  const analysisNumber = insightNumberFor(step);
  const items = confirmationItems(step.id);
  root.innerHTML = panel(`
    <div class="quiz-progress-head">
      <span>Análise ${analysisNumber} de ${INSIGHT_STEPS.length}</span>
      <strong>${progress}% do quiz respondido</strong>
    </div>
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <span class="eyebrow">${step.eyebrow || "Confirmação"}</span>
    <h2 class="insight-title">${step.title}</h2>
    <p class="insight-body confirmation-lead">${step.body}</p>
    <div class="confirmation-grid">
      ${renderConfirmationItems(items)}
    </div>
    <div class="confirmation-next">
      <span>O que isso mostra até aqui</span>
      <strong>${step.footer}</strong>
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
    if(state.stepIndex>=STEPS.length)state.screen="loading";
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
  const isPreLeadQuestion = step.id === "situation" || step.id === "judgment_error";
  queueOperationalSave("answer:"+step.id,"quiz_answer",details,checkpoint,{requiresLead:!isPreLeadQuestion});
  RX.emit("quiz_step_complete",{step_id:step.id,step_index:stepIndex,step_type:step.type});
  state.stepIndex+=1;
  if(step.id === "judgment_error" && !state.leadSaved && !state.lead){
    state.screen="lead";
  } else if(state.stepIndex>=STEPS.length) {
    state.screen="loading";
  }
  render();
}

const RESULT_LOADING_MIN_MS = 10000;
const RESULT_LOADING_TARGET_MS = 10000;
const RESULT_TESTIMONIALS = [
  "/pagina01/assets/a6fc5493469ca8e6deb52fea8094125e.webp",
  "/pagina01/assets/8d3965297bab277becfe87dbee835d4c.webp",
  "/pagina01/assets/577e8f85ec2ca4301b5085fd2a25c373.webp",
  "/pagina01/assets/1a6ccad4a7dfc6774f09f5e0bca83217.webp"
];
const RESULT_LOADING_MESSAGES = [
  "Analisando suas respostas...",
  "Identificando seus padrões de percepção...",
  "Cruzando onde essa habilidade teria mais valor...",
  "Organizando o seu resultado personalizado...",
  "Seu Raio-X está quase pronto..."
];

let completionConfirmed=false;
let completionPromise=null;
let resultPreparationRunning=false;
let completionRetryTimer=null;
let completionRetryAttempt=0;
const COMPLETION_RETRY_DELAYS_MS=[1000,2000,5000,10000,20000,30000,60000];

function keepFinalizingInBackground(){
  if(completionConfirmed)return;
  if(completionRetryTimer)return;
  const run=async()=>{
    completionRetryTimer=null;
    if(completionConfirmed)return;
    const saved=await finalizeQuizInBackground();
    if(saved){
      completionRetryAttempt=0;
      return;
    }
    const delay=COMPLETION_RETRY_DELAYS_MS[Math.min(completionRetryAttempt,COMPLETION_RETRY_DELAYS_MS.length-1)];
    completionRetryAttempt+=1;
    completionRetryTimer=window.setTimeout(run,delay);
  };
  void run();
}

async function finalizeQuizInBackground() {
  if(completionConfirmed)return true;
  if(completionPromise)return completionPromise;
  completionPromise=(async()=>{
    await ensureLeadSaved();
    await flushOperationalSaves();
    const finalAnswers=STEPS.filter(step=>step.type==="question").map(step=>{
      const optionIndex=state.answerIndexes[step.id],option=step.options[optionIndex];
      return {question_id:step.id,option_index:optionIndex,answer_label:option?.label||state.answers[step.id]||"",selected_profile:option?.profile||undefined};
    });
    const result=await RX.saveProgress("quiz_complete",{step_index:STEPS.length,answers:finalAnswers,completed_steps:[...state.completedSteps]});
    if(!RX.getTestMode() && (result.quiz_status?.finalizou!==true || result.quiz_status?.status!=="concluido" || Number(result.quiz_status?.perguntas_respondidas)!==8 || Number(result.quiz_status?.etapas_concluidas)!==11))throw new Error("completion_not_confirmed");
    state.leadSaved=true;
    completionConfirmed=true;
    RX.saveCheckpoint({...state,screen:"result",resultViewed:true});
    return true;
  })().catch(()=>{
    window.addEventListener("online",()=>{void finalizeQuizInBackground();},{once:true});
    return false;
  }).finally(()=>{completionPromise=null;});
  return completionPromise;
}

function wait(ms){return new Promise(resolve=>window.setTimeout(resolve,ms));}

function renderLoading() {
  root.innerHTML = panel(`
    <div class="result-loading">
      <span class="eyebrow">Resultado do seu Raio-X</span>
      <h1>Estamos analisando suas 8 respostas.</h1>
      <div class="loading-complete-badge">
        <span>Questionário concluído</span>
        <strong>8/8</strong>
      </div>
      <p class="result-loading-status" id="result-loading-status" aria-live="polite">${RESULT_LOADING_MESSAGES[0]}</p>
      <div class="result-loading-track" aria-label="Preparação do resultado">
        <div class="result-loading-bar" id="result-loading-bar"></div>
      </div>
      <div class="result-loading-meta">
        <span>Análise do resultado</span>
        <strong id="result-loading-percent">0%</strong>
      </div>
      <div class="loading-proof">
        <span class="loading-proof-label">Enquanto finalizamos, veja alguns depoimentos reais de participantes:</span>
        <div class="loading-testimonial-frame">
          <img id="loading-testimonial-image" src="${RESULT_TESTIMONIALS[0]}" alt="Depoimento real de participante do Raio-X Humano" loading="eager" decoding="async">
        </div>
      </div>
    </div>
  `);
  if(resultPreparationRunning)return;
  resultPreparationRunning=true;
  void runResultPreparation();
}

async function runResultPreparation(){
  const started=Date.now();
  const bar=document.querySelector("#result-loading-bar");
  const percent=document.querySelector("#result-loading-percent");
  const status=document.querySelector("#result-loading-status");
  const image=document.querySelector("#loading-testimonial-image");
  let testimonialIndex=0;
  let messageIndex=0;

  // O salvamento crítico continua em paralelo, mas nunca segura a experiência visual.
  keepFinalizingInBackground();

  const progressTimer=window.setInterval(()=>{
    const elapsed=Date.now()-started;
    const pct=Math.min(100,Math.max(1,Math.round((elapsed/RESULT_LOADING_TARGET_MS)*100)));
    if(bar)bar.style.width=pct+"%";
    if(percent)percent.textContent=pct+"%";
  },100);

  const messageTimer=window.setInterval(()=>{
    messageIndex=Math.min(RESULT_LOADING_MESSAGES.length-1,messageIndex+1);
    if(status)status.textContent=RESULT_LOADING_MESSAGES[messageIndex];
  },1800);

  const testimonialTimer=window.setInterval(()=>{
    testimonialIndex=(testimonialIndex+1)%RESULT_TESTIMONIALS.length;
    if(image){
      image.classList.add("is-changing");
      window.setTimeout(()=>{
        image.src=RESULT_TESTIMONIALS[testimonialIndex];
        image.classList.remove("is-changing");
      },160);
    }
  },2200);

  const remaining=RESULT_LOADING_TARGET_MS-(Date.now()-started);
  if(remaining>0)await wait(remaining);

  window.clearInterval(progressTimer);
  window.clearInterval(messageTimer);
  window.clearInterval(testimonialTimer);

  if(bar)bar.style.width="100%";
  if(percent)percent.textContent="100%";
  if(status)status.textContent="Resultado pronto. Abrindo sua análise...";

  // Dá um frame para o usuário ver 100% antes de revelar a VSL.
  await wait(120);

  resultPreparationRunning=false;
  state.screen="result";
  state.resultViewed=true;
  render();

  // Caso o backend ainda não tenha confirmado, continua tentando atrás da VSL.
  keepFinalizingInBackground();
}

function renderResult() {
  state.profile = deriveResultProfile();
  const result = RESULTS[state.profile] || RESULTS.vida_pessoal;
  const vslProfile = getVslProfile();
  const player = VSL_PLAYERS[vslProfile];
  root.innerHTML = panel(`
    <div class="result-simple result-vsl-reveal">
      <span class="result-badge">${result.badge}</span>
      <div class="result-vsl-intro">
        <span>Agora entenda o que suas respostas revelam</span>
        <strong>Assista ao vídeo abaixo para ver a explicação completa do seu resultado.</strong>
      </div>
      <div class="video-frame" aria-label="Vídeo do Workshop Raio-X Humano">
        <vturb-smartplayer id="${player.id}" style="display:block;margin:0 auto;width:100%;max-width:400px;">
          <div class="vturb-player-placeholder"></div>
        </vturb-smartplayer>
      </div>
      <div class="fixed-cta result-fixed-cta" id="checkout-cta">
        <a class="button button-primary" id="checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Garantir Minha Vaga</a>
        <div class="checkout-offer-copy">
          <span>Quer aprender a fazer essa leitura na prática?</span>
          <strong>No Workshop Raio-X Humano, você vai aprender ao vivo onde olhar e o que observar no rosto e no corpo.</strong>
          <p>Veja abaixo as condições do workshop.</p>
        </div>
        <div class="lot-grid" aria-label="Lotes do Workshop Raio-X Humano">
          <div class="lot-card lot-card-current">
            <span class="lot-label">1º lote</span>
            <strong>R$37</strong>
            <small>Encerra em breve</small>
          </div>
          <div class="lot-card">
            <span class="lot-label">2º lote</span>
            <strong>R$97</strong>
            <small>Em breve</small>
          </div>
          <div class="lot-card">
            <span class="lot-label">3º lote</span>
            <strong>R$197</strong>
            <small>Em breve</small>
          </div>
        </div>
      </div>
    </div>
  `);
  RX.bindVturb(document.getElementById(player.id));
  loadVturbPlayer(player);
  RX.emit("quiz_result_view", {screen:"result"});
  RX.emit("view_item", {currency:"BRL",value:37,screen:"result"});
  window.setTimeout(() => {
    const cta=document.querySelector("#checkout-cta");
    if(cta){
      cta.classList.add("visible");
      RX.emit("rx_cta_view",{element_id:"checkout-button",cta_delay_seconds:RAIOX_CONFIG.ctaDelaySeconds});
    }
  }, RAIOX_CONFIG.ctaDelaySeconds * 1000);
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