/* RaioX01 only. Ordered transport; no optimistic saves, no new analytics events. */
(function (root) {
  'use strict';
  const settings = { enabled: false, percent: 0,
    endpoint: 'https://nklqcamhkwqictdmictb.supabase.co/functions/v1/raiox01-collect-batch' };
  const idOK = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  function enroll(o) {
    if (!idOK(o.sessionId)) return false;
    const forceTest = o.testMode === true && o.forceTest === true;
    if (!forceTest && (!settings.enabled || settings.percent <= 0)) return false;
    const key = 'rx01_batch_v1_' + o.sessionId + (o.testMode ? '_test' : '_prod');
    try {
      const previous = o.storage.getItem(key);
      if (previous === 'legacy') return false;
      if (previous === 'batch') return true;
      // A session created by the previous release must not switch transport mid-quiz.
      if (o.resumed) return false;
      const bucket = parseInt(o.sessionId.replace(/-/g, '').slice(0, 8), 16) % 10000;
      const selected = forceTest || bucket < Math.min(5, settings.percent) * 100;
      o.storage.setItem(key, selected ? 'batch' : 'legacy');
      return selected;
    } catch (_) { return false; }
  }
  function create(o) {
    if (!enroll(o)) return null;
    let running = false, scheduled = false, batchEnabled = true;
    const queue = [], pending = new Map(), encoder = new TextEncoder();
    const metrics = { batches: 0, singles: 0, fallbacks: 0, confirmed: 0 };
    const storageKey = 'rx01_batch_v1_' + o.sessionId + (o.testMode ? '_test' : '_prod');
    const makeEnvelope = rows => ({ batch_version: 'rx01-batch-v1',
      session_id: o.sessionId, session_token: o.getToken(), test_mode: o.testMode,
      page_url: rows[0].p.page_url, events: rows.map(x => x.p) });
    const disable = () => {
      batchEnabled = false;
      try { o.storage.setItem(storageKey, 'legacy'); } catch (_) {}
    };
    function settle(entry, err, ack) {
      pending.delete(entry.p.event_id);
      if (err) entry.reject(err); else { metrics.confirmed += ack?.stored === true ? 1 : 0; entry.resolve(ack); }
    }
    async function single(entry) {
      try {
        if (!o.allowed(entry.p)) { settle(entry, null, {skipped:true}); return; }
        if (!o.getToken() && entry.p.event_id !== o.bootstrap().event_id) await o.requestOne(o.bootstrap());
        metrics.singles++;
        settle(entry, null, await o.requestOne(entry.p));
      } catch (err) { settle(entry, err); }
    }
    async function deliver(rows) {
      if (rows.length === 1 || !batchEnabled || !o.getToken()) {
        for (const row of rows) await single(row);
        return;
      }
      const startedAt = performance.now(), abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), o.timeoutMs || 18000);
      try {
        metrics.batches++;
        const response = await (o.fetch || root.fetch)(settings.endpoint, {
          method: 'POST', mode: 'cors', credentials: 'omit', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(makeEnvelope(rows)), signal: abort.signal, keepalive: true,
        });
        const a = await response.json().catch(() => null);
        if (!response.ok || a?.ok !== true || a?.stored !== true || a.atomic !== true
          || a.batch_version !== 'rx01-batch-v1' || a.test_mode !== o.testMode
          || !idOK(a.session_token) || !Array.isArray(a.receipts) || !Array.isArray(a.event_ids)
          || a.receipts.length !== rows.length || a.event_ids.length !== rows.length) throw Error('batch_not_confirmed');
        // Validate every receipt before resolving any caller or updating session state.
        for (let i=0; i<rows.length; i++) {
          const receipt = a.receipts[i], p = rows[i].p;
          if (a.event_ids[i] !== p.event_id || receipt?.event_id !== p.event_id
            || receipt.ok !== true || receipt.stored !== true || receipt.test_mode !== o.testMode
            || typeof receipt.lead_created !== 'boolean' || !idOK(receipt.session_token)) throw Error('invalid_batch_receipt');
        }
        if (!o.testMode && rows.some(x => x.p.event_name === 'quiz_complete') &&
          (a.quiz_status?.finalizou !== true || a.quiz_status?.status !== 'concluido' ||
           a.quiz_status?.perguntas_respondidas !== 5 || a.quiz_status?.etapas_concluidas !== 7)) throw Error('completion_not_confirmed');
        for (let i=0; i<rows.length; i++) {
          const receipt = {...a.receipts[i], session_token:a.session_token,
            quiz_status:a.quiz_status, quiz_projection:a.quiz_projection};
          o.onStored(rows[i].p, receipt);
          settle(rows[i], null, receipt);
        }
        try { o.onTiming?.({mode:'batch',events:rows.length,ms:performance.now()-startedAt}); } catch (_) {}
      } catch (_) {
        // Never claim that an uncertain request failed to write. Reuse the SAME IDs
        // with the original idempotent ingest, in order. No new IDs or dropped rows.
        metrics.fallbacks++; disable();
        for (const row of rows) await single(row);
      } finally { clearTimeout(timer); }
    }
    async function drain() {
      if (running) return;
      running = true;
      try {
        while (queue.length) {
          const first = queue.shift();
          if (!o.allowed(first.p)) { settle(first, null, {skipped:true}); continue; }
          const rows = [first];
          if (batchEnabled && o.getToken()) {
            while (queue.length && rows.length < 8) {
              const next = queue[0], last = rows[rows.length-1];
              if (!o.allowed(next.p)) { queue.shift(); settle(next,null,{skipped:true}); continue; }
              if (next.p.page_url !== first.p.page_url || next.p.sequence <= last.p.sequence) break;
              if (encoder.encode(JSON.stringify(makeEnvelope([...rows,next]))).length > 24000) break;
              rows.push(queue.shift());
            }
          }
          await deliver(rows);
        }
      } finally { running = false; if (queue.length) schedule(); }
    }
    function schedule() {
      if (running || scheduled) return;
      scheduled = true;
      // No wait to fill a batch: only coalesce events already queued in this turn.
      queueMicrotask(() => { scheduled = false; void drain(); });
    }
    function enqueue(p) {
      const snapshot = JSON.stringify(p), old = pending.get(p.event_id);
      if (old) return old.snapshot === snapshot ? old.promise : Promise.reject(Error('event_id_payload_changed'));
      const entry = {p,snapshot};
      entry.promise = new Promise((resolve,reject) => { entry.resolve=resolve; entry.reject=reject; });
      pending.set(p.event_id,entry); queue.push(entry); schedule(); return entry.promise;
    }
    return { enqueue, diagnostics: () => ({...metrics,active:batchEnabled,pending:queue.length}) };
  }
  const api = {settings,enroll,create};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RXOrderedBatch = api;
})(typeof window === 'object' ? window : globalThis);
