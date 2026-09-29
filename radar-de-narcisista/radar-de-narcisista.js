const RADAR_CONFIG = {
  checkoutUrl: "https://pay.hotmart.com/P107318989J?off=7spkcy10",
  leadWebhookUrl: "https://script.google.com/macros/s/AKfycbxZ_k-DutORMsyQrG8K-c8Jky4Jcwwr-m8bgunzXl43HY0E1mjS636QrUC4O33xJXBQ4w/exec",
  source: "quiz_radar_de_narcisista",
  quizVariant: "radar_de_narcisista",
  quizConcept: "radar_narcisismo",
  storageKey: "radar_de_narcisista_lead",
  sheetTabName: "Leads Radar de Narcisista",
  spreadsheetId: "11YDtO0DfVx9ETFHf6_cNy4N6OFq9S8j6CX7dKHHvQ_8",
  priceText: "R$67",
  workshopDateText: "6 e 7 de Outubro, às 20h · ao vivo"
};

const QUALIFICATION = {
  id: "qualification",
  type: "question",
  label: "Seu perfil",
  text: "Qual destas frases descreve melhor você hoje?",
  options: [
    { label: "Sou terapeuta e já realizo atendimentos.", profile: "terapeuta", route: "terapeuta" },
    { label: "Ainda não sou terapeuta, mas quero começar a atuar.", profile: "futuro_terapeuta", route: "nao_terapeuta" },
    { label: "Não sou terapeuta, mas trabalho diretamente com pessoas.", profile: "profissional_de_pessoas", route: "nao_terapeuta" },
    { label: "Quero utilizar esse conhecimento principalmente na minha vida pessoal.", profile: "vida_pessoal", route: "nao_terapeuta" }
  ]
};

