import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./checkout-quality.js',import.meta.url),'utf8');
const sid='11111111-1111-4111-8111-111111111111';
function browser(page,options={}) {
  const sent=[],handlers={},store=new Map();
  if(!options.noSession) store.set(page+'_tracking_v1',JSON.stringify({session_id:sid}));
  class Link {href='https://pay.hotmart.com/test';closest(){return this;}getBoundingClientRect(){return {top:20,left:20,width:100,height:40,bottom:60,right:120};}}
  const context={location:{pathname:'/'+page+'/',origin:'https://quiz.brunosimplicio.com.br',href:'https://quiz.brunosimplicio.com.br/'+page+'/',search:options.test?'?rx_test=1':''},
    document:{visibilityState:options.hidden?'hidden':'visible',addEventListener:(name,fn)=>{handlers[name]=fn;}},
    navigator:{webdriver:options.driver??false,userActivation:{isActive:options.activation??true}},Element:Link,innerHeight:900,innerWidth:400,
    getComputedStyle:()=>({display:options.hiddenTarget?'none':'block',visibility:'visible'}),
    sessionStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},
    crypto,URL,URLSearchParams,AbortController,Date,Set,console,setTimeout,clearTimeout,
    fetch:async(url,opts)=>{const p=JSON.parse(opts.body);sent.push(p);return {ok:true,status:200,json:async()=>({ok:true,stored:true,event_id:p.event_id,page_id:p.page_id})};},
    addEventListener:()=>{},RX:{getSessionId:()=>options.noSession?null:sid,getTestMode:()=>Boolean(options.test)}};
  context.window=context;vm.createContext(context);vm.runInContext(source,context);
  return {sent,context,click:async(trusted=true)=>{handlers.click?.({target:new Link(),isTrusted:trusted,detail:0});await new Promise(setImmediate);}};
}
test('all six pages use their original session and send evidence, never checkout or pixel',async()=>{
 for(const page of ['pagina01','pagina02','pagina03','pagina04','raiox01','raiox02']) {
  const b=browser(page);await b.click();assert.equal(b.sent.length,1);
  assert.equal(b.sent[0].session_id,sid);assert.equal(b.sent[0].page_id,page);assert.equal(b.sent[0].event_name,'cta_click');
  assert.equal(b.sent[0].properties.quality_evidence_only,true);assert.equal(b.sent[0].properties.interaction_trusted,true);
  assert.equal(b.context.dataLayer,undefined);assert.equal(b.context.fbq,undefined);
 }
});
test('programmatic click stays raw evidence and carries an explicit false signal',async()=>{const b=browser('pagina01');await b.click(false);assert.equal(b.sent[0].properties.interaction_trusted,false);});
test('hidden and driver signals stay separate from trusted clicks',async()=>{const b=browser('pagina02',{hidden:true,hiddenTarget:true,driver:true});await b.click();const p=b.sent[0].properties;assert.equal(p.page_visible,false);assert.equal(p.target_visible,false);assert.equal(p.automation_driver,true);});
test('keyboard click with no transient user activation is not rejected',async()=>{const b=browser('pagina03',{activation:false});await b.click();assert.equal(b.sent.length,1);assert.equal(b.sent[0].properties.interaction_trusted,true);});
test('repeated clicks of the same evidence signature are idempotent',async()=>{const b=browser('pagina04');await b.click();await b.click();assert.equal(b.sent.length,1);await b.click(false);assert.equal(b.sent.length,2);});
test('missing native session never produces invented checkout evidence',async()=>{const b=browser('raiox01',{noSession:true});await b.click();assert.equal(b.sent.length,0);});
test('QA mode is explicit and does not emit pixels',async()=>{const b=browser('raiox02',{test:true});await b.click();assert.equal(b.sent[0].test_mode,true);assert.equal(b.context.dataLayer,undefined);});
let handler;const rows=new Map();let sessionExists=true;
globalThis.Deno={env:{get:()=> 'test-only'},serve:fn=>{handler=fn;}};
globalThis.fetch=async(url,opts)=>{
 if(opts?.method!=='POST'&&String(url).includes('select=lancamento'))return Response.json(sessionExists?[{lancamento:'SERVER_TAG'}]:[]);
 if(String(url).endsWith('raiox_backup_begin'))return Response.json('backup-test');
 if(String(url).endsWith('raiox_backup_finish'))return Response.json(null);
 assert.match(String(url),/sales_page_events\?on_conflict=event_id$/);assert.equal(opts.headers.Prefer,'resolution=ignore-duplicates,return=representation');
 const row=JSON.parse(opts.body),old=rows.has(row.event_id);if(!old)rows.set(row.event_id,row);return Response.json(old?[]:[row]);
};
await import('../supabase/functions/sales-page-collect/index.ts');
const base=()=>({event_id:crypto.randomUUID(),session_id:crypto.randomUUID(),event_name:'checkout_click',page_id:'pagina01',source:'pagina01',lancamento:'TEST_ONLY',occurred_at:new Date().toISOString(),test_mode:true});
const request=(p,ua='Mozilla/5.0 Safari/604.1',origin='https://quiz.brunosimplicio.com.br')=>new Request('https://example.invalid',{method:'POST',headers:{origin,'content-type':'application/json','user-agent':ua},body:JSON.stringify(p)});
test('collector keeps the four raw page counts and test acknowledgements independent',async()=>{for(const page of ['pagina01','pagina02','pagina03','pagina04']){const p={...base(),page_id:page,source:page};const r=await handler(request(p));assert.equal(r.status,200);const ack=await r.json();assert.equal(ack.page_id,page);assert.equal(ack.test_mode,true);}});
test('duplicate event ids preserve the original evidence',async()=>{const p={...base(),properties:{quality_version:1,interaction_trusted:false}};await handler(request(p));const r=await handler(request({...p,properties:{quality_version:1,interaction_trusted:true}}));assert.equal((await r.json()).duplicate,true);assert.equal(rows.get(p.event_id).properties.interaction_trusted,false);});
test('booleans and CTA_01 are preserved, not string-coerced',async()=>{const p={...base(),properties:{cta_position:'cta_01',cta_index:1,quality_version:1,interaction_trusted:true,page_visible:true,target_visible:true,automation_driver:false}};await handler(request(p));assert.equal(rows.get(p.event_id).properties.cta_position,'cta_01');const q={...base(),properties:{quality_version:1,interaction_trusted:'true'}};await handler(request(q));assert.equal('interaction_trusted' in rows.get(q.event_id).properties,false);});
test('server does not accept browser bot scores or fabricated server verdicts',async()=>{const p={...base(),properties:{observed_bot_ua:true,bot_score:99,phone:'private'}};await handler(request(p));const v=rows.get(p.event_id).properties;assert.equal(v.observed_bot_ua,false);assert.equal('bot_score' in v,false);assert.equal('phone' in v,false);});
test('explicit bot UA is flagged without dropping the raw click',async()=>{const p=base();assert.equal((await handler(request(p,'HeadlessChrome/139'))).status,200);assert.equal(rows.get(p.event_id).properties.observed_bot_ua,true);});
test('Instagram is not rejected by network, platform or language',async()=>{const p=base();await handler(request(p,'Instagram 448.0 (iPhone; pt_BR) AppleWebKit/420+'));assert.equal(rows.get(p.event_id).properties.observed_bot_ua,false);});
test('invalid origin, mismatched page and invalid UUID are rejected',async()=>{const p=base();assert.equal((await handler(request(p,'normal','https://evil.invalid'))).status,403);assert.equal((await handler(request({...p,source:'pagina04'}))).status,400);assert.equal((await handler(request({...p,event_id:'invalid'}))).status,400);assert.equal(rows.has(p.event_id),false);});
test('quiz evidence uses native tag and cannot generate a new checkout',async()=>{for(const page of ['raiox01','raiox02']){const p={...base(),page_id:page,source:page,event_name:'cta_click',test_mode:false,properties:{quality_version:1,quality_evidence_only:true,cta_index:0}};assert.equal((await handler(request(p))).status,200);const row=rows.get(p.event_id);assert.equal(row.lancamento,'SERVER_TAG');assert.equal(row.page_type,'quiz');assert.equal(row.event_name,'cta_click');assert.equal((await handler(request({...p,event_id:crypto.randomUUID(),event_name:'checkout_click'}))).status,400);}});
test('unknown evidence session is retried, not fabricated',async()=>{sessionExists=false;const p={...base(),event_name:'cta_click',test_mode:false,properties:{quality_version:1,quality_evidence_only:true}};assert.equal((await handler(request(p))).status,409);assert.equal(rows.has(p.event_id),false);sessionExists=true;});
