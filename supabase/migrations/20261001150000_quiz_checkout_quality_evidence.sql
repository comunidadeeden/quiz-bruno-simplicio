set lock_timeout='5s';
alter table public.sales_page_events drop constraint sales_page_events_page_type_check;
alter table public.sales_page_events add constraint sales_page_events_page_type_check check (page_type='sales_page' or (page_type='quiz' and page_id in ('raiox01','raiox02') and event_name='cta_click' and properties->'quality_evidence_only'='true'::jsonb));
