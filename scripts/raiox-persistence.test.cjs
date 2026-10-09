'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ack = () => ({ok:true,stored:true,quiz_status:{finalizou:true,status:'concluido',perguntas_respondidas:5,etapas_concluidas:7}});
function deferred(){ let resolve,reject; const promise=new Promise((r,j)=>{resolve=r;reject=j;}); return {promise,resolve,reject}; }
const tick = () => new Promise(resolve=>setImmediate(resolve));
function node(){return {disabled:false,hidden:false,textContent:'Continuar',dataset:{},innerHTML:'',listeners:{},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){},remove(){},appendChild(){},addEventListener(name,fn){this.listeners[name]=fn;}};}
function harness(page,checkpoint=null){
  const root=node(),error=node(),saveError=node(),retry=node(),button=node(),continueButton=node();
  const options=[node(),node(),node(),node()],inputs=[node(),node(),node()];
  const values={name:'Teste Integridade',email:'integridade@example.invalid',phone:'+5511999999999',company_website:''};
  const form={values,querySelector:()=>button,querySelectorAll:()=>inputs};
  const events=[],writes=[],checkpoints=[],screens=[],storage=new Map();
  const RX={getAttribution:()=>({utm_source:'test'}),getSessionId:()=> '00000000-0000-4000-8000-000000000001',getCheckpoint:()=>checkpoint,
    getTestMode:()=>false,setContext(){},normalizePhone:v=>String(v||''),emit:(name,details)=>{events.push({name,details});return Promise.resolve(ack());},
    saveCheckpoint:x=>checkpoints.push(JSON.parse(JSON.stringify(x))),
    saveLead:async(lead,honey)=>{writes.push({name:'lead_submit'});if(honey)throw new Error('invalid_form');return ack();},
    saveProgress:async(name,details)=>{writes.push({name,details});return ack();}};
  const doc={querySelector:selector=>({'#quiz-root':root,'#progress-label':node(),'#form-error':error,'#quiz-save-error':saveError,'#quiz-save-retry':retry,'#continue-button':continueButton,'.panel-inner':node()}[selector]||null),
    querySelectorAll:selector=>selector==='.option'?options:[],createElement:()=>node(),addEventListener(){},head:node()};
  const win={RX,RX_CONFIG:{webhookUrl:'https://example.invalid/collect'},addEventListener(){},removeEventListener(){},scrollTo(){},setTimeout,clearTimeout};
  const context=vm.createContext({window:win,document:doc,RX,RX_CONFIG:win.RX_CONFIG,URL,URLSearchParams,console,setTimeout,clearTimeout,
    sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null},
    FormData:class{constructor(f){this.values={...f.values};}get(k){return this.values[k]??null;}},
    testEvent:{preventDefault(){},currentTarget:form},testButton:options[0],screens});
  let source=fs.readFileSync(`${page}/${page}.js`,'utf8');
  assert(/\brender\(\);\s*$/.test(source));
  source=source.replace(/\brender\(\);\s*$/,'');
  vm.runInContext(source,context,{filename:`${page}.js`});
  vm.runInContext('render = () => { screens.push(state.screen); };',context);
  const run=code=>vm.runInContext(code,context);
  return {run,RX,events,writes,checkpoints,screens,values,form,button,options,inputs,error,retry,continueButton,storage};
}
for(const page of ['raiox01','raiox02']){
  test(`${page}: registration waits for a positive ACK and rejects double submit`,async()=>{
    const h=harness(page),d=deferred();let calls=0;
    h.RX.saveLead=()=>{calls++;return d.promise;};
    const pending=h.run('handleLeadSubmit(testEvent)');await tick();
    assert.equal(h.run('state.screen'),'opening');assert.equal(h.run('state.leadSaved'),false);
    assert.equal(h.button.disabled,true);assert(h.inputs.every(x=>x.disabled));
    await h.run('handleLeadSubmit(testEvent)');assert.equal(calls,1);
    assert(!h.events.some(x=>x.name==='quiz_start'));assert.equal(h.storage.size,0);
    d.resolve(ack());await pending;
    assert.equal(h.run('state.screen'),'step');assert.equal(h.run('state.leadSaved'),true);
    assert.equal(h.button.disabled,false);assert(h.inputs.every(x=>!x.disabled));
    assert.equal(h.checkpoints.at(-1).completedSteps.length,0);
  });
  test(`${page}: failed registration stays filled and manual retry succeeds`,async()=>{
    const h=harness(page);h.RX.saveLead=async()=>{throw new Error('network');};
    await h.run('handleLeadSubmit(testEvent)');
    assert.equal(h.run('state.screen'),'opening');assert.equal(h.run('state.leadSaved'),false);
    assert.equal(h.values.email,'integridade@example.invalid');assert.equal(h.button.disabled,false);
    assert(h.error.textContent.includes('Não conseguimos salvar'));
    assert(h.events.some(x=>x.name==='rx_form_submit_error'));
    h.RX.saveLead=async()=>ack();await h.run('handleLeadSubmit(testEvent)');
    assert.equal(h.run('state.screen'),'step');
  });
  test(`${page}: a non-confirming ACK cannot count as a saved lead`,async()=>{
    const h=harness(page);h.RX.saveLead=async()=>({ok:true,stored:false});
    await h.run('handleLeadSubmit(testEvent)');
    assert.equal(h.run('state.leadSaved'),false);assert.equal(h.checkpoints.length,0);
    assert.equal(h.run('state.screen'),'opening');
  });
  test(`${page}: honeypot no longer silently advances and is never bypassed`,async()=>{
    const h=harness(page);h.values.company_website='autofilled';
    await h.run('handleLeadSubmit(testEvent)');
    assert.equal(h.run('state.screen'),'opening');assert.equal(h.run('state.leadSaved'),false);
    assert(h.events.some(x=>x.name==='rx_form_submit_error'&&x.details.error_code==='invalid_form'));
    h.values.company_website='';await h.run('handleLeadSubmit(testEvent)');
    assert.equal(h.run('state.screen'),'step');
  });
  test(`${page}: answer waits, duplicate click is ignored, and step event follows ACK`,async()=>{
    const h=harness(page),d=deferred();let calls=0;
    h.run('state.screen="step";state.leadSaved=true;');
    h.RX.saveProgress=()=>{calls++;return d.promise;};
    const pending=h.run('answerStep(STEPS[0],0,testButton)');await tick();
    assert.equal(h.run('state.stepIndex'),0);assert.equal(h.run('state.completedSteps.length'),0);
    await h.run('answerStep(STEPS[0],0,testButton)');assert.equal(calls,1);
    assert(!h.events.some(x=>x.name==='quiz_step_complete'));
    d.resolve(ack());await pending;
    assert.equal(h.run('state.stepIndex'),1);assert.equal(h.run('state.answerIndexes.profile'),0);
    assert.equal(h.events.filter(x=>x.name==='quiz_step_complete').length,1);
    assert.equal(h.checkpoints.at(-1).stepIndex,1);
  });
  test(`${page}: answer failure does not advance or checkpoint unacknowledged data`,async()=>{
    const h=harness(page);h.run('state.screen="step";state.leadSaved=true;');
    h.RX.saveProgress=async()=>{throw new Error('timeout');};
    await h.run('answerStep(STEPS[0],0,testButton)');
    assert.equal(h.run('state.stepIndex'),0);assert.equal(h.checkpoints.length,0);
    assert.equal(h.run('Object.keys(state.answerIndexes).length'),0);assert.equal(h.options[0].disabled,false);
    h.RX.saveProgress=async()=>ack();await h.run('answerStep(STEPS[0],0,testButton)');
    assert.equal(h.run('state.stepIndex'),1);
  });
  test(`${page}: no answer is sent without a confirmed registration`,async()=>{
    const h=harness(page);h.run('state.screen="step";state.leadSaved=false;');
    await h.run('answerStep(STEPS[0],0,testButton)');
    assert.equal(h.writes.length,0);assert.equal(h.run('state.stepIndex'),0);
  });
  test(`${page}: insight confirmation waits for persistence`,async()=>{
    const h=harness(page),d=deferred();
    h.run('state.screen="step";state.leadSaved=true;state.stepIndex=2;state.completedSteps=["profile","body_reading"];renderInsight(STEPS[2],40);');
    h.RX.saveProgress=()=>d.promise;
    const pending=h.continueButton.listeners.click();await tick();
    assert.equal(h.run('state.stepIndex'),2);d.resolve(ack());await pending;
    assert.equal(h.run('state.stepIndex'),3);assert.equal(h.checkpoints.at(-1).completedSteps.length,3);
  });
  test(`${page}: result and checkout stay unavailable until final confirmation`,async()=>{
    const h=harness(page),d=deferred();
    h.run('state.screen="loading";state.leadSaved=true;state.completedSteps=STEPS.map(s=>s.id);for(const s of STEPS.filter(s=>s.type==="question"))state.answerIndexes[s.id]=0;');
    h.RX.saveProgress=()=>d.promise;
    const pending=h.run('finalizeQuizInBackground()');await tick();
    assert.equal(h.run('state.screen'),'loading');assert(!h.screens.includes('result'));
    d.resolve(ack());await pending;
    assert.equal(h.run('state.screen'),'result');assert.equal(h.checkpoints.at(-1).screen,'result');
  });
  test(`${page}: incomplete backend totals reject completion and allow retry`,async()=>{
    const h=harness(page);h.run('state.screen="loading";state.leadSaved=true;state.completedSteps=STEPS.map(s=>s.id);for(const s of STEPS.filter(s=>s.type==="question"))state.answerIndexes[s.id]=0;');
    h.RX.saveProgress=async()=>({ok:true,stored:true,quiz_status:{finalizou:true,status:'concluido',perguntas_respondidas:4,etapas_concluidas:6}});
    await h.run('finalizeQuizInBackground()');assert.equal(h.run('state.screen'),'loading');
    assert.equal(h.retry.hidden,false);assert.equal(h.retry.disabled,false);assert.equal(h.checkpoints.length,0);
    h.RX.saveProgress=async()=>ack();await h.run('finalizeQuizInBackground()');assert.equal(h.run('state.screen'),'result');
  });
  test(`${page}: full resumed session must revalidate its snapshot`,()=>{
    const cp={leadSaved:true,screen:'result',completedSteps:['profile','body_reading','insight_body','desired_reading','face_reading','insight_face','consequence'],answerIndexes:{profile:0,body_reading:0,desired_reading:0,face_reading:0,consequence:0}};
    const h=harness(page,cp);assert.equal(h.run('state.screen'),'loading');assert.equal(h.run('state.completedSteps.length'),7);
  });
  test(`${page}: complete journey persists lead, five answers, two insights, completion in order`,async()=>{
    const h=harness(page);await h.run('handleLeadSubmit(testEvent)');
    for(let i=0;i<7;i++){
      for(const b of h.options)b.disabled=false;h.continueButton.disabled=false;
      if(h.run(`STEPS[${i}].type`)==='question')await h.run(`answerStep(STEPS[${i}],0,testButton)`);
      else{h.run(`renderInsight(STEPS[${i}],50)`);await h.continueButton.listeners.click();}
    }
    assert.equal(h.run('state.screen'),'loading');await h.run('finalizeQuizInBackground()');
    assert.deepEqual(h.writes.map(x=>x.name),['lead_submit','quiz_answer','quiz_answer','quiz_insight_continue','quiz_answer','quiz_answer','quiz_insight_continue','quiz_answer','quiz_complete']);
    assert.equal(h.writes.at(-1).details.answers.length,5);assert.equal(h.writes.at(-1).details.completed_steps.length,7);
    assert.equal(h.run('state.screen'),'result');
  });
}
