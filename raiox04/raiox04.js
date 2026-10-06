const RAIOX_CONFIG = {
  checkoutUrl: "https://pay.hotmart.com/P106544757H",
  leadWebhookUrl: "https://script.google.com/macros/s/AKfycbyvJP5NPzhp6lTIQlXPDL0sGxCNQCpbzI37yNfTpfh4EiWN3ZZGTxej3w0fx6b1D9f_0A/exec",
  source: "quiz_raiox04",
  quizVariant: "raiox04",
  quizConcept: "narcisismo",
  storageKey: "raiox04_lead",
  sheetTabName: "Leads Raio X 04",
  spreadsheetId: "16qXgnLTgIIFZrKD_pHXgaXyl_VESWBjw8v-TXBOS1nk",
  sheetGid: "2145203282",
  workshopDateText: "13 e 14 de Outubro, às 20h · ao vivo",
  priceText: "R$37",
  ctaDelaySeconds: 60
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

const QUALIFICATION = {
  id: "qualification",
  type: "question",
  label: "Qualificação",
  text: "Qual destas frases descreve melhor você hoje?",
  options: [
    { label: "Sou terapeuta e já realizo atendimentos.", profile: "terapeuta", route: "terapeuta", vslProfile: "terapeuta" },
    { label: "Ainda não sou terapeuta, mas quero começar a atuar.", profile: "futuro_terapeuta", route: "nao_terapeuta", vslProfile: "nao_terapeuta" },
    { label: "Não sou terapeuta, mas trabalho diretamente com pessoas.", profile: "profissional_de_pessoas", route: "nao_terapeuta", vslProfile: "nao_terapeuta" },
    { label: "Quero utilizar esse conhecimento principalmente na minha vida pessoal.", profile: "vida_pessoal", route: "nao_terapeuta", vslProfile: "nao_terapeuta" }
  ]
};

const ROUTES = {
  terapeuta: [
    {
      id: "t2_situation", type: "question", label: "Aplicação clínica",
      text: "Em qual situação identificar o Transtorno da Personalidade Narcisista pela face teria mais impacto nos seus atendimentos?",
      genericField: "situacao_de_uso", sheetField: "T2 - Situação de uso",
      options: [
        { label: "Ao receber um paciente e precisar compreender rapidamente seu funcionamento.", tag: "leitura_do_paciente" },
        { label: "Quando uma paciente relata problemas com o marido ou namorado.", tag: "foto_do_parceiro" },
        { label: "Quando o relato parece não combinar com o comportamento apresentado.", tag: "relato_incongruente" },
        { label: "Ao definir a melhor forma de conduzir e redirecionar aquele paciente.", tag: "conducao_e_redirecionamento" }
      ]
    },
    {
      id: "t3_capacity", type: "question", label: "Seu olhar hoje",
      text: "Se recebesse agora a fotografia de uma pessoa, você saberia onde olhar para identificar o Transtorno da Personalidade Narcisista?",
      genericField: "capacidade_ou_forma_atual", sheetField: "T3 - Capacidade atual",
      options: [
        { label: "Sim, conheço exatamente os pontos do terço superior que precisam ser analisados.", tag: "conhece_tecnica" },
        { label: "Já ouvi falar dessa possibilidade, mas não conheço a técnica.", tag: "conhece_possibilidade" },
        { label: "Talvez percebesse algo diferente, mas não saberia interpretar.", tag: "percepcao_sem_interpretacao" },
        { label: "Não. Hoje eu dependeria totalmente do relato e do comportamento.", tag: "dependencia_do_relato" }
      ]
    },
    {
      id: "t_insight", type: "insight", eyebrow: "Antes da primeira pergunta",
      title: "Imagine começar o atendimento já sabendo que está diante de uma pessoa com esse transtorno.",
      paragraphs: [
        "Em vez de depender somente do que o paciente decide contar, a técnica permite analisar o terço superior da face antes de iniciar a conversa.",
        "Essa informação pode ajudar você a direcionar as primeiras perguntas, compreender mecanismos de defesa, interpretar reações, adaptar a comunicação e definir a condução.",
        "Quando uma mulher relata problemas no relacionamento, uma fotografia do marido ou namorado também pode ampliar a compreensão daquela dinâmica."
      ],
      button: "Quero continuar"
    },
    {
      id: "t4_pain", type: "question", label: "O erro que você evita",
      text: "Qual erro você mais gostaria de evitar nos seus atendimentos?",
      genericField: "dor_principal", sheetField: "T4 - Dor principal",
      options: [
        { label: "Levar várias sessões para perceber um padrão que poderia ser identificado no início.", tag: "demora_na_identificacao" },
        { label: "Conduzir o paciente de uma maneira que aumenta sua resistência.", tag: "conducao_inadequada" },
        { label: "Trabalhar apenas o sofrimento da mulher sem compreender o funcionamento do parceiro.", tag: "nao_compreender_parceiro" },
        { label: "Confundir segurança e autoconfiança com um transtorno que exige outra condução.", tag: "confundir_autoconfianca" }
      ]
    },
    {
      id: "t5_transformation", type: "question", label: "Aplicação desejada",
      text: "Como essa técnica mudaria primeiro a sua atuação?",
      genericField: "transformacao_desejada", sheetField: "T5 - Transformação desejada",
      options: [
        { label: "Eu chegaria às primeiras perguntas sabendo qual padrão preciso considerar.", tag: "precisao_inicial" },
        { label: "Conseguiria adaptar minha condução ao funcionamento de cada paciente.", tag: "conducao_personalizada" },
        { label: "Ajudaria pacientes a redirecionar o transtorno para comportamentos mais construtivos.", tag: "redirecionamento" },
        { label: "Compreenderia melhor conflitos conjugais analisando também a fotografia do parceiro.", tag: "leitura_conjugal" }
      ]
    }
  ],
  nao_terapeuta: [
    {
      id: "n2_situation", type: "question", label: "Situação de uso",
      text: "Em qual situação identificar o Transtorno da Personalidade Narcisista pela face teria mais valor para você?",
      genericField: "situacao_de_uso", sheetField: "N2 - Situação de uso",
      options: [
        { label: "Antes de começar ou aprofundar um relacionamento.", tag: "novo_relacionamento" },
        { label: "Ao tentar compreender alguém com quem já me relaciono.", tag: "relacionamento_atual" },
        { label: "Antes de confiar, contratar ou construir uma parceria.", tag: "decisao_profissional" },
        { label: "Para começar uma futura atuação trabalhando com pessoas.", tag: "futura_atuacao" }
      ]
    },
    {
      id: "n3_capacity", type: "question", label: "Seu olhar hoje",
      text: "Quando alguém parece muito confiante, carismático e interessado em você, como costuma avaliar essa pessoa?",
      genericField: "capacidade_ou_forma_atual", sheetField: "N3 - Forma atual de avaliação",
      options: [
        { label: "Presto atenção principalmente no que ela diz e promete.", tag: "confia_no_discurso" },
        { label: "Confio na minha intuição, mas nem sempre sei explicar minha percepção.", tag: "intuicao" },
        { label: "Espero o comportamento mostrar quem ela realmente é.", tag: "espera_o_comportamento" },
        { label: "Observo o rosto e o corpo, mas ainda não conheço uma técnica.", tag: "observacao_sem_tecnica" }
      ]
    },
    {
      id: "n_insight", type: "insight", eyebrow: "Antes de confiar",
      title: "Esperar o comportamento revelar tudo pode custar tempo, confiança e envolvimento emocional.",
      paragraphs: [
        "No início, uma pessoa com esse transtorno pode parecer extremamente confiante, carismática, intensa, convincente e interessada.",
        "Quando os problemas aparecem, o vínculo pode já estar estabelecido.",
        "A técnica do terço superior da face permite observar esses sinais antes da primeira palavra e considerar essa informação antes de tomar uma decisão."
      ],
      button: "Quero continuar"
    },
    {
      id: "n4_pain", type: "question", label: "O erro que você evita",
      text: "Qual destas situações você mais gostaria de evitar?",
      genericField: "dor_principal", sheetField: "N4 - Dor principal",
      options: [
        { label: "Descobrir o transtorno somente depois de já estar emocionalmente envolvido.", tag: "descoberta_tardia" },
        { label: "Confundir intensidade e excesso de atenção com amor verdadeiro.", tag: "confundir_intensidade" },
        { label: "Confiar em alguém que depois passa a manipular, controlar ou desvalorizar.", tag: "manipulacao_e_controle" },
        { label: "Entrar em uma sociedade, contratação ou negociação com a pessoa errada.", tag: "erro_profissional" }
      ]
    },
    {
      id: "n5_transformation", type: "question", label: "Mudança desejada",
      text: "Se você aprendesse a identificar o transtorno pela face, o que mudaria primeiro?",
      genericField: "transformacao_desejada", sheetField: "N5 - Transformação desejada",
      options: [
        { label: "Eu escolheria melhor antes de me envolver profundamente.", tag: "escolher_melhor" },
        { label: "Estabeleceria limites antes que o relacionamento se tornasse desgastante.", tag: "estabelecer_limites" },
        { label: "Ficaria mais atento antes de confiar em alguém.", tag: "confiar_com_criterio" },
        { label: "Usaria esse conhecimento para tomar melhores decisões pessoais e profissionais.", tag: "decisoes_melhores" }
      ]
    }
  ]
};

const RESULTS = {
  terapeuta: {
    badge: "Perfil: aplicação terapêutica",
    title: "Seu atendimento pode começar antes da primeira pergunta.",
    summary: "Suas respostas mostram que essa técnica teria aplicação direta na forma como você recebe, compreende e conduz seus pacientes.",
    detail: "Ao analisar o terço superior da face, você passa a contar com uma informação anterior ao relato para orientar perguntas, comunicação, condução e redirecionamento.",
    bridgeTitle: "E se você entrasse no próximo atendimento sabendo exatamente onde olhar?",
    bridge: "No Workshop Raio-X Humano, Bruno Simplício vai ensinar a técnica utilizada para observar os sinais associados ao Transtorno da Personalidade Narcisista no terço superior da face.",
    cta: "Quero aplicar essa técnica nos meus atendimentos"
  },
  nao_terapeuta: {
    badge: "Perfil: escolhas e discernimento",
    title: "Seu maior risco pode não ser encontrar uma pessoa com esse transtorno. Pode ser perceber tarde demais.",
    summary: "Suas respostas mostram que essa habilidade teria impacto na maneira como você escolhe relacionamentos, entrega confiança, estabelece limites e avalia pessoas.",
    detail: "No início, intensidade pode parecer conexão, excesso de atenção pode parecer amor e controle pode parecer cuidado.",
    bridgeTitle: "E se você não precisasse esperar o problema aparecer para entender quem está diante de você?",
    bridge: "No Workshop Raio-X Humano, Bruno Simplício vai mostrar onde olhar, o que observar e como considerar essa informação antes de confiar ou se envolver.",
    cta: "Quero aprender a identificar antes de confiar"
  }
};

const root = document.querySelector("#quiz-root");
const progressLabel = document.querySelector("#progress-label");
let state = createState();

function createState() {
  const now = new Date().toISOString();
  return {
    screen: "opening", stepIndex: 0, lead: null, answers: {}, answerTags: {}, routeFields: {},
    profile: "", route: "", vslProfile: "nao_terapeuta", tracking: getTrackingParams(),
    submissionId: createSubmissionId(), firstSentAt: now, openingViewedAt: now,
    captureViewedAt: "", leadSubmittedAt: "", qualifiedAt: "", quizStartedAt: "",
    quizCompletedAt: "", resultViewedAt: "", checkoutClickedAt: "",
    captureViewed: false, resultViewed: false, checkoutClicked: false,
    testMode: window.RAIOX_TEST_MODE === true || new URLSearchParams(window.location.search).get("test_mode") === "1"
  };
}

function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  return ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "src", "sck"].reduce((out, key) => {
    if (params.has(key)) out[key] = params.get(key);
    return out;
  }, {});
}

