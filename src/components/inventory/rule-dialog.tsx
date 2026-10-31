import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormDialog, type FieldDef, type FormValues } from '#/components/common/form-dialog'
import { api } from '#/lib/api'
import { warehousesQuery } from '#/lib/queries'
import type { ReorderRule, Variant } from '#/lib/types'

const NEW_RULE: FormValues = {}

export function RuleDialog({ open, onOpenChange, rule }: { open: boolean; onOpenChange: (o: boolean) => void; rule?: ReorderRule }) {
  const queryClient = useQueryClient()
  const { data: warehouses } = useQuery(warehousesQuery)

  const fields: FieldDef[] = [
    ...(rule
      ? []
      : [
          { name: 'sku', label: 'Variant SKU', required: true, hint: 'Exact SKU of the product variant.' },
          {
            name: 'warehouseId',
            label: 'Warehouse',
            type: 'select' as const,
            required: true,
            options: (warehouses?.content ?? []).filter((w) => w.isActive).map((w) => ({ value: w.id, label: `${w.code} · ${w.name}` })),
          },
        ]),
    { name: 'reorderPoint', label: 'Reorder point', type: 'number', min: '0', step: '1', required: true, hint: 'An alert is raised when available stock falls to this level.' },
    { name: 'reorderQuantity', label: 'Reorder quantity', type: 'number', min: '1', step: '1', required: true },
    ...(rule ? [{ name: 'isActive', label: 'Status', type: 'select' as const, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }] : []),
  ]

  const initial = useMemo<FormValues>(
    () => (rule ? { reorderPoint: String(rule.reorderPoint), reorderQuantity: String(rule.reorderQuantity), isActive: String(rule.isActive) } : NEW_RULE),
    [rule],
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={rule ? `Edit rule for ${rule.sku}` : 'New reorder rule'}
      description={rule ? `Warehouse ${rule.warehouseCode}` : undefined}
      fields={fields}
      initial={initial}
      submitLabel={rule ? 'Save changes' : 'Create rule'}
      onSubmit={async (v) => {
        const numbers = { reorderPoint: Number(v.reorderPoint), reorderQuantity: Number(v.reorderQuantity) }
        if (rule) {
          await api.put(`/reorder-rules/${rule.id}`, { variantId: rule.variantId, warehouseId: rule.warehouseId, ...numbers, isActive: v.isActive !== 'false' })
          toast.success('Rule updated')
        } else {
          if (!v.warehouseId) throw new Error('Choose a warehouse.')
          const variant = await api.get<Variant>(`/products/variants/sku/${encodeURIComponent(v.sku.trim())}`).catch(() => {
            throw new Error(`No variant with SKU "${v.sku.trim()}".`)
          })
          await api.post('/reorder-rules', { variantId: variant.id, warehouseId: v.warehouseId, ...numbers })
          toast.success('Rule created')
        }
        queryClient.invalidateQueries({ queryKey: ['reorder-rules'] })
        queryClient.invalidateQueries({ queryKey: ['alerts'] })
      }}
    />
  )
}