const ROUTES = {
  terapeuta: [
    {
      id: "t_application", type: "question", label: "Aplicação",
      text: "Em qual situação identificar sinais associados ao narcisismo pela face teria mais impacto nos seus atendimentos?",
      genericField: "situacao_de_uso", sheetField: "T2 - Aplicação",
      options: [
        { label: "Compreender mais rapidamente um paciente.", tag: "compreender_paciente" },
        { label: "Analisar o parceiro de uma paciente.", tag: "analisar_parceiro" },
        { label: "Perceber incongruências entre relato e comportamento.", tag: "perceber_incongruencias" },
        { label: "Ter mais informações para definir a melhor condução.", tag: "definir_conducao" }
      ]
    },
    {
      id: "t_awareness", type: "question", label: "Consciência",
      text: "Se recebesse agora a fotografia de uma pessoa, você saberia onde olhar para observar sinais associados ao narcisismo?",
      genericField: "capacidade_atual", sheetField: "T3 - Consciência",
      options: [
        { label: "Sim, conheço os pontos do terço superior.", tag: "conhece_pontos" },
        { label: "Conheço a possibilidade, mas não conheço a técnica.", tag: "conhece_possibilidade" },
        { label: "Talvez percebesse alguma coisa, mas não saberia interpretar.", tag: "percepcao_sem_interpretacao" },
        { label: "Não. Dependeria totalmente do relato e do comportamento.", tag: "dependencia_do_relato" }
      ]
    },
    {
      id: "t_insight", type: "insight", eyebrow: "Uma nova camada de observação",
      title: "Imagine começar um atendimento já sabendo quais sinais observar.",
      paragraphs: [
        "Em vez de depender somente do que o paciente decide contar, existe uma técnica que utiliza o terço superior da face como uma fonte adicional de observação.",
        "Essa informação pode ajudar você a direcionar perguntas, compreender determinados padrões, interpretar reações e adaptar sua comunicação e condução."
      ],
      button: "Continuar"
    },
    {
      id: "t_pain", type: "question", label: "Dor",
      text: "Qual erro você mais gostaria de evitar nos seus atendimentos?",
      genericField: "dor_principal", sheetField: "T4 - Dor",
      options: [
        { label: "Demorar para perceber determinados padrões.", tag: "demora_na_percepcao" },
        { label: "Aumentar a resistência com uma condução inadequada.", tag: "conducao_inadequada" },
        { label: "Não compreender o funcionamento do parceiro de um paciente.", tag: "nao_compreender_parceiro" },
        { label: "Confundir autoconfiança com características que merecem uma observação mais cuidadosa.", tag: "confundir_autoconfianca" }
      ]
    },
    {
      id: "t_desire", type: "question", label: "Desejo",
      text: "Se você dominasse essa técnica, o que mudaria primeiro na sua atuação?",
      genericField: "transformacao_desejada", sheetField: "T5 - Desejo",
      options: [
        { label: "Teria mais precisão nas primeiras perguntas.", tag: "precisao_inicial" },
        { label: "Conseguiria personalizar melhor minha condução.", tag: "conducao_personalizada" },
        { label: "Teria mais informações para compreender determinados comportamentos.", tag: "compreender_comportamentos" },
        { label: "Compreenderia melhor alguns conflitos conjugais.", tag: "conflitos_conjugais" }
      ]
    }
  ],
  nao_terapeuta: [
    {
      id: "n_application", type: "question", label: "Aplicação",
      text: "Em qual situação identificar sinais associados ao narcisismo pela face teria mais valor para você?",
      genericField: "situacao_de_uso", sheetField: "N2 - Aplicação",
      options: [
        { label: "Antes de entrar em um relacionamento.", tag: "novo_relacionamento" },
        { label: "Para compreender melhor um relacionamento atual.", tag: "relacionamento_atual" },
        { label: "Antes de confiar ou construir uma parceria.", tag: "confiar_ou_parceria" },
        { label: "Para uma futura atuação trabalhando com pessoas.", tag: "futura_atuacao" }
      ]
    },
    {
      id: "n_awareness", type: "question", label: "Consciência",
      text: "Quando alguém parece muito confiante, carismático e interessado em você, como você costuma avaliar essa pessoa?",
      genericField: "capacidade_atual", sheetField: "N3 - Consciência",
      options: [
        { label: "Presto atenção principalmente no que ela fala.", tag: "discurso" },
        { label: "Confio bastante na minha intuição.", tag: "intuicao" },
        { label: "Espero o comportamento revelar quem ela realmente é.", tag: "espera_comportamento" },
        { label: "Observo rosto e corpo, mas não conheço nenhuma técnica.", tag: "observacao_sem_tecnica" }
      ]
    },
    {
      id: "n_insight", type: "insight", eyebrow: "Antes de confiar",
      title: "Esperar o comportamento revelar tudo pode custar tempo, confiança e envolvimento emocional.",
      paragraphs: [
        "No início de uma relação, algumas características podem ser interpretadas de maneiras completamente diferentes.",
        "Intensidade pode parecer conexão. Excesso de atenção pode parecer interesse genuíno. Controle pode ser confundido com cuidado.",
        "Por isso, quanto mais informações você aprende a observar, mais critérios pode ter antes de entregar sua confiança."
      ],
      button: "Continuar"
    },
    {
      id: "n_pain", type: "question", label: "Dor",
      text: "Qual destas situações você mais gostaria de evitar?",
      genericField: "dor_principal", sheetField: "N4 - Dor",
      options: [
        { label: "Descobrir determinados padrões tarde demais.", tag: "descoberta_tardia" },
        { label: "Confundir intensidade com amor.", tag: "confundir_intensidade" },
        { label: "Confiar em alguém manipulador ou controlador.", tag: "manipulacao_controle" },
        { label: "Entrar em uma parceria com a pessoa errada.", tag: "parceria_errada" }
      ]
    },
    {
      id: "n_desire", type: "question", label: "Desejo",
      text: "Se você aprendesse a observar esses sinais pela face, o que mudaria primeiro?",
      genericField: "transformacao_desejada", sheetField: "N5 - Desejo",
      options: [
        { label: "Escolheria melhor as pessoas que deixo se aproximar.", tag: "escolher_melhor" },
        { label: "Estabeleceria limites mais cedo.", tag: "limites_mais_cedo" },
        { label: "Entregaria minha confiança com mais critério.", tag: "confianca_com_criterio" },
        { label: "Tomaria melhores decisões pessoais e profissionais.", tag: "decisoes_melhores" }
      ]
    }
  ]
};

