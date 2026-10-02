const RAIOX_CONFIG = {
  checkoutUrl: "https://pay.hub.la/XhmUngrBMRpSh984fDuG",
  leadWebhookUrl: window.RX_CONFIG.webhookUrl,
  source: "quiz_raiox03",
  workshopDateText: "6 e 7 de Outubro, às 20h · ao vivo",
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
    screen: "intro",
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

function getTrackingParams() {
  return window.RX.getAttribution();
}


function panel(content) { return `<section class="screen panel"><div class="panel-inner">${content}</div></section>`; }

function render() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  updateProgress();
  const current=STEPS[state.stepIndex];
  RX.setContext({screen:state.screen,step_index:Math.min(7,state.stepIndex+1),step_id:current?.id,step_type:current?.type});
  if(state.leadSaved)RX.saveCheckpoint(state);
  if (state.screen === "intro") return renderIntro();
  if (state.screen === "opening") return renderOpening();
  if (state.screen === "step") return renderStep();
  if (state.screen === "loading") return renderLoading();
  return renderResult();
}

function updateProgress() {
  progressLabel.textContent = state.screen === "step" ? `Etapa ${state.stepIndex + 1} de ${STEPS.length}` : "";
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const element=event.currentTarget, button=element.querySelector('button[type="submit"]');
  if(button.disabled)return;
  RX.emit("rx_form_submit_attempt", {screen:"opening"});
  const form=new FormData(element);
  const lead={email:String(form.get("email")||"").trim().toLowerCase(),phone:RX.normalizePhone(form.get("phone")),marketing_contact:false};
  const error=validateLead(lead);
  if(error){document.querySelector("#form-error").textContent=error.message;RX.emit("rx_form_error",{error_code:error.code});return;}
  button.disabled=true;button.textContent="Salvando...";document.querySelector("#form-error").textContent="";
  try {
    await RX.saveLead(lead,form.get("company_website"));
    state.lead=lead;state.leadSaved=true;
    saveCheckoutPrefill(lead);
    RX.emit("quiz_start", {screen:"opening"});
    state.screen="step";
    render();
  } catch(_){
    document.querySelector("#form-error").textContent="Não foi possível confirmar o cadastro. Verifique sua conexão e tente novamente. Seus dados continuam no formulário.";
    RX.emit("rx_form_submit_error",{error_code:"save_failed"});
    button.disabled=false;button.textContent="Tentar novamente";
  }
}

function validateLead(lead) {
  if(lead.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(lead.email))return {code:"invalid_email",message:"Informe um e-mail válido."};
  if(!/^\+[1-9]\d{7,14}$/.test(lead.phone))return {code:"invalid_phone",message:"Informe seu WhatsApp com DDD. Para outro país, inclua + e o código do país."};
  return null;
}

function renderIntro() {
  root.innerHTML = panel(`
    <section class="rx03-intro" aria-labelledby="rx03-intro-title">
      <div class="rx03-intro-kicker">WORKSHOP RAIO-X HUMANO</div>
      <h1 class="rx03-intro-title" id="rx03-intro-title">
        VOU TE ENSINAR COMO ENXERGAR OS TRAUMAS DAS PESSOAS EM SEGUNDOS APENAS OLHANDO O ROSTO E O CORPO.
      </h1>
      <figure class="rx03-intro-visual">
        <img src="/raio-x-hero-wide.webp?v=2" alt="Workshop Raio-X Humano" width="1586" height="992">
      </figure>
      <div class="rx03-intro-cta">
        <button class="button button-primary rx03-intro-button" id="intro-test-button" type="button">Fazer Meu Teste Agora</button>
      </div>
    </section>
  `);
  RX.setContext({screen:"intro"});
  RX.emit("rx_cta_view", {element_id:"intro-test-button"});
  document.querySelector("#intro-test-button").addEventListener("click", () => {
    state.screen = "opening";
    RX.setContext({screen:"opening"});
    render();
  });
}

