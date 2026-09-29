// Standalone collector. No shared Apps Script project or existing deployment is changed.
function out(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return out({ok: true, service: "meuraiox01"}); }
function doPost(event) {
  try { return saveMeuRaioX01(JSON.parse(event.postData.contents || "{}")); }
  catch (error) { return out({ok: false, error: "invalid_json"}); }
}

function saveMeuRaioX01(p) {
  if (p.source !== "quiz_meuraiox01" || !/^[a-zA-Z0-9-]{8,120}$/.test(String(p.submission_id || "")) ||
      ["quiz_completed", "checkout_clicked"].indexOf(p.event) < 0 || !p.nome || !p.telefone) {
    return out({ok: false, error: "invalid_participation"});
  }
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    // Never use a client-supplied spreadsheet, tab or row.
    var sheet = SpreadsheetApp.openById("1OBr2lZO_AyVS30f2_KD0qwLtrBxyY-8owmbVCq50KK4").getSheetByName("Leads Meu Raio X 01");
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idColumn = headers.indexOf("submission_id") + 1;
    if (!idColumn) throw new Error("missing_id_column");
    var found = sheet.getLastRow() > 1 ? sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1)
      .createTextFinder(String(p.submission_id)).matchEntireCell(true).findNext() : null;
    var row = found ? found.getRow() : sheet.getLastRow() + 1;
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
    var prior = found ? sheet.getRange(row, 1, 1, headers.length).getValues()[0] : headers.map(function() { return ""; });
    var previous = function(key) { return prior[headers.indexOf(key)] || ""; };
    if (found && Date.parse(p.atualizado_em) < Date.parse(previous("atualizado_em"))) {
      return out({ok: true, ignored: "older_event"});
    }
    var checkout = p.event === "checkout_clicked" || previous("clicou_checkout") === "sim";
    p.quiz_completo = p.acessou_quiz = p.chegou_captura = p.enviou_dados = p.resultado_visto = "sim";
    p.status_resposta = "concluída";
    p.clicou_checkout = checkout ? "sim" : "";
    p.ultimo_evento = checkout ? "checkout_clicked" : "quiz_completed";
    p.etapa_atual = checkout ? "Meu Raio X 01 — checkout" : "Meu Raio X 01 — mapa visual concluído";
    p.primeiro_envio_em = previous("primeiro_envio_em") || p.primeiro_envio_em;
    p.checkout_clicked_at = previous("checkout_clicked_at") || p.checkout_clicked_at || "";
    var values = headers.map(function(key, index) {
      var value = Object.prototype.hasOwnProperty.call(p, key) ? p[key] : prior[index];
      value = String(value == null ? "" : value).slice(0, 4000);
      // Keep user input as text rather than formulas.
      return /^[=+@-]/.test(value) ? "'" + value : value;
    });
    sheet.getRange(row, 1, 1, headers.length).setValues([values]);
    SpreadsheetApp.flush();
    return out({ok: true, service: "meuraiox01", row: row});
  } catch (error) {
    return out({ok: false, error: String(error.message || error)});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