const RESULTS = {
  terapeuta: {
    badge: "Perfil: aplicação terapêutica",
    title: "Seu atendimento pode começar antes da primeira pergunta.",
    paragraphs: [
      "Suas respostas mostram que essa técnica pode adicionar uma nova camada de observação à forma como você recebe, compreende e conduz seus pacientes.",
      "Hoje, grande parte das informações surge durante a conversa.",
      "Mas existe uma região específica do rosto que provavelmente você ainda não aprendeu a analisar:"
    ]
  },
  nao_terapeuta: {
    badge: "Perfil: escolhas e discernimento",
    title: "Seu maior risco pode não ser encontrar alguém com características narcisistas. Pode ser perceber os sinais tarde demais.",
    paragraphs: [
      "Suas respostas mostram que essa habilidade poderia mudar a forma como você entrega confiança, estabelece limites e avalia as pessoas que entram na sua vida.",
      "Porque você pode esperar semanas ou meses para que determinados comportamentos apareçam.",
      "Ou pode aprender a perceber mais informações desde o início.",
      "E existe uma região específica do rosto que provavelmente você nunca aprendeu a observar:"
    ]
  }
};

const root = document.querySelector("#quiz-root");
const progressLabel = document.querySelector("#progress-label");
let state = createState();

function createState() {
  const now = new Date().toISOString();
  return {
    screen: "opening", stepIndex: 0, lead: null, answers: {}, answerTags: {}, routeFields: {},
    profile: "", route: "", tracking: getTrackingParams(), submissionId: createSubmissionId(),
    firstSentAt: now, openingViewedAt: now, captureViewedAt: "", leadSubmittedAt: "",
    qualifiedAt: "", quizStartedAt: "", quizCompletedAt: "", resultViewedAt: "",
    checkoutClickedAt: "", captureViewed: false, resultViewed: false, checkoutClicked: false,
    testMode: window.RADAR_TEST_MODE === true || new URLSearchParams(window.location.search).get("test_mode") === "1"
  };
}

function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  return ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "src", "sck"].reduce((out, key) => {
    if (params.has(key)) out[key] = params.get(key);
    return out;
  }, {});
}

function panel(content, className = "") {
  return `<section class="screen panel ${className}"><div class="panel-inner">${content}</div></section>`;
}

function currentSteps() {
  return [QUALIFICATION, ...(state.route ? ROUTES[state.route] : [])];
}

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
  if (progressLabel) progressLabel.textContent = state.screen === "step" ? `Etapa ${state.stepIndex + 1} de 6` : "";
}

function renderOpening() {
  root.innerHTML = panel(`
    <span class="eyebrow">Quiz Radar de Narcisista</span>
    <h1 class="opening-title">Você conseguiria identificar um narcisista antes mesmo dele dizer a primeira palavra?</h1>
    <p class="lead opening-promise">Existe uma técnica que utiliza o terço superior da face para observar sinais associados ao narcisismo.</p>
    <figure class="radar-hero-visual">
      <img src="/radar-de-narcisista/assets/radar-de-narcisista.png" alt="Radar de Narcisista" width="1254" height="1254">
      <span class="scan-line" aria-hidden="true"></span>
    </figure>
    <h2 class="benefit-heading">Essa habilidade pode ajudar você a:</h2>
    <ul class="opening-benefits">
      <li>Analisar alguém antes da primeira conversa.</li>
      <li>Ter mais informações para direcionar um atendimento.</li>
      <li>Compreender melhor conflitos conjugais analisando uma fotografia.</li>
      <li>Perceber sinais antes de confiar ou se envolver.</li>
      <li>Tomar decisões melhores sobre as pessoas que entram na sua vida.</li>
    </ul>
    <div class="fixed-cta"><button class="button button-primary" id="start-button" type="button">Descobrir se eu saberia identificar</button></div>
  `, "opening-screen");
  document.querySelector("#start-button").addEventListener("click", () => {
    state.captureViewed = true;
    state.captureViewedAt = new Date().toISOString();
    state.screen = "lead";
    sendLeadEvent("capture_view");
    trackEvent("radar_start");
    render();
  });
}

function renderLead() {
  const savedLead = getSavedLead();
  root.innerHTML = panel(`
    <span class="eyebrow">Radar de Narcisista</span>
    <h1>Preencha seus dados para começar.</h1>
    <p class="lead">No final, você vai descobrir quanto seu olhar percebe hoje e conhecer uma técnica de observação do terço superior da face.</p>
    <form class="form" id="lead-form" novalidate>
      <div class="field"><label for="name">Nome</label><input id="name" name="name" autocomplete="name" placeholder="Seu nome" value="${escapeHtml(savedLead.name || "")}" required></div>
      <div class="field"><label for="email">Melhor e-mail</label><input id="email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(savedLead.email || "")}" required></div>
      <div class="field"><label for="phone">WhatsApp</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="Código do país + número" value="${escapeHtml(savedLead.phone || "")}" required></div>
      <div class="error" id="form-error" role="alert"></div>
      <div class="fixed-cta"><button class="button button-primary" type="submit">Começar o quiz</button></div>
    </form>
  `);
  document.querySelector("#lead-form").addEventListener("submit", handleLeadSubmit);
}

