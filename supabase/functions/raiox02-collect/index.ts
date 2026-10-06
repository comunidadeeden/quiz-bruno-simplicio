const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const adminHeaders = {
  "Content-Type": "application/json",
  "apikey": SERVICE_KEY,
  "Authorization": "Bearer " + SERVICE_KEY,
};

async function backupBegin(quizId: string, payload: unknown): Promise<string | null> {
  try {
    const response = await fetch(SUPABASE_URL + "/rest/v1/rpc/raiox_backup_begin", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ p_quiz_id: quizId, p_payload: payload }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const id = await response.json().catch(() => null);
    return typeof id === "string" && id.length > 10 ? id : null;
  } catch (_) {
    return null;
  }
}

function normalizeOccurredAt(payload: any): any {
  const normalizeOne = (event: any) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) return event;
    const raw = typeof event.occurred_at === "string" ? event.occurred_at : "";
    const parsed = Date.parse(raw);
    const now = Date.now();
    if (
      Number.isFinite(parsed) &&
      (parsed > now + 10 * 60 * 1000 || parsed < now - 7 * 24 * 60 * 60 * 1000)
    ) {
      const properties = event.properties && typeof event.properties === "object" && !Array.isArray(event.properties)
        ? event.properties
        : {};
      return {
        ...event,
        occurred_at: new Date().toISOString(),
        properties: {
          ...properties,
          client_occurred_at_raw: raw,
          occurred_at_normalized: true,
        },
      };
    }
    return event;
  };

  if (payload && typeof payload === "object" && Array.isArray(payload.events)) {
    return { ...payload, events: payload.events.map(normalizeOne) };
  }
  return normalizeOne(payload);
}

async function backupFinish(
  backupId: string | null,
  status: "stored" | "failed",
  httpStatus: number,
  errorCode: string | null,
  responsePayload: unknown,
): Promise<void> {
  if (!backupId) return;
  try {
    await fetch(SUPABASE_URL + "/rest/v1/rpc/raiox_backup_finish", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        p_backup_id: backupId,
        p_status: status,
        p_http_status: httpStatus,
        p_error_code: errorCode,
        p_response: responsePayload ?? null,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (_) {
    // O backup inicial já foi salvo. Se a finalização falhar, permanece "received"
    // para inspeção manual em vez de perder o payload.
  }
}

// Only the audit status is finalized after the response. The raw backup and
// the main ingest transaction remain awaited; stored=true is never optimistic.
async function finishStoredBackup(
  backupId: string | null,
  httpStatus: number,
  output: unknown,
): Promise<"background" | "awaited" | "unavailable"> {
  if (!backupId) return "unavailable";
  const task = backupFinish(backupId, "stored", httpStatus, null, output);
  const runtime = (globalThis as typeof globalThis & {
    EdgeRuntime?: { waitUntil: (task: Promise<unknown>) => void };
  }).EdgeRuntime;
  if (typeof runtime?.waitUntil === "function") {
    try {
      runtime.waitUntil(task);
      return "background";
    } catch (_) {
      // Tests/other runtimes may not support detached work: await the same task.
    }
  }
  await task;
  return "awaited";
}

Deno.serve(async (req: Request) => {
  const startedAt = performance.now();
  let backupMs = 0;
  let ingestMs = 0;
  let backupFinalization = "not_started";
  const origin = req.headers.get("origin") || "";
  const allowed = new Set([
    "https://bussoladacura.com.br",
    "https://www.bussoladacura.com.br",
    "https://quiz.brunosimplicio.com.br",
  ]);

  const cors = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "https://bussoladacura.com.br",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "600",
    "Access-Control-Expose-Headers": "Server-Timing, X-RX-Collector-Version, X-RX-Backup-Finalization",
    "X-RX-Collector-Version": "rx02-ack-fast-20261006-1",
  };

  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: {
      ...cors,
      "Server-Timing": `backup;dur=${backupMs.toFixed(1)}, ingest;dur=${ingestMs.toFixed(1)}, ack;dur=${(performance.now() - startedAt).toFixed(1)}`,
      "X-RX-Backup-Finalization": backupFinalization,
    } });

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return reply({ ok: false, stored: false, code: "method_not_allowed" }, 405);
  }

  if (origin && !allowed.has(origin)) {
    return reply({ ok: false, stored: false, code: "origin_not_allowed" }, 403);
  }

  let backupId: string | null = null;

  try {
    const raw = await req.text();

    if (new TextEncoder().encode(raw).length > 32768) {
      return reply({ ok: false, stored: false, code: "payload_too_large" }, 413);
    }

    const parsed = JSON.parse(raw);
    const p = parsed?.payload && typeof parsed.payload === "object" ? parsed.payload : parsed;
    const backupStartedAt = performance.now();
    backupId = await backupBegin("raiox02", p);
    backupMs = performance.now() - backupStartedAt;
    const ingestPayload = normalizeOccurredAt(p);

    const rpc = Array.isArray(ingestPayload.events) ? "raiox02_ingest_lote" : "raiox02_ingest";
    const ingestStartedAt = performance.now();
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/rpc/" + rpc,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ p: ingestPayload }),
        signal: AbortSignal.timeout(15000),
      },
    );

    const result = await response.json().catch(() => null);
    ingestMs = performance.now() - ingestStartedAt;

    if (!response.ok) {
      const failure = result && typeof result === "object"
        ? result
        : { ok: false, stored: false, code: "storage_unavailable" };
      await backupFinish(
        backupId,
        "failed",
        response.status >= 400 && response.status < 600 ? response.status : 503,
        typeof (failure as Record<string, unknown>)?.code === "string"
          ? String((failure as Record<string, unknown>).code)
          : "storage_unavailable",
        failure,
      );
      return reply(
        failure,
        response.status >= 400 && response.status < 600 ? response.status : 503,
      );
    }

    if (!result || typeof result !== "object") {
      const failure = { ok: false, stored: false, code: "invalid_storage_response" };
      await backupFinish(backupId, "failed", 503, failure.code, failure);
      return reply(failure, 503);
    }

    const output = {
      protocol: result.protocol || "rx02-20260929",
      integration_version: result.integration_version || ingestPayload.integration_version || "raiox-v3.0",
      ...result,
    } as Record<string, unknown>;

    const outputStatus = Number(output.http_status) || 200;
    const storedOk = output.ok === true && output.stored === true && outputStatus < 400;

    if (storedOk) {
      backupFinalization = await finishStoredBackup(backupId, outputStatus, output);
    } else {
      // Rejections/errors keep the existing synchronous diagnostic path.
      await backupFinish(backupId, "failed", outputStatus, String(output.code || "ingest_rejected"), output);
      backupFinalization = "awaited_failure";
    }

    return reply(output, outputStatus);
  } catch (error) {
    const code = error instanceof DOMException && error.name === "TimeoutError"
      ? "storage_timeout"
      : "invalid_request";
    const status = code === "storage_timeout" ? 504 : 400;
    const failure = { ok: false, stored: false, code };

    await backupFinish(backupId, "failed", status, code, failure);
    return reply(failure, status);
  }
});
