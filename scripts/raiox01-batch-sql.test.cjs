'use strict';
// Real PostgreSQL engine in memory; fixture ingest only, never the production database.
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();const passed=[];
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE SCHEMA private; CREATE SCHEMA captacao_backend;
 CREATE TABLE public.quiz(session_id uuid primary key,status_quiz text,finalizou boolean,etapa_atual text,etapas_concluidas int,total_etapas int,perguntas_respondidas int,total_perguntas int,percentual_conclusao numeric,concluido_em timestamptz);
 CREATE TABLE private.fixture_events(event_id uuid PRIMARY KEY,payload jsonb);
 CREATE TABLE private.fixture_projection_calls(kind text);
 CREATE FUNCTION public.raiox01_ingest(p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
 DECLARE dupe boolean; BEGIN
 IF p->>'event_name'='invalid_event' THEN RETURN jsonb_build_object('ok',false,'stored',false,'code','event_not_allowed','http_status',422); END IF;
 SELECT EXISTS(SELECT 1 FROM private.fixture_events WHERE event_id=(p->>'event_id')::uuid) INTO dupe;
 INSERT INTO private.fixture_events VALUES((p->>'event_id')::uuid,p) ON CONFLICT DO NOTHING;
 IF p->>'event_name'='throw_error' THEN RAISE EXCEPTION 'fixture_error'; END IF;
 RETURN jsonb_build_object('ok',true,'stored',true,'event_id',CASE WHEN p->>'event_name'='wrong_ack' THEN gen_random_uuid()::text ELSE p->>'event_id' END,'test_mode',(p->>'test_mode')::boolean,'session_token','22222222-2222-4222-8222-222222222222','lead_created',p->>'event_name'='lead_submit','duplicate',dupe);
 END $$;
 CREATE FUNCTION captacao_backend.raiox_atualizar_quiz_v2(sid uuid) RETURNS void LANGUAGE plpgsql AS $$BEGIN
 INSERT INTO private.fixture_projection_calls VALUES('update');
 IF EXISTS(SELECT 1 FROM private.fixture_events WHERE payload->>'event_name'='projection_failure') THEN RAISE EXCEPTION 'fixture_projection_failed'; END IF;
 INSERT INTO public.quiz VALUES(sid,'concluido',true,'consequence',7,7,5,5,100,now()) ON CONFLICT DO NOTHING;
 END $$;
 CREATE FUNCTION captacao_backend.raiox_consolidar(sid uuid) RETURNS void LANGUAGE sql AS $$INSERT INTO private.fixture_projection_calls VALUES('consolidate')$$;`);
 await db.exec('BEGIN;'+fs.readFileSync('supabase/migrations/20261006144500_raiox01_atomic_microbatch_v1.sql','utf8')+'COMMIT;');
 const sid='00000001-1111-4111-8111-111111111111';
 const ev=(n,name='quiz_step_view',extra={})=>({event_id:`33333333-3333-4333-8333-${String(n).padStart(12,'0')}`,session_id:sid,sequence:n,event_name:name,test_mode:true,source:'quiz_raiox01',lancamento:'raiox01_2026_09',page_url:'https://quiz.brunosimplicio.com.br/raiox01/',properties:{},context:{},attribution:{},...extra});
 const env=events=>({batch_version:'rx01-batch-v1',session_id:sid,test_mode:events[0]?.test_mode??true,page_url:events[0]?.page_url??'https://quiz.brunosimplicio.com.br/raiox01/',events});
 const call=async p=>(await db.query('SELECT public.raiox01_ingest_lote_v2($1::jsonb) a',[JSON.stringify(p)])).rows[0].a;
 const count=async()=>Number((await db.query('SELECT count(*) n FROM private.fixture_events')).rows[0].n);
 const reset=async()=>db.exec('TRUNCATE private.fixture_events,private.fixture_projection_calls,public.quiz;');
 async function check(name,fn){await reset();await fn();passed.push(name);}
 await check('receipt per event and lead-created semantics',async()=>{const a=await call(env([ev(1),ev(2,'lead_submit'),ev(3)]));assert.equal(a.stored,true);assert.deepEqual(a.receipts.map(x=>x.lead_created),[false,true,false]);assert.equal(await count(),3);});
 await check('logical rejection rolls back previously accepted event',async()=>{const a=await call(env([ev(1),ev(2,'invalid_event')]));assert.equal(a.stored,false);assert.equal(a.rolled_back,true);assert.equal(a.http_status,422);assert.equal(await count(),0);});
 await check('exception rolls back whole batch and is retryable',async()=>{const a=await call(env([ev(1),ev(2,'throw_error')]));assert.equal(a.http_status,503);assert.equal(await count(),0);});
 await check('bad receipt rolls back write before acknowledgement',async()=>{const a=await call(env([ev(1),ev(2,'wrong_ack')]));assert.equal(a.stored,false);assert.equal(await count(),0);});
 await check('duplicates preserve the same event set',async()=>{const p=env([ev(1),ev(2)]);await call(p);const a=await call(p);assert.ok(a.receipts.every(x=>x.duplicate));assert.equal(await count(),2);});
 for(const [name,events] of [['mixed session',[ev(1),ev(2,'quiz_step_view',{session_id:'11111111-1111-4111-8111-111111111111'})]],['mixed test flag',[ev(1),ev(2,'quiz_step_view',{test_mode:false})]],['mixed source',[ev(1),ev(2,'quiz_step_view',{source:'quiz_raiox02'})]],['mixed page',[ev(1),ev(2,'quiz_step_view',{page_url:'https://other.invalid/'})]],['decreasing sequence',[ev(2),ev(1)]],['duplicate id',[ev(1),ev(2,'quiz_step_view',{event_id:ev(1).event_id})]],['null sequence',[ev(1),ev(2,'quiz_step_view',{sequence:null})]],['fractional sequence',[ev(1),ev(2,'quiz_step_view',{sequence:2.5})]],['oversized batch',Array.from({length:9},(_,i)=>ev(i+1))]])await check(name+' rejected without writes',async()=>{assert.equal((await call(env(events))).stored,false);assert.equal(await count(),0);});
 await check('disabled switch prevents production writes',async()=>{assert.equal((await call(env([ev(1,'page_view',{test_mode:false})]))).code,'batch_disabled');assert.equal(await count(),0);});
 await db.exec('UPDATE private.raiox01_batch_control SET enabled=true,rollout_bps=500;');
 await check('production fixture projects once per batch',async()=>{const a=await call(env([ev(1,'page_view',{test_mode:false}),ev(2,'quiz_complete',{test_mode:false})]));assert.equal(a.stored,true);assert.equal(a.quiz_status.perguntas_respondidas,5);assert.equal((await db.query('SELECT count(*)::int n FROM private.fixture_projection_calls')).rows[0].n,2);});
 await check('projection failure also rolls back events',async()=>{const a=await call(env([ev(1,'page_view',{test_mode:false}),ev(2,'projection_failure',{test_mode:false})]));assert.equal(a.stored,false);assert.equal(await count(),0);});
 await check('server limits traffic outside the 5 percent bucket',async()=>{const other='ffffffff-1111-4111-8111-111111111111';const p=env([ev(1,'page_view',{test_mode:false,session_id:other})]);p.session_id=other;assert.equal((await call(p)).code,'batch_disabled');assert.equal(await count(),0);});
 const privileges=(await db.query("SELECT has_function_privilege('anon','public.raiox01_ingest_lote_v2(jsonb)','execute') a,has_function_privilege('authenticated','public.raiox01_ingest_lote_v2(jsonb)','execute') b,has_function_privilege('service_role','public.raiox01_ingest_lote_v2(jsonb)','execute') c")).rows[0];assert.deepEqual(privileges,{a:false,b:false,c:true});passed.push('privileged RPC inaccessible to anon/authenticated');
 console.log(JSON.stringify({engine:'isolated PostgreSQL/PGlite',passed:passed.length,checks:passed,production_connections:0},null,2));await db.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
