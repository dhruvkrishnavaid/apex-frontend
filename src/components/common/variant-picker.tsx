import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { productsQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'

export interface PickedVariant {
  variantId: string
  sku: string
  productName: string
  retailPrice: number
  costPrice: number
}

/** Search products and add one of their active variants to a document. */
export function VariantPicker({ onAdd, price = 'retail' }: { onAdd: (v: PickedVariant) => void; price?: 'retail' | 'cost' }) {
  const [keyword, setKeyword] = useState('')
  const { data, isFetching } = useQuery(productsQuery({ page: 0, keyword: keyword || undefined }))

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search products by name…" className="pl-9" aria-label="Search products" />
      </div>
      <ul className="divide-y rounded-md border">
        {data?.content
          .filter((p) => p.isActive)
          .flatMap((p) => p.variants.filter((v) => v.isActive).map((v) => ({ p, v })))
          .map(({ p, v }) => (
            <li key={v.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{v.sku}</p>
              </div>
              <span className="text-sm tabular-nums">{formatCurrency(price === 'cost' ? v.costPrice : v.retailPrice)}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onAdd({ variantId: v.id, sku: v.sku, productName: p.name, retailPrice: v.retailPrice, costPrice: v.costPrice })}
              >
                <Plus /> Add
              </Button>
            </li>
          ))}
        {data && data.content.length === 0 && <li className="p-4 text-sm text-muted-foreground">No products match.</li>}
        {!data && isFetching && <li className="p-4 text-sm text-muted-foreground">Loading…</li>}
      </ul>
    </div>
  )
}
