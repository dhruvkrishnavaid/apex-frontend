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
import { warehousesQuery } from '#/lib/queries'
import type { Transfer } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/transfers/new')({
  beforeLoad: requires('transfer:create'),
  component: NewTransferPage,
})

function NewTransferPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: warehouses } = useQuery(warehousesQuery)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<CartLine[]>([])

  const active = warehouses?.content.filter((w) => w.isActive) ?? []
  const ready = !!from && !!to && from !== to && lines.length > 0

  const create = useMutation({
    mutationFn: () =>
      api.post<Transfer>('/transfers', {
        fromWarehouseId: from,
        toWarehouseId: to,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      }),
    onSuccess: (t) => {
      toast.success(`${t.referenceNumber} requested`)
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      navigate({ to: '/transfers/$transferId', params: { transferId: t.id } })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const warehouseSelect = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={set}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>
        <SelectContent>
          {active.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.code} · {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <>
      <Link to="/transfers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Transfers
      </Link>
      <PageHeader title="New transfer" description="Stock is reserved at the source warehouse until the transfer is dispatched." />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Add products</CardTitle>
          </CardHeader>
          <CardContent>
            <VariantPicker onAdd={(v) => setLines((ls) => addLine(ls, { variantId: v.variantId, sku: v.sku, productName: v.productName, quantity: 1 }))} />
          </CardContent>
        </Card>
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {warehouseSelect('from', 'From warehouse', from, setFrom)}
              {warehouseSelect('to', 'To warehouse', to, setTo)}
              {from && from === to && <p role="alert" className="text-xs text-destructive">Source and destination must differ.</p>}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <CartLines lines={lines} onChange={setLines} />
              <Button className="mt-4 w-full" disabled={!ready || create.isPending} onClick={() => create.mutate()}>
                {create.isPending && <Loader2 className="animate-spin" />}
                Request transfer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
