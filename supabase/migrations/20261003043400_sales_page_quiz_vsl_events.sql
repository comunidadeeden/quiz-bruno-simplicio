-- Expand the event contract without deleting rows or changing existing identities.
begin;
alter table public.sales_page_events drop constraint sales_page_events_event_name_check;
alter table public.sales_page_events add constraint sales_page_events_event_name_check check (event_name in ('page_view','checkout_click','cta_view','cta_click','quiz_started','quiz_step_view','quiz_answer','quiz_stopped','quiz_abandoned','quiz_completed','vsl_started','vsl_offer_revealed'));
commit;

