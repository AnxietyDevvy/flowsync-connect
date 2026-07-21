import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, type Supply, type SupplyStatus } from "@/lib/flowsync-store";

export function SupplyForm({
  initial,
  onDone,
}: {
  initial?: Supply;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [stock, setStock] = useState(initial?.stock ?? "");
  const [reorder, setReorder] = useState(initial?.reorder ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<SupplyStatus>(initial?.status ?? "ok");

  const save = () => {
    if (!name.trim()) return;
    if (initial) {
      store.updateSupply(initial.id, { name, stock, reorder, notes, status });
    } else {
      store.addSupply({ name, stock, reorder, notes, status });
    }
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sname">Item name</Label>
        <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock level</Label>
          <Input id="stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reorder">Reorder level</Label>
          <Input id="reorder" value={reorder} onChange={(e) => setReorder(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as SupplyStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="reorder">Reorder needed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="snotes">Notes</Label>
        <Textarea id="snotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={save}>{initial ? "Save changes" : "Add supply"}</Button>
      </div>
    </div>
  );
}