'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const base = path.resolve(__dirname, '..');
const candidate = fs.readFileSync(path.join(base, 'supabase/functions/raiox01-collect/index.ts'), 'utf8');
const baseline = process.env.RAIOX01_BASELINE_PATH ? fs.readFileSync(process.env.RAIOX01_BASELINE_PATH, 'utf8') : null;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const gate = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const body = { integration_version: 'raiox-v3.0', session_id: '11111111-1111-4111-8111-111111111111', event_id: '22222222-2222-4222-8222-222222222222', event_name: 'quiz_answer', test_mode: true, sequence: 7, occurred_at: new Date().toISOString(), source: 'quiz_raiox01', lancamento: 'raiox01_2026_09', properties: {question_id:'profile',option_index:0,answer_label:'Synthetic'}, context:{}, attribution:{} };
const ack = {ok:true,stored:true,event_id:body.event_id,session_token:'33333333-3333-4333-8333-333333333333',test_mode:true,quiz_status:{status:'em_andamento',perguntas_respondidas:1,etapas_concluidas:1}};
function harness(options = {}, old = false) {
  let handler;
  const calls = [], backgrounds = [];
  const sandbox = { Request, Response, Headers, TextEncoder, AbortSignal, DOMException, Date, performance, console, setTimeout, clearTimeout,
    Deno:{env:{get:n=>n==='SUPABASE_URL'?'https://test.invalid':'test-server-only-key'},serve:fn=>{handler=fn;}},
    fetch:async (url,opts)=>{
      const kind=url.split('/').at(-1);
      calls.push({kind,body:JSON.parse(opts.body),headers:opts.headers});
      if(kind==='raiox_backup_begin') {
        if(options.beginGate) await options.beginGate.promise;
        if(options.beginDelay) await delay(options.beginDelay);
        if(options.beginThrow) throw new Error('backup unavailable');
        if(options.beginStatus) return Response.json({}, {status:options.beginStatus});
        return Response.json('44444444-4444-4444-8444-444444444444');
      }
      if(kind==='raiox_backup_finish') {
        if(options.finishGate) await options.finishGate.promise;
        if(options.finishDelay) await delay(options.finishDelay);
        if(options.finishThrow) throw new Error('finish unavailable');
        return Response.json(true);
      }
      if(options.ingestGate) await options.ingestGate.promise;
      if(options.ingestDelay) await delay(options.ingestDelay);
      if(options.ingestTimeout) throw new DOMException('timeout','TimeoutError');
      if(options.invalidResponse) return new Response('not-json',{status:200});
      return Response.json(options.ack ?? ack, {status:options.ingestStatus ?? 200});
    },
  };
  if(options.runtime!=='missing') sandbox.EdgeRuntime={waitUntil:p=>{
    if(options.runtime==='throws') throw new Error('background runtime missing');
    backgrounds.push(p);
  }};
  vm.runInNewContext(stripTypeScriptTypes(old?baseline:candidate),sandbox,{filename:old?'baseline.ts':'candidate.ts'});
  const run = (payload=body, init={})=>handler(new Request('https://test.invalid/functions/v1/raiox01-collect',{
    method:init.method??'POST', headers:{origin:init.origin??'https://quiz.brunosimplicio.com.br','Content-Type':'application/json'},
    ...((init.method==='OPTIONS'||init.method==='GET')?{}:{body: typeof payload==='string'?payload:JSON.stringify(payload)}),
  }));
  return {run,calls,backgrounds};
}
function expectedResponse(options={},payload=body,init={}) {
  if(init.method==='GET') return [405,{ok:false,stored:false,code:'method_not_allowed'}];
  if(init.origin && !['https://bussoladacura.com.br','https://www.bussoladacura.com.br','https://quiz.brunosimplicio.com.br'].includes(init.origin)) return [403,{ok:false,stored:false,code:'origin_not_allowed'}];
  const raw=typeof payload==='string'?payload:JSON.stringify(payload);
  if(Buffer.byteLength(raw)>32768) return [413,{ok:false,stored:false,code:'payload_too_large'}];
  try { JSON.parse(raw); } catch { return [400,{ok:false,stored:false,code:'invalid_request'}]; }
  if(options.ingestTimeout) return [504,{ok:false,stored:false,code:'storage_timeout'}];
  if(options.invalidResponse) return [503,{ok:false,stored:false,code:'invalid_storage_response'}];
  const result=options.ack??ack;
  if((options.ingestStatus??200)>=400) return [options.ingestStatus,result];
  return [Number(result.http_status)||200,{protocol:result.protocol||'rx01-20260925',integration_version:result.integration_version||'raiox-v3.0',...result}];
}
async function sameResponse(options={},payload=body,init={}) {
  const b=harness(options),rb=await b.run(payload,init),result=await rb.json();
  const [status,expected]=expectedResponse(options,payload,init);
  assert.equal(rb.status,status);assert.deepEqual(result,expected);
  if(baseline){const a=harness(options,true),ra=await a.run(payload,init);assert.equal(rb.status,ra.status);assert.deepEqual(result,await ra.json());}
  await Promise.all(b.backgrounds);
  return b;
}

