-- Hubla Webhook 2: archive every invoice event, route Workshop/Mentoria,
-- deduplicate by x-hubla-idempotency and reuse the existing source->Dash sync.

create schema if not exists captacao_backend;

create table if not exists captacao_backend.hubla_eventos (
  event_id text primary key,
  idempotency_key text,
  invoice_id text,
  invoice_version bigint,
  event_type text not null,
  event_created_at timestamptz not null,
  target text,
  fingerprint text not null,
  payload jsonb not null,
  processing_status text not null default 'pendente',
  reason text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint hubla_eventos_target_check
    check (target is null or target in ('workshop','mentoria')),
  constraint hubla_eventos_processing_status_check
    check (processing_status in ('pendente','aplicado','ignorado_fora_de_ordem','ignorado_teste'))
);

create unique index if not exists hubla_eventos_idempotency_key_uidx
  on captacao_backend.hubla_eventos (idempotency_key)
  where idempotency_key is not null and idempotency_key <> '';

create index if not exists hubla_eventos_invoice_idx
  on captacao_backend.hubla_eventos (invoice_id, invoice_version desc, event_created_at desc);

create table if not exists private.hubla_product_routes (
  id bigint generated always as identity primary key,
  target text not null check (target in ('workshop','mentoria')),
  product_id text,
  offer_id text,
  product_name text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hubla_product_routes_has_key
    check (product_id is not null or offer_id is not null or product_name is not null)
);

create unique index if not exists hubla_product_routes_product_uidx
  on private.hubla_product_routes (product_id)
  where product_id is not null;

create unique index if not exists hubla_product_routes_offer_uidx
  on private.hubla_product_routes (offer_id)
  where offer_id is not null;

alter table public.workshop
  add column if not exists hubla_invoice_version bigint,
  add column if not exists hubla_evento_em timestamptz,
  add column if not exists hubla_evento_id text,
  add column if not exists hubla_product_id text,
  add column if not exists hubla_offer_ids text[];

alter table public.mentoria
  add column if not exists hubla_invoice_version bigint,
  add column if not exists hubla_evento_em timestamptz,
  add column if not exists hubla_evento_id text,
  add column if not exists hubla_product_id text,
  add column if not exists hubla_offer_ids text[];

