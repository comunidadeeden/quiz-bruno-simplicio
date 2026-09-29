/* Raio-X: coleta própria separada do dataLayer; nenhuma chave de banco no navegador. */
(function (w, d) {
  'use strict';
  // RX4: mantém a API RX do site salvo; troca somente o contrato/transporte.
  const oldConfig=w.RX_CONFIG||{};
  const cfg=w.RX_CONFIG={...oldConfig,version:'raiox-direct-v4.4',pageBuild:'rx4.4-vk-always-on-20260929',
    webhookUrl:'https://nklqcamhkwqictdmictb.supabase.co/functions/v1/raiox02-collect',
    source:'quiz_raiox02',launch:'raiox02_2026_09',resumeSession:oldConfig.resumeSession!==false,
    testMode:oldConfig.testMode===true||new URLSearchParams(w.location.search).get('rx_test')==='1',
    consentVersion:oldConfig.consentVersion||'rx02-2026-09-29',maxRetries:2,webhookTimeoutMs:18000};
  if(w.__RX_DIRECT_V4_INSTALLED)throw new Error('rx_tracking_loaded_twice');
  w.__RX_DIRECT_V4_INSTALLED=true;
  const expectedSteps=['profile','body_reading','insight_body','desired_reading','face_reading','insight_face','consequence'];
  const expectedQuestions=['profile','body_reading','desired_reading','face_reading','consequence'];
  let registeredSteps=null,lastDeliveryError=null;
  function registerSteps(steps){
    if(!Array.isArray(steps)||steps.length!==7||steps.some((s,i)=>s?.id!==expectedSteps[i]))throw new Error('quiz_catalog_incompatible');
    for(const s of steps){if(expectedQuestions.includes(s.id)&&(!Array.isArray(s.options)||s.options.length!==4||
      s.options.some(o=>typeof o?.label!=='string'||!o.label.trim()||o.label.length>1000)))throw new Error('quiz_catalog_incompatible');}
    registeredSteps=steps;return true;
  }
  function getSteps(){
    if(registeredSteps)return registeredSteps;
    try{if(typeof STEPS!=='undefined')registerSteps(STEPS);}catch(e){if(e.message==='quiz_catalog_incompatible')throw e;}
    if(!registeredSteps&&Array.isArray(w.RX_QUIZ_CATALOG))registerSteps(w.RX_QUIZ_CATALOG);
    if(!registeredSteps)throw new Error('quiz_catalog_not_available');return registeredSteps;
  }
  function answerRecord(id,index,supplied){
    if(!expectedQuestions.includes(id)||!Number.isInteger(index)||index<0||index>3)throw new Error('invalid_answer');
    const option=getSteps().find(s=>s.id===id).options[index];
    if(supplied?.answer_label!=null&&supplied.answer_label!==option.label)throw new Error('answer_label_mismatch');
    return {question_id:id,option_index:index,answer_label:option.label,...(option.profile?{selected_profile:option.profile}:{})};
  }
  function normalizeProgress(name,details){
    const v={...details};
    if(name==='quiz_answer')Object.assign(v,answerRecord(v.question_id,v.option_index,v));
    if(name==='quiz_complete'){
      const raw=v.answers;if(!raw||typeof raw!=='object')throw new Error('answers_snapshot_required');
      if(Array.isArray(raw)){
        if(raw.length!==5||new Set(raw.map(x=>x?.question_id)).size!==5)throw new Error('incomplete_snapshot');
        v.answers=expectedQuestions.map(id=>{const a=raw.find(x=>x?.question_id===id);if(!a)throw new Error('incomplete_snapshot');return answerRecord(id,a.option_index,a);});
      }else{
        if(Object.keys(raw).length!==5||expectedQuestions.some(id=>!Object.prototype.hasOwnProperty.call(raw,id)))throw new Error('incomplete_snapshot');
        v.answers=expectedQuestions.map(id=>answerRecord(id,raw[id]));
      }
    }
    if(name==='quiz_answer'||name==='quiz_complete'){
      const a=v.completed_steps;
      if(!Array.isArray(a)||!a.length||a.length>7||a.some((id,i)=>id!==expectedSteps[i])||
        (name==='quiz_complete'&&a.length!==7)||(name==='quiz_answer'&&a[a.length-1]!==v.question_id))throw new Error('invalid_step_snapshot');
    }
    if(name==='quiz_insight_continue'&&!['insight_body','insight_face'].includes(v.step_id))throw new Error('invalid_step');
    return v;
  }
  function reportError(e,p){
    lastDeliveryError={code:String(e?.message||'delivery_failed').slice(0,100),status:Number(e?.status)||null,event_name:p.event_name,event_id:p.event_id};
    w.dispatchEvent(new CustomEvent('rx:delivery-error',{detail:{...lastDeliveryError}}));
  }
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r=Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16); });
  const storageKey='rx02_runtime_v4_'+cfg.launch+'_'+(cfg.testMode?'test':'prod');
  const validId=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  let saved=null;
  try {
    const x=JSON.parse(sessionStorage.getItem(storageKey)||'null');
    if(cfg.resumeSession && x && x.version===cfg.version && validId(x.session_id) && validId(x.client_key)
      && Number.isFinite(x.saved_at) && Date.now()-x.saved_at>=0 && Date.now()-x.saved_at<(cfg.sessionMaxAgeMs||21600000)
      && validId(x.session_token) && Number.isInteger(x.sequence) && x.sequence>=1 && x.sequence<1000000) saved=x;
    else sessionStorage.removeItem(storageKey);
  } catch(_) {}
  const sessionId=saved?.session_id||uid(), clientKey=saved?.client_key||uid(), openedAt=saved?.opened_at||new Date().toISOString();
  let token=validId(saved?.session_token)?saved.session_token:null, seq=saved?.sequence||0,
    checkpoint=saved?.checkpoint||null, latestStatus=null,
    context={screen:'opening',step_index:0}, queue=Promise.resolve(), consentListeners=[];
  function persistRuntime(){
    if(!cfg.resumeSession)return;
    try{sessionStorage.setItem(storageKey,JSON.stringify({version:cfg.version,session_id:sessionId,client_key:clientKey,
      session_token:token,sequence:seq,opened_at:openedAt,saved_at:Date.now(),checkpoint}));}catch(_){}
  }
  function saveCheckpoint(value){
    // Never persist PII, arbitrary payloads or URLs. Only acknowledged quiz state.
    const ids=['profile','body_reading','insight_body','desired_reading','face_reading','insight_face','consequence'];
    const qs=['profile','body_reading','desired_reading','face_reading','consequence'];
    if(!value || value.leadSaved!==true || !['step','loading','result'].includes(value.screen))return;
    const completed=value.completedSteps;
    if(!Array.isArray(completed)||completed.length>7||completed.some((id,i)=>id!==ids[i]))return;
    const indexes={}; for(const q of qs){const i=value.answerIndexes?.[q];if(Number.isInteger(i)&&i>=0&&i<=3)indexes[q]=i;}
    checkpoint={screen:value.screen,stepIndex:Math.min(7,Math.max(0,Number(value.stepIndex)||0)),leadSaved:true,
      completedSteps:completed.slice(),answerIndexes:indexes,resultViewed:value.resultViewed===true,checkoutClicked:value.checkoutClicked===true};
    persistRuntime();
  }
  function getCheckpoint(){
    const x=checkpoint,ids=['profile','body_reading','insight_body','desired_reading','face_reading','insight_face','consequence'];
    if(!token||!x||x.leadSaved!==true||!['step','loading','result'].includes(x.screen)
      ||!Array.isArray(x.completedSteps)||x.completedSteps.length>7||x.completedSteps.some((id,i)=>id!==ids[i])
      ||!x.answerIndexes||typeof x.answerIndexes!=='object'||Array.isArray(x.answerIndexes))return null;
    const indexes={};
    for(const q of ['profile','body_reading','desired_reading','face_reading','consequence']){
      const n=x.answerIndexes[q];if(n!=null){if(!Number.isInteger(n)||n<0||n>3)return null;indexes[q]=n;}
    }
    return {screen:x.screen,stepIndex:x.completedSteps.length,leadSaved:true,completedSteps:x.completedSteps.slice(),
      answerIndexes:indexes,resultViewed:x.resultViewed===true,checkoutClicked:x.checkoutClicked===true};
  }

  let consent={analytics:false,advertising:false,marketing_contact:false,decided:false};
  try { const old=JSON.parse(localStorage.getItem('rx02_consent_v1')||'null'); if(old && old.version===cfg.consentVersion && Date.now()-old.saved_at<180*864e5) consent={...consent,...old.choices}; localStorage.removeItem('raiox02_lead'); } catch (_) {}
  const incoming=new URLSearchParams(w.location.search);
  const utmKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','utm_adset','utm_ad','src','sck','meta_campaign_id','meta_campaign_name','meta_adset_id','meta_adset_name','meta_ad_id','meta_ad_name','meta_creative_id','meta_creative_name','vk_source','vk_ad_id','creative_code','meta_platform','meta_placement'];
  const clickKeys=['fbclid','gclid','gbraid','wbraid','ttclid','msclkid'];
  const safeText=v => {v=String(v||'').trim(); return v.length>250 || /@|(?:\+?\d[\s().-]*){10,}/.test(v) ? null:v;};
  const attribution={};
  utmKeys.concat(clickKeys).forEach(k=>{const v=incoming.get(k); if(v && v.length<=250 && !v.includes('@')) attribution[k]=v;});
  function safeUrl(v) {try {const u=new URL(v,w.location.href); return /^(http:|https:)$/.test(u.protocol)?u.origin+u.pathname:'';}catch(_){return '';}}
  function cookie(name) {const match=d.cookie.split('; ').find(c=>c.startsWith(name+'='));return match?decodeURIComponent(match.slice(name.length+1)):null;}
  function currentAttribution() {
    const a={};
    utmKeys.forEach(k=>{if(attribution[k])a[k]=attribution[k];});
    if(consent.advertising){
      clickKeys.forEach(k=>{if(attribution[k])a[k]=attribution[k];});
      a.fbp=cookie('_fbp');a.fbc=cookie('_fbc');
    }
    return a;
  }
  function mode(c){return {analytics_storage:c.analytics?'granted':'denied',ad_storage:c.advertising?'granted':'denied',ad_user_data:c.advertising?'granted':'denied',ad_personalization:c.advertising?'granted':'denied'};}
  w.RXConsent={get:()=>({...consent}),getMode:()=>mode(consent),subscribe:fn=>consentListeners.push(fn)};
  w.dataLayer=w.dataLayer||[];
  const dlSeen=new Set();
  const analyticKeys=['screen','step_id','step_index','step_type','question_id','question_index','option_count','error_code','element_id','link_domain','scroll_percent','active_seconds','video_id','video_percent','video_seconds','video_duration','is_autoplay','cta_delay_seconds','currency','value','load_ms','metric'];
  function publicEvent(name,id,details={}) {
    if(cfg.testMode || (!consent.analytics && !consent.advertising)) return;
    if(dlSeen.has(id+':'+name))return;dlSeen.add(id+':'+name);
    const params={};analyticKeys.forEach(k=>{const v=details[k];if(v===undefined||v===null)return;if(typeof v==='number'&&Number.isFinite(v)||typeof v==='boolean')params[k]=v;else if(typeof v==='string'&&v.length<=100&&!v.includes('@'))params[k]=v;});
    const traffic={},a=currentAttribution();
    const trafficKeys={campaign_source:'utm_source',campaign_medium:'utm_medium',campaign_name:'utm_campaign',campaign_content:'utm_content',campaign_term:'utm_term',campaign_id:'utm_id'};
    Object.keys(trafficKeys).forEach(k=>{const v=safeText(a[trafficKeys[k]]);if(v)traffic[k]=v;});
    w.dataLayer.push({rx:null});
    w.dataLayer.push({event:'rx_event',rx:{name:name,event_id:id,page_location:safeUrl(location.href),page_referrer:safeUrl(d.referrer),source:cfg.source,analytics:consent.analytics,advertising:consent.advertising,test_mode:cfg.testMode===true,traffic:traffic,params:params}});
  }
  function payload(name,details,lead) {
    seq+=1;persistRuntime();
    return {integration_version:'raiox-v3.0',client_key:clientKey,schema_version:1,event_id:uid(),event_name:name,session_id:sessionId,session_token:token,sequence:seq,occurred_at:new Date().toISOString(),source:cfg.source,lancamento:cfg.launch,test_mode:cfg.testMode===true,page_url:safeUrl(location.href),referrer:consent.analytics?safeUrl(d.referrer):'',context:{...context},properties:details||{},attribution:currentAttribution(),consent:{analytics:consent.analytics,advertising:consent.advertising,marketing_contact:consent.marketing_contact,version:cfg.consentVersion,decided:consent.decided},device:consent.analytics?{language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,viewport_width:innerWidth,viewport_height:innerHeight,screen_width:screen.width,screen_height:screen.height}:{},lead:lead||undefined};
  }
  async function request(p){
    let last;
    for(let attempt=0;attempt<=cfg.maxRetries;attempt++){
      const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),cfg.webhookTimeoutMs);
      try{
        // Retentativas mantêm o conteúdo, o ID e a sequência; só atualizam o token.
        const body={...p,session_token:token||p.session_token};
        const res=await fetch(cfg.webhookUrl,{method:'POST',mode:'cors',credentials:'omit',
          headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal,keepalive:true});
        const result=await res.json().catch(()=>null);
        const matches=result?.event_id===p.event_id||(Array.isArray(result?.event_ids)&&result.event_ids.includes(p.event_id));
        if(!res.ok||!result||result.ok!==true||result.stored!==true||!matches||result.test_mode!==p.test_mode){
          const e=new Error(result?.code||'invalid_ack');e.retryable=res.status===429||res.status>=500;e.status=res.status;throw e;
        }
        if(!validId(result.session_token)){const e=new Error('invalid_session_token_ack');e.retryable=false;throw e;}
        token=result.session_token;if(result.quiz_status)latestStatus={...result.quiz_status};
        lastDeliveryError=null;persistRuntime();
        w.dispatchEvent(new CustomEvent('rx:stored',{detail:{event_name:p.event_name,event_id:p.event_id,
          session_id:sessionId,test_mode:cfg.testMode,quiz_status:latestStatus?{...latestStatus}:null}}));
        return result;
      }catch(e){
        last=e;
        if(e.retryable===false||(e.status&&e.status<500&&e.status!==429)||attempt===cfg.maxRetries){reportError(e,p);throw e;}
        await new Promise(r=>setTimeout(r,600*Math.pow(2,attempt)));
      }finally{clearTimeout(timer);}
    }throw last;
  }
  // Cadastro/progresso são operações do serviço; pixels e métricas opcionais continuam sob consentimento.
  const essential=new Set(['page_view','quiz_start','rx_form_view','rx_form_start','rx_form_submit_attempt',
    'rx_form_error','rx_form_submit_error','lead_submit','quiz_step_view','quiz_step_complete','quiz_insight_view',
    'quiz_insight_continue','quiz_answer','quiz_complete','quiz_result_view','rx_cta_view','rx_checkout_click','consent_change']);
  const supported=new Set([...essential,'rx_page_hidden','rx_page_visible','rx_page_exit','view_item','rx_scroll','rx_engaged_time',
    'rx_outbound_click','rx_whatsapp_click','rx_video_ready','rx_video_preview','rx_video_start','rx_video_resume',
    'rx_video_pause','rx_video_progress','rx_video_complete','rx_video_pitch','rx_performance']);
  let bootstrapEvent;
  function serial(p){
    const task=queue.catch(()=>{}).then(async()=>{
      if(!consent.analytics&&!essential.has(p.event_name))return {skipped:true};
      if(!token&&p!==bootstrapEvent)await request(bootstrapEvent);
      return request(p);
    });queue=task;return task;
  }
  function emit(name,details={},options={}){
    if(!supported.has(name))return Promise.resolve({skipped:true,code:'event_not_allowed'});
    if(['quiz_answer','quiz_insight_continue','quiz_complete'].includes(name))return saveProgress(name,details);
    const id=uid();if(!options.noAnalytics)publicEvent(name,id,{...context,...details});
    if(!consent.analytics&&!essential.has(name))return Promise.resolve({skipped:true});
    const p=payload(name,{...context,...details});p.event_id=id;
    return serial(p).catch(e=>({ok:false,stored:false,code:e.message||'delivery_failed'}));
  }
  const pendingProgress=new Map();
  async function saveProgress(name,details={}) {
    if(!['quiz_answer','quiz_insight_continue','quiz_complete'].includes(name))throw new Error('invalid_operational_event');
    details=normalizeProgress(name,details);
    const key=name+':'+(details.question_id||details.step_id||'final');
    const snapshot=JSON.stringify(details);
    let pending=pendingProgress.get(key);
    if(!pending || pending.snapshot!==snapshot){pending={snapshot,p:payload(name,details)};pendingProgress.set(key,pending);}
    const result=await serial(pending.p);
    if(name==='quiz_complete' && !cfg.testMode && (result.quiz_status?.finalizou!==true || result.quiz_status?.status!=='concluido' || result.quiz_status?.perguntas_respondidas!==5 || result.quiz_status?.etapas_concluidas!==7)){const e=new Error('completion_not_confirmed');reportError(e,pending.p);throw e;}
    // Completion/answers only reach analytics after the backend ACK. Details stay allowlisted.
    publicEvent(name,pending.p.event_id,{...context,...details});
    pendingProgress.delete(key);
    return result;
  }
  let pendingLead=null;
  async function saveLead(lead,honey) {
    if(String(honey||'').trim())throw new Error('invalid_form');
    consent.marketing_contact=lead.marketing_contact===true;
    const normalized={nome:String(lead.name||'').trim().replace(/\s+/g,' '),email:String(lead.email||'').trim().toLowerCase(),telefone:normalizePhone(lead.phone),form_notice_version:cfg.consentVersion,honey:String(honey||'')};
    // Retentativa manual do mesmo cadastro conserva ID; dados alterados geram novo evento.
    if(!pendingLead||JSON.stringify(pendingLead.lead)!==JSON.stringify(normalized))pendingLead=payload('lead_submit',{},normalized);
    const p=pendingLead, result=await serial(p);
    publicEvent(result.lead_created===true?'generate_lead':'rx_lead_existing',p.event_id,{screen:'lead'});
    pendingLead=null;
    return result;
  }
  function normalizePhone(v) {
    const s=String(v||'').trim(),digits=s.replace(/\D/g,'');
    if(s.startsWith('+'))return /^[1-9]\d{7,14}$/.test(digits)?'+'+digits:'';
    if(digits.startsWith('00'))return /^[1-9]\d{7,14}$/.test(digits.slice(2))?'+'+digits.slice(2):'';
    if((digits.length===12||digits.length===13)&&digits.startsWith('55'))return '+'+digits;
    if(digits.length===10||digits.length===11)return '+55'+digits;
    return '';
  }
  function setContext(c){context={...context,...c};}
  let pageAnalyticsTracked=false;
  function recordPage(){
    if(!pageAnalyticsTracked&&!cfg.testMode&&(consent.analytics||consent.advertising)){
      pageAnalyticsTracked=true;
      // PageView para medição após consentimento, sem repetir a inicialização no banco.
      publicEvent('page_view',bootstrapEvent.event_id,{screen:context.screen});
    }
  }
  function ensureMetaBase(){
    if(cfg.testMode||w.__rx26PixelBase)return;
    w.__rx26PixelBase=true;
    const pixel='866754926148360';
    if(!w.fbq){
      const n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};
      w._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
      const s=d.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';d.head.appendChild(s);
    }
    const f=w.fbq;
    if(!w.__rx26Pixel){
      f.disablePushState=true;
      f('set','autoConfig',false,pixel);
      f('init',pixel);
      w.__rx26Pixel=true;
    }
    f('consent',consent.advertising?'grant':'revoke');
  }
  function loadVk(){if(cfg.testMode||w.__rxVk)return;w.__rxVk=true;const c='dOP0AtWY0KNPoS4XBYdj';(w.vkPixelSales=w.vkPixelSales||{_q:[]})._q.push(['init',c]);(w.vkPageViewPixel=w.vkPageViewPixel||{_q:[]})._q.push(['init',c,'page_view']);['https://cf.vkdigital.com.br/sales_pixel_beacon.js?v=56','https://cf.vkdigital.com.br/event_pageview.js'].forEach((src,i)=>{const s=d.createElement('script');s.src=src;s.async=true;if(!i)['data-no-xcod-url','data-sticky-paid-source','data-global-tracking-cache'].forEach(k=>s.setAttribute(k,''));d.head.appendChild(s);});}
  function choose(analytics,advertising){
    consent={...consent,analytics:analytics===true,advertising:advertising===true,decided:true};
    try{localStorage.setItem('rx02_consent_v1',JSON.stringify({version:cfg.consentVersion,saved_at:Date.now(),choices:consent}));}catch(_){}
    consentListeners.forEach(fn=>fn(mode(consent)));
    ensureMetaBase();
    if(typeof w.fbq==='function')w.fbq('consent',consent.advertising?'grant':'revoke');
    d.querySelector('#rx-consent')?.remove();
    // Itens anteriores à autorização não são reproduzidos. Registra somente o estado atual.
    w.dataLayer.push({event:'rx_consent_changed'});
    recordPage();loadVk();emit('consent_change',{}, {noAnalytics:true});
  }
  function showConsent(){
    if(d.querySelector('#rx-consent'))return;
    const el=d.createElement('section');el.id='rx-consent';el.setAttribute('aria-label','Preferências de privacidade');
    el.innerHTML='<strong>Suas preferências de privacidade</strong><p>O formulário funciona sem cookies opcionais. Podemos medir a navegação e usar pixels de publicidade somente com sua autorização.</p><label><input type="checkbox" id="rx-analytics"> Medição de navegação</label><label><input type="checkbox" id="rx-ads"> Publicidade (Meta e VK)</label><div><button type="button" id="rx-consent-save">Salvar escolhas</button><button type="button" id="rx-consent-no">Somente necessários</button><button type="button" id="rx-consent-all">Aceitar opcionais</button></div>';
    d.body.appendChild(el);el.querySelector('#rx-analytics').checked=consent.analytics;el.querySelector('#rx-ads').checked=consent.advertising;
    el.querySelector('#rx-consent-save').onclick=()=>choose(el.querySelector('#rx-analytics').checked,el.querySelector('#rx-ads').checked);
    el.querySelector('#rx-consent-no').onclick=()=>choose(false,false);el.querySelector('#rx-consent-all').onclick=()=>choose(true,true);
  }
  const scrollSeen=new Set();let scrollTimer;
  d.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const max=d.documentElement.scrollHeight-innerHeight;if(max<100)return;const pct=Math.min(100,Math.round(scrollY/max*100));[25,50,75,90,100].forEach(n=>{const k=context.screen+':'+context.step_index+':'+n;if(pct>=n&&!scrollSeen.has(k)){scrollSeen.add(k);emit('rx_scroll',{scroll_percent:n});}});},180);},{passive:true});
  let active=0,last=performance.now(),timeSeen=new Set();
  setInterval(()=>{const now=performance.now(),delta=Math.min(2000,now-last);last=now;if(!d.hidden&&d.hasFocus())active+=delta;[15,30,60,120,300].forEach(n=>{if(active>=n*1000&&!timeSeen.has(n)){timeSeen.add(n);emit('rx_engaged_time',{active_seconds:n});}});},1000);
  d.addEventListener('visibilitychange',()=>{if(consent.analytics)emit(d.hidden?'rx_page_hidden':'rx_page_visible',{});});
  let lastInteraction=Date.now();
  ['pointerdown','keydown','touchstart','scroll'].forEach(name=>d.addEventListener(name,()=>{lastInteraction=Date.now();},{passive:true}));
  setInterval(()=>{
    if(consent.analytics&&checkpoint?.leadSaved&&!d.hidden&&d.hasFocus()&&Date.now()-lastInteraction<90000)
      emit('rx_engaged_time',{...context,metric:'quiz_heartbeat',active_seconds:Math.floor(active/1000)});
  },Math.max(15,Number(cfg.heartbeatSeconds)||30)*1000);
  function checkoutSck(existing){
    const marker=(cfg.testMode?'rx02test_':'rx02_')+sessionId.replace(/-/g,'');
    const source=String(existing||'').trim().replace(/(?:^|~)rx02(?:test)?_[0-9a-f]{32}(?=~|$)/gi,'').replace(/^~|~$/g,'');
    // Existing sck is preserved without truncation, provided it fits. Otherwise leave it
    // unchanged and use conservative email matching on the backend, not a guessed link.
    if(source.length+marker.length+1>255)return source;
    return source?source+'~'+marker:marker;
  }

  w.addEventListener('pagehide',()=>{
    // Saída não força conclusão. Respostas críticas já usam fetch keepalive e confirmação.
    if(consent.analytics&&token)emit('rx_page_exit',{...context,active_seconds:Math.floor(active/1000)});
  });
  d.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.id==='checkout-button')return;try{const u=new URL(a.href);if(/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(u.hostname))emit('rx_whatsapp_click',{link_domain:u.hostname});else if(u.origin!==location.origin&&/^https?:$/.test(u.protocol))emit('rx_outbound_click',{link_domain:u.hostname});}catch(_){};});
  function bindVturb(player){
    if(!player||player.dataset.rxBound)return;player.dataset.rxBound='1';
    let started=false,marks=new Set(),smart=false;
    const base=()=>({video_id:player.id,video_duration:Number(player.duration)||0,video_seconds:Math.floor(Number(player.currentTime)||0),is_autoplay:smart||player.inSmartAutoPlay===true});
    player.addEventListener('smartautoplay:active',()=>{smart=true;emit('rx_video_preview',base());});
    player.addEventListener('smartautoplay:inactive',()=>{smart=false;});
    player.addEventListener('player:ready',()=>emit('rx_video_ready',base()));
    player.addEventListener('video:play',()=>{if(smart||player.inSmartAutoPlay===true)return;emit(started?'rx_video_resume':'rx_video_start',base());started=true;});
    player.addEventListener('video:pause',()=>{if(started)emit('rx_video_pause',base());});
    player.addEventListener('video:timeupdate',e=>{if(smart||player.inSmartAutoPlay===true)return;const duration=Number(player.duration),time=Number(e.detail?.time??player.currentTime);if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(time))return;const pct=Math.min(100,time/duration*100);[10,25,50,75,90].forEach(n=>{if(pct>=n&&!marks.has(n)){marks.add(n);emit('rx_video_progress',{...base(),video_seconds:Math.floor(time),video_percent:n});}});});
    player.addEventListener('video:ended',()=>{if(!smart)emit('rx_video_complete',{...base(),video_percent:100});});
    player.addEventListener('pitch:time',()=>emit('rx_video_pitch',base()));
  }
  w.RX={registerSteps,getDiagnostics:()=>({build:cfg.pageBuild,endpoint:cfg.webhookUrl,launch:cfg.launch,test_mode:cfg.testMode,session_id:sessionId,session_confirmed:!!token,status:latestStatus?{...latestStatus}:null,last_error:lastDeliveryError?{...lastDeliveryError}:null,catalog_ready:(()=>{try{getSteps();return true;}catch{return false;}})()}),emit,saveLead,saveProgress,saveCheckpoint,getCheckpoint,checkoutSck,getSavedStatus:()=>latestStatus,publicEvent,normalizePhone,setContext,bindVturb,showConsent,safeUrl,getAttribution:currentAttribution,getSessionId:()=>sessionId,getTestMode:()=>cfg.testMode===true};
  bootstrapEvent=payload('page_view',{screen:'opening'});
  serial(bootstrapEvent).catch(()=>{});
  d.addEventListener('DOMContentLoaded',()=>{
    const control=d.createElement('button');
    control.type='button';
    control.className='rx-privacy-settings';
    control.textContent='Privacidade';
    control.onclick=showConsent;
    const footer=d.querySelector('.footer-brand');
    if(footer){
      footer.appendChild(d.createTextNode(' · '));
      footer.appendChild(control);
    }else{
      d.body.appendChild(control);
    }
    if(cfg.testMode){const b=d.createElement('div');b.className='rx-test-banner';b.textContent='MODO DE TESTE — dados não entram na base de leads';d.body.prepend(b);}
    ensureMetaBase();
    recordPage();loadVk();
    if(consent.analytics){const n=performance.getEntriesByType('navigation')[0];if(n)emit('rx_performance',{metric:'dom_interactive',load_ms:Math.round(n.domInteractive)});}
  });
})(window,document);