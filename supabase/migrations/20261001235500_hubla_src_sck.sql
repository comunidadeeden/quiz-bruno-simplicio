-- Persist Hubla src/sck that arrive in invoice.paymentSession.params.
alter table public.workshop
  add column if not exists src text,
  add column if not exists sck text;

alter table public.mentoria
  add column if not exists src text,
  add column if not exists sck text;

create or replace function private.fill_hubla_tracking_params()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if lower(coalesce(new.plataforma,''))='hubla' then
    new.src := coalesce(
      nullif(new.src,''),
      nullif(new.raw_data #>> '{event,invoice,paymentSession,params,src}','')
    );
    new.sck := coalesce(
      nullif(new.sck,''),
      nullif(new.raw_data #>> '{event,invoice,paymentSession,params,sck}','')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists fill_hubla_tracking_params_workshop on public.workshop;
create trigger fill_hubla_tracking_params_workshop
before insert or update of raw_data,plataforma,src,sck
on public.workshop
for each row execute function private.fill_hubla_tracking_params();

drop trigger if exists fill_hubla_tracking_params_mentoria on public.mentoria;
create trigger fill_hubla_tracking_params_mentoria
before insert or update of raw_data,plataforma,src,sck
on public.mentoria
for each row execute function private.fill_hubla_tracking_params();

update public.workshop
set src=coalesce(src,raw_data #>> '{event,invoice,paymentSession,params,src}'),
    sck=coalesce(sck,raw_data #>> '{event,invoice,paymentSession,params,sck}')
where lower(coalesce(plataforma,''))='hubla';

update public.mentoria
set src=coalesce(src,raw_data #>> '{event,invoice,paymentSession,params,src}'),
    sck=coalesce(sck,raw_data #>> '{event,invoice,paymentSession,params,sck}')
where lower(coalesce(plataforma,''))='hubla';
