const RAIOX_CONFIG = {
  checkoutUrl: "https://pay.hotmart.com/P106544757H?off=khgkndlr",
  leadWebhookUrl: "https://script.google.com/macros/s/AKfycbwfB9L59W9e07FwjmaS7TLOzJrec4VOv0O4taqWIttCg3M6i9QUzS6gfX2nWt0povht/exec",
  source: "quiz_raiox01ext",
  sheetTabName: "Leads Raio X 01",
  spreadsheetId: "1OBr2lZO_AyVS30f2_KD0qwLtrBxyY-8owmbVCq50KK4",
  sheetGid: "521598952",
  workshopDateText: "6 e 7 de Outubro, às 20h · ao vivo",
  priceText: "$15",
  ctaDelaySeconds: 60
};

const VSL_PLAYERS = {
  terapeuta: {
    id: "vid-6a8de2d9d5cdae2c958dc2a1",
    scriptUrl: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6a8de2d9d5cdae2c958dc2a1/v4/player.js",
    maxWidth: "100%",
    placeholderPadding: "56.25%"
  },
  nao_terapeuta: {
    id: "vid-6a8de2eb31552ce9b670d0bf",
    scriptUrl: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6a8de2eb31552ce9b670d0bf/v4/player.js",
    maxWidth: "400px",
    placeholderPadding: "177.77777777777777%"
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

function createState() {
  const startedAt = new Date().toISOString();
  return {
    screen: "opening",
    stepIndex: 0,
    lead: null,
    answers: {},
    profile: "",
    utms: getTrackingParams(),
    submissionId: createSubmissionId(),
    firstSentAt: startedAt,
    captureViewed: false,
    resultViewed: false,
    checkoutClicked: false
  };
}

function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  return ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "src", "sck"].reduce((data, key) => {
    if (params.has(key)) data[key] = params.get(key);
    return data;
  }, {});
}

function panel(content) { return `<section class="screen panel"><div class="panel-inner">${content}</div></section>`; }