function getSavedLead() {
  try { return JSON.parse(localStorage.getItem(RADAR_CONFIG.storageKey) || "{}") || {}; }
  catch (_) { return {}; }
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
  if (error) {
    document.querySelector("#form-error").textContent = error;
    return;
  }
  state.lead = lead;
  state.leadSubmittedAt = new Date().toISOString();
  state.quizStartedAt = state.leadSubmittedAt;
  localStorage.setItem(RADAR_CONFIG.storageKey, JSON.stringify(lead));
  sendLeadEvent("lead_submitted");
  trackEvent("radar_lead_submit");
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
      ${step.options.map((option, index) => `<button class="option" type="button" data-index="${index}"><span>${String.fromCharCode(65 + index)}</span>${option.label}</button>`).join("")}
    </div>
  `);
  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => answerStep(step, Number(button.dataset.index), button));
  });
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
    trackEvent("radar_insight_continue", { route: state.route });
    render();
  });
}

function answerStep(step, optionIndex, button) {
  const option = step.options[optionIndex];
  document.querySelectorAll(".option").forEach((item) => { item.disabled = true; });
  button.classList.add("selected");
  state.answers[step.id] = option.label;
  state.answerTags[step.id] = option.tag || "";

  if (step.id === "qualification") {
    state.profile = option.profile;
    state.route = option.route;
    state.qualifiedAt = new Date().toISOString();
  } else {
    state.routeFields[step.genericField] = option.label;
    state.routeFields[step.sheetField] = option.label;
  }

  sendLeadEvent("partial", step.id);
  trackEvent("radar_answer", { question: step.id, profile: state.profile, route: state.route, tag: option.tag || "" });
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
      <h2>${therapist ? "Organizando seu perfil de aplicação..." : "Organizando seu perfil de discernimento..."}</h2>
      <p>Estamos conectando suas respostas às situações em que um olhar mais treinado pode mudar suas decisões.</p>
    </div>
  `);
  window.setTimeout(() => {
    const completedAt = new Date().toISOString();
    state.screen = "result";
    state.resultViewed = true;
    state.quizCompletedAt = completedAt;
    state.resultViewedAt = completedAt;
    sendLeadEvent("quiz_completed");
    trackEvent("radar_result_view", { profile: state.profile, route: state.route });
    render();
  }, 700);
}

