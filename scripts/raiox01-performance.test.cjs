'use strict';
// All requests are fulfilled locally. No request reaches Supabase, GTM, Meta or checkout.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.RX_CANDIDATE_ROOT||'.');
const baseline=path.resolve(process.env.RX_BASELINE_ROOT||'/tmp/rx01-baseline');
const read=(r,p)=>fs.readFileSync(path.join(r,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const results={checks:[],journeys:[],network_mode:'all requests intercepted; zero production writes'};
function check(name,fn){fn();results.checks.push(name);}
const html=read(root,'raiox01/index.html'),js=read(root,'raiox01/raiox01.js'),oldHtml=read(baseline,'raiox01/index.html'),oldJs=read(baseline,'raiox01/raiox01.js');
check('tracking, config, original styles, original hero, quality and both collectors unchanged',()=>{
 for(const p of ['raiox01/rx-tracking.js','raiox01/rx-config.js','raiox01/base.css','raiox01/raiox01.css','raiox01/rx-privacy.css','raiox01/raio-x-hero-wide.webp','scripts/checkout-quality.js','supabase/functions/raiox01-collect/index.ts','supabase/functions/raiox02-collect/index.ts','raiox02/index.html','raiox02/raiox02.js','raiox02/rx-tracking.js']) assert.equal(sha(fs.readFileSync(path.join(root,p))),sha(fs.readFileSync(path.join(baseline,p))),p);
});
check('operational save, completion, video binding and checkout functions unchanged',()=>{
 for(const [a,b] of [['async function handleLeadSubmit','function validateLead'],['async function answerStep','let completionInFlight'],['async function renderLoading','function renderResult'],['function renderResult','function getVslProfile'],['function buildCheckoutUrl','function escapeHtml']]){const span=s=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));assert.equal(span(js),span(oldJs),a);}
});
check('complete ordered CSS without import or removed rules',()=>{const expected=read(root,'raiox01/base.css')+'\n'+read(root,'raiox01/raiox01.css').replace('@import url("./base.css?v=4");','')+'\n'+read(root,'raiox01/rx-privacy.css');assert.equal(read(root,'raiox01/raiox01.bundle.css'),'/* Same rules and cascade: base, page, privacy. */\n'+expected);assert.ok(!expected.includes('@import'));});
check('GTM container, bootstrap code, noscript and Google Fonts unchanged',()=>{const code=oldHtml.match(/<script>(\(function\(w,d,s,l,i\)[\s\S]*?'GTM-MZBZ9HCS'\);)<\/script>/)[1];assert.ok(read(root,'raiox01/gtm-bootstrap.js').includes(code));assert.equal(html.match(/<noscript>[\s\S]*?<\/noscript>/)[0],oldHtml.match(/<noscript>[\s\S]*?<\/noscript>/)[0]);assert.equal(html.match(/<link href="https:\/\/fonts.googleapis.com[^>]+>/)[0],oldHtml.match(/<link href="https:\/\/fonts.googleapis.com[^>]+>/)[0]);});
check('ordered defer, eager responsive hero and no opening video downloads',()=>{const files=[...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)].map(m=>({tag:m[0],src:m[1]}));assert.deepEqual(files.map(f=>f.src.split('?')[0]),['./rx-config.js','./rx-tracking.js','./gtm-bootstrap.js','./raiox01.js','/scripts/checkout-quality.js']);assert.ok(files.every(f=>f.tag.includes('defer')));assert.ok(html.includes('imagesrcset=')&&html.includes('loading="eager"'));assert.equal([...html.matchAll(/<link rel="preload"[^>]*converteai/g)].length,0);for(const width of [640,960,1200])assert.ok(fs.statSync(path.join(root,`raiox01/raio-x-hero-${width}.webp`)).size<164326);});

