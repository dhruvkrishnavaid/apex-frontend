import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { FormDialog, optional } from '#/components/common/form-dialog'
import { addLine, CartLines, type CartLine } from '#/components/common/cart-lines'
import { PageHeader } from '#/components/common/page-header'
import { VariantPicker } from '#/components/common/variant-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '#/lib/api'
import { customersQuery, warehousesQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'
import type { Order } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/orders/new')({
  beforeLoad: ({ context }) => {
    if (!context.auth.can('order:create')) throw redirect({ to: '/orders' })
  },
  component: NewOrderPage,
})

interface OrderLine extends CartLine {
  unitPrice: number
}

const CHANNELS = [
  { value: 'IN_STORE', label: 'In store' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'PHONE', label: 'Phone' },
]

function NewOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: warehouses, isError: warehousesFailed } = useQuery(warehousesQuery)
  const { data: customers } = useQuery(customersQuery)
  const [warehouseId, setWarehouseId] = useState('')
  const [customerId, setCustomerId] = useState('walk-in')
  const [channel, setChannel] = useState('IN_STORE')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [newCustomer, setNewCustomer] = useState(false)

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)

  const create = useMutation({
    mutationFn: () =>
      api.post<Order>('/orders', {
        customerId: customerId === 'walk-in' ? undefined : customerId,
        warehouseId,
        channel,
        notes: optional(notes),
        lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      }),
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} created`)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const ready = !!warehouseId && lines.length > 0

  return (
    <>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader title="New order" description="Stock is reserved in the chosen warehouse when the order is placed." />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Add products</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantPicker onAdd={(v) => setLines((ls) => addLine(ls, { variantId: v.variantId, sku: v.sku, productName: v.productName, unitPrice: v.retailPrice, quantity: 1 }))} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Fulfilment warehouse</Label>
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
              {warehousesFailed && (
                <p role="alert" className="-mt-2 text-xs text-destructive">
                  Your role cannot list warehouses (needs warehouse:read), so an order cannot be placed from this account.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <div className="flex gap-2">
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger id="customer" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in customer</SelectItem>
                      {customers?.content.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" aria-label="New customer" onClick={() => setNewCustomer(true)}>
                    <UserPlus />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger id="channel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order lines</CardTitle>
            </CardHeader>
            <CardContent>
              <CartLines lines={lines} onChange={setLines} extra={(l) => <span className="text-sm tabular-nums text-muted-foreground">{formatCurrency(l.unitPrice)}</span>} />
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Subtotal (before tax)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <Button className="mt-4 w-full" disabled={!ready || create.isPending} onClick={() => create.mutate()}>
                {create.isPending && <Loader2 className="animate-spin" />}
                Place order
              </Button>
              {!warehouseId && lines.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Choose a warehouse to continue.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <FormDialog
        open={newCustomer}
        onOpenChange={setNewCustomer}
        title="New customer"
        fields={[
          { name: 'name', label: 'Name', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone' },
        ]}
        submitLabel="Create customer"
        onSubmit={async (v) => {
          const created = await api.post<{ id: string }>('/customers', { name: v.name, email: optional(v.email), phone: optional(v.phone) })
          await queryClient.invalidateQueries({ queryKey: ['customers'] })
          setCustomerId(created.id)
          toast.success('Customer created')
        }}
      />
    </>
  )
}

