const MENTORIA_CONFIG = {
  checkoutUrl: "https://pay.hotmart.com/P106544757H",
  leadWebhookUrl: "https://script.google.com/macros/s/AKfycbws3Kj9A42d_UxuSLQgcI33ypFK4rSxsxZ0chSyEgE0vNo1Pet2tVTFgMEZJy7dLk2wEQ/exec",
  source: "quiz_mentoria_terapeutas",
  sheetTabName: "Mentoria",
  spreadsheetId: "1y8flaW1dDzGUpV9wXnoug0ADVxUUWjtMk5v-z6ygjlg",
  sheetGid: "481510436",
  ctaDelaySeconds: 60,
  workshopDateText: "29 e 30 de Setembro, às 20h · ao vivo",
  priceText: "R$37"
};

const VSL_PLAYERS = {
  terapeuta: {
    id: "vid-6a42eb103f9c960ae39bbb50",
    scriptUrl: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6a42eb103f9c960ae39bbb50/v4/player.js"
  },
  nao_terapeuta: {
    id: "vid-6a42eb18d77f3406e43d9b7e",
    scriptUrl: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6a42eb18d77f3406e43d9b7e/v4/player.js"
  }
};

const QUESTIONS = [
  {
    id: "professional_status",
    stepLabel: "Filtro inicial",
    text: "Você já atende pessoas profissionalmente, como terapeuta, psicólogo, coach ou em outra abordagem?",
    options: [
      { label: "Sim, já atendo como terapeuta ou em outra abordagem terapêutica", profile: "terapeuta", next: "current_ticket" },
      { label: "Não ainda, mas quero me tornar terapeuta em breve", profile: "nao_terapeuta", next: "use_intention" },
      { label: "Não sou terapeuta, mas quero aprender essa habilidade para outro contexto", profile: "nao_terapeuta", next: "use_intention" },
      { label: "Trabalho com pessoas, como RH, educação ou liderança, e quero usar isso no meu trabalho", profile: "nao_terapeuta", next: "use_intention" }
    ]
  },
  {
    id: "current_ticket",
    stepLabel: "Ticket atual",
    text: "Quanto você cobra por sessão hoje?",
    condition: (state) => state.profile === "terapeuta",
    options: [
      { label: "Até R$150 por sessão", tag: "ticket_baixo" },
      { label: "Entre R$150 e R$300 por sessão", tag: "ticket_medio_baixo" },
      { label: "Entre R$300 e R$600 por sessão", tag: "ticket_medio" },
      { label: "Acima de R$600 por sessão", tag: "ticket_alto" }
    ]
  },
  {
    id: "main_block",
    stepLabel: "Dor principal",
    text: "O que mais te trava hoje nos seus atendimentos?",
    condition: (state) => state.profile === "terapeuta",
    options: [
      { label: "Cobro pouco porque não sei como justificar um preço mais alto", tag: "preco" },
      { label: "Sinto que falta precisão na minha leitura do paciente", tag: "precisao" },
      { label: "Os resultados que entrego não são consistentes o suficiente", tag: "resultado" },
      { label: "Tenho dificuldade de fidelizar pacientes por mais tempo", tag: "fidelizacao" }
    ]
  },
  {
    id: "use_intention",
    stepLabel: "Intenção de uso",
    text: "Se você pudesse entender tudo sobre uma pessoa em 1 minuto, o que faria com isso?",
    options: [
      { label: "Cobrar sessões mais caras e ter resultados mais rápidos com pacientes", tag: "monetizar" },
      { label: "Começar a atender de verdade e construir uma renda com isso", tag: "comecar" },
      { label: "Usar para me entender e entender melhor quem está ao meu redor", tag: "pessoal" },
      { label: "Complementar outra abordagem que já uso, como tarot, barras de access ou outra técnica", tag: "complementar" }
    ]
  },
  {
    id: "strongest_argument",
    stepLabel: "Maior interesse",
    text: "Quando você pensa em aprender com o Bruno, o que mais te atrai?",
    options: [
      { label: "Aprender o método que justifica cobrar 5 mil ou mais por sessão", tag: "cobrar_mais" },
      { label: "Entender como o Bruno pensa e aplica na prática, não só teoria", tag: "pratica" },
      { label: "Ter uma habilidade que 99% dos terapeutas não têm", tag: "diferenciacao" },
      { label: "Usar essa leitura na minha própria vida antes de ensinar para outros", tag: "vida_pessoal" }
    ]
  },
  {
    id: "positioning_confirmation",
    stepLabel: "Posicionamento",
    text: "Qual dessas frases descreve melhor onde você está hoje?",
    options: [
      { label: "Sou terapeuta e quero parar de cobrar barato pelo que entrego", profileHint: "terapeuta", tag: "cobrar_barato" },
      { label: "Estou começando e quero já iniciar com uma técnica diferenciada", profileHint: "nao_terapeuta", tag: "iniciante" },
      { label: "Não sou terapeuta, mas essa habilidade mudaria minha vida pessoal e profissional", profileHint: "nao_terapeuta", tag: "habilidade_vida" },
      { label: "Trabalho com pessoas há anos e quero dar um salto de nível no que faço", profileHint: "nao_terapeuta", tag: "salto_profissional" }
    ]
  }
];

