import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function browser(page,qa=false){
 const sent=[],windowHandlers={},docHandlers={},session=new Map(),local=new Map();
 const add=(bag)=>(name,fn)=>{(bag[name]??=[]).push(fn);};
 const storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)});
 class Element {dataset={};href='https://pay.hub.la/XhmUngrBMRpSh984fDuG';textContent='Garanta R$ 37';id='';classList={contains:()=>false};getAttribute(){return null;}getBoundingClientRect(){return {width:100,height:40};}closest(selector){return selector==='a[href]'?this:null;}}
 const link=new Element();
 const search='?utm_source=technical_test&utm_content=original&utm_campaign=BS06OUT2026'+(qa?'&rx_test=1':'');
 const document={visibilityState:'visible',referrer:'',querySelectorAll:sel=>sel==='a[href]'?[link]:[],addEventListener:add(docHandlers)};
 const context={document,location:{search,href:'https://quiz.brunosimplicio.com.br/'+page+'/'+search},navigator:{webdriver:true,userActivation:{hasBeenActive:false}},performance:{now:()=>1000},crypto,URL,URLSearchParams,AbortController,Element,HTMLElement:Element,sessionStorage:storage(session),localStorage:storage(local),getComputedStyle:()=>({display:'block',visibility:'visible'}),setTimeout,clearTimeout,console,addEventListener:add(windowHandlers),fetch:async(url,opts)=>{const p=JSON.parse(opts.body);sent.push(p);return {ok:true,status:200,json:async()=>({ok:true,stored:true,event_id:p.event_id})};}};
 context.window=context;vm.runInNewContext(fs.readFileSync(new URL(page+'/tracking.js',root),'utf8'),context);
 const emit=async(name,event={})=>{for(const fn of windowHandlers[name]||[])fn(event);await new Promise(setImmediate);};
 const emitDoc=async(name,event={})=>{for(const fn of docHandlers[name]||[])fn(event);await new Promise(setImmediate);};
 return {sent,context,link,local,session,emit,emitDoc};
}
for(const page of ['vsl01v1','raioxvsl1']) {
 test(page+': QA is isolated, stores once and emits no marketing events',async()=>{
  const b=browser(page,true);await new Promise(setImmediate);
  assert.equal(b.sent.length,1);assert.equal(b.sent[0].test_mode,true);assert.equal(b.context.dataLayer.length,0);
  assert.ok([...b.session.keys()].every(k=>k.endsWith('_test')));
  assert.deepEqual(JSON.parse([...b.local.values()][0]),[]);
 });
 test(page+': checkout preserves attribution, price and idempotency',async()=>{
  const b=browser(page);await new Promise(setImmediate);
  const u=new URL(b.link.href);assert.equal(u.searchParams.get('src'),page);assert.equal(u.searchParams.get('utm_content'),'original~pg_'+page);assert.match(u.searchParams.get('sck'),new RegExp('^'+page+'_[a-f0-9]{32}$'));
  await b.emitDoc('click',{target:b.link,isTrusted:false});await b.emitDoc('click',{target:b.link,isTrusted:false});
  const checks=b.sent.filter(x=>x.event_name==='checkout_click');assert.equal(checks.length,2);assert.equal(checks[0].event_id,checks[1].event_id);assert.equal(checks[0].properties.value,37);
  assert.ok(!b.sent.some(x=>/purchase/i.test(x.event_name)));
  const rx=b.context.dataLayer.filter(x=>x.event==='rx_event');assert.ok(rx.every(x=>x.rx.session_id===x.rx.params.session_id&&x.rx.session_id===b.sent[0].session_id));
 });
}
test('vsl01v1 maps desktop/mobile checkout copies to the same 10 logical CTAs',async()=>{
 const sent=[],windowHandlers={},docHandlers={},session=new Map(),local=new Map();
 const add=(bag)=>(name,fn)=>{(bag[name]??=[]).push(fn);};
 const storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)});
 class Element {dataset={};href='https://pay.hub.la/XhmUngrBMRpSh984fDuG';textContent='Garanta';id='';classList={contains:()=>false};getAttribute(){return null;}getBoundingClientRect(){return {width:100,height:40};}closest(selector){return selector==='a[href]'?this:null;}}
 const links=Array.from({length:20},()=>new Element());
 const document={visibilityState:'visible',referrer:'',querySelectorAll:sel=>sel==='a[href]'?links:[],addEventListener:add(docHandlers)};
 const context={document,location:{search:'',href:'https://quiz.brunosimplicio.com.br/vsl01v1/'},navigator:{webdriver:false,userActivation:{hasBeenActive:true}},performance:{now:()=>1000},crypto,URL,URLSearchParams,AbortController,Element,HTMLElement:Element,sessionStorage:storage(session),localStorage:storage(local),getComputedStyle:()=>({display:'block',visibility:'visible'}),setTimeout,clearTimeout,console,addEventListener:add(windowHandlers),fetch:async(url,opts)=>{const p=JSON.parse(opts.body);sent.push(p);return {ok:true,status:200,json:async()=>({ok:true,stored:true,event_id:p.event_id})};}};
 context.window=context;vm.runInNewContext(fs.readFileSync(new URL('vsl01v1/tracking.js',root),'utf8'),context);
 await new Promise(setImmediate);
 assert.deepEqual(links.slice(0,10).map(x=>x.dataset.vsl01v1Cta),['1','2','3','4','5','6','7','8','9','10']);
 assert.deepEqual(links.slice(10).map(x=>x.dataset.vsl01v1Cta),['1','2','3','4','5','6','7','8','9','10']);
 assert.ok(links.every(x=>x.dataset.rxSalesPageCtaTotal==='10'));
});

