const RAIOX_CONFIG = {
  checkoutUrl: "https://pay.hotmart.com/P106544757H",
  leadWebhookUrl: "", // Enable only after the exclusive collector is authorized and verified.
  source: "quiz_meuraiox01",
  spreadsheetId: "1OBr2lZO_AyVS30f2_KD0qwLtrBxyY-8owmbVCq50KK4",
  sheetTabName: "Leads Meu Raio X 01", sheetGid: "23092501",
  workshopDateText: "29 e 30 de Setembro, às 20h · ao vivo",
  priceText: "R$37",
  vsl: { id: "vid-6a42eb18d77f3406e43d9b7e", url: "https://scripts.converteai.net/a07c65c7-f155-44ff-8522-402ada1630b9/players/6a42eb18d77f3406e43d9b7e/v4/player.js" }
};
// IDs identify drawings only. No personality or family-history inference is made.
const BODY_REFERENCES = [
  { id: "alongado", letter: "TE", x: 0, label: "Corpo magro e anguloso", details: ["Cabeça/testa maiores", "Corpo magro e juntas marcadas", "Barriga localizada"], description: "cabeça e testa maiores, juntas marcadas, corpo magro e barriga localizada" },
  { id: "arredondado", letter: "TO", x: 25, label: "Corpo arredondado", details: ["Cabeça e bochechas redondas", "Corpo rechonchudo", "Contornos suaves"], description: "cabeça e bochechas arredondadas, contornos arredondados e corpo rechonchudo" },
  { id: "triangular", letter: "TP", x: 50, label: "Triângulo invertido", details: ["Queixo pontudo", "Tronco largo em triângulo invertido", "Tornozelos finos"], description: "queixo pontudo, tronco largo em triângulo invertido e tornozelos finos" },
  { id: "retangular", letter: "TM", x: 75, label: "Corpo em blocos", details: ["Corpo em blocos", "Quadrado/retangular", "Tornozelos grossos"], description: "corpo em blocos, formato quadrado ou retangular e tornozelos grossos" },
  { id: "cintura", letter: "TR", x: 100, label: "Curvas acentuadas", details: ["Corpo formoso", "Rosto harmônico", "Curvas acentuadas"], description: "corpo formoso, rosto harmônico e curvas acentuadas" }
];
// Educational summaries of the supplied course material, not classifications of the participant.
const STUDY_PROFILES = {
  TE: { title: "Reflexão e criatividade", text: "Esse perfil é descrito no material pela introspecção, racionalidade e criatividade. Valoriza conversas profundas e espaço para pensar. Diante de conflitos ou críticas, pode se recolher e ter dificuldade para expressar o que sente." },
  TO: { title: "Conexão e acolhimento", text: "Esse perfil valoriza os vínculos e a expressão das emoções. Comunicação, empatia e generosidade aparecem como forças. A busca por proximidade pode vir acompanhada de necessidade de atenção e reações impulsivas." },
  TP: { title: "Estratégia e direção", text: "Esse perfil combina análise, persuasão e visão estratégica. Busca conduzir situações e defender seus interesses. A competitividade e a necessidade de controle podem tornar as relações mais tensas." },
  TM: { title: "Constância e compromisso", text: "Esse perfil se destaca pela organização, disciplina e lealdade. Tem facilidade para sustentar compromissos e executar processos. Pode guardar incômodos, ceder demais e acumular responsabilidades." },
  TR: { title: "Determinação e realização", text: "Esse perfil reúne foco, confiança e perseverança. Busca fazer bem feito e assumir a liderança. A exigência pode se transformar em perfeccionismo, rigidez e dificuldade para acolher outras maneiras de fazer." }
};
// Glossary from the supplied teaching material. These terms name references in the
// material; they do not establish the participant's experiences or clinical history.
const FACIAL_STUDY_CONCEPTS = {
  curva: { id: "peso", title: "Peso", terms: { paterno: "Peso Paterno", materno: "Peso Materno" } },
  lateral: { id: "ausencia", title: "Ausência", terms: { paterno: "Ausência Paterna", materno: "Ausência Materna" } },
  linhas: { id: "manipulacao", title: "Manipulação", terms: { paterno: "Manipulação Paterna", materno: "Manipulação Materna" } }
};
// Sides always refer to the participant's own face, never the displayed image.
const STUDY_SIDE_REFERENCES = { direito: ["paterno"], esquerdo: ["materno"], ambos: ["paterno", "materno"] };
// Modular visual observations: adding a feature automatically extends the flow and result.
const FACE_FEATURES = [
  { id: "curva", title: "Você identifica este volume abaixo dos olhos?", label: "Volume abaixo do olho", image: "volume", hint: "Observe a curva e o volume logo abaixo da pálpebra inferior. Compare a imagem e o desenho com o seu rosto.", description: "uma curva com volume abaixo da pálpebra inferior" },
  { id: "lateral", title: "Você identifica este sulco que desce em direção à bochecha?", label: "Sulco em direção à bochecha", image: "sulco", hint: "Observe o sulco que começa abaixo do olho e desce em direção à bochecha. A linha azul mostra o caminho para comparar.", description: "um sulco que parte debaixo do olho e desce em direção à bochecha" },
  { id: "linhas", title: "Você identifica esta combinação no olho e no canto da boca?", label: "Contorno do olho e canto da boca", image: "expressao", hint: "Compare a abertura do olho, a curva logo abaixo dele e a elevação no canto da boca que aparecem na imagem.", description: "a combinação de uma abertura de olho mais estreita, curva inferior e elevação no canto da boca" }
];
const SIDE_LABELS = { esquerdo: "No seu lado esquerdo", direito: "No seu lado direito", ambos: "Nos dois lados" };
const FLOW = ["referencias", "corpo", "preparo", ...FACE_FEATURES.map(f => f.id), ...(RAIOX_CONFIG.leadWebhookUrl ? ["contato"] : [])];
const root = document.getElementById("quiz-root");
const progress = document.getElementById("progress");
const state = {
  step: -1, mode: "presence", references: null, body: null, face: {}, lead: null,
  submissionId: window.crypto?.randomUUID?.() || `meuraiox01-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  firstSentAt: new Date().toISOString(), completedAt: "", resultViewed: false, checkoutClicked: false,
  utms: Object.fromEntries([...new URLSearchParams(location.search)].filter(([key]) => key.startsWith("utm_") || ["fbclid", "gclid", "src", "sck"].includes(key))),
  testMode: new URLSearchParams(location.search).get("test_mode") === "1"
};
let saveQueue = Promise.resolve();
let loadingTimer;
let playerResizeObserver;
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function on(id, event, handler) { const element = document.getElementById(id); if (element) element[`on${event}`] = handler; }
function button(text, id, extra = "") { return `<button type="button" class="button ${extra}" id="${id}">${text}<span class="arrow" aria-hidden="true">↗</span></button>`; }
function bodyArt(ref, references = state.references || "masculinas", extra = "") {
  const x = ref.x / 25 * 323.8, y = references === "femininas" ? 485.5 : 0;
  const clip = `body-${ref.id}-${references}`;
  return `<svg class="body-art ${extra}" viewBox="${x} ${y} 323.8 485.5" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Ilustração: ${escapeHtml(ref.label)}"><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="323.8" height="485.5"/></clipPath></defs><image href="./assets/body-atlas-v2.png" width="1619" height="971" clip-path="url(#${clip})"/></svg>`;
}
function eyeSvg(feature = "curva", small = false) {
  const title = FACE_FEATURES.find(f => f.id === feature)?.label || "Referência visual";
  const common = 'fill="none" stroke="#0781d4" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"';
  if (feature === "linhas") {
    return `<svg class="eye-svg expression-svg" viewBox="0 0 400 410" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Desenho destacando a abertura do olho, a curva inferior e o canto da boca"><path d="M65 90 C63 11 332 11 335 90 L322 282 Q298 360 200 390 Q107 360 78 282Z" fill="#e9f3fb" stroke="#91a6b8" stroke-width="3"/><path d="M89 127 Q133 104 170 123 M230 121 Q278 99 310 121" fill="none" stroke="#91a6b8" stroke-width="7" stroke-linecap="round"/><path d="M87 161 Q131 131 176 155 Q132 183 87 161Z M226 154 Q269 114 311 153 Q270 186 226 154Z" fill="white" stroke="#395b75" stroke-width="3"/><ellipse cx="132" cy="153" rx="14" ry="13" fill="#395b75"/><circle cx="267" cy="152" r="16" fill="#395b75"/><path d="M190 175 L177 239 Q198 252 218 235" fill="none" stroke="#91a6b8" stroke-width="3"/><path d="M145 289 Q202 312 266 296" fill="none" stroke="#395b75" stroke-width="4" stroke-linecap="round"/><g ${common}><path d="M92 174 Q132 205 178 170"/><path d="M106 163 l-4 -9 M159 156 l8 -5"/><path d="M140 276 Q130 286 145 298"/></g></svg>`;
  }
  const mark = feature === "lateral" ? '<path d="M319 169 C323 215 295 265 260 294"/>' : '<path d="M117 184 Q226 250 322 184"/>';
  return `<svg class="eye-svg" viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(title)} em azul"><path d="M67 105 Q214 23 365 100" fill="none" stroke="#91a6b8" stroke-width="10" stroke-linecap="round"/><path d="M91 152 Q220 60 349 152 Q223 216 91 152Z" fill="white" stroke="#395b75" stroke-width="4"/><circle cx="221" cy="144" r="37" fill="#b6cfe2" stroke="#395b75" stroke-width="3"/><circle cx="221" cy="144" r="17" fill="#395b75"/><circle cx="231" cy="133" r="7" fill="white"/><path d="M355 165 Q375 248 331 306" fill="none" stroke="#d6e4ef" stroke-width="3"/><g ${common}>${mark}</g></svg>`;
}
function featureVisual(feature) {
  const sex = state.references === "femininas" ? "mulher" : "homem";
  return `<div class="feature-comparison"><figure class="feature-photo"><button id="open-reference" class="image-zoom" type="button" aria-label="Ampliar imagem de referência"><img src="./assets/${feature.image}-${sex}.png" alt="Referência visual: ${escapeHtml(feature.label)}" width="1122" height="1402" decoding="async"></button><figcaption>Toque para ampliar</figcaption></figure><figure class="feature-diagram">${eyeSvg(feature.id)}<figcaption><span class="visual-key"></span>Compare com o desenho</figcaption></figure></div><dialog id="reference-zoom" class="reference-zoom"><button type="button" id="close-reference">Fechar imagem ×</button><img src="./assets/${feature.image}-${sex}.png" alt="Referência ampliada: ${escapeHtml(feature.label)}"></dialog>`;
}
function faceSvg() {
  return `<svg class="face-svg" viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rosto visto de frente: seu lado direito à esquerda do desenho e seu lado esquerdo à direita do desenho"><path d="M146 140 C128 32 352 32 334 140 L326 213 Q310 286 240 312 Q170 286 154 213Z" fill="#e6f1fa" stroke="#53758f" stroke-width="3"/><path d="M240 61 V309" stroke="#1484d1" stroke-width="3" stroke-dasharray="7 7"/><path d="M161 155 Q188 130 218 155 Q188 173 161 155 M262 155 Q292 130 319 155 Q292 173 262 155" fill="white" stroke="#53758f" stroke-width="3"/><circle cx="190" cy="153" r="9" fill="#53758f"/><circle cx="291" cy="153" r="9" fill="#53758f"/><path d="M233 169 L222 214 Q240 223 256 211 M211 250 Q240 264 270 250" fill="none" stroke="#53758f" stroke-width="3" stroke-linecap="round"/><path d="M54 190 H135 M345 190 H426" stroke="#a4c4dc" stroke-width="2"/><text x="61" y="165" text-anchor="middle" fill="#25688f" font-family="Inter,Arial" font-weight="700" font-size="13">Seu lado</text><text x="61" y="181" text-anchor="middle" fill="#25688f" font-family="Inter,Arial" font-weight="700" font-size="13">direito</text><text x="420" y="165" text-anchor="middle" fill="#25688f" font-family="Inter,Arial" font-weight="700" font-size="13">Seu lado</text><text x="420" y="181" text-anchor="middle" fill="#25688f" font-family="Inter,Arial" font-weight="700" font-size="13">esquerdo</text></svg>`;
}
function sideIcon(side) {
  const head = "M39 75 C31 7 169 7 161 75 L156 135 Q145 180 100 199 Q55 180 44 135Z";
  return `<svg class="side-icon" viewBox="0 0 200 215" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="half-${side}"><path d="${head}"/></clipPath></defs><path d="${head}" fill="#edf4fa" stroke="#7896ad" stroke-width="3"/><rect x="${side === "esquerdo" ? 100 : 0}" y="0" width="${side === "ambos" ? 200 : 100}" height="210" fill="#59b3f0" clip-path="url(#half-${side})"/><path d="M100 29V196 M56 88Q72 77 85 88 M115 88Q130 77 145 88 M84 150Q100 161 117 150" fill="none" stroke="#315875" stroke-width="4" stroke-linecap="round"/></svg>`;
}
function panel(content, extra = "", actions = "") {
  playerResizeObserver?.disconnect();
  document.documentElement.classList.toggle("result-open", state.resultViewed);
  root.innerHTML = `<section class="panel ${extra}"><div class="screen-content">${content}</div>${actions ? `<div class="screen-actions">${actions}</div>` : ""}</section>`;
  progress.hidden = state.step < 0 || state.resultViewed || state.step >= FLOW.length;
  if (!progress.hidden) {
    const current = state.step + 1;
    const total = FLOW.length;
    progress.innerHTML = `<div class="progress-meta"><span>Etapa ${current} de ${total}</span></div><div class="track"><span style="width:${current / total * 100}%"></span></div>`;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  const h = root.querySelector("h1");
  if (state.step >= 0 && h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}
function go(step) { clearTimeout(loadingTimer); state.step = step; state.mode = "presence"; render(); }
function render() {
  if (state.step < 0) return renderOpening();
  if (state.resultViewed) return renderResult();
  if (state.step === FLOW.length && !RAIOX_CONFIG.leadWebhookUrl) return renderLoading();
  const current = FLOW[state.step];
  if (current === "referencias") return renderReferences();
  if (current === "corpo") return renderBodies();
  if (current === "preparo") return renderPreparation();
  if (current === "contato") return renderLead();
  const feature = FACE_FEATURES.find(f => f.id === current);
  if (feature) return renderFeature(feature);
}
function renderOpening() {
  panel(`<h1>Você acredita que é possível descobrir muito sobre uma pessoa apenas <em>observando seu rosto e o formato do seu corpo?</em></h1>
    <p class="challenge-banner"><strong>Não acredita? Então faça o teste.</strong></p>
    <p class="intro">Identifique alguns sinais no seu rosto e corpo e descubra <strong>o que eles podem revelar sobre você.</strong></p>
    <div class="hero-stage"><figure class="workshop-hero"><img src="/raio-x-hero-wide.webp?v=2" alt="Bruno Simplício na arte do Workshop Raio-X Humano" width="1586" height="992" fetchpriority="high"><span class="raiox-scan-line" aria-hidden="true"></span></figure></div>`, "opening-panel", `${button("Começar meu Raio-X", "start")}
    <p class="microcopy">Pegue um espelho se quiser. Eu mostro onde olhar.</p>`);
  on("start", "click", () => { track("start"); go(0); });
}
function renderReferences() {
  panel(`<span class="eyebrow">Vamos começar pelo conjunto</span><h1>Você é <em>homem ou mulher?</em></h1>
    <p class="hint">Vou mostrar as imagens correspondentes à sua escolha.</p>
    <div class="choice-grid">${["masculinas", "femininas"].map(value => `<button class="reference-card" type="button" data-reference="${value}">${bodyArt(BODY_REFERENCES[4], value)}<span>${value === "masculinas" ? "Homem" : "Mulher"}</span></button>`).join("")}</div>`, "references-panel");
  root.querySelectorAll("[data-reference]").forEach(el => el.addEventListener("click", () => {
    if (state.references !== el.dataset.reference) state.body = null;
    state.references = el.dataset.reference; track("reference_selected"); go(state.step + 1);
  }));
}
function renderBodies() {
  panel(`<span class="eyebrow">Seu corpo, visto por inteiro</span>
    <h1>Qual destes <em>formatos de corpo</em> mais se aproxima do seu?</h1>
    <p class="hint">Observe as proporções entre ombros, cintura, quadril e membros.</p>
    <div class="body-grid">${BODY_REFERENCES.map(ref => `<button class="body-card" data-body="${ref.id}" type="button" aria-pressed="${state.body === ref.id}">${bodyArt(ref)}<span class="body-label">${ref.letter}</span><span class="body-caption">${escapeHtml(ref.details.join(" · "))}</span></button>`).join("")}</div>`, "bodies-panel", `<p class="microcopy">Toque na imagem para continuar</p>`);
  root.querySelectorAll("[data-body]").forEach(el => el.addEventListener("click", () => {
    state.body = el.dataset.body;
    track("body_selected"); go(state.step + 1);
  }));
}
function renderPreparation() {
  panel(`<span class="eyebrow">Agora, os detalhes do rosto</span>
    <h1>O conjunto chamou sua atenção.<br><em>Agora aproxime o olhar.</em></h1>
    <p class="intro">Agora você vai comparar três detalhes do rosto. Use as imagens e os desenhos para localizar cada um.</p>
    <div class="visual-frame">${faceSvg()}</div>
    <ol class="steps-list"><li>Use boa iluminação e mantenha o rosto relaxado.</li><li>Direita e esquerda são sempre os lados do seu próprio rosto.</li><li>Uma selfie pode estar espelhada: não use a posição na tela para escolher o lado.</li></ol>`, "preparation-panel", button("Estou pronto para observar", "ready"));
  on("ready", "click", () => go(state.step + 1));
}
function renderFeature(feature) {
  const sideMode = state.mode === "side";
  panel(`<span class="eyebrow">Observação ${FACE_FEATURES.indexOf(feature) + 1} de ${FACE_FEATURES.length} · detalhes do rosto</span>
    <h1>${sideMode ? "Em qual <em>lado do rosto</em> você identifica esse detalhe?" : feature.title}</h1>
    <p class="hint">${sideMode ? "Direita e esquerda do seu próprio rosto, independentemente da posição na imagem." : feature.hint}</p>
    ${featureVisual(feature)}`, `feature-panel ${sideMode ? "side-panel" : ""}`, `<div class="answers ${sideMode ? "side-answers" : ""}">${(sideMode ? Object.entries(SIDE_LABELS) : [["sim", "Identifico algo parecido"], ["nao", "Não identifico"], ["incerto", "Não consigo identificar"]]).map(([value, label]) => `<button class="answer ${sideMode ? "side-answer" : ""}" data-answer="${value}" type="button">${sideMode ? sideIcon(value) : ""}${label}${sideMode ? "" : '<span aria-hidden="true">↗</span>'}</button>`).join("")}</div>`);
  on("open-reference", "click", () => document.getElementById("reference-zoom").showModal());
  on("close-reference", "click", () => document.getElementById("reference-zoom").close());
  root.querySelectorAll("[data-answer]").forEach(el => el.addEventListener("click", () => {
    const value = el.dataset.answer;
    if (sideMode) { state.face[feature.id] = declaredVisualAnswer(feature.id, "sim", value); track("visual_step_completed"); go(state.step + 1); }
    else {
      state.face[feature.id] = declaredVisualAnswer(feature.id, value);
      if (value === "sim") { state.mode = "side"; render(); }
      else { track("visual_step_completed"); go(state.step + 1); }
    }
  }));
}
function declaredVisualAnswer(mark, presence, side = null) {
  // Record only the participant's declaration, with sides relative to their own face.
  return {
    referencia_visual: mark,
    marca: FACIAL_STUDY_CONCEPTS[mark]?.id || mark,
    presente: presence === "sim" ? true : presence === "nao" ? false : null,
    lado_usuario: presence === "sim" ? side : null,
    status: presence === "incerto" ? "inconclusivo" : "declarado",
    origem: "resposta_usuario"
  };
}
function educationalReferences(answer) {
  if (!answer || answer.presente !== true || answer.status !== "declarado") return [];
  const concept = FACIAL_STUDY_CONCEPTS[answer.referencia_visual];
  if (!concept) return [];
  return (STUDY_SIDE_REFERENCES[answer.lado_usuario] || []).map(reference => ({
    referencia_metodo: reference,
    codigo_material: concept.terms[reference].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, "_"),
    nomenclatura_material: concept.terms[reference]
  }));
}
function facialStudyItems(data = state) {
  return FACE_FEATURES.map(feature => {
    const answer = data.face[feature.id];
    return { concept: FACIAL_STUDY_CONCEPTS[feature.id], answer, references: educationalReferences(answer) };
  });
}
function renderFacialStudy(data = state) {
  const references = facialStudyItems(data).flatMap(item => item.references);
  const intro = references.length
    ? "Dentro do Raio X, os pontos do rosto que você selecionou correspondem a:"
    : "Nenhuma referência visual foi confirmada nesta comparação.";
  return `<section class="study-topics" aria-labelledby="study-topics-heading"><h2 id="study-topics-heading">${intro}</h2>${references.length ? `<ul class="study-result-list">${references.map(ref => `<li>${escapeHtml(ref.nomenclatura_material)}</li>`).join("")}</ul>` : ""}</section>`;
}
function renderLead() {
  panel(`<span class="eyebrow">Suas comparações estão concluídas</span><h1>Seu mapa está pronto.<br><em>Como posso chamar você?</em></h1>
    <p class="intro">Preencha seu nome e WhatsApp para registrar suas respostas e receber informações sobre o workshop. Seu mapa aparece aqui, na próxima tela.</p>
    <form class="form" id="lead-form" novalidate>
      <div class="field"><label for="name">Seu nome</label><input id="name" name="name" autocomplete="given-name" maxlength="100" placeholder="Como posso chamar você?" required value="${escapeHtml(state.lead?.name)}"></div>
      <div class="field"><label for="phone">Seu WhatsApp com DDD</label><input id="phone" name="phone" autocomplete="tel" type="tel" maxlength="24" placeholder="(11) 99999-9999" required value="${escapeHtml(state.lead?.phone)}"></div>
      <p id="form-error" class="error" role="alert"></p>
    </form>`, "lead-panel", `<button class="button" type="submit" form="lead-form">Ver meu Raio-X inicial<span aria-hidden="true" class="arrow">↗</span></button><p class="microcopy">Nenhuma foto sua é enviada ou armazenada.</p>`);
  on("lead-form", "submit", e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const lead = { name: String(data.get("name") || "").trim(), phone: String(data.get("phone") || "").trim() };
    const digits = lead.phone.replace(/\D/g, "");
    const error = lead.name.length < 2 ? "Digite seu nome para continuar." : digits.length < 10 || digits.length > 15 || /^(\d)\1+$/.test(digits) ? "Informe um WhatsApp válido com DDD." : "";
    if (error) { document.getElementById("form-error").textContent = error; return; }
    state.lead = lead; track("lead_submit"); renderLoading();
  });
}
function renderLoading() {
  state.step = FLOW.length;
  panel(`<span class="eyebrow">Suas escolhas, organizadas</span><h1>Reunindo seu<br><em>mapa de observação.</em></h1><div class="loading-orbit" aria-hidden="true"></div><ul class="loading-list"><li>Referência corporal escolhida</li><li>Contornos que você identificou</li><li>Lados do rosto que você marcou</li></ul><p class="microcopy" role="status">Preparando seu resumo…</p>`, "loading-panel");
  loadingTimer = setTimeout(() => { state.resultViewed = true; state.completedAt = new Date().toISOString(); render(); sendLeadEvent("quiz_completed"); track("result_view"); }, 650);
}
function getObservationSummary(data = state) {
  const primary = BODY_REFERENCES.find(ref => ref.id === data.body);
  const yes = FACE_FEATURES.filter(f => data.face[f.id]?.presente === true);
  const uncertain = FACE_FEATURES.filter(f => data.face[f.id]?.status === "inconclusivo");
  const bodyText = primary ? `Na sua comparação, você escolheu a referência ${primary.letter}, que destaca ${primary.description}.` : "Nenhuma referência corporal selecionada.";
  const faceText = yes.length ? `Você reconheceu ${yes.length} de ${FACE_FEATURES.length} contornos apresentados.${uncertain.length ? ` Em ${uncertain.length === 1 ? "uma comparação" : `${uncertain.length} comparações`}, preferiu registrar uma dúvida.` : ""}` : uncertain.length ? "Você não confirmou nenhum dos contornos e registrou dúvidas na comparação. Isso também faz parte de observar: distinguir o que percebe do que ainda não está claro." : `Você não identificou em si os ${FACE_FEATURES.length} detalhes apresentados nas imagens.`;
  return { primary, yes, uncertain, bodyText, faceText };
}
function checkoutButton(label = `Participar do workshop · ${RAIOX_CONFIG.priceText}`) {
  return `<a class="button button-green" data-checkout href="${escapeHtml(buildCheckoutUrl())}" target="_blank" rel="noopener noreferrer">${label}<span class="arrow" aria-hidden="true">↗</span></a>`;
}
function workshopDate() {
  return `<div class="date-card"><span>Reserve estas datas</span><strong>${RAIOX_CONFIG.workshopDateText}</strong></div>`;
}
function renderResult() {
  const result = getObservationSummary();
  const profile = result.primary ? STUDY_PROFILES[result.primary.letter] : null;
  panel(`<header class="result-intro"><h1>Seu <em>Raio-X</em></h1><p class="intro">Suas seleções, organizadas pelos conceitos do método Raio-X.</p></header>
    ${profile ? `<section class="reference-result study-profile" aria-labelledby="study-profile-heading"><div class="study-profile-header"><div class="result-body-art">${bodyArt(result.primary)}</div><div><span class="result-label">Descrição do perfil no material</span><h2 id="study-profile-heading">${result.primary.letter}</h2><h3>${escapeHtml(profile.title)}</h3></div></div><p>${escapeHtml(profile.text)}</p></section>` : ""}
    ${renderFacialStudy()}
    <a class="continue-workshop" href="#workshop-heading" aria-label="Continue abaixo para conhecer o workshop"><span>Continue abaixo</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 6 7 7 7-7M5 12l7 7 7-7"/></svg></a>
    <section class="result-offer" aria-labelledby="workshop-heading">
      <span class="eyebrow workshop-tag">Workshop Raio-X Humano</span><h2 id="workshop-heading" tabindex="-1">Isso é <em>só o começo.</em></h2>
      <p class="intro">O que você viu aqui foi só o começo. <strong>Em 2 dias, vou te ensinar a ler qualquer pessoa em segundos:</strong></p>
      <ul class="workshop-topics"><li>Os traços de caráter como você nunca viu.</li><li>Como investigar experiências maternas e paternas a partir de relatos.</li><li>Como reconhecer comportamentos narcisistas nas relações.</li></ul>
      ${workshopDate()}
      <p class="video-teaser">Assista ao vídeo pra entender o que você vai aprender no Workshop Raio-X.</p>
      <div class="video-offer-media">
        <div class="video-stage">${state.testMode ? '<div class="video-placeholder"><span aria-hidden="true">▶</span><p>Vídeo do workshop disponível na versão publicada.</p></div>' : `<div class="video-player-frame"><vturb-smartplayer id="${RAIOX_CONFIG.vsl.id}"></vturb-smartplayer></div>`}</div>
        <div class="video-checkout">${checkoutButton(`Quero meu ingresso por ${RAIOX_CONFIG.priceText}`)}</div>
      </div>
    </section>`, "result-panel scroll-result-panel");
  if (!state.testMode) {
    const frame = root.querySelector(".video-player-frame");
    const fitPlayer = () => frame.style.setProperty("--player-scale", frame.getBoundingClientRect().width / 400);
    fitPlayer();
    playerResizeObserver = new ResizeObserver(fitPlayer);
    playerResizeObserver.observe(frame);
  }
  if (!state.testMode && !document.querySelector("script[data-meuraiox-player]")) {
    const script = document.createElement("script"); script.src = RAIOX_CONFIG.vsl.url; script.async = true; script.dataset.meuraioxPlayer = "true"; document.head.appendChild(script);
  }
  root.querySelectorAll("[data-checkout]").forEach(el => el.addEventListener("click", () => {
    state.checkoutClicked = true; sendLeadEvent("checkout_clicked"); track("checkout_click");
  }));
}
function buildCheckoutUrl() {
  const url = new URL(RAIOX_CONFIG.checkoutUrl);
  Object.entries(state.utms).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("src", state.utms.src || RAIOX_CONFIG.source);
  url.searchParams.set("quiz", "meuraiox01");
  return url.toString();
}
function faceAnswer(feature) {
  const answer = state.face[feature.id];
  if (!answer) return "Sem resposta";
  if (answer.status === "inconclusivo") return "Não consigo identificar";
  if (answer.presente === true) return answer.lado_usuario ? `Sim — ${SIDE_LABELS[answer.lado_usuario]}` : "Sim — lado ainda não informado";
  return "Não identifico em mim";
}
function buildPayload(event) {
  const summary = getObservationSummary(); const now = new Date().toISOString();
  return {
    event, source: RAIOX_CONFIG.source, quiz_variant: "meuraiox01", submission_id: state.submissionId,
    spreadsheet_id: RAIOX_CONFIG.spreadsheetId, sheet_name: RAIOX_CONFIG.sheetTabName, sheet_gid: RAIOX_CONFIG.sheetGid,
    status_resposta: "concluída", ultimo_evento: event, primeiro_envio_em: state.firstSentAt, atualizado_em: now, concluido_em: state.completedAt,
    acessou_quiz: "sim", chegou_captura: "sim", enviou_dados: "sim", quiz_completo: "sim", resultado_visto: "sim",
    clicou_checkout: state.checkoutClicked ? "sim" : "", checkout_clicked_at: state.checkoutClicked ? now : "",
    etapa_atual: state.checkoutClicked ? "Meu Raio X 01 — checkout" : "Meu Raio X 01 — mapa visual concluído",
    nome: state.lead.name, telefone: state.lead.phone, perfil: "observacao_visual", perfil_vsl: "nao_terapeuta",
    "Meu Raio X 01 — Referências": state.references,
    "Meu Raio X 01 — Corpo principal": summary.primary ? `Referência ${summary.primary.letter} — ${summary.primary.label}` : "Não consegui comparar",
    "Meu Raio X 01 — Corpo complementar": "", // Legacy collector column; this version has one body selection.
    "Meu Raio X 01 — Curva inferior": faceAnswer(FACE_FEATURES[0]),
    "Meu Raio X 01 — Contorno lateral": faceAnswer(FACE_FEATURES[1]),
    "Meu Raio X 01 — Pequenas linhas": faceAnswer(FACE_FEATURES[2]),
    "Meu Raio X 01 — Resumo": `${summary.bodyText}\n${summary.faceText}`,
    ...state.utms, src: state.utms.src || RAIOX_CONFIG.source, page_url: location.href
  };
}
function sendLeadEvent(event) {
  if (state.testMode || !RAIOX_CONFIG.leadWebhookUrl || !state.lead || !state.resultViewed) return;
  const body = JSON.stringify(buildPayload(event));
  // Serialize final/checkout updates so this browser cannot create competing rows.
  saveQueue = saveQueue.catch(() => {}).then(() => fetch(RAIOX_CONFIG.leadWebhookUrl, {
    method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: true
  })).catch(() => {});
}
function track(event) {
  if (state.testMode) return;
  const payload = { event: `meuraiox01_${event}`, source: RAIOX_CONFIG.source };
  window.dataLayer?.push(payload);
  if (typeof window.fbq === "function") window.fbq("trackCustom", payload.event, { source: RAIOX_CONFIG.source });
}
track("view");
render();
