import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '#/lib/api'
import type { Order } from '#/lib/types'

export function ReturnDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [restock, setRestock] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setQuantities({})
      setReason('')
      setRestock(true)
      setError(null)
    }
  }, [open])

  const returnable = (l: Order['lines'][number]) => Math.max(0, l.quantityPicked - l.quantityReturned)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const lines = order.lines
      .map((l) => ({ orderLineId: l.id, quantity: Number(quantities[l.id] ?? 0), max: returnable(l) }))
      .filter((l) => l.quantity > 0)
    if (!lines.length) return setError('Enter a quantity for at least one line.')
    if (lines.some((l) => !Number.isInteger(l.quantity) || l.quantity > l.max)) return setError('Quantities must be whole numbers within what can be returned.')
    setPending(true)
    setError(null)
    try {
      await api.post(`/orders/${order.id}/returns`, {
        reason: reason.trim() || undefined,
        restock,
        lines: lines.map(({ orderLineId, quantity }) => ({ orderLineId, quantity })),
      })
      toast.success('Return recorded')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Return items</DialogTitle>
            <DialogDescription>Order {order.orderNumber}. Enter how many of each item came back.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y">
            {order.lines.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{l.sku}</span> · up to {returnable(l)}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={returnable(l)}
                  disabled={returnable(l) === 0}
                  value={quantities[l.id] ?? ''}
                  onChange={(e) => setQuantities((q) => ({ ...q, [l.id]: e.target.value }))}
                  aria-label={`Quantity returned for ${l.sku}`}
                  className="w-20 text-right"
                />
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Label htmlFor="return-reason">Reason</Label>
            <Input id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
            Return items to stock (uncheck to write off)
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Record return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
