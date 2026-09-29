/* Configuração pública: NUNCA coloque senhas, Hottok ou service_role aqui. */
window.RX_CONFIG = {
  version: "raiox-v3.0", // Protocolo mantido: compatível com o workflow V3 já importado.
  pageBuild: "2026-09-29-supabase-direct-status",
  resumeSession: true, // Mesma aba, até 6 horas; sem nome/email/telefone no armazenamento local.
  sessionMaxAgeMs: 21600000,
  correlateCheckout: true, // Acrescenta marcador opaco ao sck, sem dados pessoais.
  heartbeatSeconds: 30, // Somente com medição opcional autorizada.
  webhookUrl: "https://nklqcamhkwqictdmictb.supabase.co/functions/v1/raiox01-collect",
  gtmId: "GTM-MZBZ9HCS",
  testMode: false, // Produção. Use ?rx_test=1 para homologar sem gravar leads reais.
  source: "quiz_raiox01",
  launch: "raiox01_2026_09", // Contrato direto do Supabase. Não alterar sem atualizar a função de ingestão.
  privacyPolicyUrl: "", // Insira a política real do controlador antes de publicar.
  consentVersion: "rx01-2026-09-25",
  enableVkAfterConsent: true,
  webhookTimeoutMs: 12000,
  maxRetries: 2
};

// Homologação opcional sem editar código. ?rx_test=1 isola dados e bloqueia GA4/Meta/VK.
if (new URLSearchParams(window.location.search).get("rx_test") === "1") window.RX_CONFIG.testMode = true;