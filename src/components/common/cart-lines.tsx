import type { ReactNode } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CartLine {
  variantId: string
  sku: string
  productName: string
  quantity: number
}

/** Editable list of document lines with quantity steppers; `extra` renders per-line fields. */
export function CartLines<T extends CartLine>({
  lines,
  onChange,
  empty = 'Search for a product and add a variant.',
  extra,
}: {
  lines: T[]
  onChange: (lines: T[]) => void
  empty?: string
  extra?: (line: T, update: (patch: Partial<T>) => void) => ReactNode
}) {
  if (lines.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  const update = (variantId: string, patch: Partial<T>) => onChange(lines.map((l) => (l.variantId === variantId ? { ...l, ...patch } : l)))
  return (
    <ul className="divide-y">
      {lines.map((l) => (
        <li key={l.variantId} className="flex flex-wrap items-center gap-2 py-2.5">
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate text-sm font-medium">{l.productName}</p>
            <p className="font-mono text-xs text-muted-foreground">{l.sku}</p>
          </div>
          {extra?.(l, (patch) => update(l.variantId, patch))}
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon" className="size-8" aria-label="Decrease quantity" onClick={() => update(l.variantId, { quantity: Math.max(1, l.quantity - 1) } as Partial<T>)}>
              <Minus />
            </Button>
            <span className="w-7 text-center text-sm tabular-nums">{l.quantity}</span>
            <Button type="button" variant="outline" size="icon" className="size-8" aria-label="Increase quantity" onClick={() => update(l.variantId, { quantity: l.quantity + 1 } as Partial<T>)}>
              <Plus />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={`Remove ${l.sku}`} onClick={() => onChange(lines.filter((x) => x.variantId !== l.variantId))}>
              <Trash2 />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function addLine<T extends CartLine>(lines: T[], line: T): T[] {
  return lines.some((l) => l.variantId === line.variantId)
    ? lines.map((l) => (l.variantId === line.variantId ? { ...l, quantity: l.quantity + 1 } : l))
    : [...lines, line]
}
