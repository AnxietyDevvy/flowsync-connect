import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFlowSync } from "@/lib/flowsync-store";
import { exportMonthlyStock } from "@/lib/stock-export";

export function StockExport() {
  const { orders, supplies, products } = useFlowSync();
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [open, setOpen] = useState(false);
  const [monthStr, setMonthStr] = useState(defaultMonth);

  const handleExport = () => {
    const [y, m] = monthStr.split("-").map((n) => parseInt(n, 10));
    if (!y || !m) return;
    exportMonthlyStock({ year: y, month: m, supplies, products, orders });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-1 h-4 w-4" /> Export stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export monthly stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Downloads an Excel file with three sheets: current supplies snapshot,
            product stock &amp; materials, and orders from the selected month.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="month"
              value={monthStr}
              onChange={(e) => setMonthStr(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-1 h-4 w-4" /> Download .xlsx
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}