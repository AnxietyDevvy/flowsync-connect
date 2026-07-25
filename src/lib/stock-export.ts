import * as XLSX from "xlsx";
import type { Order, Supply, CatalogProduct } from "./flowsync-store";

export function exportMonthlyStock(opts: {
  year: number;
  month: number; // 1-12
  supplies: Supply[];
  products: CatalogProduct[];
  orders: Order[];
}) {
  const { year, month, supplies } = opts;

  const rows = supplies.map((s) => ({
    "Item Name": s.name,
    Stock: typeof s.stock === "number" ? s.stock : Number(s.stock) || 0,
    Reorder: typeof s.reorder === "number" ? s.reorder : Number(s.reorder) || 0,
    Notes: s.notes ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(
    rows.length ? rows : [{ "Item Name": "", Stock: "", Reorder: "", Notes: "" }],
    { header: ["Item Name", "Stock", "Reorder", "Notes"] },
  );
  ws["!cols"] = [{ wch: 50 }, { wch: 10 }, { wch: 10 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const mm = String(month).padStart(2, "0");
  XLSX.writeFile(wb, `flowsync-stock-${year}-${mm}.xlsx`);
}