test('success waits for backup AND committed ingest, but not final audit status',async()=>{
  const begin=gate(),ingest=gate(),finish=gate();const h=harness({beginGate:begin,ingestGate:ingest,finishGate:finish});
  let replied=false;const response=h.run().then(r=>{replied=true;return r;});
  await delay(5);assert.equal(replied,false);assert.deepEqual(h.calls.map(c=>c.kind),['raiox_backup_begin']);
  begin.resolve();await delay(5);assert.equal(replied,false);assert.equal(h.calls.at(-1).kind,'raiox01_ingest');
  ingest.resolve();const r=await response;assert.equal(r.status,200);assert.equal(h.backgrounds.length,1);
  assert.equal(r.headers.get('x-rx-backup-finalization'),'background');assert.equal((await r.json()).stored,true);
  finish.resolve();await Promise.all(h.backgrounds);assert.equal(h.calls.at(-1).body.p_status,'stored');
});
for(const runtime of ['missing','throws']) test(`runtime ${runtime}: await fallback retains audit completion`,async()=>{
  const finish=gate(),h=harness({runtime,finishGate:finish});let done=false;
  const p=h.run().then(r=>{done=true;return r;});await delay(10);assert.equal(done,false);finish.resolve();
  const r=await p;assert.equal(r.headers.get('x-rx-backup-finalization'),'awaited');assert.equal(h.backgrounds.length,0);
});
for(const origin of ['https://bussoladacura.com.br','https://www.bussoladacura.com.br','https://quiz.brunosimplicio.com.br']) test(`preserve allowed origin ${origin}`,async()=>{
 const h=harness();const r=await h.run(body,{origin});assert.equal(r.headers.get('access-control-allow-origin'),origin);await Promise.all(h.backgrounds);
});
test('CORS permission can be cached, but data responses remain no-store',async()=>{
 const h=harness(),r=await h.run(null,{method:'OPTIONS'});assert.equal(r.status,204);assert.equal(r.headers.get('access-control-max-age'),'600');assert.equal(h.calls.length,0);
 const s=await h.run();assert.equal(s.headers.get('cache-control'),'no-store');assert.equal(s.headers.get('access-control-allow-headers'),'content-type');await Promise.all(h.backgrounds);
});
test('reject unknown origins before touching database',async()=>{const h=await sameResponse({},body,{origin:'https://evil.invalid'});assert.equal(h.calls.length,0);});
test('reject GET before touching database',async()=>{const h=await sameResponse({},body,{method:'GET'});assert.equal(h.calls.length,0);});
test('malformed JSON unchanged',async()=>{await sameResponse({},'{');});
test('32 KiB bound unchanged',async()=>{const h=await sameResponse({},'x'.repeat(32769));assert.equal(h.calls.length,0);});
test('success response body is byte-for-byte compatible in data',async()=>{await sameResponse();});
test('wrapped payload is preserved',async()=>{const h=await sameResponse({}, {payload:body});assert.deepEqual(h.calls[1].body.p,body);});
test('normal timestamps, IDs, sequence, attribution and tag forwarded unchanged',async()=>{
 const p={...body,attribution:{utm_source:'synthetic',meta_campaign_id:'12345'},properties:{...body.properties,completed_steps:['profile']}};
 const h=await sameResponse({},p);assert.deepEqual(h.calls[0].body.p_payload,p);assert.deepEqual(h.calls[1].body.p,p);assert.equal(h.calls[0].body.p_quiz_id,'raiox01');
});
test('lead ACK flags and payload retain their original meanings',async()=>{
 const a={...ack,lead_created:true};const p={...body,event_name:'lead_submit',lead:{nome:'Synthetic Tester',email:'synthetic@example.invalid',telefone:'+5511000000000'}};
 const h=await sameResponse({ack:a},p);assert.deepEqual(h.calls[1].body.p.lead,p.lead);
});
test('batch routes to existing raiox01_ingest_lote with all event IDs',async()=>{
 const p={events:[body],session_id:body.session_id,page_url:'https://quiz.brunosimplicio.com.br/raiox01/',test_mode:true};
 const a={...ack,event_ids:[body.event_id]};delete a.event_id;
 const h=await sameResponse({ack:a},p);assert.equal(h.calls[1].kind,'raiox01_ingest_lote');assert.deepEqual(h.calls[1].body.p,p);
});
for(const code of [400,403,409,422,429,500,503])test(`HTTP ${code} is not acknowledged as success`,async()=>{
 const a={ok:false,stored:false,code:'rejected'};const h=await sameResponse({ingestStatus:code,ack:a});assert.equal(h.backgrounds.length,0);assert.equal(h.calls.at(-1).body.p_status,'failed');
});
test('logical rejection with HTTP 200 stays synchronous and stored=false',async()=>{
 const finish=gate(),h=harness({ack:{ok:false,stored:false,code:'incomplete_snapshot',http_status:422},finishGate:finish});let done=false;
 const p=h.run().then(r=>{done=true;return r;});await delay(10);assert.equal(done,false);assert.equal(h.backgrounds.length,0);
 finish.resolve();const r=await p;assert.equal(r.status,422);assert.equal((await r.json()).stored,false);
});
test('success-looking response with error http_status remains rejection',async()=>{const h=await sameResponse({ack:{...ack,http_status:500}});assert.equal(h.backgrounds.length,0);});
test('invalid ingest response never yields success',async()=>{const h=await sameResponse({invalidResponse:true});assert.equal(h.backgrounds.length,0);});
test('ingest timeout preserves 504 storage_timeout and failed audit',async()=>{const h=await sameResponse({ingestTimeout:true});assert.equal(h.backgrounds.length,0);assert.equal(h.calls.at(-1).body.p_error_code,'storage_timeout');});
test('failed backup does not fabricate an ACK; existing main-ingest path unchanged',async()=>{const h=await sameResponse({beginThrow:true});assert.equal(h.calls.length,2);assert.equal(h.backgrounds.length,0);});
test('HTTP backup failure keeps existing main-ingest behavior',async()=>{const h=await sameResponse({beginStatus:503});assert.equal(h.calls.length,2);});
test('background rejection is handled and does not alter committed ingest ACK',async()=>{const h=await sameResponse({finishThrow:true});assert.equal(h.backgrounds.length,1);});
test('diagnostic headers contain durations/version only, no input secrets or PII',async()=>{
 const h=harness(),r=await h.run();const text=JSON.stringify([...r.headers]);assert.match(r.headers.get('server-timing'),/^backup;dur=\d+\.\d, ingest;dur=\d+\.\d, ack;dur=\d+\.\d$/);assert.ok(!text.includes('test-server-only-key'));assert.ok(!text.includes(body.session_id));await Promise.all(h.backgrounds);
});
test('raw backup retains invalid client time while normalization rule is preserved',async()=>{
 const p={...body,occurred_at:'2020-01-01T00:00:00Z'};const h=harness();const r=await h.run(p);await r.json();await Promise.all(h.backgrounds);
 assert.equal(h.calls[0].body.p_payload.occurred_at,p.occurred_at);assert.equal(h.calls[1].body.p.properties.client_occurred_at_raw,p.occurred_at);assert.equal(h.calls[1].body.p.properties.occurred_at_normalized,true);
});