const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
const stageIds=['profile','body_reading','insight_body','desired_reading','face_reading','insight_face','consequence'];
async function session(browser,dir,width,settings={}){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:2,isMobile:width<600,hasTouch:width<600,javaScriptEnabled:settings.noJS!==true,serviceWorkers:'block'});
 const packets=[],stored=[],gets=[],errors=[];let fail=settings.failAnswer?1:0;
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(req.method()==='POST'&&url.hostname==='nklqcamhkwqictdmictb.supabase.co'&&url.pathname.endsWith('/raiox01-collect')){
   const p=req.postDataJSON();packets.push(p);
   if(fail&&p.event_name==='quiz_answer'){fail--;return route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({ok:false,stored:false,code:'test_rejection'})});}
   stored.push(p);
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,stored:true,event_id:p.event_id,test_mode:p.test_mode,session_token:'33333333-3333-4333-8333-333333333333',lead_created:p.event_name==='lead_submit',quiz_status:{finalizou:p.event_name==='quiz_complete',status:p.event_name==='quiz_complete'?'concluido':'em_andamento',perguntas_respondidas:5,etapas_concluidas:7}})});
  }
  if(req.method()==='GET'&&url.hostname==='quiz.brunosimplicio.com.br'){
   let file=decodeURIComponent(url.pathname);if(file.endsWith('/'))file+='index.html';file=path.resolve(dir,'.'+file);
   if(!file.startsWith(dir+path.sep))throw Error('Unsafe fixture path');
   gets.push(url.pathname);
   if(settings.delayApp&&url.pathname==='/raiox01/raiox01.js')await new Promise(r=>setTimeout(r,settings.delayApp));
   if(fs.existsSync(file))return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
   return route.fulfill({status:204});
  }
  // No fallback to network, including pixels, GTM, video, font CDN and checkout.
  return route.fulfill({status:200,contentType:url.pathname.endsWith('.css')?'text/css':'application/javascript',body:''});
 });
 if(!settings.noJS)await context.addInitScript(()=>{const original=setTimeout;window.__ctaTimers=[];window.setTimeout=function(fn,ms,...args){if(ms===60000){window.__ctaTimers.push({fn,args,ms});return 0;}return original(fn,ms,...args);};});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 return {context,page,packets,stored,gets,errors};
}
const url='https://quiz.brunosimplicio.com.br/raiox01/?rx_test=1&utm_source=qa&utm_medium=test&utm_campaign=preserve&sck=original';
async function finishJourney(s,from=0){
 for(let i=from;i<7;i++){
  await s.page.waitForFunction(i=>state.screen==='step'&&state.stepIndex===i,i);
  if(i===2||i===5)await s.page.locator('#continue-button').evaluate(b=>b.click());
  else await s.page.locator('.option').nth(i%4).evaluate(b=>b.click());
 }
 await s.page.locator('#checkout-button').waitFor({state:'attached'});
 assert.equal(await s.page.locator('#checkout-button').isVisible(),false,'Original CTA delay must be preserved');
 assert.equal(await s.page.evaluate(()=>window.__ctaTimers[0].ms),60000);
 await s.page.evaluate(()=>window.__ctaTimers.splice(0).forEach(t=>t.fn(...t.args)));
 assert.equal(await s.page.locator('#checkout-button').isVisible(),true);
 const href=await s.page.locator('#checkout-button').getAttribute('href');const target=new URL(href);
 assert.equal(target.hostname,'pay.hub.la');assert.equal(target.searchParams.get('utm_source'),'qa');assert.equal(target.searchParams.get('src'),'quiz_raiox01');assert.ok(target.searchParams.get('sck').startsWith('original~rx01test_'));assert.ok(target.searchParams.get('utm_content').includes('pg_raiox01'));
 // Prevent navigation only inside this test while exercising the original click listeners.
 await s.page.locator('#checkout-button').evaluate(b=>b.addEventListener('click',e=>e.preventDefault()));
 await s.page.locator('#checkout-button').evaluate(b=>b.click());
 await s.page.waitForTimeout(100);
 assert.equal(s.stored.filter(p=>p.event_name==='quiz_answer').length,5);
 assert.equal(s.stored.filter(p=>p.event_name==='quiz_insight_continue').length,2);
 assert.equal(s.stored.filter(p=>p.event_name==='quiz_complete').length,1);
 assert.equal(s.stored.filter(p=>p.event_name==='rx_checkout_click').length,1);
 assert.ok(s.packets.every(p=>p.test_mode===true&&p.source==='quiz_raiox01'&&p.lancamento==='raiox01_2026_09'));
 assert.equal(new Set(s.stored.map(p=>p.event_id)).size,s.stored.length);
 assert.equal(s.errors.length,0,s.errors.join('\n'));
 return {href,answers:s.stored.filter(p=>p.event_name==='quiz_answer').map(p=>p.properties),events:s.stored.map(p=>p.event_name),state:await s.page.evaluate(()=>({screen:state.screen,completedSteps:state.completedSteps,answerIndexes:state.answerIndexes}))};
}
async function fillLead(s){await s.page.locator('#name').fill('Teste Isolado');await s.page.locator('#email').fill('qa@example.invalid');await s.page.locator('#phone').fill('+5511999998888');await s.page.locator('#lead-form button[type=submit]').evaluate(b=>b.click());await s.page.locator('.option').first().waitFor();}
(async()=>{
 const bin=require('@sparticuz/chromium');
 const browser=await chromium.launch({executablePath:await bin.executablePath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']});
 try{
  for(const width of [390,1365]){
   const outcomes=[];
   for(const [name,dir] of [['baseline',baseline],['candidate',root]]){
    const s=await session(browser,dir,width);await s.page.goto(url,{waitUntil:'domcontentloaded'});await s.page.locator('#start-button').waitFor();
    const intro=await s.page.locator('#quiz-root').innerText();
    const box=await s.page.locator('.raiox-hero-visual').boundingBox();
    const image=await s.page.locator('.raiox-hero-visual img').evaluate(i=>({src:i.currentSrc,complete:i.complete,width:i.clientWidth}));
    await s.page.locator('#start-button').evaluate(b=>b.click());await fillLead(s);const result=await finishJourney(s);
    outcomes.push({intro,box,result});results.journeys.push({name,width,image,event_count:s.stored.length,answers:5,errors:s.errors});await s.context.close();
   }
   assert.equal(outcomes[0].intro,outcomes[1].intro,'Opening copy preserved');
   for(const k of ['x','y','width','height'])assert.ok(Math.abs(outcomes[0].box[k]-outcomes[1].box[k])<1,'Opening geometry '+k);
   assert.deepEqual(outcomes[0].result.answers,outcomes[1].result.answers,'Answer payloads preserved');assert.deepEqual(outcomes[0].result.state,outcomes[1].result.state,'Completion state preserved');
   assert.deepEqual(outcomes[0].result.events,outcomes[1].result.events,'Event names and order preserved');
   results.checks.push('full desktop/mobile journey and event parity '+width);
  }
  const nojs=await session(browser,root,390,{noJS:true});await nojs.page.goto(url);assert.ok((await nojs.page.locator('.opening-title').innerText()).includes('VOU TE ENSINAR'));assert.ok(await nojs.page.locator('#start-button').isVisible());assert.equal(nojs.packets.length,0);await nojs.context.close();results.checks.push('opening visible before JavaScript');
  const early=await session(browser,root,390,{delayApp:700});const nav=early.page.goto(url,{waitUntil:'domcontentloaded'});await early.page.locator('#start-button').waitFor();await early.page.locator('#start-button').evaluate(b=>b.click());await nav;await early.page.locator('#lead-form').waitFor();assert.equal(early.stored.filter(p=>p.event_name==='quiz_start').length,1);await early.context.close();results.checks.push('early start click not lost or duplicated');
  const retry=await session(browser,root,390,{failAnswer:true});await retry.page.goto(url);await retry.page.locator('#start-button').evaluate(b=>b.click());await fillLead(retry);await retry.page.locator('.option').first().evaluate(b=>b.click());await retry.page.locator('#quiz-save-error').waitFor();assert.equal(await retry.page.evaluate(()=>state.stepIndex),0);const failed=retry.packets.find(p=>p.event_name==='quiz_answer');const result=await finishJourney(retry);assert.equal(retry.stored.find(p=>p.event_name==='quiz_answer').event_id,failed.event_id);await retry.context.close();results.checks.push('failed save stays on step, retry preserves event ID');
  const resume=await session(browser,root,390);await resume.page.goto(url);await resume.page.locator('#start-button').evaluate(b=>b.click());await fillLead(resume);for(let i=0;i<2;i++){await resume.page.waitForFunction(i=>state.stepIndex===i,i);await resume.page.locator('.option').nth(i%4).evaluate(b=>b.click());}await resume.page.waitForFunction(()=>state.stepIndex===2);const sid=await resume.page.evaluate(()=>RX.getSessionId());await resume.page.reload();assert.equal(await resume.page.evaluate(()=>RX.getSessionId()),sid);assert.equal(await resume.page.evaluate(()=>state.stepIndex),2);await finishJourney(resume,2);assert.equal(resume.stored.filter(p=>p.event_name==='lead_submit').length,1);await resume.context.close();results.checks.push('reload resumes same session and saved answers without another lead');
  console.log(JSON.stringify(results,null,2));
  if(process.env.RX_RESULT_PATH)fs.writeFileSync(process.env.RX_RESULT_PATH,JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
