import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '#/lib/api'
import type { StockLevel } from '#/lib/types'

export function AdjustStockDialog({ stock, onClose }: { stock: StockLevel | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (body: { variantId: string; warehouseId: string; quantityChange: number; reason: string }) =>
      api.post('/inventory/adjustments', body),
    onSuccess: () => {
      toast.success('Stock adjusted')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  return (
    <Dialog open={!!stock} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {stock && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              const quantityChange = Number(form.get('quantityChange'))
              if (!Number.isInteger(quantityChange) || quantityChange === 0) {
                setError('Enter a whole number other than zero.')
                return
              }
              setError(null)
              mutation.mutate({
                variantId: stock.variantId,
                warehouseId: stock.warehouseId,
                quantityChange,
                reason: String(form.get('reason')),
              })
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Adjust stock</DialogTitle>
              <DialogDescription>
                {stock.productName} · <span className="font-mono">{stock.sku}</span> at {stock.warehouseCode}. Currently {stock.quantityOnHand} on hand.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="quantityChange">Quantity change</Label>
              <Input id="quantityChange" name="quantityChange" type="number" step={1} placeholder="e.g. 5 or -2" required />
              <p className="text-xs text-muted-foreground">Positive adds stock, negative removes it.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" maxLength={500} required />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Save adjustment
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