function renderResult() {
  const result = RESULTS[state.route] || RESULTS.nao_terapeuta;
  root.innerHTML = `
    <section class="screen result-page">
      <section class="result-hero sales-band">
        <div class="content-width">
          <span class="result-badge">${result.badge}</span>
          <h1>${result.title}</h1>
          <div class="result-copy">${result.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div>
          <p class="face-focus">O terço superior da face.</p>
          <p>E foi justamente para ensinar essa análise que Bruno Simplício criou o:</p>
          <h2 class="product-name">Radar de Narcisista</h2>
        </div>
      </section>

      <section class="product-band sales-band">
        <div class="content-width two-column-offer">
          <div class="product-art"><img src="/radar-de-narcisista/assets/radar-de-narcisista.png" alt="Radar de Narcisista" width="1254" height="1254" loading="eager"></div>
          <div class="offer-copy">
            <span class="eyebrow left">Treinamento online</span>
            <h2>Radar de Narcisista</h2>
            <h3>Aprenda onde olhar e o que observar no terço superior do rosto.</h3>
            <p>O Radar de Narcisista é um treinamento direto ao ponto em que Bruno Simplício ensina a técnica utilizada dentro do método para analisar essa região específica da face.</p>
          </div>
        </div>
        <div class="content-width learning-block">
          <h3>Você vai aprender:</h3>
          <ul class="check-list">
            <li>Qual região do rosto deve ser observada.</li>
            <li>Quais características analisar no terço superior.</li>
            <li>Como realizar essa observação de forma estruturada.</li>
            <li>Quais sinais são associados ao narcisismo dentro do método.</li>
            <li>Como começar a aplicar esse conhecimento na prática.</li>
          </ul>
          <div class="simple-promise">
            <strong>Sem precisar ser terapeuta. Sem precisar ter conhecimento prévio.</strong>
            <p>Depois de aprender onde olhar, você começa a perceber detalhes que antes passavam despercebidos.</p>
          </div>
          <a class="button button-primary inline-cta checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Quero aprender a técnica</a>
        </div>
      </section>

      <section class="bonus-band sales-band">
        <div class="content-width">
          <span class="eyebrow">Bônus especial</span>
          <h2>E sua compra ainda inclui um ingresso para o Workshop Raio-X Humano.</h2>
          <figure class="ticket-art"><img src="/radar-de-narcisista/assets/ingresso-workshop.png" alt="Ingresso para o Workshop Raio-X Humano incluído na compra do Radar de Narcisista" width="1672" height="940" loading="lazy"></figure>
          <p>O Radar de Narcisista ensina uma análise muito específica. Mas ele é apenas uma pequena parte do que pode ser observado no rosto e no corpo.</p>
          <p>Por isso, ao adquirir o Radar, você também garante sua participação no:</p>
          <h3 class="workshop-name">Workshop Raio-X Humano</h3>
          <p class="live-label">${RADAR_CONFIG.workshopDateText} · 2 noites com Bruno Simplício</p>
        </div>
      </section>

      <section class="curriculum-band sales-band">
        <div class="content-width">
          <h2>O que você vai aprender no Raio-X Humano</h2>
          <div class="curriculum-grid">
            <article>
              <span>01</span>
              <h3>Traços de caráter</h3>
              <p>Como características e formatos do corpo são utilizados na análise dos diferentes traços de caráter.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Traumas no rosto</h3>
              <p>Como determinadas características do rosto são interpretadas dentro do método como possíveis marcas de experiências emocionais.</p>
            </article>
          </div>
          <div class="analysis-list">
            <h3>Você conhecerá análises relacionadas a:</h3>
            <ul>
              <li>Ausência materna e paterna.</li>
              <li>Raiva materna e paterna.</li>
              <li>Manipulação materna e paterna.</li>
              <li>Peso materno e paterno.</li>
            </ul>
            <p>E vai começar a entender como rosto, corpo, traços e história emocional podem ser observados em conjunto.</p>
          </div>
        </div>
      </section>

      <section class="bridge-band sales-band">
        <div class="content-width">
          <span class="eyebrow">Primeiro o Radar. Depois, o Raio-X completo.</span>
          <h2>Uma análise específica abre caminho para uma leitura mais ampla.</h2>
          <div class="comparison">
            <div><strong>No Radar de Narcisista</strong><span>Terço superior da face → sinais associados ao narcisismo.</span></div>
            <div><strong>No Workshop Raio-X Humano</strong><span>Rosto + Corpo + Traços de caráter + possíveis marcas emocionais.</span></div>
          </div>
          <p>E o seu ingresso para as duas noites já está incluso na compra.</p>
        </div>
      </section>

      <section class="price-band sales-band">
        <div class="content-width">
          <span class="eyebrow">Veja tudo o que você recebe</span>
          <h2>Radar de Narcisista + ingresso para o Workshop Raio-X Humano</h2>
          <div class="bundle-list">
            <div><span>Treinamento</span><strong>Radar de Narcisista</strong><p>Observe e analise o terço superior da face.</p></div>
            <div><span>Bônus</span><strong>Ingresso para o Workshop Raio-X Humano</strong><p>${RADAR_CONFIG.workshopDateText} · Duas noites com Bruno Simplício.</p></div>
          </div>
          <div class="price-box">
            <span>Tudo isso teria o valor de</span>
            <del>R$197</del>
            <small>Mas hoje você garante seu acesso por apenas:</small>
            <strong>${RADAR_CONFIG.priceText}</strong>
            <span>Pagamento único.</span>
          </div>
          <a class="button button-primary inline-cta checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Quero acessar o Radar + garantir meu ingresso</a>
          <p class="button-note">Acesso ao Radar de Narcisista + ingresso para o Workshop Raio-X Humano.</p>
        </div>
      </section>

      <section class="closing-band sales-band">
        <div class="content-width">
          <h2>Quanto pode mudar quando você aprende a perceber o que antes passava despercebido?</h2>
          <p>Hoje, talvez você olhe para essa região do rosto e não veja nada além de olhos, sobrancelhas e testa.</p>
          <p>Depois de conhecer a técnica, você vai saber onde olhar e quais características observar.</p>
          <p>E esse é apenas o começo. Além do Radar de Narcisista, sua inscrição também coloca você dentro do Workshop Raio-X Humano, onde vamos aprofundar esse olhar durante duas noites ao vivo.</p>
          <h3>Radar de Narcisista + Workshop Raio-X Humano</h3>
          <div class="closing-price"><del>R$197</del><strong>${RADAR_CONFIG.priceText}</strong></div>
          <a class="button button-primary inline-cta checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Quero garantir meu acesso</a>
          <p class="health-note">O conteúdo é apresentado como ferramenta educacional de análise e observação visual. Características faciais isoladas não estabelecem diagnóstico clínico de Transtorno da Personalidade Narcisista. Diagnósticos formais devem ser realizados por profissional habilitado mediante avaliação adequada.</p>
        </div>
      </section>

      <div class="sticky-offer" id="sticky-offer">
        <div><span>Radar + ingresso</span><strong>${RADAR_CONFIG.priceText}</strong></div>
        <a class="button button-primary checkout-button" href="${buildCheckoutUrl()}" target="_blank" rel="noopener noreferrer">Quero meu acesso</a>
      </div>
    </section>
  `;

  document.querySelectorAll(".checkout-button").forEach((button) => {
    button.addEventListener("click", handleCheckoutClick);
  });
}

