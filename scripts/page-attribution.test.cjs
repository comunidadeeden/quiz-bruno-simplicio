const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pages=['pagina01','pagina02','pagina03','pagina04','paginabio','vsl01v1','raioxvsl1'];
(async()=>{
const result=[];
for(const page of pages){
 const sent=[],data=new Map(),session=new Map(),handlers={};
 class Element{constructor(href){this.href=href;this.dataset={};this.textContent='CTA';this.id='';this.classList={contains:()=>false};}getBoundingClientRect(){return {width:100,height:40};}getAttribute(){return null;}closest(s){return s==='a[href]'?this:null;}}
 const html=fs.readFileSync(root+'/'+page+'/index.html','utf8');
 const hrefs=[...html.matchAll(/<a\b[^>]*href=["'](https:\/\/pay\.(?:hub\.la|hotmart\.com)\/[^"']+)["']/g)].map(m=>m[1].replace(/&amp;/g,'&'));
 const links=hrefs.map(h=>new Element(h));
 const add=(name,fn)=>{(handlers[name]??=[]).push(fn)};
 const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)});
 const search='?utm_source=meta&utm_campaign=BS06OUT2026&utm_content=creative123&sck=ad123&src=facebook';
 const document={visibilityState:'visible',referrer:'',querySelectorAll:s=>s==='a[href]'?links:[],addEventListener:add};
 const ctx={document,location:{pathname:'/'+page+'/',search,href:'https://quiz.brunosimplicio.com.br/'+page+'/'+search},navigator:{webdriver:true,userActivation:{hasBeenActive:false}},performance:{now:()=>1000},crypto,URL,URLSearchParams,AbortController,Element,HTMLElement:Element,sessionStorage:storage(session),localStorage:storage(data),getComputedStyle:()=>({display:'block',visibility:'visible'}),setTimeout,clearTimeout,console,addEventListener:add,fetch:async(u,o)=>{let p=JSON.parse(o.body);sent.push(p);return {ok:true,status:200,json:async()=>({ok:true,stored:true,event_id:p.event_id})}}};ctx.window=ctx;
 const file=/pagina0[2-4]/.test(page)?'scripts/sales-page-tracking.js':page+'/tracking.js';
 vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx);
 await new Promise(setImmediate);
 const urls=links.map(l=>new URL(l.href));
 assert.ok(urls.length>0,page);
 assert.ok(urls.every(u=>u.searchParams.get('src')===page),page+' src');
 assert.ok(urls.every(u=>u.searchParams.get('utm_content')===('creative123~pg_'+page)),page+' utm');
 assert.ok(urls.every(u=>new RegExp('^ad123~'+page+'_[a-f0-9]{32}$').test(u.searchParams.get('sck'))),page+' sck');
 for(const f of handlers.click||[])f({target:links[0],isTrusted:false});
 await new Promise(setImmediate);
 assert.equal(sent.find(e=>e.event_name==='checkout_click')?.properties.value,page.includes('vsl')?37:47,page+' checkout value');
 const rx=ctx.dataLayer.filter(e=>e.event==='rx_event');
 assert.ok(rx.length>0);
 assert.ok(rx.every(e=>e.rx.params.session_id===sent[0].session_id),page+' GTM session');
 result.push({page,provider:urls[0].hostname,ctas:urls.length,src:urls[0].searchParams.get('src'),utm_content:urls[0].searchParams.get('utm_content'),sck_has_session:true,session_available_to_gtm:rx.every(e=>e.rx.params.session_id===sent[0].session_id),price:sent.find(e=>e.event_name==='checkout_click')?.properties.value,events:[...new Set(sent.map(e=>e.event_name))]});
}
for(const page of ['raiox01','raiox02','raiox03']){
 const code=fs.readFileSync(root+'/'+page+'/'+page+'.js','utf8');
 const f=code.slice(code.indexOf('function buildCheckoutUrl()'),code.indexOf('\n}',code.indexOf('function buildCheckoutUrl()'))+2);
 const attr={src:'facebook',utm_content:'creative123'};
 const tracking=fs.readFileSync(root+'/'+page+'/rx-tracking.js','utf8');
 const sckCode=tracking.slice(tracking.indexOf('  function checkoutSck('),tracking.indexOf("\n  w.addEventListener('pagehide'",tracking.indexOf('  function checkoutSck(')));
 const sckContext={cfg:{testMode:false},sessionId:'12345678-1234-4234-8123-123456789012'};vm.runInNewContext(sckCode,sckContext);
 const ctx={URL,getCheckoutPrefill:()=>null,RAIOX_CONFIG:{checkoutUrl:'https://pay.hub.la/XhmUngrBMRpSh984fDuG',source:'quiz_'+page},RX_CONFIG:{correlateCheckout:true},RX:{getAttribution:()=>attr,checkoutSck:sckContext.checkoutSck},state:{utms:{}}};
 vm.runInNewContext(f,ctx);const u=new URL(ctx.buildCheckoutUrl());
 assert.equal(u.searchParams.get('src'),'quiz_'+page,page+' must preserve its own source');
 assert.equal(u.searchParams.get('sck'),'rx'+page.slice(-2)+'_12345678123442348123123456789012',page+' checkout correlation');
 const publicCode=tracking.slice(tracking.indexOf('  const analyticKeys='),tracking.indexOf('  function payload('));
 const context={cfg:{testMode:false},sessionId:'12345678-1234-4234-8123-123456789012',dlSeen:new Set(),w:{dataLayer:[]},consent:{analytics:true,advertising:true},currentAttribution:()=>({}),safeText:v=>v,safeUrl:v=>v,location:{href:'https://quiz.brunosimplicio.com.br/'+page},d:{referrer:''}};
 vm.runInNewContext(publicCode,context);
 context.publicEvent('quiz_answer','event-1',{step_index:1,answer_value:'private answer',email:'private@example.test'});
 context.publicEvent('quiz_answer','event-1',{step_index:1});
 const publicEvents=context.w.dataLayer.filter(e=>e.event==='rx_event');
 assert.equal(publicEvents.length,1,page+' event dedup');
 assert.equal(publicEvents[0].rx.params.session_id,context.sessionId,page+' GTM session');
 assert.equal(publicEvents[0].rx.params.answer_value,undefined,page+' private answer');
 assert.equal(publicEvents[0].rx.params.email,undefined,page+' private email');
 result.push({page,session_available_to_gtm:true,src_with_inbound_facebook:u.searchParams.get('src'),utm_content:u.searchParams.get('utm_content'),sck:u.searchParams.get('sck')});
}
console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

