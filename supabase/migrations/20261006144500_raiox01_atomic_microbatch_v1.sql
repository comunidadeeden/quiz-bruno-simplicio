-- Additive, RaioX01 only. Does not replace existing ingest functions or rewrite history.
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
CREATE TABLE IF NOT EXISTS private.raiox01_batch_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  rollout_bps integer NOT NULL DEFAULT 0 CHECK (rollout_bps BETWEEN 0 AND 500),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.raiox01_batch_control FROM PUBLIC, anon, authenticated;
INSERT INTO private.raiox01_batch_control(singleton) VALUES(true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.raiox01_ingest_lote_v2(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  e jsonb; a jsonb; rejected jsonb; receipts jsonb := '[]'::jsonb;
  ids jsonb := '[]'::jsonb; sid uuid; eid uuid; tst boolean; tok text;
  prior_sequence integer := 0; sequence_no integer; seen_ids uuid[] := '{}';
  old_setting text; q public.quiz%ROWTYPE; status_json jsonb;
  enabled boolean; bps integer; bucket bigint; has_completion boolean := false;
BEGIN
  -- Validate all batch identity/ordering BEFORE invoking a write operation.
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR octet_length(p::text)>32768
     OR p->>'batch_version' IS DISTINCT FROM 'rx01-batch-v1'
     OR jsonb_typeof(p->'events') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p->'test_mode') IS DISTINCT FROM 'boolean'
     OR jsonb_typeof(p->'page_url') IS DISTINCT FROM 'string'
     OR nullif(p->>'page_url','') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','invalid_batch','http_status',400);
  END IF;
  IF jsonb_array_length(p->'events') NOT BETWEEN 1 AND 8 THEN
    RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','invalid_batch_size','http_status',400);
  END IF;
  sid := (p->>'session_id')::uuid; tst := (p->>'test_mode')::boolean;
  tok := nullif(p->>'session_token','');
  IF sid IS NULL THEN RAISE invalid_text_representation; END IF;
  IF tok IS NOT NULL THEN PERFORM tok::uuid; END IF;
  FOR e IN SELECT value FROM jsonb_array_elements(p->'events') LOOP
    IF jsonb_typeof(e) IS DISTINCT FROM 'object'
       OR e->>'session_id' IS DISTINCT FROM sid::text
       OR e->'test_mode' IS DISTINCT FROM to_jsonb(tst)
       OR e->>'page_url' IS DISTINCT FROM p->>'page_url'
       OR e->>'source' IS DISTINCT FROM 'quiz_raiox01'
       OR e->>'lancamento' IS DISTINCT FROM 'raiox01_2026_09'
       OR jsonb_typeof(e->'sequence') IS DISTINCT FROM 'number'
       OR (e->>'sequence') !~ '^[0-9]+$' THEN
      RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','invalid_batch_identity','http_status',400);
    END IF;
    sequence_no := (e->>'sequence')::integer; eid := (e->>'event_id')::uuid;
    IF eid IS NULL OR eid=ANY(seen_ids) OR sequence_no<=prior_sequence OR sequence_no>=1000000 THEN
      RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','invalid_batch_order','http_status',400);
    END IF;
    prior_sequence := sequence_no; seen_ids := array_append(seen_ids,eid);
    has_completion := has_completion OR e->>'event_name'='quiz_complete';
  END LOOP;
  -- Remote kill switch affects this new endpoint only. Original ingest stays available.
  IF NOT tst THEN
    SELECT c.enabled,c.rollout_bps INTO enabled,bps FROM private.raiox01_batch_control c WHERE singleton;
    bucket := (('x'||substr(replace(sid::text,'-',''),1,8))::bit(32)::bigint)%10000;
    IF enabled IS DISTINCT FROM true OR bucket>=coalesce(bps,0) THEN
      RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','batch_disabled','http_status',409);
    END IF;
  END IF;
  old_setting := current_setting('raiox.batch',true);
  -- Exceptions inside this block undo ALL its writes. Returning an error alone would not.
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended((CASE WHEN tst THEN 'test:' ELSE 'prod:' END)||sid::text,0));
    PERFORM set_config('raiox.batch','on',true);
    FOR e IN SELECT value FROM jsonb_array_elements(p->'events') LOOP
      -- No payload mutation except the same session-token refresh as single-event delivery.
      e := (e-'session_token') || CASE WHEN tok IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('session_token',tok) END;
      a := public.raiox01_ingest(e);
      IF a->'ok' IS DISTINCT FROM 'true'::jsonb OR a->'stored' IS DISTINCT FROM 'true'::jsonb THEN
        rejected := a;
        RAISE EXCEPTION USING ERRCODE='P0B01',MESSAGE='batch_event_rejected';
      END IF;
      IF a->>'event_id' IS DISTINCT FROM e->>'event_id'
         OR a->'test_mode' IS DISTINCT FROM to_jsonb(tst)
         OR nullif(a->>'session_token','') IS NULL THEN
        RAISE EXCEPTION USING ERRCODE='P0B02',MESSAGE='invalid_batch_receipt';
      END IF;
      tok := a->>'session_token'; PERFORM tok::uuid;
      -- Keep lead_created/duplicate for EACH event; do not turn every receipt into a new lead.
      receipts := receipts || jsonb_build_array(a);
      ids := ids || jsonb_build_array(e->>'event_id');
    END LOOP;
    PERFORM set_config('raiox.batch',coalesce(old_setting,''),true);
    IF NOT tst THEN
      PERFORM captacao_backend.raiox_atualizar_quiz_v2(sid);
      PERFORM captacao_backend.raiox_consolidar(sid);
      SELECT * INTO STRICT q FROM public.quiz WHERE session_id=sid;
      status_json := jsonb_build_object('status',q.status_quiz,'finalizou',q.finalizou,
        'etapa_atual',q.etapa_atual,'etapas_concluidas',q.etapas_concluidas,'total_etapas',q.total_etapas,
        'perguntas_respondidas',q.perguntas_respondidas,'total_perguntas',q.total_perguntas,
        'percentual_conclusao',q.percentual_conclusao,'concluido_em',q.concluido_em);
      IF has_completion AND (q.finalizou IS DISTINCT FROM true OR q.status_quiz IS DISTINCT FROM 'concluido'
         OR q.perguntas_respondidas IS DISTINCT FROM 5 OR q.etapas_concluidas IS DISTINCT FROM 7) THEN
        RAISE EXCEPTION USING ERRCODE='P0B02',MESSAGE='completion_not_confirmed';
      END IF;
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'P0B01' THEN
      RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,
        'code',coalesce(rejected->>'code','batch_event_rejected'),
        'http_status',CASE WHEN (rejected->>'http_status')::int BETWEEN 400 AND 599 THEN (rejected->>'http_status')::int ELSE 503 END);
    WHEN OTHERS THEN
      RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','batch_processing_failed','http_status',503);
  END;
  RETURN jsonb_build_object('ok',true,'stored',true,'atomic',true,'batch_version','rx01-batch-v1',
    'event_ids',ids,'receipts',receipts,'session_token',tok,'test_mode',tst,
    'quiz_projection',CASE WHEN tst THEN 'test_only' ELSE 'v2' END,'quiz_status',status_json);
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  RETURN jsonb_build_object('ok',false,'stored',false,'atomic',true,'rolled_back',true,'code','invalid_batch_identity','http_status',400);
END;
$function$;
REVOKE ALL ON FUNCTION public.raiox01_ingest_lote_v2(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.raiox01_ingest_lote_v2(jsonb) TO service_role;
COMMENT ON FUNCTION public.raiox01_ingest_lote_v2(jsonb) IS
  'Opt-in RaioX01 ordered microbatch v1; per-event receipts, atomic failures, existing ingest/auth/idempotency, one projection per batch. Default disabled, max 5% canary.';
