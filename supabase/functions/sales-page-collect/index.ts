const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const allowedOrigins = new Set(["https://quiz.brunosimplicio.com.br"]);
const jsonHeaders = (origin: string) => ({
  "Content-Type": "application/json", "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://quiz.brunosimplicio.com.br",
  "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin",
});
const adminHeaders = { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY };
const reply = (origin: string, body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers: jsonHeaders(origin)});
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedEvents = new Set(["page_view","checkout_click","cta_view","cta_click"]);
const allowedPages = new Set(["pagina01","pagina02","pagina03","pagina04","raiox01","raiox02"]);
const allowedAttribution = new Set([
  "utm_source","utm_medium","utm_campaign","utm_content","utm_term","utm_id","utm_adset","utm_ad",
  "fbclid","gclid","gbraid","wbraid","ttclid","msclkid","meta_campaign_id","meta_campaign_name",
  "meta_adset_id","meta_adset_name","meta_ad_id","meta_ad_name","meta_creative_id","meta_creative_name",
  "meta_platform","meta_placement","sck","xcod"
]);
function safeText(value: unknown, max = 250): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim(); return clean && clean.length <= max ? clean : null;
}
function safeUrl(value: unknown): string | null {
  const text = safeText(value,700); if (!text) return null;
  try { const u=new URL(text); return ["http:","https:"].includes(u.protocol) ? u.origin+u.pathname : null; } catch { return null; }
}
function sanitizeAttribution(value: unknown): Record<string,string> {
  const out: Record<string,string>={};
  if (!value || typeof value!=="object" || Array.isArray(value)) return out;
  for (const [key,raw] of Object.entries(value)) {
    if (!allowedAttribution.has(key)) continue;
    const text=safeText(raw,250); if(text) out[key]=text;
  }
  return out;
}
function sanitizeProperties(value: unknown): Record<string,unknown> {
  if (!value || typeof value!=="object" || Array.isArray(value)) return {};
  const input=value as Record<string,unknown>, out: Record<string,unknown>={};
  const ctaText=safeText(input.cta_text,120), ctaPosition=safeText(input.cta_position,80);
  const ctaIndex=Number(input.cta_index), ctaTotal=Number(input.cta_total);
  if(ctaText) out.cta_text=ctaText;
  if(ctaPosition && /^cta(?:_\d{1,2})?$/.test(ctaPosition)) out.cta_position=ctaPosition;
  if(Number.isInteger(ctaIndex) && ctaIndex>=0 && ctaIndex<=99) out.cta_index=ctaIndex;
  if(Number.isInteger(ctaTotal) && ctaTotal>=0 && ctaTotal<=99) out.cta_total=ctaTotal;
  if(input.occurred_at_normalized===true) out.occurred_at_normalized=true;
  const rawClock=safeText(input.client_occurred_at_raw,80); if(rawClock) out.client_occurred_at_raw=rawClock;
  // Browser assertions, not a server certificate of humanity. Missing stays unknown.
  if(input.quality_version===1) {
    out.quality_version=1;
    if(input.quality_evidence_only===true) out.quality_evidence_only=true;
    for(const key of ["interaction_trusted","page_visible","target_visible","automation_driver","user_activation"]) {
      if(typeof input[key]==="boolean") out[key]=input[key];
    }
    const interactionKind=safeText(input.interaction_kind,32);
    if(interactionKind && ["pointer","touch","keyboard","wheel","scroll","checkout"].includes(interactionKind)) out.interaction_kind=interactionKind;
    const dwellMs=Number(input.dwell_ms);
    if(Number.isFinite(dwellMs) && dwellMs>=0 && dwellMs<=3600000) out.dwell_ms=Math.round(dwellMs);
  }
  return out;
}
function normalizeOccurredAt(value: unknown, properties: Record<string,unknown>): {occurredAt:string;properties:Record<string,unknown>} {
  const raw=safeText(value,80), parsed=raw ? Date.parse(raw) : NaN, now=Date.now();
  if(!Number.isFinite(parsed) || parsed>now+600000 || parsed<now-172800000) return {
    occurredAt:new Date().toISOString(), properties:{...properties,occurred_at_normalized:true,...(raw?{client_occurred_at_raw:raw}:{})},
  };
  return {occurredAt:new Date(parsed).toISOString(),properties};
}
async function backupBegin(pageId: string,payload: unknown): Promise<string|null> {
  try {
    const res=await fetch(SUPABASE_URL+"/rest/v1/rpc/raiox_backup_begin",{
      method:"POST",headers:adminHeaders,body:JSON.stringify({p_quiz_id:pageId,p_payload:payload}),signal:AbortSignal.timeout(3000),
    });
    if(!res.ok) return null;
    const id=await res.json().catch(()=>null); return typeof id==="string"?id:null;
  } catch {return null;}
}
async function backupFinish(id: string|null,status: "stored"|"failed",httpStatus: number,errorCode: string|null,responsePayload: unknown) {
  if(!id) return;
  try { await fetch(SUPABASE_URL+"/rest/v1/rpc/raiox_backup_finish",{
    method:"POST",headers:adminHeaders,body:JSON.stringify({p_backup_id:id,p_status:status,p_http_status:httpStatus,p_error_code:errorCode,p_response:responsePayload??null}),signal:AbortSignal.timeout(3000),
  }); } catch { /* Original backup remains available. */ }
}
Deno.serve(async (req: Request) => {
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:jsonHeaders(origin)});
  if(req.method!=="POST") return reply(origin,{ok:false,stored:false,code:"method_not_allowed"},405);
  if(origin && !allowedOrigins.has(origin)) return reply(origin,{ok:false,stored:false,code:"origin_not_allowed"},403);
  let backupId: string|null=null;
  try {
    const raw=await req.text();
    if(new TextEncoder().encode(raw).length>32768) return reply(origin,{ok:false,stored:false,code:"payload_too_large"},413);
    const payload=JSON.parse(raw);
    if(!payload || typeof payload!=="object" || Array.isArray(payload)) return reply(origin,{ok:false,stored:false,code:"invalid_payload"},400);
    const rawPageId=safeText(payload.page_id,40);
    backupId=rawPageId && allowedPages.has(rawPageId)?await backupBegin(rawPageId,payload):null;
    const eventId=safeText(payload.event_id,64),sessionId=safeText(payload.session_id,64),eventName=safeText(payload.event_name,40);
    const pageId=safeText(payload.page_id,40),source=safeText(payload.source,60),testMode=payload.test_mode===true;
    let lancamento=safeText(payload.lancamento,80);
    const evidenceOnly=payload.properties?.quality_version===1 && payload.properties?.quality_evidence_only===true;
    const isQuiz=pageId==="raiox01" || pageId==="raiox02";
    if(!eventId || !uuidRe.test(eventId) || !sessionId || !uuidRe.test(sessionId) || !eventName || !allowedEvents.has(eventName)
      || !pageId || !allowedPages.has(pageId) || source!==pageId || !lancamento || lancamento.length<3
      || (evidenceOnly && eventName!=="cta_click") || (isQuiz && !evidenceOnly)) {
      await backupFinish(backupId,"failed",400,"invalid_identity",{code:"invalid_identity"});
      return reply(origin,{ok:false,stored:false,code:"invalid_identity"},400);
    }
    const attribution=sanitizeAttribution(payload.attribution);
    const normalized=normalizeOccurredAt(payload.occurred_at,sanitizeProperties(payload.properties));
    // Evidence does not create checkout. Bind it to the existing native session/tag.
    if(evidenceOnly && !testMode) {
      const table=pageId==="raiox01"?"quiz":pageId==="raiox02"?"raiox02_quiz":"sales_page_events";
      const extra=isQuiz?"":"&page_id=eq."+pageId+"&event_name=eq.page_view&test_mode=eq.false&order=received_at.asc";
      const base=await fetch(SUPABASE_URL+"/rest/v1/"+table+"?select=lancamento&session_id=eq."+sessionId+extra+"&limit=1",{
        headers:adminHeaders,signal:AbortSignal.timeout(5000),
      });
      const records=await base.json().catch(()=>null);
      if(!base.ok || !Array.isArray(records) || !safeText(records[0]?.lancamento,80)) {
        await backupFinish(backupId,"failed",409,"source_session_pending",null);
        return reply(origin,{ok:false,stored:false,code:"source_session_pending"},409);
      }
      lancamento=records[0].lancamento;
    }
    // Only an explicit automation UA is a signal; never classify by country/network.
    // Do not trust a score or observed_bot_ua supplied in the request body.
    if(eventName==="checkout_click" || eventName==="cta_click") {
      normalized.properties.observed_bot_ua=/(?:HeadlessChrome|PhantomJS|facebookexternalhit|Facebot|Googlebot|bingbot|GPTBot|ClaudeBot|Bytespider|python-requests|curl\/)/i.test(req.headers.get("user-agent")||"");
    }
    const row={event_id:eventId,session_id:sessionId,event_name:eventName,page_id:pageId,page_type:isQuiz?"quiz":"sales_page",source,lancamento,
      occurred_at:normalized.occurredAt,page_url:safeUrl(payload.page_url),referrer:safeUrl(payload.referrer),attribution,properties:normalized.properties,test_mode:testMode};
    const insert=await fetch(SUPABASE_URL+"/rest/v1/sales_page_events?on_conflict=event_id",{
      method:"POST",headers:{...adminHeaders,"Prefer":"resolution=ignore-duplicates,return=representation"},body:JSON.stringify(row),signal:AbortSignal.timeout(8000),
    });
    const result=await insert.json().catch(()=>null);
    if(!insert.ok) {
      const code=typeof result?.code==="string"?result.code:"storage_unavailable";
      await backupFinish(backupId,"failed",insert.status,code,result);
      return reply(origin,{ok:false,stored:false,code},insert.status>=400?insert.status:503);
    }
    const output={ok:true,stored:true,duplicate:Array.isArray(result)&&result.length===0,event_id:eventId,session_id:sessionId,event_name:eventName,page_id:pageId,test_mode:testMode};
    await backupFinish(backupId,"stored",200,null,output); return reply(origin,output,200);
  } catch(error) {
    const code=error instanceof DOMException && error.name==="TimeoutError"?"storage_timeout":"invalid_request";
    const status=code==="storage_timeout"?504:400;
    await backupFinish(backupId,"failed",status,code,{code}); return reply(origin,{ok:false,stored:false,code},status);
  }
});
