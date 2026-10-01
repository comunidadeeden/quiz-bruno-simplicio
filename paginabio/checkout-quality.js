/* Quality evidence only. Never blocks navigation, changes page content or fires pixels. */
(() => {
  "use strict";
  const match = location.pathname.replace(/^\/paginabio(?=\/|$)/i, "/pagina01").match(/^\/(pagina0[1-4]|raiox0[12])(?:\/|$)/i);
  if (!match || window.__RX_CHECKOUT_QUALITY_V1) return;
  window.__RX_CHECKOUT_QUALITY_V1 = true;
  const pageId = match[1].toLowerCase();
  const endpoint = "https://nklqcamhkwqictdmictb.supabase.co/functions/v1/sales-page-collect";
  const isUuid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const inflight = new Set();
  let memory = {};
  let memorySession = "";
  const session = () => {
    try {
      const id = pageId.startsWith("raiox") ? window.RX?.getSessionId?.()
        : JSON.parse(sessionStorage.getItem(pageId + "_tracking_v1") || "null")?.session_id;
      return isUuid(id) ? id : null;
    } catch (_) { return null; }
  };
  const storageKey = sid => "rx_checkout_quality_v1_" + pageId + "_" + sid;
  const load = sid => {
    if (memorySession !== sid) { memory = {}; memorySession = sid; }
    try { const saved = JSON.parse(sessionStorage.getItem(storageKey(sid)) || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) memory = saved;
    } catch (_) {}
    return memory;
  };
  const save = (sid, state) => { memory = state; try { sessionStorage.setItem(storageKey(sid), JSON.stringify(state)); } catch (_) {} };
  const send = async (sid, signature, record) => {
    if (inflight.has(record.payload.event_id)) return;
    inflight.add(record.payload.event_id);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(endpoint, {method:"POST",mode:"cors",credentials:"omit",keepalive:true,
            headers:{"Content-Type":"application/json"},body:JSON.stringify(record.payload),signal:controller.signal});
          const result = await response.json().catch(() => null);
          if(response.ok && result?.ok === true && result?.stored === true && result.event_id === record.payload.event_id && result.page_id === pageId) {
            const state = load(sid); state[signature] = {...record, delivered:true}; save(sid,state); return;
          }
          if (response.status < 500 && ![409,429].includes(response.status)) return;
        } catch (_) { /* Same event ID is retried; raw checkout is independent. */ }
        finally { clearTimeout(timer); }
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * 2 ** attempt));
      }
    } finally { inflight.delete(record.payload.event_id); }
  };
  const retry = () => {
    const sid = session(); if (!sid) return;
    const state = load(sid);
    for(const [signature,record] of Object.entries(state).slice(0,8)) {
      if (record?.payload && !record.delivered && isUuid(record.payload.event_id)
        && record.payload.session_id === sid && record.payload.page_id === pageId
        && Date.now() - record.saved_at >= 0 && Date.now() - record.saved_at < 21600000) void send(sid,signature,record);
    }
  };
  document.addEventListener("click", event => {
    try {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || new URL(link.href, location.href).hostname !== "pay.hotmart.com") return;
      const sid = session(); if (!sid) return;
      const rect = link.getBoundingClientRect(), style = getComputedStyle(link);
      const properties = {
        quality_version:1, quality_evidence_only:true, cta_index:0,
        interaction_trusted:typeof event.isTrusted === "boolean" ? event.isTrusted : null,
        page_visible:typeof document.visibilityState === "string" ? document.visibilityState === "visible" : null,
        target_visible:style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
          && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth,
        automation_driver:typeof navigator.webdriver === "boolean" ? navigator.webdriver : null,
        user_activation:typeof navigator.userActivation?.isActive === "boolean" ? navigator.userActivation.isActive : null,
      };
      const signature = [properties.interaction_trusted,properties.page_visible,properties.target_visible,properties.automation_driver].map(String).join(":");
      const state = load(sid);
      if (!state[signature] && Object.keys(state).length >= 8) return;
      const testMode = window.RX?.getTestMode?.() === true || new URLSearchParams(location.search).get("rx_test") === "1";
      const record = state[signature] || {delivered:false,saved_at:Date.now(),payload:{
        event_id:crypto.randomUUID(), session_id:sid, event_name:"cta_click", page_id:pageId, source:pageId,
        lancamento:"QUALITY_EVIDENCE", occurred_at:new Date().toISOString(),
        page_url:location.origin + location.pathname, properties, test_mode:testMode,
      }};
      state[signature] = record; save(sid,state);
      if (!record.delivered) void send(sid,signature,record);
    } catch (_) { /* No interference with the customer's original click or payment. */ }
  }, {capture:true});
  window.addEventListener("online", retry);
  retry();
})();
