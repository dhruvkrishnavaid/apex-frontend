import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormDialog, optional, type FieldDef, type FormValues } from '#/components/common/form-dialog'
import { api } from '#/lib/api'
import type { Customer } from '#/lib/types'

const NEW_CUSTOMER: FormValues = {}

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'city', label: 'City' },
  { name: 'country', label: 'Country' },
  { name: 'notes', label: 'Notes' },
]

export function CustomerDialog({ open, onOpenChange, customer }: { open: boolean; onOpenChange: (o: boolean) => void; customer?: Customer }) {
  const queryClient = useQueryClient()
  const fields: FieldDef[] = customer
    ? [...FIELDS, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]
    : FIELDS

  const initial = useMemo<FormValues>(
    () =>
      customer
        ? {
            name: customer.name,
            email: customer.email ?? '',
            phone: customer.phone ?? '',
            city: customer.city ?? '',
            country: customer.country ?? '',
            notes: customer.notes ?? '',
            isActive: String(customer.isActive),
          }
        : NEW_CUSTOMER,
    [customer],
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={customer ? 'Edit customer' : 'New customer'}
      fields={fields}
      initial={initial}
      submitLabel={customer ? 'Save changes' : 'Create customer'}
      onSubmit={async (v) => {
        const body = { name: v.name, email: optional(v.email), phone: optional(v.phone), city: optional(v.city), country: optional(v.country), notes: optional(v.notes) }
        if (customer) {
          await api.put(`/customers/${customer.id}`, { ...body, isActive: v.isActive !== 'false' })
          toast.success('Customer updated')
        } else {
          await api.post('/customers', body)
          toast.success('Customer created')
        }
        queryClient.invalidateQueries({ queryKey: ['customers'] })
      }}
    />
  )
}