function render() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateProgress();
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
      <div class="field"><label for="name">Nome</label><input id="name" name="name" autocomplete="name" placeholder="Seu nome" value="${escapeHtml(lead.name || "")}" required></div>
      <div class="field"><label for="email">Melhor e-mail</label><input id="email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(lead.email || "")}" required></div>
      <div class="field"><label for="phone">WhatsApp</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="+55 11 99999-9999" value="${escapeHtml(lead.phone || "")}" required></div>
      <div class="error" id="form-error" role="alert"></div>
      <div class="fixed-cta"><button class="button button-primary" type="submit">Continuar</button></div>
    </form>
    <p class="fine-print">Seus dados serão usados para enviar informações sobre seu resultado e sobre o Workshop Raio-X Humano.</p>
  `);
  document.querySelector("#lead-form").addEventListener("submit", handleLeadSubmit);
}

function handleLeadSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const lead = { name: String(form.get("name") || "").trim(), email: String(form.get("email") || "").trim(), phone: String(form.get("phone") || "").trim() };
  const error = validateLead(lead);
  if (error) return document.querySelector("#form-error").textContent = error;
  state.lead = lead;
  localStorage.setItem("raiox01ext_lead", JSON.stringify(lead));
  sendLeadEvent("lead_submitted");
  trackEvent("raiox01ext_lead_submit");
  state.screen = "step";
  render();
}

function validateLead(lead) {
  if (lead.name.length < 2) return "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Informe um e-mail válido.";
  if (lead.phone.replace(/\D/g, "").length < 8) return "Informe um WhatsApp válido.";
  return "";
}

function renderOpening() {
  root.innerHTML = panel(`
    <span class="eyebrow">Workshop Raio-X Humano</span>
    <h1 class="opening-title">Você acredita que é possível descobrir muito sobre uma pessoa apenas observando seu rosto e o formato do seu corpo?</h1>
    <figure class="raiox-hero-visual">
      <img src="/raio-x-hero-wide.webp?v=2" alt="Leitura de traços do rosto e comportamento humano" width="1586" height="992">
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
    <div class="fixed-cta"><button class="button button-primary" id="start-button" type="button">Garantir minha vaga</button></div>
  `);
  document.querySelector("#start-button").addEventListener("click", () => {
    state.captureViewed = true;
    state.screen = "lead";
    sendLeadEvent("capture_view");
    trackEvent("raiox01ext_start");
    render();
  });
}

function renderStep() {
  const step = STEPS[state.stepIndex];
  const progress = ((state.stepIndex + 1) / STEPS.length) * 100;
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
  document.querySelector("#continue-button").addEventListener("click", () => { state.stepIndex += 1; trackEvent("raiox01ext_insight_continue", { insight: step.id }); render(); });
}

function answerStep(step, optionIndex, button) {
  const option = step.options[optionIndex];
  document.querySelectorAll(".option").forEach((item) => item.disabled = true);
  button.classList.add("selected");
  if (option.profile) state.profile = option.profile;
  state.answers[step.id] = option.label;
  sendLeadEvent("partial", step.id);
  trackEvent("raiox01ext_answer", { question: step.id, profile: state.profile });
  window.setTimeout(() => {
    state.stepIndex += 1;
    if (state.stepIndex >= STEPS.length) {
      state.screen = "loading";
    }
    render();
  }, 260);
}

function renderLoading() {
  root.innerHTML = panel(`<div class="loading"><div class="loading-ring" aria-hidden="true"></div><h2>Organizando seu resultado...</h2><p>Estamos conectando suas respostas com o caminho mais coerente para você.</p></div>`);
  window.setTimeout(() => {
    state.screen = "result";
    state.resultViewed = true;
    sendLeadEvent("quiz_completed");
    trackEvent("raiox01ext_result_view", { profile: state.profile });
    render();
  }, 750);
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
        <vturb-smartplayer id="${player.id}" style="display:block;margin:0 auto;width:100%;max-width:${player.maxWidth};">
          <div class="vturb-player-placeholder" style="padding:${player.placeholderPadding} 0 0;"></div>
        </vturb-smartplayer>
      </div>
      <div class="workshop-date-card"><span>Workshop Raio-X Humano</span><strong>${RAIOX_CONFIG.workshopDateText}</strong><small>Investimento: ${RAIOX_CONFIG.priceText}</small></div>
      <div class="fixed-cta result-fixed-cta" id="checkout-cta"><a class="button button-primary" id="checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Quero aprender a analisar rosto e corpo</a></div>
    </div>
  `);
  loadVturbPlayer(player);
  window.setTimeout(() => document.querySelector("#checkout-cta")?.classList.add("visible"), RAIOX_CONFIG.ctaDelaySeconds * 1000);
  document.querySelector("#checkout-button").addEventListener("click", () => {
    state.checkoutClicked = true;
    sendLeadEvent("checkout_clicked");
    trackEvent("raiox01ext_checkout_click", { profile: state.profile, vsl_profile: vslProfile });
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
  Object.entries(state.utms).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("src", state.utms.src || RAIOX_CONFIG.source);
  url.searchParams.set("profile", state.profile || "vida_pessoal");
  return url.toString();
}

function sendLeadEvent(event, lastQuestionId = "") {
  if (!state.submissionId || !RAIOX_CONFIG.leadWebhookUrl) return;
  const now = new Date().toISOString();
  const completed = event === "quiz_completed" || event === "checkout_clicked";
  const payload = {
    event,
    source: RAIOX_CONFIG.source,
    spreadsheet_id: RAIOX_CONFIG.spreadsheetId,
    sheet_name: RAIOX_CONFIG.sheetTabName,
    sheet_gid: RAIOX_CONFIG.sheetGid,
    timestamp: now,
    page_url: window.location.href,
    submission_id: state.submissionId,
    status_resposta: completed ? "concluída" : "em andamento",
    ultimo_evento: event,
    primeiro_envio_em: state.firstSentAt || now,
    atualizado_em: now,
    concluido_em: completed ? now : "",
    checkout_clicked_at: event === "checkout_clicked" ? now : "",
    ultima_pergunta_respondida: lastQuestionId,
    acessou_quiz: "sim",
    chegou_captura: state.captureViewed ? "sim" : undefined,
    enviou_dados: state.lead ? "sim" : undefined,
    quiz_completo: completed ? "sim" : undefined,
    resultado_visto: state.resultViewed ? "sim" : undefined,
    clicou_checkout: state.checkoutClicked ? "sim" : undefined,
    etapa_atual: getCurrentStage(event, lastQuestionId),
    nome: state.lead?.name,
    email: state.lead?.email,
    telefone: state.lead?.phone,
    whatsapp: state.lead?.phone,
    perfil: state.profile,
    perfil_vsl: getVslProfile(),
    "1ª Etapa - Situação mais valiosa": state.answers.profile || undefined,
    "2ª Etapa - Seu olhar hoje": state.answers.body_reading || undefined,
    "3ª Etapa - O que você busca": state.answers.desired_reading || undefined,
    "4ª Etapa - Leitura do rosto": state.answers.face_reading || undefined,
    "5ª Etapa - O erro que você evita": state.answers.consequence || undefined,
    ...state.utms
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  const body = JSON.stringify(payload);
  if (event === "checkout_clicked" && navigator.sendBeacon) {
    navigator.sendBeacon(RAIOX_CONFIG.leadWebhookUrl, new Blob([body], { type: "text/plain;charset=utf-8" }));
    return;
  }
  fetch(RAIOX_CONFIG.leadWebhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body }).catch(() => {});
}

function getCurrentStage(event, lastQuestionId) {
  if (event === "quiz_view") return "1. Abertura";
  if (event === "capture_view") return "2. Captura de dados";
  if (event === "lead_submitted") return "3. Pergunta 1";
  if (event === "quiz_completed") return "9. Resultado";
  if (event === "checkout_clicked") return "10. Checkout";
  const questionIndex = STEPS.findIndex((step) => step.id === lastQuestionId);
  if (questionIndex < 0) return "Em andamento";
  const questionNumber = STEPS.slice(0, questionIndex + 1).filter((step) => step.type === "question").length;
  return `Pergunta ${questionNumber} de 5`;
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `raiox01ext-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function trackEvent(eventName, payload = {}) {
  const data = { event: eventName, source: RAIOX_CONFIG.source, ...payload };
  if (window.dataLayer) window.dataLayer.push(data);
  if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, data);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

trackEvent("raiox01ext_view");
sendLeadEvent("quiz_view");
render();
