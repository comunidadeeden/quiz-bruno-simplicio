const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const reply = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });

const str = (value: unknown, max = 500): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
};

const isoDate = (value: unknown): string | null => {
  const text = str(value, 100);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
};

const cents = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number / 100 : null;
};

async function sameSecret(expected: string, supplied: string): Promise<boolean> {
  const digest = async (value: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(expected), digest(supplied)]);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
}

async function rpc(name: string, body: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("supabase_runtime_missing");

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`${name}_failed_${response.status}`);
  return await response.json();
}

function normalizePhone(value: unknown): string | null {
  const raw = str(value, 50);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") && /^[1-9][0-9]{7,14}$/.test(digits)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

function statusDate(invoice: Record<string, any>, targetStatus: string): string | null {
  const rows = Array.isArray(invoice.statusAt) ? invoice.statusAt : [];
  const matches = rows
    .filter((row) => row && String(row.status ?? "").toLowerCase() === targetStatus)
    .map((row) => isoDate(row.when))
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return matches[0] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return reply({ ok: false, stored: false, code: "method_not_allowed", http_status: 405 }, 405);
  }

  let body: Record<string, any>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 131072) {
      return reply({ ok: false, stored: false, code: "payload_too_large", http_status: 413 }, 413);
    }
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid_json");
  } catch {
    return reply({ ok: false, stored: false, code: "invalid_json", http_status: 400 }, 400);
  }

  const eventType = str(body.type, 120);
  const event = body.event && typeof body.event === "object" ? body.event : {};
  const invoice = event.invoice && typeof event.invoice === "object" ? event.invoice : {};
  const productsRaw = Array.isArray(event.products)
    ? event.products
    : event.product && typeof event.product === "object"
      ? [event.product]
      : [];
  const product = productsRaw.length === 1 && productsRaw[0] && typeof productsRaw[0] === "object"
    ? productsRaw[0] as Record<string, any>
    : null;

  const productId = str(product?.id, 300);
  const productName = str(product?.name ?? product?.title, 500);
  const offers = Array.isArray(product?.offers) ? product?.offers : [];
  const offerIds = offers.map((offer: any) => str(offer?.id, 300)).filter((value: string | null): value is string => Boolean(value));
  const invoiceId = str(invoice.id, 300);
  const eventAt = isoDate(invoice.modifiedAt) ?? isoDate(invoice.createdAt) ?? isoDate(body.createdAt) ?? new Date().toISOString();

  let runtime: Record<string, any>;
  try {
    runtime = await rpc("get_hubla_webhook_runtime", {
      p_event_at: eventAt,
      p_product_id: productId,
      p_offer_ids: offerIds,
      p_product_name: productName,
    });
  } catch {
    return reply({ ok: false, stored: false, code: "runtime_unavailable", http_status: 503 }, 503);
  }

  const expected = str(runtime?.hubla_token, 1000);
  const supplied = req.headers.get("x-hubla-token") ?? "";
  if (!expected || !(await sameSecret(expected, supplied))) {
    return reply({ ok: false, stored: false, code: "unauthorized", http_status: 401 }, 401);
  }

  const idempotency = str(req.headers.get("x-hubla-idempotency"), 300);
  const sandboxHeader = String(req.headers.get("x-hubla-sandbox") ?? "").toLowerCase();
  const sandbox = ["1", "true", "yes"].includes(sandboxHeader);

  const allowedEvents = new Set([
    "invoice.created",
    "invoice.status_updated",
    "invoice.payment_succeeded",
    "invoice.refunded",
    "invoice.expired",
    "invoice.payment_failed",
  ]);

  const statuses: Record<string, string> = {
    unpaid: "pending",
    paid: "approved",
    refunded: "refunded",
    canceled: "cancelled",
    cancelled: "cancelled",
    chargeback: "chargeback",
    overdue: "pending",
    expired: "expired",
  };

  const invoiceStatus = String(invoice.status ?? "").toLowerCase();
  const normalizedStatus = statuses[invoiceStatus] ?? null;
  const version = Number(invoice.version);
  const parentInvoiceId = str(invoice.parentInvoiceId, 300);

  let pendingReason: string | null = null;
  if (!eventType || !allowedEvents.has(eventType)) pendingReason = "evento_fora_do_escopo";
  else if (!invoiceId) pendingReason = "invoice_ausente";
  else if (!product || productsRaw.length !== 1) pendingReason = "formato_de_produto_ambiguo";
  else if (parentInvoiceId) pendingReason = "fatura_vinculada_order_bump";
  else if (!Number.isSafeInteger(version) || version < 0) pendingReason = "invoice_version_ausente";
  else if (!normalizedStatus) pendingReason = "status_nao_suportado";
  else if (Number(runtime?.route_matches ?? 0) !== 1 || !runtime?.target) pendingReason = "produto_nao_configurado";
  else if (!runtime?.lancamento) pendingReason = "lancamento_fora_da_janela";

  const payer = {
    ...(event.user && typeof event.user === "object" ? event.user : {}),
    ...(invoice.payer && typeof invoice.payer === "object" ? invoice.payer : {}),
  };
  const emailRaw = str(payer.email, 254)?.toLowerCase() ?? null;
  const email = emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;
  const name = str(
    [payer.firstName, payer.lastName].filter(Boolean).join(" ") || payer.name,
    200,
  );
  const phone = normalizePhone(payer.phone);

  const amount = invoice.amount && typeof invoice.amount === "object" ? invoice.amount : {};
  const totalValue = cents(amount.totalCents);
  const netValue =
    cents(amount.netCents) ??
    cents(amount.sellerCents) ??
    cents(amount.producerCents);
  const currency = str(invoice.currency, 3)?.toUpperCase() ?? null;

  const paymentSession = invoice.paymentSession && typeof invoice.paymentSession === "object"
    ? invoice.paymentSession
    : {};
  const utm = paymentSession.utm && typeof paymentSession.utm === "object"
    ? paymentSession.utm
    : {};
  const params = paymentSession.params && typeof paymentSession.params === "object"
    ? paymentSession.params
    : {};
  const cookies = paymentSession.cookies && typeof paymentSession.cookies === "object"
    ? paymentSession.cookies
    : {};

  if (totalValue === null || !currency || !/^[A-Z]{3}$/.test(currency)) {
    pendingReason = pendingReason ?? "valor_ou_moeda_ausente";
  }

  const eventId = idempotency
    ?? [eventType ?? "invoice", invoiceId ?? "sem_invoice", Number.isSafeInteger(version) ? version : "sem_versao", eventAt].join(":");

  const normalized = {
    event_id: eventId,
    idempotency_key: idempotency,
    event_type: eventType,
    event_created_at: eventAt,
    invoice_id: invoiceId,
    invoice_version: Number.isSafeInteger(version) ? version : null,
    target: Number(runtime?.route_matches ?? 0) === 1 ? str(runtime.target, 30) : null,
    route_source: str(runtime?.route_source, 50),
    lancamento: str(runtime?.lancamento, 100),
    pending_reason: pendingReason,
    sandbox,
    parent_invoice_id: parentInvoiceId,
    product_id: productId,
    product_name: productName,
    offer_ids: offerIds,
    nome: name,
    email,
    telefone: phone,
    status: normalizedStatus,
    valor: totalValue,
    valor_liquido: netValue,
    moeda: currency,
    payment_type: str(invoice.paymentMethod, 120),
    checkout_url: str(paymentSession.url, 1500),
    approved_at: statusDate(invoice, "paid"),
    refunded_at: statusDate(invoice, "refunded"),
    created_at: isoDate(invoice.createdAt),
    updated_at: isoDate(invoice.modifiedAt),
    src: str(params.src, 1000),
    sck: str(params.sck, 4000),
    utm_source: str(utm.source, 500),
    utm_medium: str(utm.medium, 500),
    utm_campaign: str(utm.campaign, 500),
    utm_content: str(utm.content, 500),
    utm_term: str(utm.term, 500),
    fbclid: str(cookies.fbclid, 1000),
    fbc: str(cookies.fbc, 1000),
    fbp: str(cookies.fbp, 1000),
    raw_data: body,
  };

  try {
    const ack = await rpc("hubla_ingest", { p: normalized });
    const status = Number(ack?.http_status ?? (ack?.ok ? 200 : 503));
    return reply(ack, Number.isFinite(status) ? status : 200);
  } catch {
    return reply({ ok: false, stored: false, code: "storage_unavailable", http_status: 503 }, 503);
  }
});