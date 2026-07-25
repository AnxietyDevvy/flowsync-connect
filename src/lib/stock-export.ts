import * as XLSX from "xlsx";
import type { Order, Supply, CatalogProduct } from "./flowsync-store";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function statusLabel(s: Supply["status"]) {
  return s === "ok" ? "OK" : s === "low" ? "Low" : "Reorder";
}

export function exportMonthlyStock(opts: {
  year: number;
  month: number; // 1-12
  supplies: Supply[];
  products: CatalogProduct[];
  orders: Order[];
}) {
  const { year, month, supplies, products, orders } = opts;
  const monthStart = new Date(year, month - 1, 1).getTime();
  const monthEnd = new Date(year, month, 1).getTime();

  const suppliesSheet = supplies.map((s) => ({
    "Item name": s.name,
    Stock: s.stock,
    "Reorder level": s.reorder,
    Status: statusLabel(s.status),
    Notes: s.notes,
    "Last updated": fmtDate(s.updatedAt),
    "Noticed by": s.noticedBy,
  }));

  const productsSheet = products.map((p) => ({
    Product: p.name,
    Category: p.category,
    Stock: p.stock,
    "Low-stock threshold": p.lowStock,
    Materials: (p.materials ?? [])
      .map((m) => `${m.name} (${m.quantity}${m.unit ? " " + m.unit : ""})`)
      .join("; "),
  }));

  const monthOrders = orders.filter((o) => {
    const t = o.createdAt;
    return t >= monthStart && t < monthEnd;
  });
  const ordersSheet: Record<string, string | number>[] = [];
  for (const o of monthOrders) {
    if (o.products.length === 0) {
      ordersSheet.push({
        "Order #": o.orderNumber,
        Date: o.date,
        Status: o.status,
        "Created by": o.createdBy,
        "Assigned to": o.assignedTo,
        Product: "",
        Quantity: "",
      });
      continue;
    }
    for (const line of o.products) {
      ordersSheet.push({
        "Order #": o.orderNumber,
        Date: o.date,
        Status: o.status,
        "Created by": o.createdBy,
        "Assigned to": o.assignedTo,
        Product: line.name,
        Quantity: line.quantity,
      });
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(suppliesSheet.length ? suppliesSheet : [{ "Item name": "" }]),
    "Supplies",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(productsSheet.length ? productsSheet : [{ Product: "" }]),
    "Products",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ordersSheet.length ? ordersSheet : [{ "Order #": "" }]),
    "Orders",
  );

  const mm = String(month).padStart(2, "0");
  XLSX.writeFile(wb, `flowsync-stock-${year}-${mm}.xlsx`);
}