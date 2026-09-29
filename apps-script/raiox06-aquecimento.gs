// Dedicated intake for workshop students. Never accepts a destination from the client.
const WARMUP_SHEET_ID = "18N9QfsXG5mGdG05n4uLqBe4kQWP1gIjS_5GQGQ3tSlM";
const WARMUP_TAB = "Respostas do aquecimento";
const FIELDS = [["nome", "Nome"], ["telefone", "WhatsApp"], ["perfil", "Dois traços"], ["status_resposta", "Situação"], ["primeiro_envio_em", "Início"], ["atualizado_em", "Última atualização"], ["concluido_em", "Conclusão"], ["resposta_01", "1. Quando alguém muda"], ["resposta_02", "2. Em um ambiente novo"], ["resposta_03", "3. Antes de confiar"], ["resposta_04", "4. Numa discussão"], ["resposta_05", "5. Mais um favor"], ["resposta_06", "6. O elogio que importa"], ["resposta_07", "7. Um plano dá errado"], ["resposta_08", "8. Quando algo machuca"], ["resposta_09", "9. O que mais desgasta"], ["resposta_10", "10. O que quer mudar"], ["desempate_01", "Desempate 1"], ["desempate_02", "Desempate 2"], ["pontos_TE", "Pontos TE"], ["pontos_TO", "Pontos TO"], ["pontos_TP", "Pontos TP"], ["pontos_TM", "Pontos TM"], ["pontos_TR", "Pontos TR"], ["etapa_atual", "Etapa atual"], ["ultimo_evento", "Último evento"], ["page_url", "Página"], ["submission_id", "ID da participação"], ["revision", "Revisão"], ["source", "Origem"], ["registro_original", "Dados originais"], ["faixa_etaria", "Faixa etária"], ["atuacao_atual", "Atende profissionalmente?"], ["profissao", "Profissão / ocupação"], ["renda_mensal", "Renda mensal"], ["mudanca_desejada", "O que mudaria na vida"], ["motivacao_principal", "Principal motivação"], ["investimento_formacao", "Investimento em formação"], ["origem_declarada", "Como me conheceu"], ["pergunta_aula", "Pergunta para a aula"], ["email", "E-mail"], ["versao_exercicio", "Versão do exercício"]];
function reply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return reply({ok:true, service:"raiox06-aquecimento"}); }
function doPost(e) {
  let lock;
  try {
    const p = JSON.parse(e.postData.contents || "{}");
    if (p.source !== "quiz_raiox06" || typeof p.submission_id !== "string" || !/^[a-zA-Z0-9_-]{10,100}$/.test(p.submission_id)) {
      return reply({ok:false,error:"invalid_participation"});
    }
    const revision = Number(p.revision) || Date.parse(p.atualizado_em || p.timestamp) * 1000;
    if (!Number.isFinite(revision) || revision <= 0) return reply({ok:false,error:"invalid_revision"});
    lock = LockService.getScriptLock();
    lock.waitLock(25000);
    const sheet = SpreadsheetApp.openById(WARMUP_SHEET_ID).getSheetByName(WARMUP_TAB);
    if (!sheet) throw new Error("missing_sheet");
    const actualHeaders = sheet.getRange(1,1,1,FIELDS.length).getValues()[0];
    if (!FIELDS.every((f,i) => f[1] === actualHeaders[i])) throw new Error("header_mismatch");
    const last = sheet.getLastRow();
    const idColumn = FIELDS.findIndex(f => f[0] === "submission_id") + 1;
    const found = last > 1 ? sheet.getRange(2,idColumn,last-1,1).createTextFinder(p.submission_id).matchEntireCell(true).useRegularExpression(false).findNext() : null;
    const row = found ? found.getRow() : last + 1;
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),100);
    const current = found ? sheet.getRange(row,1,1,FIELDS.length).getValues()[0] : FIELDS.map(() => "");
    const revIndex = FIELDS.findIndex(f => f[0] === "revision");
    if (Number(current[revIndex]) >= revision) return reply({ok:true,ignored:"older_or_duplicate",submission_id:p.submission_id});
    p.revision = revision;
    const completed = p.resultado_visto === "sim" || p.quiz_completo === "sim" || Boolean(p.concluido_em);
    if (completed) p.status_resposta = "concluída";
    const values = FIELDS.map(([key],i) => {
      let v = Object.prototype.hasOwnProperty.call(p,key) ? p[key] : current[i];
      if (key === "primeiro_envio_em" && current[i]) v = current[i];
      if (key === "registro_original") v = JSON.stringify(p);
      if (typeof v === "number") return v;
      const text = String(v == null ? "" : v).slice(0,45000);
      return /^[=+@-]/.test(text) ? "'" + text : text;
    });
    sheet.getRange(row,1,1,FIELDS.length).setValues([values]);
    SpreadsheetApp.flush();
    return reply({ok:true,submission_id:p.submission_id});
  } catch (error) {
    console.error(String(error));
    return reply({ok:false,error:"save_failed"});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