function panel(content) { return `<section class="screen panel"><div class="panel-inner">${content}</div></section>`; }
function currentSteps() { return [QUALIFICATION, ...(state.route ? ROUTES[state.route] : [])]; }

function render() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateProgress();
  if (state.screen === "opening") return renderOpening();
  if (state.screen === "lead") return renderLead();
  if (state.screen === "step") return renderStep();
  if (state.screen === "loading") return renderLoading();
  return renderResult();
}

function updateProgress() {
  progressLabel.textContent = state.screen === "step" ? `Etapa ${state.stepIndex + 1} de 6` : "";
}

function renderOpening() {
  root.innerHTML = panel(`
    <span class="eyebrow">Quiz Raio-X do Narcisismo · 2 minutos</span>
    <h1 class="opening-title">Você conseguiria identificar uma pessoa com Transtorno da Personalidade Narcisista antes mesmo de ela dizer a primeira palavra?</h1>
    <figure class="raiox-hero-visual">
      <img src="/raio-x-hero-wide.webp?v=2" alt="Observação de características do rosto" width="1586" height="992">
      <span class="raiox-scan-line" aria-hidden="true"></span>
    </figure>
    <p class="lead opening-promise">Existe uma técnica que utiliza o terço superior da face para observar sinais associados ao transtorno. Descubra quanto seu olhar percebe hoje e quantos sinais podem estar passando despercebidos.</p>
    <ul class="opening-list opening-benefits opening-benefits-five">
      <li>Analisar alguém antes da primeira conversa.</li>
      <li>Direcionar melhor um atendimento.</li>
      <li>Compreender conflitos conjugais pela fotografia do parceiro.</li>
      <li>Identificar sinais antes de confiar ou se envolver.</li>
      <li>Tomar decisões melhores sobre pessoas.</li>
    </ul>
    <p class="fine-print">Conteúdo educacional sobre a técnica apresentada no Workshop Raio-X Humano.</p>
    <div class="fixed-cta"><button class="button button-primary" id="start-button" type="button">Descobrir se eu saberia identificar</button></div>
  `);
  document.querySelector("#start-button").addEventListener("click", () => {
    state.captureViewed = true;
    state.captureViewedAt = new Date().toISOString();
    state.screen = "lead";
    sendLeadEvent("capture_view");
    trackEvent("raiox04_start");
    render();
  });
}

