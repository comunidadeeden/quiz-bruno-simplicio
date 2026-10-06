const RAIOX_CONFIG = {
  leadWebhookUrl: "https://script.google.com/macros/s/AKfycbxX9UQEnEfqWTirPDc26dXPaQIoYjSUodE84FHNeFHP-1E-F_47cfWeS3uSLWXHBLbKZw/exec",
  source: "quiz_raiox06",
  reminderUrl: "https://youtube.com/live/Q5OtCmuy4IM?feature=share",
  sheetTabName: "Respostas do aquecimento",
  spreadsheetId: "18N9QfsXG5mGdG05n4uLqBe4kQWP1gIjS_5GQGQ3tSlM",
  sheetGid: "1513396897",
  workshopDateText: "13 e 14 de Outubro, às 20h · ao vivo"

};

const PATTERN_KEYS = ["observar", "conectar", "conduzir", "sustentar", "realizar"];
// Each option describes a self-reported reaction, not a clinical trait.
const QUESTIONS = [
  { id: "distancia", answerKey: "resposta_01", chapter: "Quando alguém importa", text: "Uma pessoa importante fica diferente com você. Qual é seu primeiro movimento?", options: [
    "Me afasto um pouco para organizar o que estou sentindo.",
    "Puxo uma conversa. Ficar sem saber me incomoda.",
    "Observo o que mudou antes de decidir como agir.",
    "Dou espaço e tento não aumentar o problema.",
    "Sigo meu dia e evito mostrar quanto aquilo me afetou."
  ] },
  { id: "confianca", answerKey: "resposta_03", chapter: "Antes de confiar", text: "Alguém faz uma proposta que parece boa demais. O que pesa mais para você?", options: [
    "Ter tempo para pesquisar e chegar à minha conclusão.",
    "Sentir abertura para perguntar e conversar de verdade.",
    "Entender o que cada pessoa ganha com aquilo.",
    "Saber se os compromissos serão respeitados.",
    "Ver resultados concretos de quem está propondo."
  ] },
  { id: "conflito", answerKey: "resposta_04", chapter: "Quando a conversa aperta", text: "Numa discussão, qual reação é mais parecida com a sua?", options: [
    "Preciso de uma pausa para pensar antes de falar.",
    "Quero esclarecer tudo enquanto estamos ali.",
    "Busco os argumentos para colocar a conversa nos trilhos.",
    "Seguro minha reação para não piorar as coisas.",
    "Defendo meu ponto, principalmente quando me sinto injustiçado(a)."
  ] },
  { id: "pedido", answerKey: "resposta_05", chapter: "O preço de dizer sim", text: "Você já está no limite e alguém pede mais um favor. O que tende a acontecer?", options: [
    "Me recolho e demoro a responder.",
    "Penso em como a pessoa vai se sentir se eu disser não.",
    "Tento negociar o pedido de um jeito que funcione para mim.",
    "Acabo aceitando e depois me viro para dar conta.",
    "Quero resolver, mesmo que precise me cobrar ainda mais."
  ] },
  { id: "pressao", answerKey: "resposta_07", chapter: "Você sob pressão", text: "Um plano importante dá errado. O que você tenta recuperar primeiro?", options: [
    "Clareza. Preciso entender o que aconteceu.",
    "Apoio. Preciso conversar com alguém em quem confio.",
    "Direção. Preciso reorganizar as possibilidades.",
    "Estabilidade. Preciso garantir que ninguém fique na mão.",
    "Resultado. Preciso encontrar um jeito de fazer dar certo."
  ] },
  { id: "silencio", answerKey: "resposta_08", chapter: "O que fica por dentro", text: "Quando algo machuca, qual frase chega mais perto do que você faz?", options: [
    "Fico mais quieto(a) do que costumo ficar.",
    "Procuro um sinal de que ainda sou importante para a pessoa.",
    "Tento não perder o controle da situação.",
    "Digo que está tudo bem, mesmo quando ainda não está.",
    "Me esforço para mostrar que consigo seguir em frente."
  ] },
  { id: "desgaste", answerKey: "resposta_09", chapter: "Onde sua energia vai embora", text: "Qual destas situações mais desgasta você?", options: [
    "Ser pressionado(a) a responder antes de pensar.",
    "Sentir frieza de alguém com quem quero me conectar.",
    "Perceber que estão decidindo por mim sem me ouvir.",
    "Ter que carregar responsabilidades que deveriam ser divididas.",
    "Me dedicar muito e sentir que isso não foi reconhecido."
  ] },
  { id: "relacao_dificil", multiple: true, answerKey: "resposta_10", chapter: "Quando a relação fica difícil", text: "Quando uma relação fica difícil, quais duas reações mais se parecem com você?", options: [
    "Me afasto um pouco para organizar o que estou sentindo antes de conversar.",
    "Procuro conversar e sentir que ainda existe uma conexão entre nós.",
    "Tento entender o que está acontecendo e conduzir a situação para não perder o controle.",
    "Cedo ou guardo o que sinto para evitar uma discussão.",
    "Me esforço ainda mais para acertar e mostrar meu valor na relação."
  ] }
];