function renderOpening() {
  const lead = state.lead || {};
  root.innerHTML = panel(`
    <figure class="raiox-hero-visual">
      <img src="/raio-x-hero-wide.webp?v=2" alt="Leitura de traços do rosto e comportamento humano" width="1586" height="992">
      <span class="raiox-scan-line" aria-hidden="true"></span>
    </figure>
    <h1 class="opening-title">
      <span class="opening-line">APRENDA ENXERGAR SE UMA PESSOA</span>
      <span class="opening-line">TEM TRAUMAS OU SOFREU ABUSO OU</span>
      <span class="opening-line">SE TEM PROBLEMAS COM PAI E MÃE</span>
    </h1>
    <h2 class="opening-secondary-title">APENAS OLHANDO O ROSTO E O CORPO EM 5 SEGUNDOS!</h2>
    <p class="opening-subtitle">EM APENAS 2 NOITES AO VIVO COM MATERIAL DE APOIO NA PRÁTICA</p>
    <form class="form opening-form" id="lead-form" novalidate>
      <div class="field"><label for="email">Digite seu melhor e-mail:</label><input id="email" name="email" type="email" maxlength="254" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(lead.email || "")}" required></div>
      <div class="field"><label for="phone">Telefone ( Whatsapp):</label><input id="phone" name="phone" type="tel" inputmode="tel" maxlength="30" autocomplete="tel" placeholder="+55 11 99999-9999" value="${escapeHtml(lead.phone || "")}" required></div>
      <div class="rx-honey" aria-hidden="true"><label>Site<input name="company_website" tabindex="-1" autocomplete="off"></label></div>
      <div class="error" id="form-error" role="alert"></div>
      <div class="fixed-cta"><button class="button button-primary" id="start-button" type="submit">QUERO APRENDER</button></div>
    </form>
    <p class="fine-print">Ao continuar, você solicita o cadastro no quiz e o uso dos dados e respostas para entregar o resultado e os próximos passos deste workshop. ${window.RX_CONFIG.privacyPolicyUrl ? `<a href="${escapeHtml(window.RX_CONFIG.privacyPolicyUrl)}" target="_blank" rel="noopener noreferrer">Política de privacidade</a>` : ""}</p>
  `);
  const form = document.querySelector("#lead-form");
  form.addEventListener("submit", handleLeadSubmit);
  form.addEventListener("input", () => RX.emit("rx_form_start", {screen:"opening"}), {once:true});
  state.captureViewed = true;
  RX.emit("rx_form_view", {screen:"opening"});
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
    <span class="eyebrow insight-eyebrow">Ponto de observação</span>
    <h2 class="insight-title">${step.title}</h2>
    <div class="insight-card">
      <p class="insight-body">${step.body}</p>
      <ul class="opening-list insight-list">${step.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
      <p class="insight-footer"><strong>${step.footer}</strong></p>
    </div>
    <div class="fixed-cta"><button class="button button-primary" id="continue-button" type="button">${step.button}</button></div>
  `);
  RX.emit("quiz_insight_view", {step_id:step.id,step_index:state.stepIndex+1});
  document.querySelector("#continue-button").addEventListener("click", async () => {
    const button=document.querySelector("#continue-button");button.disabled=true;clearSaveError();
    try {
      await RX.saveProgress("quiz_insight_continue", {step_id:step.id,step_index:state.stepIndex+1,step_type:step.type});
      markStepCompleted(step.id);state.stepIndex+=1;render();
    } catch (_) {button.disabled=false;showSaveError("Não conseguimos salvar esta etapa. Verifique sua conexão e toque em Continuar novamente.");}
  });
}

function clearSaveError(){document.querySelector("#quiz-save-error")?.remove();}
function showSaveError(message){
  clearSaveError();const box=document.createElement("p");box.id="quiz-save-error";box.className="error";box.setAttribute("role","alert");box.textContent=message;
  const target=document.querySelector(".panel-inner");if(target)target.appendChild(box);
}
async function answerStep(step, optionIndex, button) {
  const option=step.options[optionIndex];
  document.querySelectorAll(".option").forEach(item=>item.disabled=true);button.classList.add("selected");clearSaveError();
  const completed=state.completedSteps.includes(step.id)?[...state.completedSteps]:[...state.completedSteps,step.id];
  try {
    await RX.saveProgress("quiz_answer", {question_id:step.id,option_index:optionIndex,answer_label:option.label,selected_profile:option.profile||undefined,step_index:state.stepIndex+1,option_count:step.options.length,completed_steps:completed});
    if(option.profile)state.profile=option.profile;
    state.answers[step.id]=option.label;state.answerIndexes[step.id]=optionIndex;markStepCompleted(step.id);
    RX.emit("quiz_step_complete",{step_id:step.id,step_index:state.stepIndex+1,step_type:step.type});
    state.stepIndex+=1;if(state.stepIndex>=STEPS.length)state.screen="loading";render();
  } catch (_) {
    document.querySelectorAll(".option").forEach(item=>{item.disabled=false;item.classList.remove("selected");});
    showSaveError("Não conseguimos salvar sua resposta. Verifique sua conexão e selecione a opção novamente.");
  }
}

let completionInFlight=false;
async function renderLoading() {
  if(completionInFlight)return;completionInFlight=true;
  root.innerHTML=panel(`<div class="loading"><div class="loading-ring" aria-hidden="true"></div><h2>Organizando seu resultado...</h2><p>Estamos conectando suas respostas com o caminho mais coerente para você.</p></div>`);
  try {
    const finalAnswers=STEPS.filter(step=>step.type==="question").map(step=>{const optionIndex=state.answerIndexes[step.id],option=step.options[optionIndex];return {question_id:step.id,option_index:optionIndex,answer_label:option?.label||state.answers[step.id]||"",selected_profile:option?.profile||undefined};});
    const result=await RX.saveProgress("quiz_complete",{step_index:STEPS.length,answers:finalAnswers,completed_steps:[...state.completedSteps]});
    if(!RX.getTestMode() && (result.quiz_status?.finalizou!==true || result.quiz_status?.status!=="concluido" || Number(result.quiz_status?.perguntas_respondidas)!==5 || Number(result.quiz_status?.etapas_concluidas)!==7))throw new Error("completion_not_confirmed");
    state.screen="result";state.resultViewed=true;completionInFlight=false;render();
  } catch (_) {
    completionInFlight=false;
    root.innerHTML=panel(`<h2>Precisamos confirmar suas respostas.</h2><p>Não foi possível concluir a gravação agora. Suas respostas continuam nesta página. Toque abaixo para tentar novamente.</p><button class="button button-primary" id="retry-completion" type="button">Tentar salvar novamente</button>`);
    document.querySelector("#retry-completion").addEventListener("click",renderLoading);
  }
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
  url.searchParams.set("src", RX.getAttribution().src || state.utms.src || RAIOX_CONFIG.source);
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