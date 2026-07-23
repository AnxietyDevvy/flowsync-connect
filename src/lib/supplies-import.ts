import * as XLSX from "xlsx";
import type { Supply, SupplyStatus } from "./flowsync-store";

export type ImportRow = {
  name: string;
  stock: string;
  reorder: string;
  notes: string;
  status: SupplyStatus;
};

export type ImportPlan = {
  toInsert: ImportRow[];
  toUpdate: { id: string; row: ImportRow }[];
  problems: { rowIndex: number; reason: string }[];
};

const NAME_KEYS = ["item name", "item", "name", "supply", "product"];
const STOCK_KEYS = ["stock", "stock level", "on hand", "qty", "quantity"];
const REORDER_KEYS = ["reorder", "reorder level", "reorder at", "min", "threshold"];
const NOTES_KEYS = ["notes", "note", "comment", "comments"];

function pickKey(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    const found = headers.find((h) => h.trim().toLowerCase() === c);
    if (found) return found;
  }
  return null;
}

function computeStatus(stock: string, reorder: string): SupplyStatus {
  const s = parseFloat(stock);
  const r = parseFloat(reorder);
  if (!isNaN(s) && s <= 0) return "reorder";
  if (!isNaN(s) && !isNaN(r) && s <= r) return "low";
  return "ok";
}

export async function parseSuppliesFile(file: File): Promise<{
  rows: ImportRow[];
  problems: { rowIndex: number; reason: string }[];
  headersFound: { name: string | null; stock: string | null; reorder: string | null; notes: string | null };
}> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (json.length === 0) {
    return {
      rows: [],
      problems: [{ rowIndex: 0, reason: "File is empty" }],
      headersFound: { name: null, stock: null, reorder: null, notes: null },
    };
  }
  const headers = Object.keys(json[0]);
  const nameKey = pickKey(headers, NAME_KEYS);
  const stockKey = pickKey(headers, STOCK_KEYS);
  const reorderKey = pickKey(headers, REORDER_KEYS);
  const notesKey = pickKey(headers, NOTES_KEYS);

  const rows: ImportRow[] = [];
  const problems: { rowIndex: number; reason: string }[] = [];

  if (!nameKey) {
    problems.push({ rowIndex: 0, reason: "No 'Item name' column found" });
  }

  json.forEach((raw, i) => {
    const rowNum = i + 2; // header is row 1
    const name = nameKey ? String(raw[nameKey] ?? "").trim() : "";
    if (!name) {
      if (nameKey) problems.push({ rowIndex: rowNum, reason: "Missing item name" });
      return;
    }
    const stock = stockKey ? String(raw[stockKey] ?? "").trim() : "";
    const reorder = reorderKey ? String(raw[reorderKey] ?? "").trim() : "";
    const notes = notesKey ? String(raw[notesKey] ?? "").trim() : "";
    if (stock && isNaN(parseFloat(stock))) {
      problems.push({ rowIndex: rowNum, reason: `Stock "${stock}" is not a number` });
    }
    rows.push({
      name,
      stock,
      reorder,
      notes,
      status: computeStatus(stock, reorder),
    });
  });

  return {
    rows,
    problems,
    headersFound: { name: nameKey, stock: stockKey, reorder: reorderKey, notes: notesKey },
  };
}

export function buildImportPlan(rows: ImportRow[], existing: Supply[]): ImportPlan {
  const byName = new Map(existing.map((s) => [s.name.trim().toLowerCase(), s]));
  const toInsert: ImportRow[] = [];
  const toUpdate: { id: string; row: ImportRow }[] = [];
  for (const row of rows) {
    const match = byName.get(row.name.trim().toLowerCase());
    if (match) toUpdate.push({ id: match.id, row });
    else toInsert.push(row);
  }
  return { toInsert, toUpdate, problems: [] };
}