// Course codes follow the option order in the original quiz brief.
const TRAITS = {
  observar: { code: "TE", choice: "Preciso de espaço para pensar e organizar o que sinto antes de me expor." },
  conectar: { code: "TO", choice: "Busco proximidade e sinais de que existe uma conexão de verdade." },
  conduzir: { code: "TP", choice: "Procuro entender o que está em jogo e preservar minha liberdade de escolha." },
  sustentar: { code: "TM", choice: "Tendo a sustentar os compromissos e evitar que as pessoas fiquem na mão." },
  realizar: { code: "TR", choice: "Me empenho em fazer bem feito e valorizo o reconhecimento do que entrego." }
};

const COMBINATIONS = {
  TE_TO: "Suas respostas combinam a necessidade de espaço para pensar com o desejo de se sentir próximo das pessoas. Você pode querer conexão e, ao mesmo tempo, precisar se recolher para organizar o que sente.",
  TE_TP: "Suas respostas mostram atenção ao que está em jogo e necessidade de pensar antes de se expor. Você tende a observar, criar possibilidades e buscar suas próprias conclusões antes de agir.",
  TE_TM: "Suas respostas combinam observação e compromisso. Você tende a pensar bastante antes de falar e a sustentar responsabilidades, mesmo quando precisa de mais espaço para si.",
  TE_TR: "Suas respostas combinam reflexão e vontade de fazer bem feito. Você tende a analisar antes de agir e pode se cobrar para transformar suas ideias em uma entrega de qualidade.",
  TO_TP: "Suas respostas combinam desejo de conexão e atenção à dinâmica das relações. Você valoriza a proximidade, mas também quer entender as intenções e preservar sua liberdade de escolha.",
  TO_TM: "Suas respostas combinam conexão e cuidado. Você tende a valorizar os vínculos e a estar disponível para os outros, podendo deixar suas próprias necessidades para depois.",
  TO_TR: "Suas respostas combinam desejo de proximidade e reconhecimento. Você tende a se dedicar às relações e pode sentir mais o peso de uma resposta fria ou de um esforço que não foi percebido.",
  TP_TM: "Suas respostas combinam direção e responsabilidade. Você tende a buscar saídas e manter os compromissos, podendo assumir mais do que gostaria para garantir que tudo funcione.",
  TP_TR: "Suas respostas combinam estratégia e realização. Você tende a procurar caminhos para fazer dar certo e valoriza autonomia, qualidade e reconhecimento pelo que entrega.",
  TM_TR: "Suas respostas combinam compromisso e exigência com a entrega. Você tende a ser persistente e a assumir responsabilidades, podendo se cobrar mesmo quando já está fazendo bastante."
};

