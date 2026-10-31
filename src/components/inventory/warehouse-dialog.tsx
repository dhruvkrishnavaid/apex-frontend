import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormDialog, optional, type FieldDef, type FormValues } from '#/components/common/form-dialog'
import { api } from '#/lib/api'
import type { Warehouse } from '#/lib/types'

const NEW_WAREHOUSE: FormValues = {}

export function WarehouseDialog({ open, onOpenChange, warehouse }: { open: boolean; onOpenChange: (o: boolean) => void; warehouse?: Warehouse }) {
  const queryClient = useQueryClient()
  const fields: FieldDef[] = [
    ...(warehouse ? [] : [{ name: 'code', label: 'Code', required: true, hint: 'Short unique identifier, e.g. MAIN.' }]),
    { name: 'name', label: 'Name', required: true },
    { name: 'city', label: 'City' },
    { name: 'country', label: 'Country' },
    { name: 'contactPhone', label: 'Contact phone' },
    ...(warehouse
      ? [{ name: 'isActive', label: 'Status', type: 'select' as const, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], hint: 'Deactivating is refused while stock remains.' }]
      : []),
  ]

  const initial = useMemo<FormValues>(
    () =>
      warehouse
        ? { name: warehouse.name, city: warehouse.city ?? '', country: warehouse.country ?? '', contactPhone: warehouse.contactPhone ?? '', isActive: String(warehouse.isActive) }
        : NEW_WAREHOUSE,
    [warehouse],
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={warehouse ? 'Edit warehouse' : 'New warehouse'}
      fields={fields}
      initial={initial}
      submitLabel={warehouse ? 'Save changes' : 'Create warehouse'}
      onSubmit={async (v) => {
        const body = { name: v.name, city: optional(v.city), country: optional(v.country), contactPhone: optional(v.contactPhone) }
        if (warehouse) {
          await api.put(`/warehouses/${warehouse.id}`, { ...body, isActive: v.isActive !== 'false' })
          toast.success('Warehouse updated')
        } else {
          await api.post('/warehouses', { ...body, code: v.code })
          toast.success('Warehouse created')
        }
        queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      }}
    />
  )
}
