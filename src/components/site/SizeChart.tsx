import { Ruler } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROWS = [
  { size: "S", chest: "94 – 98", length: "68", sleeve: "20" },
  { size: "M", chest: "98 – 102", length: "70", sleeve: "21" },
  { size: "L", chest: "102 – 108", length: "72", sleeve: "22" },
  { size: "XL", chest: "108 – 114", length: "74", sleeve: "23" },
  { size: "XXL", chest: "114 – 120", length: "76", sleeve: "24" },
];

/** Standard EU unisex sizing for our jersey, hoodie and tee. All in centimetres. */
export function SizeChart({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-gold-bright"
          >
            <Ruler className="size-3.5" /> Size chart
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Size chart</DialogTitle>
          <DialogDescription>
            EU unisex sizing for our jersey, hoodie and tee. All measurements in centimetres.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Size</th>
                <th className="py-2 pr-3 font-semibold">Chest</th>
                <th className="py-2 pr-3 font-semibold">Body length</th>
                <th className="py-2 font-semibold">Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.size} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-display text-primary">{row.size}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.chest}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.length}</td>
                  <td className="py-2.5 text-muted-foreground">{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">How to measure</p>
          <p>
            Chest: measure around the fullest part of your chest, keeping the tape level. Body
            length: from the highest point of the shoulder straight down. Sleeve: from the shoulder
            seam to the cuff.
          </p>
          <p>
            Between two sizes? The hoodie runs roomy, the jersey runs athletic. You can always try
            one on at The Hive during opening hours before you pay.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