const RESULTS = {
  terapeuta: {
    badge: "Perfil terapeuta",
    title: "Você está pronta para cobrar o que você vale.",
    subtitle: "Suas respostas mostram que você já está no jogo, mas talvez ainda esteja cobrando pouco pela transformação que quer entregar.",
    insight: "A mentoria faz sentido para quem quer aumentar percepção de valor, ganhar precisão na leitura do paciente e justificar atendimentos mais caros com um método claro.",
    videoTitle: "VSL para terapeutas",
    pitch: "O Bruno vai mostrar por que uma leitura precisa pode mudar o valor percebido de uma sessão. Não é sobre cobrar caro sem entregar. É sobre desenvolver uma habilidade que faz o paciente enxergar valor no que antes parecia subjetivo.",
    cta: "Quero entender o método do Bruno"
  },
  nao_terapeuta: {
    badge: "Perfil em formação",
    title: "Essa habilidade pode mudar o que você constrói.",
    subtitle: "Você talvez ainda não atenda, mas suas respostas mostram interesse real em desenvolver uma leitura que poucas pessoas dominam.",
    insight: "A mentoria faz sentido para quem quer começar com uma habilidade diferenciada, aplicar em outro contexto profissional ou entender pessoas com mais profundidade.",
    videoTitle: "VSL para novos caminhos",
    pitch: "O Bruno vai explicar como essa habilidade pode ser usada para compreender padrões emocionais, doenças, comportamentos e relações. Para algumas pessoas, isso vira profissão. Para outras, vira uma nova forma de enxergar a própria vida e o trabalho com pessoas.",
    cta: "Quero conhecer essa habilidade"
  }
};

const root = document.querySelector("#quiz-root");
const progressLabel = document.querySelector("#progress-label");
let state = createState();

function createState() {
  return {
    screen: "lead",
    lead: null,
    currentQuestionId: "professional_status",
    answers: {},
    route: [],
    profile: null,
    utms: getTrackingParams(),
    submitting: false
  };
}

function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "src", "sck"];
  return keys.reduce((acc, key) => {
    if (params.has(key)) acc[key] = params.get(key);
    return acc;
  }, {});
}

function render() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateProgress();
  if (state.screen === "lead") return renderLead();
  if (state.screen === "question") return renderQuestion();
  if (state.screen === "loading") return renderLoading();
  if (state.screen === "result") return renderResult();
}

function updateProgress() {
  if (state.screen !== "question") {
    progressLabel.textContent = "";
    return;
  }
  const visible = getVisibleQuestions();
  const index = visible.findIndex((question) => question.id === state.currentQuestionId);
  progressLabel.textContent = index >= 0 ? `Etapa ${index + 1} de ${visible.length}` : "";
}

function panel(content, className = "") {
  return `<section class="screen panel ${className}"><div class="panel-inner">${content}</div></section>`;
}

function renderLead() {
  const lead = state.lead || {};
  root.innerHTML = panel(`
    <span class="eyebrow">Pesquisa rápida</span>
    <h1>Você quer aprender a ler pessoas como o Bruno?</h1>
    <p class="lead">Preencha seus dados para liberar a pesquisa do Workshop Raio X Humano.</p>
    <form class="form" id="lead-form" novalidate>
      <div class="field">
        <label for="name">Nome</label>
        <input id="name" name="name" autocomplete="name" placeholder="Seu nome" value="${escapeHtml(lead.name || "")}" required>
      </div>
      <div class="field">
        <label for="email">Melhor e-mail</label>
        <input id="email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(lead.email || "")}" required>
      </div>
      <div class="field">
        <label for="phone">WhatsApp</label>
        <input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="+55 11 99999-9999" value="${escapeHtml(lead.phone || "")}" required>
      </div>
      <div class="error" id="form-error" role="alert"></div>
      <button class="button button-primary" type="submit">Continuar</button>
    </form>
    <p class="fine-print">Suas respostas serão usadas para entender a demanda pelo workshop e enviar os próximos passos.</p>
  `);

  document.querySelector("#lead-form").addEventListener("submit", handleLeadSubmit);
}

function handleLeadSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const lead = {
    name: String(form.get("name") || "").trim(),
    email: String(form.get("email") || "").trim(),
    phone: String(form.get("phone") || "").trim()
  };
  const error = validateLead(lead);
  const errorEl = document.querySelector("#form-error");
  if (error) {
    errorEl.textContent = error;
    return;
  }
  state.lead = lead;
  localStorage.setItem("mentoria_terapeutas_lead", JSON.stringify(lead));
  sendLeadEvent("lead_submitted");
  trackEvent("mentoria_quiz_lead_submit", { email: lead.email });
  trackEvent("mentoria_quiz_start");
  state.screen = "question";
  render();
}

function validateLead(lead) {
  if (lead.name.length < 2) return "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Informe um e-mail válido.";
  const digits = lead.phone.replace(/\D/g, "");
  if (digits.length < 8) return "Informe um WhatsApp válido.";
  return "";
}

function getQuestionById(id) {
  return QUESTIONS.find((question) => question.id === id);
}

function getVisibleQuestions() {
  return QUESTIONS.filter((question) => !question.condition || question.condition(state));
}

function renderQuestion() {
  const question = getQuestionById(state.currentQuestionId);
  const visible = getVisibleQuestions();
  const index = Math.max(visible.findIndex((item) => item.id === question.id), 0);
  const progress = ((index + 1) / visible.length) * 100;

  root.innerHTML = panel(`
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <div class="question-number">${question.stepLabel} · etapa ${index + 1} de ${visible.length}</div>
    <h2 class="question-title">${question.text}</h2>
    <div class="options" role="radiogroup" aria-label="${question.text}">
      ${question.options.map((option, optionIndex) => `
        <button class="option" type="button" data-index="${optionIndex}">
          ${option.label}
        </button>
      `).join("")}
    </div>
  `);

  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => answerQuestion(question, Number(button.dataset.index), button));
  });
}

function answerQuestion(question, optionIndex, button) {
  const option = question.options[optionIndex];
  document.querySelectorAll(".option").forEach((item) => item.disabled = true);
  button.classList.add("selected");

  if (option.profile) state.profile = option.profile;
  if (!state.profile && option.profileHint) state.profile = option.profileHint;
  state.answers[question.id] = {
    question: question.text,
    answer: option.label,
    tag: option.tag || "",
    profile: option.profile || option.profileHint || ""
  };
  state.route.push(question.id);

  trackEvent("mentoria_quiz_answer", { question: question.id, tag: option.tag || "", profile: state.profile });

  window.setTimeout(() => {
    const nextId = option.next || getNextQuestionId(question.id);
    if (!nextId) {
      state.screen = "loading";
      render();
      return;
    }
    state.currentQuestionId = nextId;
    state.screen = "question";
    render();
  }, 260);
}

function getNextQuestionId(currentId) {
  const visible = getVisibleQuestions();
  const index = visible.findIndex((question) => question.id === currentId);
  return visible[index + 1]?.id || "";
}

function renderLoading() {
  root.innerHTML = panel(`
    <div class="loading">
      <div class="loading-ring" aria-hidden="true"></div>
      <h2>Organizando suas respostas...</h2>
      <p>A pesquisa está cruzando seu momento atual com o caminho mais coerente para o Workshop Raio X Humano.</p>
    </div>
  `);
  window.setTimeout(() => {
    state.screen = "result";
    sendLeadEvent("quiz_completed");
    trackEvent("mentoria_quiz_result_view", { profile: getFinalProfile() });
    render();
  }, 850);
}

function getFinalProfile() {
  if (state.profile === "terapeuta") return "terapeuta";
  return "nao_terapeuta";
}

function renderResult() {
  const profile = getFinalProfile();
  const result = RESULTS[profile];
  const player = VSL_PLAYERS[profile] || VSL_PLAYERS.nao_terapeuta;

  root.innerHTML = panel(`
    <div class="result-simple">
      <span class="result-badge">${result.badge}</span>
      <h1>${result.title}</h1>
      <div class="video-frame" aria-label="Vídeo do Workshop Raio X Humano">
        <vturb-smartplayer id="${player.id}" style="display:block;margin:0 auto;width:100%;max-width:400px;">
          <div class="vturb-player-placeholder"></div>
        </vturb-smartplayer>
      </div>
      <div class="workshop-date-card" aria-label="Data do Workshop Raio X Humano">
        <span>Workshop Raio X Humano</span>
        <strong>${MENTORIA_CONFIG.workshopDateText}</strong>
      </div>
      <a class="button button-primary delayed-cta" id="checkout-button" href="${buildCheckoutUrl()}" ${MENTORIA_CONFIG.checkoutUrl === "#" ? "" : "target=\"_blank\" rel=\"noopener noreferrer\""}>${result.cta} - Workshop por ${MENTORIA_CONFIG.priceText}</a>
    </div>
  `);

  loadVturbPlayer(player);
  window.setTimeout(() => {
    document.querySelector("#checkout-button")?.classList.add("visible");
  }, MENTORIA_CONFIG.ctaDelaySeconds * 1000);
  document.querySelector("#checkout-button").addEventListener("click", () => {
    sendLeadEvent("checkout_clicked");
    trackEvent("mentoria_quiz_checkout_click", { profile });
  });
}