function renderLead() {
  const lead = state.lead || {};
  root.innerHTML = panel(`
    <span class="eyebrow">Workshop Raio-X Humano</span>
    <h1>Preencha seus dados para começar.</h1>
    <p class="lead">Você receberá seu resultado e os próximos passos para conhecer a técnica de observação do terço superior da face.</p>
    <form class="form" id="lead-form" novalidate>
      <div class="field"><label for="name">Nome</label><input id="name" name="name" autocomplete="name" placeholder="Seu nome" value="${escapeHtml(lead.name || "")}" required></div>
      <div class="field"><label for="email">Melhor e-mail</label><input id="email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(lead.email || "")}" required></div>
      <div class="field"><label for="phone">WhatsApp</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="+55 11 99999-9999" value="${escapeHtml(lead.phone || "")}" required></div>
      <div class="error" id="form-error" role="alert"></div>
      <div class="fixed-cta"><button class="button button-primary" type="submit">Começar o quiz</button></div>
    </form>
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
  state.leadSubmittedAt = new Date().toISOString();
  state.quizStartedAt = state.leadSubmittedAt;
  localStorage.setItem(RAIOX_CONFIG.storageKey, JSON.stringify(lead));
  sendLeadEvent("lead_submitted");
  trackEvent("raiox04_lead_submit");
  state.screen = "step";
  render();
}

function validateLead(lead) {
  if (lead.name.length < 2) return "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Informe um e-mail válido.";
  if (lead.phone.replace(/\D/g, "").length < 7) return "Informe um WhatsApp válido, com código do país.";
  return "";
}

function renderStep() {
  const steps = currentSteps();
  const step = steps[state.stepIndex];
  const progress = ((state.stepIndex + 1) / 6) * 100;
  if (step.type === "insight") return renderInsight(step, progress);
  root.innerHTML = panel(`
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <div class="question-number">${step.label} · etapa ${state.stepIndex + 1} de 6</div>
    <h2 class="question-title">${step.text}</h2>
    <div class="options" role="radiogroup" aria-label="${escapeHtml(step.text)}">
      ${step.options.map((option, index) => `<button class="option" type="button" data-index="${index}">${option.label}</button>`).join("")}
    </div>
  `);
  document.querySelectorAll(".option").forEach((button) => button.addEventListener("click", () => answerStep(step, Number(button.dataset.index), button)));
}

function renderInsight(step, progress) {
  root.innerHTML = panel(`
    <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress}%"></div></div>
    <span class="eyebrow">${step.eyebrow}</span>
    <h2>${step.title}</h2>
    <div class="insight-card">${step.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div>
    <div class="fixed-cta"><button class="button button-primary" id="continue-button" type="button">${step.button}</button></div>
  `);
  document.querySelector("#continue-button").addEventListener("click", () => {
    state.stepIndex += 1;
    trackEvent("raiox04_insight_continue", { route: state.route });
    render();
  });
}

function answerStep(step, optionIndex, button) {
  const option = step.options[optionIndex];
  document.querySelectorAll(".option").forEach((item) => item.disabled = true);
  button.classList.add("selected");
  state.answers[step.id] = option.label;
  state.answerTags[step.id] = option.tag || "";

  if (step.id === "qualification") {
    state.profile = option.profile;
    state.route = option.route;
    state.vslProfile = option.vslProfile;
    state.qualifiedAt = new Date().toISOString();
  } else {
    state.routeFields[step.genericField] = option.label;
    state.routeFields[step.sheetField] = option.label;
  }

  sendLeadEvent("partial", step.id);
  trackEvent("raiox04_answer", { question: step.id, profile: state.profile, route: state.route, tag: option.tag || "" });
  window.setTimeout(() => {
    state.stepIndex += 1;
    if (state.stepIndex >= currentSteps().length) state.screen = "loading";
    render();
  }, 260);
}

function renderLoading() {
  const therapist = state.route === "terapeuta";
  root.innerHTML = panel(`
    <div class="loading"><div class="loading-ring" aria-hidden="true"></div>
      <h2>${therapist ? "Organizando seu Mapa de Aplicação Clínica..." : "Organizando seu Mapa de Discernimento..."}</h2>
      <p>${therapist ? "Estamos conectando suas respostas às situações em que a leitura do terço superior da face pode transformar seus atendimentos." : "Estamos conectando suas respostas às situações em que essa técnica pode mudar suas escolhas."}</p>
    </div>
  `);
  window.setTimeout(() => {
    const completedAt = new Date().toISOString();
    state.screen = "result";
    state.resultViewed = true;
    state.quizCompletedAt = completedAt;
    state.resultViewedAt = completedAt;
    sendLeadEvent("quiz_completed");
    trackEvent("raiox04_result_view", { profile: state.profile, route: state.route });
    render();
  }, 750);
}

function renderResult() {
  const result = RESULTS[state.route] || RESULTS.nao_terapeuta;
  const player = VSL_PLAYERS[state.vslProfile];
  root.innerHTML = panel(`
    <div class="result-simple result-narcissism">
      <span class="result-badge">${result.badge}</span>
      <h1>${result.title}</h1>
      <div class="result-copy compact-result-copy">
        <p>${result.summary}</p>
        <p>${result.detail}</p>
        <div class="personalization"><span>Você afirmou que gostaria de:</span><strong>${escapeHtml(state.routeFields.transformacao_desejada || "desenvolver um olhar mais treinado sobre as pessoas.")}</strong></div>
      </div>
      <div class="bridge-card"><h3>${result.bridgeTitle}</h3><p>${result.bridge}</p></div>
      <div class="video-frame" aria-label="Vídeo do Workshop Raio-X Humano">
        <vturb-smartplayer id="${player.id}" style="display:block;margin:0 auto;width:100%;max-width:400px;"><div class="vturb-player-placeholder"></div></vturb-smartplayer>
      </div>
      <div class="workshop-date-card"><span>Workshop Raio-X Humano</span><strong>${RAIOX_CONFIG.workshopDateText}</strong><small>Duas noites ao vivo · Investimento: ${RAIOX_CONFIG.priceText}</small></div>
      <p class="health-note">A técnica é apresentada como ferramenta educacional de análise visual. Diagnósticos clínicos formais devem ser realizados por profissional habilitado mediante avaliação completa.</p>
      <div class="fixed-cta result-fixed-cta" id="checkout-cta"><a class="button button-primary" id="checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">${result.cta}</a></div>
    </div>
  `);
  loadVturbPlayer(player);
  window.setTimeout(() => document.querySelector("#checkout-cta")?.classList.add("visible"), (state.testMode ? 0 : RAIOX_CONFIG.ctaDelaySeconds) * 1000);
  document.querySelector("#checkout-button").addEventListener("click", (event) => {
    if (state.testMode) event.preventDefault();
    state.checkoutClicked = true;
    state.checkoutClickedAt = new Date().toISOString();
    sendLeadEvent("checkout_clicked");
    trackEvent("raiox04_checkout_click", { profile: state.profile, route: state.route, vsl_profile: state.vslProfile, test_mode: state.testMode });
  });
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
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (key !== "test_mode") url.searchParams.set(key, value);
  });
  url.searchParams.set("profile", state.profile || "vida_pessoal");
  return state.testMode ? "#checkout-teste" : url.toString();
}

function sendLeadEvent(event, lastQuestionId = "") {
  if (!state.submissionId || !RAIOX_CONFIG.leadWebhookUrl) return;
  const now = new Date().toISOString();
  const payload = {
    event,
    source: RAIOX_CONFIG.source,
    quiz_variant: RAIOX_CONFIG.quizVariant,
    quiz_concept: RAIOX_CONFIG.quizConcept,
    spreadsheet_id: RAIOX_CONFIG.spreadsheetId,
    sheet_name: RAIOX_CONFIG.sheetTabName,
    sheet_gid: RAIOX_CONFIG.sheetGid,
    timestamp: now,
    page_url: window.location.href,
    submission_id: state.submissionId,
    status_resposta: state.resultViewed ? "concluída" : "em andamento",
    ultimo_evento: event,
    primeiro_envio_em: state.firstSentAt,
    atualizado_em: now,
    etapa_atual: getCurrentStage(event, lastQuestionId),
    acessou_quiz: "sim",
    chegou_captura: state.captureViewed ? "sim" : undefined,
    enviou_dados: state.lead ? "sim" : undefined,
    quiz_completo: state.resultViewed ? "sim" : undefined,
    resultado_visto: state.resultViewed ? "sim" : undefined,
    clicou_checkout: state.checkoutClicked ? "sim" : undefined,
    opening_viewed_at: state.openingViewedAt,
    capture_viewed_at: state.captureViewedAt || undefined,
    lead_submitted_at: state.leadSubmittedAt || undefined,
    qualified_at: state.qualifiedAt || undefined,
    quiz_started_at: state.quizStartedAt || undefined,
    quiz_completed_at: state.quizCompletedAt || undefined,
    result_viewed_at: state.resultViewedAt || undefined,
    checkout_clicked_at: state.checkoutClickedAt || undefined,
    nome: state.lead?.name,
    email: state.lead?.email,
    telefone: state.lead?.phone,
    perfil: state.profile,
    route: state.route,
    perfil_vsl: state.vslProfile,
    qualificacao: state.answers.qualification,
    ...state.routeFields,
    is_test: state.testMode ? "sim" : "não",
    ...state.tracking
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  const body = JSON.stringify(payload);
  if ((event === "checkout_clicked" || event === "abandoned") && navigator.sendBeacon) {
    navigator.sendBeacon(RAIOX_CONFIG.leadWebhookUrl, new Blob([body], { type: "text/plain;charset=utf-8" }));
    return;
  }
  fetch(RAIOX_CONFIG.leadWebhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body }).catch(() => {});
}

function getCurrentStage(event, lastQuestionId) {
  if (event === "quiz_view") return "1. Abertura";
  if (event === "capture_view") return "2. Captura";
  if (event === "lead_submitted") return "3. Qualificação";
  if (event === "quiz_completed") return "11. Resultado";
  if (event === "checkout_clicked") return "12. Checkout";
  if (event === "abandoned") return `Abandono · ${state.screen}`;
  const steps = currentSteps();
  const index = steps.findIndex((step) => step.id === lastQuestionId);
  if (index < 0) return "Em andamento";
  const questionNumber = steps.slice(0, index + 1).filter((step) => step.type === "question").length;
  return `${state.route || "qualificacao"} · pergunta ${questionNumber} de 5`;
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `raiox04-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function trackEvent(eventName, payload = {}) {
  const data = { event: eventName, source: RAIOX_CONFIG.source, quiz_variant: RAIOX_CONFIG.quizVariant, ...payload };
  if (window.dataLayer) window.dataLayer.push(data);
  if (!state.testMode && typeof window.fbq === "function") window.fbq("trackCustom", eventName, data);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.addEventListener("pagehide", () => {
  if (!state.resultViewed && !state.checkoutClicked) sendLeadEvent("abandoned");
});

trackEvent("raiox04_view");
sendLeadEvent("quiz_view");
render();