test('quiz emits steps, answers, stopped, abandoned and completed without legacy duplicate names',async()=>{
 const b=browser('raioxvsl1',true);
 for(const [name,properties] of [['quiz_started',{answers_count:0}],['quiz_step_view',{step_id:'perfil',step_index:2}],['quiz_answer',{step_id:'perfil',answer_value:'terapeuta',answers_count:1}],['quiz_answer',{step_id:'perfil',answer_value:'pessoal',answers_count:1}]]) await b.emit('raioxvsl1:quiz_event',{detail:{name,properties}});
 b.context.document.visibilityState='hidden';await b.emitDoc('visibilitychange');await b.emit('pagehide');
 assert.equal(b.sent.find(x=>x.event_name==='quiz_stopped').properties.answers_count,1);
 assert.equal(b.sent.filter(x=>x.event_name==='quiz_abandoned').length,1);
 await b.emit('raioxvsl1:quiz_event',{detail:{name:'quiz_completed',properties:{final_answers:{perfil:'pessoal'},answers_count:1}}});
 await b.emit('vsl:started');await b.emit('vsl:revealed');await b.emit('pagehide');
 assert.equal(b.sent.filter(x=>x.event_name==='quiz_abandoned').length,1);
 for(const n of ['quiz_started','quiz_step_view','quiz_answer','quiz_stopped','quiz_abandoned','quiz_completed','vsl_started','vsl_offer_revealed'])assert.ok(b.sent.some(x=>x.event_name===n),n);
});
for (const page of ['vsl01v1','raioxvsl1']) test(page+': VSL events are emitted once per session',async()=>{
 const b=browser(page);for(let i=0;i<2;i++){await b.emit('vsl:started');await b.emit('vsl:revealed');}
 for(const n of ['vsl_started','vsl_offer_revealed'])assert.equal(b.sent.filter(x=>x.event_name===n).length,1);
});
test('responsive local images exist, schedule is consistent and inline scripts compile',()=>{
 for(const page of ['vsl01v1','raioxvsl1']){
  const html=fs.readFileSync(new URL(page+'/index.html',root),'utf8');
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
  if(page==='raioxvsl1'){
   assert.ok(!/(?<![\w/])assets\//.test(html));assert.ok(!/6 e 7 de outubro/i.test(html));assert.ok(html.includes('AO VIVO · TERÇA E QUARTA · 20H'));
   assert.ok(!html.includes('raioxvsl1:vsl_started'));
   const paths=[...new Set(html.match(/\.\.\/vsl01v1\/(?:assets|fonts)\/[a-zA-Z0-9_.-]+/g))];
   for(const p of paths)assert.ok(fs.existsSync(new URL(page+'/'+p,root)),p);
  }
 }
});