function handleCheckoutClick(event) {
  if (state.testMode) event.preventDefault();
  state.checkoutClicked = true;
  state.checkoutClickedAt = new Date().toISOString();
  sendLeadEvent("checkout_clicked");
  trackEvent("radar_checkout_click", { profile: state.profile, route: state.route, test_mode: state.testMode });
}

function buildCheckoutUrl() {
  if (state.testMode) return "#checkout-teste";
  const url = new URL(RADAR_CONFIG.checkoutUrl);
  const current = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "src", "sck"].forEach((key) => {
    if (current.has(key)) url.searchParams.set(key, current.get(key));
  });
  return url.toString();
}

function sendLeadEvent(event, lastQuestionId = "") {
  if (!state.submissionId || !RADAR_CONFIG.leadWebhookUrl) return;
  const now = new Date().toISOString();
  const payload = {
    event,
    source: RADAR_CONFIG.source,
    quiz_variant: RADAR_CONFIG.quizVariant,
    quiz_concept: RADAR_CONFIG.quizConcept,
    spreadsheet_id: RADAR_CONFIG.spreadsheetId,
    sheet_name: RADAR_CONFIG.sheetTabName,
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
    qualificacao: state.answers.qualification,
    respostas: state.answers,
    answer_tags: state.answerTags,
    ...state.routeFields,
    is_test: state.testMode ? "sim" : "não",
    ...state.tracking
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  const body = JSON.stringify(payload);
  if ((event === "checkout_clicked" || event === "abandoned") && navigator.sendBeacon) {
    navigator.sendBeacon(RADAR_CONFIG.leadWebhookUrl, new Blob([body], { type: "text/plain;charset=utf-8" }));
    return;
  }
  fetch(RADAR_CONFIG.leadWebhookUrl, {
    method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body
  }).catch(() => {});
}

function getCurrentStage(event, lastQuestionId) {
  if (event === "quiz_view") return "1. Abertura";
  if (event === "capture_view") return "2. Captura";
  if (event === "lead_submitted") return "3. Qualificação";
  if (event === "quiz_completed") return "9. Resultado";
  if (event === "checkout_clicked") return "10. Checkout";
  if (event === "abandoned") return `Abandono · ${state.screen}`;
  const steps = currentSteps();
  const index = steps.findIndex((step) => step.id === lastQuestionId);
  if (index < 0) return "Em andamento";
  return `${state.route || "qualificacao"} · etapa ${index + 1} de 6`;
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `radar-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function trackEvent(eventName, payload = {}) {
  const data = { event: eventName, source: RADAR_CONFIG.source, quiz_variant: RADAR_CONFIG.quizVariant, ...payload };
  if (window.dataLayer) window.dataLayer.push(data);
  if (!state.testMode && typeof window.fbq === "function") window.fbq("trackCustom", eventName, data);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.addEventListener("pagehide", () => {
  if (!state.resultViewed && !state.checkoutClicked) sendLeadEvent("abandoned");
});

trackEvent("radar_view");
sendLeadEvent("quiz_view");
render();