function loadVturbPlayer(player) {
  if (!player?.scriptUrl || document.querySelector(`script[data-vturb-player="${player.id}"]`)) return;
  const script = document.createElement("script");
  script.src = player.scriptUrl;
  script.async = true;
  script.dataset.vturbPlayer = player.id;
  document.head.appendChild(script);
}

function buildCheckoutUrl() {
  if (!MENTORIA_CONFIG.checkoutUrl || MENTORIA_CONFIG.checkoutUrl === "#") return "#";
  const url = new URL(MENTORIA_CONFIG.checkoutUrl);
  Object.entries(state.utms).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("src", state.utms.src || MENTORIA_CONFIG.source);
  url.searchParams.set("profile", getFinalProfile());
  return url.toString();
}

function sendLeadEvent(eventName) {
  if (!MENTORIA_CONFIG.leadWebhookUrl || !state.lead) return;
  const payload = buildSheetPayload(eventName);

  if (eventName === "checkout_clicked" && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=utf-8" });
    if (navigator.sendBeacon(MENTORIA_CONFIG.leadWebhookUrl, blob)) return;
  }

  fetch(MENTORIA_CONFIG.leadWebhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).catch((error) => console.warn("Lead webhook failed", error));
}

function buildSheetPayload(eventName) {
  const lead = state.lead || {};
  const submittedAt = buildLeadDateFields();
  const utms = state.utms || {};

  return {
    event: eventName,
    source: MENTORIA_CONFIG.source,
    spreadsheet_id: MENTORIA_CONFIG.spreadsheetId,
    spreadsheet_url: `https://docs.google.com/spreadsheets/d/${MENTORIA_CONFIG.spreadsheetId}/edit?gid=${MENTORIA_CONFIG.sheetGid}#gid=${MENTORIA_CONFIG.sheetGid}`,
    sheet_gid: MENTORIA_CONFIG.sheetGid,
    gid: MENTORIA_CONFIG.sheetGid,
    sheet_name: MENTORIA_CONFIG.sheetTabName,
    sheet_tab: MENTORIA_CONFIG.sheetTabName,
    aba: MENTORIA_CONFIG.sheetTabName,
    ...submittedAt,
    page_url: window.location.href,
    nome: lead.name || "",
    email: lead.email || "",
    telefone: lead.phone || "",
    whatsapp: lead.phone || "",
    lead_key: lead.email || lead.phone || "",
    clicou_botao: eventName === "checkout_clicked" ? "sim" : "não",
    checkout_clicked_at: eventName === "checkout_clicked" ? new Date().toISOString() : "",
    perfil: getFinalProfile(),
    ja_atende_profissionalmente: answerText("professional_status"),
    ticket_atual: answerText("current_ticket"),
    trava_atendimentos: answerText("main_block"),
    intencao_de_uso: answerText("use_intention"),
    maior_interesse: answerText("strongest_argument"),
    posicionamento: answerText("positioning_confirmation"),
    utm_source: utms.utm_source || "",
    utm_medium: utms.utm_medium || "",
    utm_campaign: utms.utm_campaign || "",
    utm_content: utms.utm_content || "",
    utm_term: utms.utm_term || "",
    fbclid: utms.fbclid || "",
    gclid: utms.gclid || "",
    src: utms.src || "",
    sck: utms.sck || ""
  };
}

function answerText(questionId) {
  return state.answers[questionId]?.answer || "";
}

function buildLeadDateFields(date = new Date()) {
  const timeZone = "America/Sao_Paulo";
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date).reduce((fields, part) => {
    if (part.type !== "literal") fields[part.type] = part.value;
    return fields;
  }, {});

  const dateBR = `${parts.day}/${parts.month}/${parts.year}`;
  const timeBR = `${parts.hour}:${parts.minute}:${parts.second}`;

  return {
    timestamp: date.toISOString(),
    data_preenchimento: dateBR,
    hora_preenchimento: timeBR,
    data_hora_preenchimento: `${dateBR} ${timeBR}`,
    data_iso_local: `${parts.year}-${parts.month}-${parts.day} ${timeBR}`,
    timestamp_ms: date.getTime(),
    timezone: timeZone
  };
}

function trackEvent(eventName, payload = {}) {
  const data = { event: eventName, source: MENTORIA_CONFIG.source, ...payload };
  if (window.dataLayer) window.dataLayer.push(data);
  if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, data);
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") console.log(eventName, data);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

trackEvent("mentoria_quiz_view");
render();
