/* RaioX01: fila sequencial, confirmação explícita e eventos deduplicados. */
const RX = (() => {
  // Coleta primária: a Edge Function usa service_role internamente e confirma
  // o lote gravado antes de a fila local ser removida. O n8n fica livre para
  // automações posteriores e não bloqueia a entrada dos dados do quiz.
  const endpoint = 'https://nklqcamhkwqictdmictb.supabase.co/functions/v1/raiox01-collect';
  const storage = {get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}},remove(k){try{localStorage.removeItem(k)}catch{}}};
  const uuid=()=>crypto.randomUUID();
  let id; try {id=sessionStorage.getItem('rx01_session');if(!id){id=uuid();sessionStorage.setItem('rx01_session',id)}} catch {id=uuid()}
  const key='rx01_queue_'+id;
  let saved;try{saved=JSON.parse(storage.get(key)||'null')}catch{}
  if(saved && Date.now()-saved.updated>6*86400000){storage.remove(key);saved=null;id=uuid();try{sessionStorage.setItem('rx01_session',id)}catch{}}
  const storeKey='rx01_queue_'+id;
  let seq=saved?.seq||0,token=saved?.token||null,queue=saved?.queue||[],snapshot=saved?.snapshot||null;
  let analytics=saved?.analytics===true,busy=false,retries=0,timer=null,batchTimer=null;
  const allowed=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','utm_adset','utm_ad','utm_source_platform','utm_creative_format','utm_marketing_tactic','fbclid','gclid','gbraid','wbraid','msclkid','ttclid','src','sck','meta_campaign_id','meta_campaign_name','meta_adset_id','meta_adset_name','meta_ad_id','meta_ad_name','meta_creative_id','meta_creative_name'];
  allowed.push('vk_source','vk_campaign_id','vk_adset_id','vk_ad_id','xcod','meta_platform','meta_placement','creative_code');
  function readAttribution(){
    const query=new URLSearchParams(location.search),out={};
    for(const k of allowed){const value=query.get(k);if(value && !/[{}\r\n]/.test(value))out[k]=value.slice(0,500)}
    if(out.vk_source==='paid_metaads' && !out.meta_ad_id && /^\d+$/.test(out.vk_ad_id||''))out.meta_ad_id=out.vk_ad_id;
    return out;
  }
  const params=new URLSearchParams(location.search),current=readAttribution();
  let first=saved?.first||current,last=Object.keys(current).length?current:(saved?.last||{});
  const page=location.origin+location.pathname;
  const test=saved?.test ?? (params.get('rx_test')==='1');
  function attribution(){const latest=readAttribution();if(Object.keys(latest).length)last=latest;return {...last}}
  const optional=new Set(['rx_scroll','rx_engaged_time','rx_outbound_click','rx_whatsapp_click','rx_video_ready','rx_video_start','rx_video_pause','rx_video_resume','rx_video_progress','rx_video_complete','rx_video_preview','rx_video_pitch','rx_performance']);
  function persist(){storage.set(storeKey,JSON.stringify({seq,token,queue,snapshot,analytics,first,last,test,updated:Date.now()}))}
  function context(){return {screen:snapshot?.screen||'opening',step_index:snapshot?.stepIndex??0,viewport_width:innerWidth,viewport_height:innerHeight,language:navigator.language}}
  function status(){/* O rastreamento funciona em segundo plano e não exibe avisos ao visitante. */}
  function emit(event,properties={},lead){
    if(optional.has(event)&&(!analytics||queue.length>200))return;
    attribution();
    const p={schema_version:1,source:'quiz_raiox01',lancamento:'raiox01_2026_09',event_id:uuid(),session_id:id,sequence:++seq,event_name:event,occurred_at:new Date().toISOString(),test_mode:test,user_agent:navigator.userAgent.slice(0,500),page_url:page,context:context(),attribution:{...last},consent:{analytics,advertising:false,marketing_contact:false,version:'rx01_20260926'},properties};
    if(event==='page_view')p.properties={...properties,first_attribution:first,referrer:document.referrer?new URL(document.referrer).origin:'',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};
    if(lead)p.lead={nome:lead.name,email:lead.email.toLowerCase(),telefone:lead.phone,form_notice_version:'rx01_20260926'};
    window.RXGTM?.send(p,false);
    queue.push(p);persist();
    const immediate=['page_view','lead_submit','quiz_complete','rx_checkout_click','rx_page_hidden','rx_page_exit'].includes(event);
    if(immediate){clearTimeout(batchTimer);batchTimer=null;void flush()}
    else if(!batchTimer)batchTimer=setTimeout(()=>{batchTimer=null;void flush()},5000);
    return p.event_id;
  }
  function batch(){
    const events=[];
    for(const item of queue.slice(0,20)){
      if(events.length && new TextEncoder().encode(JSON.stringify([...events,item])).length>28000)break;
      events.push(item);
      if(!token)break;
    }
    return {session_id:id,test_mode:test,page_url:page,...(token?{session_token:token}:{}),events};
  }
  async function flush(){
    if(busy||!queue.length||!navigator.onLine)return;
    busy=true;clearTimeout(timer);
    try{
      while(queue.length){
        const p=batch();
        const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(p),signal:AbortSignal.timeout(20000)});
        const ack=await response.json();
        if(!response.ok||!ack.ok||!ack.stored||!Array.isArray(ack.event_ids)||ack.event_ids.length!==p.events.length||!p.events.every((e,i)=>ack.event_ids[i]===e.event_id)){
          if(response.status>=400&&response.status<500&&response.status!==429){status('Não foi possível salvar. Suas respostas estão neste navegador. Tente recarregar a página.');throw Error('rejected')}
          throw Error('unconfirmed');
        }
        for(const item of p.events)if(item.event_name==='lead_submit')window.RXGTM?.send(item,true);
        token=ack.session_token||token;queue.splice(0,p.events.length);retries=0;persist();status('');
      }
    }catch{retries++;timer=setTimeout(flush,Math.min(60000,1000*2**Math.min(retries,6)));if(queue.some(p=>p.event_name==='lead_submit'||p.event_name==='quiz_complete'))status('Salvamento pendente. Tentando reconectar…')}
    finally{busy=false}
  }
  function update(s){snapshot=JSON.parse(JSON.stringify(s));persist()}
  function consent(value){analytics=!!value;persist();emit('consent_change',{analytics})}
  addEventListener('online',()=>{status('');void flush()});
  addEventListener('pagehide',()=>{
    emit('rx_page_exit');
    // Apenas o primeiro item: não violar dependência de lead/token. Fila só sai após ACK.
    if(token&&queue.length)navigator.sendBeacon?.(endpoint,new Blob([JSON.stringify(batch())],{type:'text/plain;charset=UTF-8'}));
  });
  document.addEventListener('visibilitychange',()=>emit(document.hidden?'rx_page_hidden':'rx_page_visible'));
  let scrollMark=0,activeSeconds=0;
  addEventListener('scroll',()=>{const denominator=document.documentElement.scrollHeight-innerHeight;if(denominator<=0)return;const percent=Math.min(100,Math.floor(scrollY/denominator*100/25)*25);if(percent>scrollMark){scrollMark=percent;emit('rx_scroll',{percent})}},{passive:true});
  setInterval(()=>{if(!document.hidden){activeSeconds+=15;if(analytics&&activeSeconds%30===0)emit('rx_engaged_time',{active_seconds:activeSeconds})}},15000);
  document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(link&&link.id!=='checkout-button'){try{const url=new URL(link.href);if(url.origin!==location.origin)emit('rx_outbound_click',{destination:url.origin+url.pathname})}catch{}}});
  // Eventos HTML5 observáveis; não infere reprodução de um simples temporizador.
  const bound=new WeakSet();
  function bindVideos(){for(const v of document.querySelectorAll('video')){if(bound.has(v))continue;bound.add(v);let started=false,marks=new Set();v.addEventListener('play',()=>{emit(started?'rx_video_resume':'rx_video_start');started=true});v.addEventListener('pause',()=>emit('rx_video_pause',{seconds:Math.round(v.currentTime)}));v.addEventListener('ended',()=>emit('rx_video_complete'));v.addEventListener('timeupdate',()=>{if(!Number.isFinite(v.duration)||!v.duration)return;for(const percent of [25,50,75,90])if(v.currentTime/v.duration*100>=percent&&!marks.has(percent)){marks.add(percent);emit('rx_video_progress',{percent})}})}}
  function bindVturb(){for(const v of document.querySelectorAll('vturb-smartplayer')){
    if(bound.has(v))continue;bound.add(v);let started=false,marks=new Set();
    const props=()=>({player_id:v.id,seconds:Math.round(Number(v.currentTime)||0)});
    v.addEventListener('player:ready',()=>emit('rx_video_ready',props()));
    v.addEventListener('smartautoplay:active',()=>emit('rx_video_preview',props()));
    v.addEventListener('video:play',()=>{if(v.inSmartAutoPlay)return;emit(started?'rx_video_resume':'rx_video_start',props());started=true});
    v.addEventListener('video:pause',()=>{if(started)emit('rx_video_pause',props())});
    v.addEventListener('video:ended',()=>{if(started)emit('rx_video_complete',props())});
    v.addEventListener('pitch:time',()=>emit('rx_video_pitch',props()));
    v.addEventListener('video:timeupdate',e=>{if(!started||v.inSmartAutoPlay)return;const duration=Number(v.duration),time=Number(e.detail?.time);if(!duration||!Number.isFinite(time))return;for(const percent of [25,50,75,90])if(time/duration*100>=percent&&!marks.has(percent)){marks.add(percent);emit('rx_video_progress',{...props(),percent})}});
  }}
  new MutationObserver(()=>{bindVideos();bindVturb()}).observe(document.body,{childList:true,subtree:true});
  addEventListener('load',()=>{const n=performance.getEntriesByType('navigation')[0];if(n)emit('rx_performance',{dom_ready_ms:Math.round(n.domContentLoadedEventEnd),load_ms:Math.round(n.loadEventEnd)})});
  if(!seq)emit('page_view');else void flush();
  return {emit,update,consent,snapshot:()=>snapshot,attribution,sessionId:()=>id,analytics:()=>analytics,pending:()=>queue.length};
})();
