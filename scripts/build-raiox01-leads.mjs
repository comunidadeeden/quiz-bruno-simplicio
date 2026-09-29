import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/private/tmp/raiox01-leads";
const outputFile = `${outputDir}/raiox01-leads.xlsx`;
const previewFile = `${outputDir}/raiox01-leads.png`;

const headers = [
  "submission_id",
  "status_resposta",
  "ultimo_evento",
  "primeiro_envio_em",
  "atualizado_em",
  "concluido_em",
  "checkout_clicked_at",
  "nome",
  "email",
  "telefone",
  "perfil",
  "situacao_valiosa",
  "leitura_corpo_atual",
  "desejo_de_leitura",
  "leitura_rosto_atual",
  "erro_que_quer_evitar",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "src",
  "sck",
  "page_url"
];

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Leads Raio X 01");
sheet.showGridLines = false;
sheet.getRange("A1:Z1").values = [headers];
sheet.getRange("A1:Z1").format = {
  fill: "#17365D",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#17365D" }
};
sheet.getRange("A1:Z1").format.rowHeightPx = 44;
sheet.freezePanes.freezeRows(1);
sheet.getRange("A:Z").format.columnWidthPx = 155;
sheet.getRange("A:A").format.columnWidthPx = 220;
sheet.getRange("B:B").format.columnWidthPx = 130;
sheet.getRange("D:G").format.columnWidthPx = 175;
sheet.getRange("H:H").format.columnWidthPx = 180;
sheet.getRange("I:J").format.columnWidthPx = 210;
sheet.getRange("K:P").format.columnWidthPx = 290;
sheet.getRange("Q:Z").format.columnWidthPx = 180;
sheet.getRange("A2:Z2").values = [headers.map(() => "")];
sheet.getRange("A2:Z2").format = {
  fill: "#F8FAFC",
  borders: { preset: "inside", style: "thin", color: "#E5EAF0" }
};

await fs.mkdir(outputDir, { recursive: true });
const inspection = await workbook.inspect({
  kind: "table",
  range: "Leads Raio X 01!A1:Z2",
  include: "values",
  tableMaxRows: 4,
  tableMaxCols: 26
});
if (!inspection.ndjson.includes("submission_id") || !inspection.ndjson.includes("erro_que_quer_evitar")) {
  throw new Error("Cabeçalhos da planilha não foram criados corretamente.");
}

const preview = await workbook.render({ sheetName: "Leads Raio X 01", range: "A1:P2", scale: 1.5 });
await fs.writeFile(previewFile, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputFile);
console.log(outputFile);