const SURVEY_BLOCKS = [
  { title: "Quero conhecer o seu momento.", intro: "Antes de continuar, me conta um pouco sobre você.", fields: [
    { key: "faixa_etaria", label: "Qual sua idade?", options: ["Até 25", "26–35", "36–45", "46–55", "56+"] },
    { key: "atuacao_atual", label: "Você já atende pessoas profissionalmente hoje?", options: ["Sim, sou terapeuta / psicólogo(a)", "Sim, com outra abordagem (tarot, coach, barras, constelação etc.)", "Não ainda, mas quero começar", "Não, e não pretendo atender — quero essa habilidade para mim"] },
    { key: "profissao", label: "Com o que você trabalha hoje?", placeholder: "Sua profissão ou ocupação atual", max: 150 }
  ] },
  { title: "Onde isso faria diferença para você?", intro: "Quero entender o que trouxe você até esta aula.", fields: [
    { key: "motivacao_principal", label: "O que mais atrai você em aprender a compreender as pessoas?", options: ["Ganhar mais / cobrar mais pelo que eu faço", "Me proteger e reconhecer situações de manipulação", "Entender melhor quem está perto de mim (família, parceiro, filhos)", "Me entender e cuidar de mim", "Começar uma nova profissão com isso"] },
    { key: "mudanca_desejada", label: "Se você compreendesse melhor as pessoas, o que mudaria na sua vida hoje?", placeholder: "Pode responder em uma frase.", multiline: true }
  ] },
  { title: "Me conta sobre a sua trajetória.", intro: "Estas respostas me ajudam a conhecer a realidade de quem vai estar comigo no workshop.", fields: [
    { key: "renda_mensal", label: "Quanto você ganha por mês, aproximadamente?", options: ["Até R$ 2.000", "R$ 2.000 a R$ 5.000", "R$ 5.000 a R$ 10.000", "Acima de R$ 10.000"] },
    { key: "investimento_formacao", label: "Você já investiu em curso, formação ou mentoria? Quanto, aproximadamente?", options: ["Nunca investi", "Até R$ 300", "R$ 300 a R$ 1.000", "R$ 1.000 a R$ 3.000", "Mais de R$ 3.000"] }
  ] },
  { title: "O que você quer me perguntar?", intro: "As oito situações estão concluídas. Agora, quero ouvir o que você gostaria de levar para a nossa aula.", fields: [
    { key: "origem_declarada", label: "Como você me conheceu?", options: ["Vi um anúncio agora (não conhecia antes)", "Já acompanho você há um tempo", "Alguém me indicou", "Não lembro / cheguei aqui de alguma forma"] },
    { key: "pergunta_aula", label: "Se pudesse me perguntar uma coisa, o que perguntaria?", placeholder: "Escreva sua pergunta. Se não tiver, pode me contar também.", multiline: true }
  ] }
];
// Two trait questions, then one short context block. Context never enters scoring.
const STEPS = QUESTIONS.flatMap((_, index) => [
  { screen: "question", index },
  ...(index % 2 ? [{ screen: "survey", index: Math.floor(index / 2) }] : [])
]).concat({ screen: "lead", index: 0 });
const root = document.querySelector("#quiz-root");
const progressLabel = document.querySelector("#progress-label");
const state = {
  screen: "opening", step: -1, index: 0, answers: [], survey: {}, lead: null, captureViewed: false,
  resultViewed: false, revision: 0, completedAt: "", firstSentAt: new Date().toISOString(),
  submissionId: window.crypto?.randomUUID?.() || `raiox06-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  utms: getTrackingParams(), testMode: new URLSearchParams(location.search).get("test_mode") === "1"
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function getTrackingParams() {
  const tracking = {};
  new URLSearchParams(location.search).forEach((value, key) => {
    if (key.startsWith("utm_") || ["fbclid", "gclid", "src", "sck"].includes(key)) tracking[key] = value;
  });
  return tracking;
}
function panel(content, extra = "") {
  root.innerHTML = `<section class="screen panel ${extra}"><div class="panel-inner">${content}</div></section>`;
  window.scrollTo({ top: 0, behavior: "instant" });
  const heading = root.querySelector("h1, h2");
  if (state.screen !== "opening" && heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
}
function on(id, event, fn) { document.getElementById(id).addEventListener(event, fn); }
function button(label, id, extra = "") { return `<button class="button button-primary ${extra}" id="${id}" type="button">${label}<span aria-hidden="true">↗</span></button>`; }
function backButton() { return '<button class="back-button" id="back-button" type="button">← Voltar</button>'; }
function progress(chapter) {
  return `<div class="question-meta"><span>${escapeHtml(chapter)}</span><span>Etapa ${state.step + 1} de ${STEPS.length}</span></div><div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${(state.step + 1) / STEPS.length * 100}%"></div></div>`;
}
function goToStep(step) {
  state.step = step;
  if (step < 0) state.screen = "opening";
  else Object.assign(state, STEPS[step]);
  if (state.screen === "lead") state.captureViewed = true;
  render();
}
function render() {
  progressLabel.textContent = state.screen === "opening" || state.screen === "result" ? "" : `${state.step + 1} / ${STEPS.length}`;
  if (state.screen === "opening") return renderOpening();
  if (state.screen === "question") return renderQuestion();
  if (state.screen === "survey") return renderSurvey();
  if (state.screen === "lead") return renderLead();
  return renderResult();
}
function renderOpening() {
  panel(`
    <span class="eyebrow">Aquecimento · Workshop Raio-X Humano</span>
    <h1>Oito situações.<br>Um jeito novo de <em>enxergar você.</em></h1>
    <p class="intro">Depois da aula de aquecimento, é hora de olhar para você. Responda às situações e descubra <strong>os dois traços que mais aparecem nas suas respostas.</strong></p>
    <figure class="hero-visual"><img src="/raio-x-hero-wide.webp?v=2" alt="Bruno Simplício e os detalhes da observação do rosto" width="1586" height="992"><figcaption>Seu aquecimento para a minha aula.</figcaption></figure>
    <p class="opening-hook">Entre as situações, vou perguntar sobre seu momento e suas expectativas. Quero conhecer você e o que deseja levar para a nossa aula.</p>
    ${button("Começar meu aquecimento", "start-button")}
    <p class="microcopy">8 situações + perguntas rápidas sobre você</p>
    <div class="preview-strip"><span>O seu próximo passo</span><p>No final, veja sua dupla de traços e ative o lembrete da aula. Leve esse resultado para aprofundarmos juntos no workshop.</p></div>
  `, "opening-screen");
  on("start-button", "click", () => { trackEvent("start"); goToStep(0); });
}
function renderQuestion() {
  const question = QUESTIONS[state.index];
  const order = PATTERN_KEYS.map((_, i) => (i + state.index * 2) % PATTERN_KEYS.length);
  let selections = question.multiple ? [...(state.answers[state.index] || [])] : [];
  panel(`
    ${progress(question.chapter)}
    <span class="eyebrow">Situação ${state.index + 1} de ${QUESTIONS.length}</span>
    <h1 class="question-title">${question.text}</h1>
    <p class="question-hint">${question.multiple ? "Escolha duas reações: primeiro a que mais se parece com você, depois a segunda. Pense em como você costuma agir." : "Escolha o que mais se aproxima de você, mesmo que nenhuma opção seja perfeita."}</p>
    <div class="options">${order.map((optionIndex, displayIndex) => `<button type="button" class="option" data-option="${optionIndex}" aria-pressed="${question.multiple ? selections.includes(optionIndex) : state.answers[state.index] === optionIndex}"><span class="option-letter">${String.fromCharCode(65 + displayIndex)}</span><span>${question.options[optionIndex]}</span><span class="option-arrow" aria-hidden="true">↗</span></button>`).join("")}</div>
    ${question.multiple ? '<p class="microcopy" id="selection-count" role="status"></p>' + button("Continuar", "confirm-traits", "trait-confirm") : ""}
    ${backButton()}
  `);
  const updateSelections = () => {
    root.querySelectorAll("[data-option]").forEach(element => {
      const rank = selections.indexOf(Number(element.dataset.option));
      element.setAttribute("aria-pressed", String(rank >= 0));
      element.querySelector(".option-letter").textContent = rank >= 0 ? `${rank + 1}ª` : "○";
    });
    document.getElementById("selection-count").textContent = `${selections.length} de 2 selecionadas`;
    document.getElementById("confirm-traits").disabled = selections.length !== 2;
  };
  root.querySelectorAll("[data-option]").forEach(element => element.addEventListener("click", () => {
    const option = Number(element.dataset.option);
    if (!question.multiple) return answerQuestion(option);
    if (selections.includes(option)) selections = selections.filter(value => value !== option);
    else if (selections.length < 2) selections.push(option);
    state.answers[state.index] = [...selections];
    updateSelections();
  }));
  if (question.multiple) { updateSelections(); on("confirm-traits", "click", () => answerQuestion(selections)); }
  on("back-button", "click", () => goToStep(state.step - 1));
}
function answerQuestion(answer) {
  const question = QUESTIONS[state.index];
  const values = Array.isArray(answer) ? answer : [answer];
  if (state.screen !== "question" || values.length !== (question.multiple ? 2 : 1) || new Set(values).size !== values.length || values.some(value => !Number.isInteger(value) || value < 0 || value >= 5)) return;
  state.answers[state.index] = question.multiple ? [...answer] : answer;
  trackEvent("answer", { question: question.id });
  goToStep(state.step + 1);
  sendLeadEvent("answer");
}
function surveyField(field) {
  const value = state.survey[field.key] || "";
  const id = escapeHtml(field.key);
  let control;
  if (field.options) {
    control = `<select id="${id}" name="${id}" required><option value="">Selecione uma opção</option>${field.options.map(option => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select><p class="selected-answer" id="${id}-answer" aria-live="polite">${value.length > 48 ? escapeHtml(value) : ""}</p>`;
  } else if (field.multiline) {
    control = `<textarea id="${id}" name="${id}" rows="3" maxlength="1000" placeholder="${escapeHtml(field.placeholder)}" required>${escapeHtml(value)}</textarea>`;
  } else {
    control = `<input id="${id}" name="${id}" maxlength="${field.max || 150}" placeholder="${escapeHtml(field.placeholder)}" value="${escapeHtml(value)}" required>`;
  }
  return `<div class="field"><label for="${id}">${escapeHtml(field.label)}</label>${control}</div>`;
}
function saveSurveyDraft(form, block) {
  const data = new FormData(form);
  block.fields.forEach(field => { state.survey[field.key] = String(data.get(field.key) || "").trim(); });
}
function renderSurvey() {
  const block = SURVEY_BLOCKS[state.index];
  panel(`
    ${progress("Preparando nossa aula")}
    <h1 class="question-title">${block.title}</h1>
    <p class="question-hint">${block.intro}</p>
    <form class="form" id="survey-form" novalidate>
      ${block.fields.map(surveyField).join("")}
      <p class="error" id="form-error" role="alert"></p>
      <button class="button button-primary" type="submit">${state.index === 3 ? "Ir para meu resultado" : "Continuar meu aquecimento"}<span aria-hidden="true">↗</span></button>
    </form>
    ${backButton()}
  `, "survey-screen");
  block.fields.filter(field => field.options).forEach(field => on(field.key, "change", event => {
    document.getElementById(`${field.key}-answer`).textContent = event.target.value.length > 48 ? event.target.value : "";
  }));
  on("survey-form", "submit", event => {
    event.preventDefault();
    saveSurveyDraft(event.currentTarget, block);
    const missing = block.fields.find(field => !state.survey[field.key] || (field.options && !field.options.includes(state.survey[field.key])));
    if (missing) {
      document.getElementById("form-error").textContent = "Responda aos campos desta etapa para continuar.";
      document.getElementById(missing.key).focus();
      return;
    }
    goToStep(state.step + 1);
    sendLeadEvent("context_answer");
  });
  on("back-button", "click", () => {
    saveSurveyDraft(document.getElementById("survey-form"), block);
    goToStep(state.step - 1);
  });
}
function renderLead() {
  panel(`
    ${progress("Seu resultado está pronto")}
    <h1>Como posso <em>encontrar você?</em></h1>
    <p class="lead">Vou registrar sua participação e usar seu e-mail para enviar o material da aula. Também poderei chamar algumas pessoas no WhatsApp para conversar.</p>
    <form class="form" id="lead-form" novalidate>
      <div class="field"><label for="name">Como posso chamar você?</label><input id="name" name="name" autocomplete="given-name" maxlength="100" placeholder="Seu nome" value="${escapeHtml(state.lead?.name || "")}" required></div>
      <div class="field"><label for="phone">Seu WhatsApp</label><input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="24" placeholder="DDD + número" value="${escapeHtml(state.lead?.phone || "")}" required></div>
      <div class="field"><label for="email">Seu e-mail para receber o material da aula</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="voce@exemplo.com" value="${escapeHtml(state.lead?.email || "")}" required></div>
      <p class="form-privacy">Suas respostas me ajudam a conhecer os alunos e preparar nossa conversa no workshop.</p>
      <p class="error" id="form-error" role="alert"></p>
      <button class="button button-primary" type="submit">Ver meus dois traços<span aria-hidden="true">↗</span></button>
    </form>
    <p class="microcopy">O resultado aparece aqui, na próxima tela.</p>
    ${backButton()}
  `);
  on("lead-form", "submit", handleLeadSubmit);
  on("back-button", "click", () => { state.lead = readLead(document.getElementById("lead-form")); goToStep(state.step - 1); });
}
function readLead(element) {
  const form = new FormData(element);
  return Object.fromEntries(["name", "phone", "email"].map(key => [key, String(form.get(key) || "").trim()]));
}
function validateLead(lead) {
  if (lead.name.length < 2) return "Informe seu nome para continuar.";
  const digits = lead.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15 || /^(\d)\1+$/.test(digits)) return "Informe um telefone válido com DDD.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Informe um e-mail válido para receber o material.";
  return "";
}
function handleLeadSubmit(event) {
  event.preventDefault();
  const lead = readLead(event.currentTarget);
  const error = validateLead(lead);
  if (error) { document.getElementById("form-error").textContent = error; return; }
  state.lead = lead; state.resultViewed = true; state.screen = "result";
  sendLeadEvent("lead_submitted"); trackEvent("lead_submit"); render();
}
function getReading(answers = state.answers) {
  // Only trait choices score. Final question has two distinct, ordered choices.
  const choices = answers.flat().filter(Number.isInteger);
  const priority = [...(Array.isArray(answers[7]) ? answers[7] : []), ...answers.slice(0, 7).reverse()];
  const ranked = PATTERN_KEYS.map((key, index) => ({ key, score: choices.filter(value => value === index).length, priority: priority.indexOf(index) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.priority - b.priority);
  return { primary: ranked[0]?.key || null, secondary: ranked[1]?.key || null,
    tied: ranked.length > 1 && (ranked[0].score === ranked[1].score || ranked[1].score === ranked[2]?.score) };
}
function getResultText(reading = getReading()) {
  const pair = [reading.primary, reading.secondary];
  const code = pair.map((key) => TRAITS[key].code).join(" + ");
  const combination = [...pair].sort((a, b) => PATTERN_KEYS.indexOf(a) - PATTERN_KEYS.indexOf(b)).map((key) => TRAITS[key].code).join("_");
  return { code, summary: COMBINATIONS[combination] };
}
function renderResult() {
  const result = getResultText();
  const name = escapeHtml(state.lead.name.split(/\s+/)[0]);
  panel(`
    <span class="eyebrow">Aquecimento concluído · ${name}</span>
    <h1>Seus dois traços<br><em>predominantes no teste.</em></h1>
    <div class="traits-card"><span>Minha combinação</span><strong>${result.code}</strong><p>Workshop Raio-X Humano</p></div>
    <p class="trait-summary">${result.summary}</p>
    <details class="result-method"><summary>Como cheguei a essa dupla?</summary><p>Usei apenas suas escolhas nas oito situações. Na última, as duas escolhas contam um ponto cada. Em empates, considerei primeiro a ordem que você escolheu na última situação e, depois, as escolhas mais recentes. As respostas sobre seu momento e sua experiência não alteram os traços.</p></details>
    <div class="workshop-reminder"><h2>Leve esse resultado<br>para o workshop.</h2><p class="warmup-close">Você já tem uma primeira pista.<br><strong>No workshop, eu vou te mostrar como conectar as peças.</strong></p></div>
    <p class="warmup-date">${RAIOX_CONFIG.workshopDateText}</p>
    ${RAIOX_CONFIG.reminderUrl ? `<a class="button button-primary" id="reminder-link" href="${escapeHtml(RAIOX_CONFIG.reminderUrl)}" target="_blank" rel="noopener noreferrer">Ativar lembrete da aula<span aria-hidden="true">↗</span></a>` : ""}
  `, "warmup-result");
  sendLeadEvent("quiz_completed"); trackEvent("result_view", { traits: result.code });
  if (RAIOX_CONFIG.reminderUrl) on("reminder-link", "click", () => trackEvent("reminder_click"));
}
function trackEvent(event, detail = {}) {
  if (state.testMode) return;
  const data = { event: `raiox06_${event}`, source: RAIOX_CONFIG.source, ...detail };
  window.dataLayer?.push(data);
  if (typeof window.fbq === "function") window.fbq("trackCustom", data.event, data);
}
function sendLeadEvent(event) {
  if (state.testMode) return;
  const now = new Date().toISOString();
  const completed = state.resultViewed;
  if (completed && !state.completedAt) state.completedAt = now;
  state.revision = Math.max(Date.now() * 1000, state.revision + 1);
  const reading = state.answers.length === QUESTIONS.length && Array.isArray(state.answers[7]) && state.answers[7].length === 2 ? getReading() : null;
  const payload = {
    event, source: RAIOX_CONFIG.source, quiz_variant: "raiox06", versao_exercicio: "8-tracos-pesquisa-v2",
    spreadsheet_id: RAIOX_CONFIG.spreadsheetId, sheet_name: RAIOX_CONFIG.sheetTabName, sheet_gid: RAIOX_CONFIG.sheetGid,
    submission_id: state.submissionId, revision: state.revision, timestamp: now, page_url: location.href,
    primeiro_envio_em: state.firstSentAt, atualizado_em: now, ultimo_evento: event,
    status_resposta: completed ? "concluída" : "em andamento",
    etapa_atual: `${state.screen} · ${state.answers.length}/${QUESTIONS.length}`,
    acessou_quiz: "sim", chegou_captura: state.captureViewed ? "sim" : undefined,
    enviou_dados: state.lead ? "sim" : undefined, quiz_completo: completed ? "sim" : undefined,
    resultado_visto: state.resultViewed ? "sim" : undefined,
    concluido_em: completed ? state.completedAt : undefined,
    nome: state.lead?.name, telefone: state.lead?.phone, whatsapp: state.lead?.phone, email: state.lead?.email,
    perfil: reading ? getResultText(reading).code : undefined,
    finalidade: "aquecimento_alunos", ...state.utms, ...state.survey
  };
  QUESTIONS.forEach((question, index) => {
    const answer = state.answers[index];
    const options = Array.isArray(answer) ? answer : Number.isInteger(answer) ? [answer] : [];
    // Preserve original question-to-column mapping for historical submissions.
    payload[question.answerKey] = options.map(option => question.options[option]).join(" | ");
  });
  PATTERN_KEYS.forEach((key, index) => { payload[`pontos_${TRAITS[key].code}`] = state.answers.flat().filter(answer => answer === index).length; });
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  const body = JSON.stringify(payload);
  if (!RAIOX_CONFIG.leadWebhookUrl) return;
  fetch(RAIOX_CONFIG.leadWebhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: true }).catch(() => {});
}

trackEvent("view");
sendLeadEvent("quiz_view");
render();
