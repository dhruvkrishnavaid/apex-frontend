import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { addLine, CartLines, type CartLine } from '#/components/common/cart-lines'
import { PageHeader } from '#/components/common/page-header'
import { VariantPicker } from '#/components/common/variant-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '#/lib/api'
import { requires } from '#/lib/guards'
import { supplierOptionsQuery, warehousesQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'
import type { PurchaseOrder } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/purchase-orders/new')({
  beforeLoad: requires('purchase:create'),
  component: NewPurchaseOrderPage,
})

interface PoDraftLine extends CartLine {
  unitCost: string
}

function NewPurchaseOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: suppliers } = useQuery(supplierOptionsQuery)
  const { data: warehouses } = useQuery(warehousesQuery)
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<PoDraftLine[]>([])

  const total = lines.reduce((sum, l) => sum + (Number(l.unitCost) || 0) * l.quantity, 0)
  const ready = !!supplierId && !!warehouseId && lines.length > 0 && lines.every((l) => Number(l.unitCost) > 0)

  const create = useMutation({
    mutationFn: () =>
      api.post<PurchaseOrder>('/purchase-orders', {
        supplierId,
        warehouseId,
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, unitCost: Number(l.unitCost) })),
      }),
    onSuccess: (po) => {
      toast.success(`${po.poNumber} saved as draft`)
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      navigate({ to: '/purchase-orders/$poId', params: { poId: po.id } })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <Link to="/purchase-orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Purchase orders
      </Link>
      <PageHeader title="New purchase order" description="Saved as a draft. Submit it to the supplier from its detail page." />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Add products</CardTitle>
          </CardHeader>
          <CardContent>
            <VariantPicker
              price="cost"
              onAdd={(v) => setLines((ls) => addLine(ls, { variantId: v.variantId, sku: v.sku, productName: v.productName, quantity: 1, unitCost: String(v.costPrice) }))}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger id="supplier" className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.content.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Deliver to</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger id="warehouse" className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.content
                      .filter((w) => w.isActive)
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.code} · {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected">Expected date</Label>
                <Input id="expected" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <CartLines
                lines={lines}
                onChange={setLines}
                extra={(l, update) => (
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={l.unitCost}
                    onChange={(e) => update({ unitCost: e.target.value })}
                    aria-label={`Unit cost for ${l.sku}`}
                    className="h-8 w-20 text-right"
                  />
                )}
              />
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
              </div>
              <Button className="mt-4 w-full" disabled={!ready || create.isPending} onClick={() => create.mutate()}>
                {create.isPending && <Loader2 className="animate-spin" />}
                Save draft
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
