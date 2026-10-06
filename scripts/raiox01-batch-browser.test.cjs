'use strict';
// Exercise the existing complete browser suite rather than weakening its assertions.
// All page/collector/third-party requests are intercepted; no production writes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file=path.resolve('scripts/raiox01-performance.test.cjs');
let source=fs.readFileSync(file,'utf8');
const mode=process.env.RX_BATCH_SCENARIO||'normal';
if(!['normal','lost-ack','production-envelope'].includes(mode))throw Error('Unknown scenario');
const replace=(a,b)=>{if(!source.includes(a))throw Error('Test fixture changed: '+a.slice(0,70));source=source.replace(a,b);};
replace('const packets=[],stored=[],gets=[],errors=[];let fail=settings.failAnswer?1:0;',
 `const packets=[],stored=[],gets=[],errors=[];let fail=settings.failAnswer?1:0,requests=0,lost=false;`);
replace("  if(req.method()==='POST'&&url.hostname==='nklqcamhkwqictdmictb.supabase.co'&&url.pathname.endsWith('/raiox01-collect')){",`
  if(req.method()==='POST'&&url.hostname==='nklqcamhkwqictdmictb.supabase.co'&&url.pathname.endsWith('/raiox01-collect-batch')){
   requests++; const p=req.postDataJSON(); const events=p.events; packets.push(...events);
   assert.equal(p.batch_version,'rx01-batch-v1');assert.ok(events.length>=2&&events.length<=8);
   assert.ok(Buffer.byteLength(JSON.stringify(p))<=24000);
   assert.ok(events.every((e,i)=>e.session_id===p.session_id&&e.test_mode===p.test_mode&&(!i||e.sequence>events[i-1].sequence)));
   if(fail&&events.some(e=>e.event_name==='quiz_answer'))return route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({ok:false,stored:false,atomic:true,rolled_back:true,code:'test_rejection'})});
   const receipts=events.map(e=>({ok:true,stored:true,event_id:e.event_id,test_mode:e.test_mode,session_token:'33333333-3333-4333-8333-333333333333',lead_created:e.event_name==='lead_submit',duplicate:stored.some(x=>x.event_id===e.event_id)}));
   for(const e of events)if(!stored.some(x=>x.event_id===e.event_id))stored.push(e);
   if(${JSON.stringify(mode)}==='lost-ack'&&!lost){lost=true;return route.abort('failed');}
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,stored:true,atomic:true,batch_version:'rx01-batch-v1',event_ids:events.map(e=>e.event_id),receipts,session_token:'33333333-3333-4333-8333-333333333333',test_mode:p.test_mode,quiz_status:{finalizou:stored.some(e=>e.event_name==='quiz_complete'),status:stored.some(e=>e.event_name==='quiz_complete')?'concluido':'em_andamento',perguntas_respondidas:5,etapas_concluidas:7}})});
  }
  if(req.method()==='POST'&&url.hostname==='nklqcamhkwqictdmictb.supabase.co'&&url.pathname.endsWith('/raiox01-collect')){
   requests++;`);
replace('   stored.push(p);',"   if(!stored.some(x=>x.event_id===p.event_id))stored.push(p);");
replace('return {context,page,packets,stored,gets,errors};','return {context,page,packets,stored,gets,errors,rpcCount:()=>requests};');
replace('rx_test=1&utm_source','rx_test=1&rx_batch=1&utm_source');
replace('event_count:s.stored.length,answers:5,errors:s.errors','event_count:s.stored.length,requests:s.rpcCount(),answers:5,errors:s.errors');
replace('const results={checks:[],journeys:[],',`const results={scenario:${JSON.stringify(mode)},checks:[],journeys:[],`);
if(mode==='production-envelope'){
 source=source.replace('rx_test=1&rx_batch=1','rx_test=0&rx_batch=1').replace("'original~rx01test_'","'original~rx01_'").replace('p.test_mode===true&&','p.test_mode===false&&');
 replace('if(fs.existsSync(file))return route.fulfill(',`if(url.pathname==='/raiox01/rx-batch.js'&&fs.existsSync(file))return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(file,'utf8').replace('enabled: false, percent: 0','enabled: true, percent: 5')});
   if(fs.existsSync(file))return route.fulfill(`);
 replace('const page=await context.newPage();',`await context.addInitScript(()=>{let first=true;const original=crypto.randomUUID.bind(crypto);crypto.randomUUID=()=>{if(first){first=false;return '00000001-1111-4111-8111-111111111111';}return original();};});
 const page=await context.newPage();`);
 replace('outcomes.push({intro,box,result});',`const dl=await s.page.evaluate(()=>dataLayer.filter(e=>e.event==='rx_event').map(e=>({name:e.rx.name,traffic:e.rx.traffic})));outcomes.push({intro,box,result,dl});`);
 replace("assert.equal(outcomes[0].intro,outcomes[1].intro,'Opening copy preserved');",`assert.deepEqual(outcomes[0].dl,outcomes[1].dl,'Production analytics names and attribution must match');assert.equal(outcomes[0].intro,outcomes[1].intro,'Opening copy preserved');`);
}
const temp=path.resolve('scripts/.raiox01-batch-browser.generated.cjs');
try{fs.writeFileSync(temp,source);cp.execFileSync(process.execPath,[temp],{stdio:'inherit',env:process.env});}
finally{fs.rmSync(temp,{force:true});}
