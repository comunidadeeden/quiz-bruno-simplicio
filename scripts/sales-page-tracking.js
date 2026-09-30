(() => {
  "use strict";

  const match = location.pathname.match(/^\/(pagina0[2-4])(?:\/|$)/i);
  if (!match) return;

  const pageId = match[1].toLowerCase();
  window.__RX26_SITE = true;

  const cfg = {
    pageId,
    source: pageId,
    pageType: "sales_page",
    launch: "BS06OUT2026",
    endpoint: "https://nklqcamhkwqictdmictb.supabase.co/functions/v1/sales-page-collect",
    currency: "BRL",
    value: 47,
    sessionMaxAgeMs: 21600000,
    queueMaxAgeMs: 86400000,
  };

  const uuid = () => crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 3 | 8)).toString(16);
      });

  const validUuid = value =>
    typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const stateKey = pageId + "_tracking_v1";
  const queueKey = pageId + "_delivery_queue_v1";
  let state = null;

  try {
    const saved = JSON.parse(sessionStorage.getItem(stateKey) || "null");
    if (
      saved
      && validUuid(saved.session_id)
      && validUuid(saved.page_view_event_id)
      && Number.isFinite(saved.saved_at)
      && Date.now() - saved.saved_at >= 0
      && Date.now() - saved.saved_at < cfg.sessionMaxAgeMs
    ) state = saved;
  } catch (_) {}

  if (!state) {
    state = {
      session_id: uuid(),
      page_view_event_id: uuid(),
      checkout_event_id: null,
      cta_view_event_ids: {},
      cta_click_event_ids: {},
      saved_at: Date.now(),
    };
  }

  const saveState = () => {
    state.saved_at = Date.now();
    try { sessionStorage.setItem(stateKey, JSON.stringify(state)); } catch (_) {}
  };
  if (!state.cta_view_event_ids || typeof state.cta_view_event_ids !== "object" || Array.isArray(state.cta_view_event_ids)) state.cta_view_event_ids = {};
  if (!state.cta_click_event_ids || typeof state.cta_click_event_ids !== "object" || Array.isArray(state.cta_click_event_ids)) state.cta_click_event_ids = {};
  saveState();

  const eventIdForCta = (bucket, ctaPosition) => {
    const map = bucket === "view" ? state.cta_view_event_ids : state.cta_click_event_ids;
    if (validUuid(map[ctaPosition])) return map[ctaPosition];
    map[ctaPosition] = uuid();
    saveState();
    return map[ctaPosition];
  };

  const allowedAttributionKeys = [
    "utm_source","utm_medium","utm_campaign","utm_content","utm_term","utm_id",
    "utm_adset","utm_ad","fbclid","gclid","gbraid","wbraid","ttclid","msclkid",
    "meta_campaign_id","meta_campaign_name","meta_adset_id","meta_adset_name",
    "meta_ad_id","meta_ad_name","meta_creative_id","meta_creative_name",
    "meta_platform","meta_placement","sck","xcod"
  ];

  const params = new URLSearchParams(location.search);
  const attribution = {};
  for (const key of allowedAttributionKeys) {
    const value = params.get(key);
    if (value && value.length <= 250 && !value.includes("@")) attribution[key] = value;
  }

  const safeUrl = value => {
    try {
      const url = new URL(value, location.href);
      return /^https?:$/.test(url.protocol) ? url.origin + url.pathname : "";
    } catch (_) {
      return "";
    }
  };

  const loadQueue = () => {
    try {
      const rows = JSON.parse(localStorage.getItem(queueKey) || "[]");
      if (!Array.isArray(rows)) return [];
      return rows.filter(item =>
        item && item.payload && validUuid(item.payload.event_id)
        && Number.isFinite(item.queued_at)
        && Date.now() - item.queued_at >= 0
        && Date.now() - item.queued_at < cfg.queueMaxAgeMs
      ).slice(-40);
    } catch (_) {
      return [];
    }
  };

  const saveQueue = rows => {
    try { localStorage.setItem(queueKey, JSON.stringify(rows.slice(-40))); } catch (_) {}
  };

  const removeQueued = eventId =>
    saveQueue(loadQueue().filter(item => item.payload.event_id !== eventId));

  const enqueue = payload => {
    const rows = loadQueue().filter(item => item.payload.event_id !== payload.event_id);
    rows.push({ queued_at: Date.now(), payload });
    saveQueue(rows);
  };

  const send = async payload => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch(cfg.endpoint, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
          keepalive: true,
        });
        const result = await response.json().catch(() => null);
        if (
          response.ok
          && result?.ok === true
          && result?.stored === true
          && result?.event_id === payload.event_id
          && result?.page_id === pageId
        ) {
          removeQueued(payload.event_id);
          return true;
        }
        if (response.status < 500 && response.status !== 429) break;
      } catch (_) {
        // retry
      } finally {
        clearTimeout(timer);
      }
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
    }
    enqueue(payload);
    return false;
  };

  const payload = (eventName, eventId, properties = {}) => ({
    event_id: eventId,
    session_id: state.session_id,
    event_name: eventName,
    page_id: pageId,
    page_type: cfg.pageType,
    source: cfg.source,
    lancamento: cfg.launch,
    occurred_at: new Date().toISOString(),
    page_url: safeUrl(location.href),
    referrer: safeUrl(document.referrer),
    attribution,
    properties,
    test_mode: false,
  });

  window.dataLayer = window.dataLayer || [];
  const pushGtm = (name, eventId, properties = {}) => {
    window.dataLayer.push({ rx: null });
    window.dataLayer.push({
      event: "rx_event",
      rx: {
        name,
        event_id: eventId,
        quiz_id: "",
        page_id: pageId,
        page_type: cfg.pageType,
        source: cfg.source,
        launch: cfg.launch,
        technical_launch: pageId,
        page_location: safeUrl(location.href),
        page_referrer: safeUrl(document.referrer),
        analytics: true,
        advertising: true,
        test_mode: false,
        traffic: {
          campaign_source: attribution.utm_source || "",
          campaign_medium: attribution.utm_medium || "",
          campaign_name: attribution.utm_campaign || "",
          campaign_content: attribution.utm_content || "",
          campaign_term: attribution.utm_term || "",
          campaign_id: attribution.utm_id || "",
        },
        params: properties,
      },
    });
  };

  const checkoutMarker = pageId + "_" + state.session_id.replace(/-/g, "");
  const trackedKeys = [
    "utm_source","utm_medium","utm_campaign","utm_content","utm_term","utm_id",
    "utm_adset","utm_ad","fbclid","gclid","gbraid","wbraid","ttclid","msclkid",
    "meta_campaign_id","meta_campaign_name","meta_adset_id","meta_adset_name",
    "meta_ad_id","meta_ad_name","meta_creative_id","meta_creative_name",
    "meta_platform","meta_placement","xcod"
  ];

  const checkoutLinks = () => [...document.querySelectorAll('a[href*="pay.hotmart.com"]')];

  const isVisibleCta = (link) => {
    if (!(link instanceof HTMLElement)) return false;
    const style = getComputedStyle(link);
    const rect = link.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  const reindexVisibleCtas = () => {
    const links = checkoutLinks();
    links.forEach((link) => {
      delete link.dataset.rxSalesPageCta;
      delete link.dataset.rxSalesPageCtaTotal;
    });
    const visible = links.filter(isVisibleCta);
    visible.forEach((link, index) => {
      link.dataset.rxSalesPageCta = String(index + 1);
      link.dataset.rxSalesPageCtaTotal = String(visible.length);
    });
    return visible;
  };

  const prepareCheckoutLinks = () => {
    const links = [...document.querySelectorAll('a[href*="pay.hotmart.com"]')];
    links.forEach((link) => {
      try {
        const url = new URL(link.href, location.href);
        if (url.hostname !== "pay.hotmart.com") return;

        url.searchParams.set("src", pageId);
        for (const key of trackedKeys) {
          const value = attribution[key];
          if (value && value.length <= 250) url.searchParams.set(key, value);
        }

        const markerPattern = new RegExp("(?:^|~)" + pageId + "_[0-9a-f]{32}(?=~|$)", "gi");
        const inboundSck = (attribution.sck || url.searchParams.get("sck") || "")
          .replace(markerPattern, "")
          .replace(/^~|~$/g, "");
        const combined = inboundSck ? inboundSck + "~" + checkoutMarker : checkoutMarker;

        if (combined.length <= 255) url.searchParams.set("sck", combined);
        else if (inboundSck && inboundSck.length <= 255) url.searchParams.set("sck", inboundSck);

        link.href = url.toString();
      } catch (_) {}
    });
    return reindexVisibleCtas();
  };

  const ctaProperties = (link) => {
    const rawIndex = Number(link.dataset.rxSalesPageCta);
    const ctaIndex = Number.isInteger(rawIndex) && rawIndex > 0 ? rawIndex : 0;
    const rawTotal = Number(link.dataset.rxSalesPageCtaTotal);
    const ctaTotal = Number.isInteger(rawTotal) && rawTotal > 0 ? rawTotal : reindexVisibleCtas().length;
    const ctaPosition = ctaIndex > 0 ? "cta_" + String(ctaIndex).padStart(2, "0") : "cta";
    return {
      cta_position: ctaPosition,
      cta_index: ctaIndex,
      cta_total: ctaTotal,
      cta_text: (link.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
      currency: cfg.currency,
      value: cfg.value,
    };
  };

  const viewedCtas = new Set();
  const trackCtaView = (link) => {
    const properties = ctaProperties(link);
    if (!properties.cta_index || viewedCtas.has(properties.cta_position)) return;
    viewedCtas.add(properties.cta_position);
    const eventId = eventIdForCta("view", properties.cta_position);
    pushGtm("rx_sales_page_cta_view", eventId, properties);
    void send(payload("cta_view", eventId, properties));
  };

  let ctaObserver = null;
  const observeVisibleCtas = () => {
    const visible = reindexVisibleCtas();
    if (ctaObserver) ctaObserver.disconnect();
    if (!("IntersectionObserver" in window)) return visible;
    ctaObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) continue;
        trackCtaView(entry.target);
        ctaObserver?.unobserve(entry.target);
      }
    }, { threshold: [0.35] });
    visible.forEach((link) => ctaObserver.observe(link));
    return visible;
  };

  const pageView = payload("page_view", state.page_view_event_id, { metric: "sales_page_view" });
  pushGtm("page_view", state.page_view_event_id, { metric: "sales_page_view" });
  void send(pageView);

  prepareCheckoutLinks();
  observeVisibleCtas();
  for (const item of loadQueue()) void send(item.payload);

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element
      ? event.target.closest('a[href*="pay.hotmart.com"]')
      : null;
    if (!link) return;

    if (!link.dataset.rxSalesPageCta) reindexVisibleCtas();
    const properties = ctaProperties(link);
    trackCtaView(link);

    if (properties.cta_index) {
      const ctaClickEventId = eventIdForCta("click", properties.cta_position);
      pushGtm("rx_sales_page_cta_click", ctaClickEventId, properties);
      void send(payload("cta_click", ctaClickEventId, properties));
    }

    if (!validUuid(state.checkout_event_id)) {
      state.checkout_event_id = uuid();
      saveState();
    }
    pushGtm("rx_checkout_click", state.checkout_event_id, properties);
    void send(payload("checkout_click", state.checkout_event_id, properties));
  }, { capture: true });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => observeVisibleCtas(), 180);
  });

  window.addEventListener("online", () => {
    for (const item of loadQueue()) void send(item.payload);
  });
})();