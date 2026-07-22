import { BptLogo, FlowSyncLogo } from "@/components/flowsync/Logos";
import type { Order } from "@/lib/flowsync-store";

export function PrintSheet({ order }: { order: Order }) {
  return (
    <>
      <div id="flowsync-print-portal" className="hidden print:block bg-white text-black">
        <div className="mx-auto max-w-3xl px-8 py-6">
          <div className="border-b-4 border-red-600 pb-4">
            <div className="flex items-start justify-between gap-4">
              <BptLogo />
              <FlowSyncLogo />
            </div>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">
              Package Order
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Order number
              </div>
              <div className="mt-1 font-mono text-lg font-bold">
                {order.orderNumber}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Date
              </div>
              <div className="mt-1 text-lg font-bold">{order.date}</div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Notes
              </div>
              <div className="mt-1 whitespace-pre-wrap rounded border border-neutral-300 bg-neutral-50 p-3 text-sm">
                {order.notes}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
              Products
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="w-12 py-2 text-left">#</th>
                  <th className="py-2 text-left">Product</th>
                  <th className="w-24 py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((p, i) => (
                  <tr key={p.id} className="border-b border-neutral-300">
                    <td className="py-2 text-neutral-500">{i + 1}</td>
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 text-right font-mono">{p.quantity || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-10">
            <div>
              <div className="border-t-2 border-black pt-2 text-xs font-bold uppercase tracking-wider">
                Prepared by (signature)
              </div>
            </div>
            <div>
              <div className="border-t-2 border-black pt-2 text-xs font-bold uppercase tracking-wider">
                Received by (signature)
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-neutral-400">
            FlowSync · BPT Internal
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          html, body { background: white !important; margin: 0 !important; }
          body > *:not(#flowsync-print-portal-wrapper) { display: none !important; }
          #flowsync-print-portal { display: block !important; }
        }
      `}</style>
    </>
  );
}