create or replace function public.get_hubla_webhook_runtime(
  p_event_at timestamptz,
  p_product_id text default null,
  p_offer_ids text[] default null,
  p_product_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_tag text;
  v_target text;
  v_route_source text;
  v_matches integer := 0;
  v_name text := lower(coalesce(p_product_name,''));
begin
  select decrypted_secret
  into v_secret
  from vault.decrypted_secrets
  where name = 'hubla_webhook_token_v2'
  limit 1;

  select w.tag
  into v_tag
  from private.dash_tag_windows w
  where w.enabled
    and p_event_at >= w.starts_at
    and (w.ends_at is null or p_event_at < w.ends_at)
  order by w.starts_at desc
  limit 1;

  with matching_routes as (
    select distinct r.target
    from private.hubla_product_routes r
    where r.enabled
      and (
        (r.product_id is not null and p_product_id is not null and r.product_id = p_product_id)
        or
        (r.offer_id is not null and p_offer_ids is not null and r.offer_id = any(p_offer_ids))
        or
        (
          r.product_id is null
          and r.offer_id is null
          and r.product_name is not null
          and lower(btrim(r.product_name)) = lower(btrim(coalesce(p_product_name,'')))
        )
      )
  )
  select count(*), min(target)
  into v_matches, v_target
  from matching_routes;

  if v_matches = 1 then
    v_route_source := 'configured';
  elsif v_matches = 0 then
    if v_name like '%workshop%' then
      v_target := 'workshop';
      v_matches := 1;
      v_route_source := 'name_fallback';
    elsif v_name like '%mentoria%' then
      v_target := 'mentoria';
      v_matches := 1;
      v_route_source := 'name_fallback';
    end if;
  end if;

  return jsonb_build_object(
    'hubla_token', v_secret,
    'lancamento', v_tag,
    'target', case when v_matches = 1 then v_target else null end,
    'route_matches', v_matches,
    'route_source', v_route_source
  );
end;
$$;

revoke all on function public.get_hubla_webhook_runtime(timestamptz,text,text[],text)
  from public, anon, authenticated;
grant execute on function public.get_hubla_webhook_runtime(timestamptz,text,text[],text)
  to service_role;

create or replace function public.hubla_ingest(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id text := nullif(p->>'event_id','');
  v_idempotency text := nullif(p->>'idempotency_key','');
  v_invoice_id text := nullif(p->>'invoice_id','');
  v_event_type text := nullif(p->>'event_type','');
  v_target text := nullif(p->>'target','');
  v_tag text := nullif(p->>'lancamento','');
  v_status text := nullif(p->>'status','');
  v_reason text := nullif(p->>'pending_reason','');
  v_route_source text := nullif(p->>'route_source','');
  v_product_id text := nullif(p->>'product_id','');
  v_product_name text := nullif(p->>'product_name','');
  v_offer_ids text[] := case
    when jsonb_typeof(p->'offer_ids')='array'
      then array(select jsonb_array_elements_text(p->'offer_ids'))
    else null
  end;
  v_event_at timestamptz;
  v_invoice_version bigint;
  v_fingerprint text;
  v_previous captacao_backend.hubla_eventos%rowtype;
  v_existing record;
  v_other_count integer := 0;
  v_cadastro_id bigint;
  v_contact_count integer := 0;
  v_contact_attr jsonb := '{}'::jsonb;
  v_email text := lower(nullif(btrim(p->>'email'),''));
  v_phone text := nullif(btrim(p->>'telefone'),'');
  v_value numeric;
  v_net_value numeric;
  v_currency text;
  v_approved_at timestamptz;
  v_refunded_at timestamptz;
  v_created_at timestamptz;
  v_updated_at timestamptz;
  v_old_version bigint;
  v_old_event_at timestamptz;
begin
  if jsonb_typeof(p) is distinct from 'object'
     or v_event_id is null
     or v_event_type is null
     or octet_length(p::text) > 65536
  then
    return jsonb_build_object('ok',false,'stored',false,'code','invalid_event','http_status',400);
  end if;

  begin
    v_event_at := (p->>'event_created_at')::timestamptz;
    v_invoice_version := nullif(p->>'invoice_version','')::bigint;
    v_value := nullif(p->>'valor','')::numeric;
    v_net_value := nullif(p->>'valor_liquido','')::numeric;
    v_approved_at := nullif(p->>'approved_at','')::timestamptz;
    v_refunded_at := nullif(p->>'refunded_at','')::timestamptz;
    v_created_at := nullif(p->>'created_at','')::timestamptz;
    v_updated_at := nullif(p->>'updated_at','')::timestamptz;
  exception when others then
    return jsonb_build_object('ok',false,'stored',false,'code','invalid_types','http_status',400);
  end;

  if v_event_at is null or v_event_at > now() + interval '10 minutes' then
    return jsonb_build_object('ok',false,'stored',false,'code','invalid_event_time','http_status',400);
  end if;

  v_fingerprint := md5((p - 'event_id' - 'idempotency_key' - 'pending_reason')::text);

  perform pg_advisory_xact_lock(hashtextextended('hubla-event:'||v_event_id,0));

  select *
  into v_previous
  from captacao_backend.hubla_eventos
  where event_id = v_event_id;

  if found then
    if v_previous.fingerprint <> v_fingerprint then
      return jsonb_build_object('ok',false,'stored',false,'code','idempotency_conflict','http_status',409);
    end if;
    if v_previous.processing_status <> 'pendente' then
      return jsonb_build_object(
        'ok',true,'stored',true,'duplicate',true,
        'event_id',v_event_id,'result',v_previous.processing_status
      );
    end if;
  end if;

  insert into captacao_backend.hubla_eventos (
    event_id,idempotency_key,invoice_id,invoice_version,event_type,event_created_at,
    target,fingerprint,payload,reason
  )
  values (
    v_event_id,v_idempotency,v_invoice_id,v_invoice_version,v_event_type,v_event_at,
    v_target,v_fingerprint,p,v_reason
  )
  on conflict (event_id) do update
  set payload=excluded.payload,
      target=excluded.target,
      invoice_id=excluded.invoice_id,
      invoice_version=excluded.invoice_version,
      reason=excluded.reason;

  if coalesce((p->>'sandbox')::boolean,false) then
    update captacao_backend.hubla_eventos
    set processing_status='ignorado_teste',
        reason='sandbox_event',
        processed_at=now()
    where event_id=v_event_id;
    return jsonb_build_object('ok',true,'stored',true,'event_id',v_event_id,'result','ignorado_teste');
  end if;

  if v_invoice_id is null then v_reason := coalesce(v_reason,'invoice_ausente'); end if;
  if v_invoice_id is not null and v_invoice_id like '%-tester' then
    update captacao_backend.hubla_eventos
    set processing_status='ignorado_teste',
        reason='invoice_tester',
        processed_at=now()
    where event_id=v_event_id;
    return jsonb_build_object('ok',true,'stored',true,'event_id',v_event_id,'result','ignorado_teste');
  end if;
  if v_target not in ('workshop','mentoria') then v_reason := coalesce(v_reason,'produto_nao_configurado'); end if;
  if v_tag is null then v_reason := coalesce(v_reason,'lancamento_fora_da_janela'); end if;
  if v_status not in ('pending','approved','completed','cancelled','refunded','chargeback','expired') then
    v_reason := coalesce(v_reason,'status_nao_suportado');
  end if;
  if v_invoice_version is null or v_invoice_version < 0 then
    v_reason := coalesce(v_reason,'invoice_version_ausente');
  end if;

  v_currency := upper(coalesce(nullif(p->>'moeda',''),'BRL'));
  if v_value is null or v_value < 0 or v_currency !~ '^[A-Z]{3}$' then
    v_reason := coalesce(v_reason,'valor_ou_moeda_ausente');
  end if;

  if v_reason is not null then
    update captacao_backend.hubla_eventos
    set reason=v_reason
    where event_id=v_event_id;
    return jsonb_build_object(
      'ok',true,'stored',true,'event_id',v_event_id,
      'result','pendente','reason',v_reason
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended('hubla-sale:'||v_invoice_id,0));

  if v_route_source='name_fallback' and v_product_id is not null then
    insert into private.hubla_product_routes(target,product_id,product_name)
    values(v_target,v_product_id,v_product_name)
    on conflict (product_id) do nothing;
  end if;

  if v_target='workshop' then
    select count(*) into v_other_count
    from public.mentoria
    where plataforma='hubla' and external_id=v_invoice_id;
  else
    select count(*) into v_other_count
    from public.workshop
    where plataforma='hubla' and external_id=v_invoice_id;
  end if;

  if v_other_count > 0 then
    update captacao_backend.hubla_eventos
    set reason='transacao_em_outro_produto'
    where event_id=v_event_id;
    return jsonb_build_object(
      'ok',true,'stored',true,'event_id',v_event_id,
      'result','pendente','reason','transacao_em_outro_produto'
    );
  end if;

  if v_target='workshop' then
    select hubla_invoice_version,hubla_evento_em,status
    into v_old_version,v_old_event_at,v_existing.status
    from public.workshop
    where plataforma='hubla' and external_id=v_invoice_id
    for update;
  else
    select hubla_invoice_version,hubla_evento_em,status
    into v_old_version,v_old_event_at,v_existing.status
    from public.mentoria
    where plataforma='hubla' and external_id=v_invoice_id
    for update;
  end if;

  if found and (
    (v_old_version is not null and v_invoice_version < v_old_version)
    or
    (v_old_version = v_invoice_version and v_old_event_at is not null and v_event_at < v_old_event_at)
    or
    (v_existing.status in ('refunded','chargeback') and v_status not in ('refunded','chargeback'))
    or
    (v_existing.status='chargeback' and v_status='refunded')
    or
    (v_existing.status in ('approved','completed') and v_status in ('pending','expired','cancelled'))
    or
    (v_existing.status='completed' and v_status='approved')
  ) then
    update captacao_backend.hubla_eventos
    set processing_status='ignorado_fora_de_ordem',
        reason='estado_mais_recente_preservado',
        processed_at=now()
    where event_id=v_event_id;
    return jsonb_build_object(
      'ok',true,'stored',true,'event_id',v_event_id,
      'result','ignorado_fora_de_ordem'
    );
  end if;

  select count(*),min(c.id)
  into v_contact_count,v_cadastro_id
  from public."cadastroClientes" c
  where c.lancamento=v_tag
    and (v_email is not null or v_phone is not null)
    and (v_email is null or lower(c.email)=v_email)
    and (v_phone is null or c.telefone=v_phone);

  if v_contact_count=1 then
    select coalesce(c.last_attribution,'{}'::jsonb)
    into v_contact_attr
    from public."cadastroClientes" c
    where c.id=v_cadastro_id;
  else
    v_cadastro_id := null;
  end if;

  execute format(
    'insert into public.%I (
      external_id,plataforma,nome,email,telefone,lancamento,produto,
      valor,valor_liquido,moeda,status,tipopagamento,checkout_url,
      approved_at,refunded_at,cadastro_id,raw_data,
      hubla_invoice_version,hubla_evento_em,hubla_evento_id,hubla_product_id,hubla_offer_ids,
      utm_source,utm_medium,utm_campaign,utm_content,utm_term,fbclid,fbc,fbp,
      meta_campaign_id,meta_campaign_name,meta_adset_id,meta_adset_name,
      meta_ad_id,meta_ad_name,meta_creative_id,meta_creative_name,
      created_at,updated_at
    ) values (
      $1,''hubla'',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
      $17,$18,$19,$20,$21,
      $22,$23,$24,$25,$26,$27,$28,$29,
      $30,$31,$32,$33,$34,$35,$36,$37,
      coalesce($38,now()),coalesce($39,now())
    )
    on conflict(plataforma,external_id) do update set
      nome=coalesce(excluded.nome,%I.nome),
      email=coalesce(excluded.email,%I.email),
      telefone=coalesce(excluded.telefone,%I.telefone),
      lancamento=excluded.lancamento,
      produto=excluded.produto,
      valor=excluded.valor,
      valor_liquido=coalesce(excluded.valor_liquido,%I.valor_liquido),
      moeda=excluded.moeda,
      status=excluded.status,
      tipopagamento=coalesce(excluded.tipopagamento,%I.tipopagamento),
      checkout_url=coalesce(excluded.checkout_url,%I.checkout_url),
      approved_at=coalesce(%I.approved_at,excluded.approved_at),
      refunded_at=coalesce(%I.refunded_at,excluded.refunded_at),
      cadastro_id=coalesce(excluded.cadastro_id,%I.cadastro_id),
      raw_data=excluded.raw_data,
      hubla_invoice_version=excluded.hubla_invoice_version,
      hubla_evento_em=excluded.hubla_evento_em,
      hubla_evento_id=excluded.hubla_evento_id,
      hubla_product_id=excluded.hubla_product_id,
      hubla_offer_ids=excluded.hubla_offer_ids,
      utm_source=coalesce(excluded.utm_source,%I.utm_source),
      utm_medium=coalesce(excluded.utm_medium,%I.utm_medium),
      utm_campaign=coalesce(excluded.utm_campaign,%I.utm_campaign),
      utm_content=coalesce(excluded.utm_content,%I.utm_content),
      utm_term=coalesce(excluded.utm_term,%I.utm_term),
      fbclid=coalesce(excluded.fbclid,%I.fbclid),
      fbc=coalesce(excluded.fbc,%I.fbc),
      fbp=coalesce(excluded.fbp,%I.fbp),
      meta_campaign_id=coalesce(excluded.meta_campaign_id,%I.meta_campaign_id),
      meta_campaign_name=coalesce(excluded.meta_campaign_name,%I.meta_campaign_name),
      meta_adset_id=coalesce(excluded.meta_adset_id,%I.meta_adset_id),
      meta_adset_name=coalesce(excluded.meta_adset_name,%I.meta_adset_name),
      meta_ad_id=coalesce(excluded.meta_ad_id,%I.meta_ad_id),
      meta_ad_name=coalesce(excluded.meta_ad_name,%I.meta_ad_name),
      meta_creative_id=coalesce(excluded.meta_creative_id,%I.meta_creative_id),
      meta_creative_name=coalesce(excluded.meta_creative_name,%I.meta_creative_name),
      updated_at=greatest(%I.updated_at,excluded.updated_at)',
    v_target,
    v_target,v_target,v_target,v_target,v_target,v_target,v_target,v_target,
    v_target,v_target,v_target,v_target,v_target,v_target,v_target,v_target,
    v_target,v_target,v_target,v_target,v_target,v_target,v_target,v_target,
    v_target,v_target,v_target,v_target,v_target,v_target
  )
  using
    v_invoice_id,
    p->>'nome',
    v_email,
    v_phone,
    v_tag,
    v_product_name,
    v_value,
    v_net_value,
    v_currency,
    v_status,
    p->>'payment_type',
    p->>'checkout_url',
    case when v_status in ('approved','completed') then coalesce(v_approved_at,v_event_at) else v_approved_at end,
    case when v_status='refunded' then coalesce(v_refunded_at,v_event_at) else v_refunded_at end,
    v_cadastro_id,
    p->'raw_data',
    v_invoice_version,
    v_event_at,
    v_event_id,
    v_product_id,
    v_offer_ids,
    coalesce(nullif(p->>'utm_source',''),v_contact_attr->>'utm_source'),
    coalesce(nullif(p->>'utm_medium',''),v_contact_attr->>'utm_medium'),
    coalesce(nullif(p->>'utm_campaign',''),v_contact_attr->>'utm_campaign'),
    coalesce(nullif(p->>'utm_content',''),v_contact_attr->>'utm_content'),
    coalesce(nullif(p->>'utm_term',''),v_contact_attr->>'utm_term'),
    coalesce(nullif(p->>'fbclid',''),v_contact_attr->>'fbclid'),
    coalesce(nullif(p->>'fbc',''),v_contact_attr->>'fbc'),
    coalesce(nullif(p->>'fbp',''),v_contact_attr->>'fbp'),
    coalesce(nullif(p->>'meta_campaign_id',''),v_contact_attr->>'meta_campaign_id'),
    coalesce(nullif(p->>'meta_campaign_name',''),v_contact_attr->>'meta_campaign_name'),
    coalesce(nullif(p->>'meta_adset_id',''),v_contact_attr->>'meta_adset_id'),
    coalesce(nullif(p->>'meta_adset_name',''),v_contact_attr->>'meta_adset_name'),
    coalesce(nullif(p->>'meta_ad_id',''),v_contact_attr->>'meta_ad_id'),
    coalesce(nullif(p->>'meta_ad_name',''),v_contact_attr->>'meta_ad_name'),
    coalesce(nullif(p->>'meta_creative_id',''),v_contact_attr->>'meta_creative_id'),
    coalesce(nullif(p->>'meta_creative_name',''),v_contact_attr->>'meta_creative_name'),
    v_created_at,
    v_updated_at;

  update captacao_backend.hubla_eventos
  set processing_status='aplicado',
      reason=null,
      processed_at=now()
  where event_id=v_event_id;

  return jsonb_build_object(
    'ok',true,'stored',true,'event_id',v_event_id,
    'result','aplicado','target',v_target,'linked',v_cadastro_id is not null
  );
exception
  when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range then
    return jsonb_build_object('ok',false,'stored',false,'code','invalid_event','http_status',400);
end;
$$;

revoke all on function public.hubla_ingest(jsonb) from public,anon,authenticated;
grant execute on function public.hubla_ingest(jsonb) to service_role;

comment on function public.hubla_ingest(jsonb) is
  'Hubla Webhook 2 ingestion for Workshop/Mentoria. Archives every event, deduplicates by idempotency/invoice version and writes plataforma=hubla into the existing sale tables.';
