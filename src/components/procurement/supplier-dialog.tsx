import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormDialog, optional, type FieldDef, type FormValues } from '#/components/common/form-dialog'
import { api } from '#/lib/api'
import type { Supplier } from '#/lib/types'

const NEW_SUPPLIER: FormValues = {}

export function SupplierDialog({ open, onOpenChange, supplier }: { open: boolean; onOpenChange: (o: boolean) => void; supplier?: Supplier }) {
  const queryClient = useQueryClient()
  const editing = !!supplier

  const fields: FieldDef[] = [
    ...(editing ? [] : [{ name: 'code', label: 'Code', required: true, hint: 'Short unique identifier, e.g. ACME.' }]),
    { name: 'name', label: 'Name', required: true },
    { name: 'contactName', label: 'Contact name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'city', label: 'City' },
    { name: 'country', label: 'Country' },
    { name: 'paymentTerms', label: 'Payment terms', placeholder: 'e.g. Net 30' },
    { name: 'leadTimeDays', label: 'Lead time (days)', type: 'number', min: '0', step: '1' },
    ...(editing
      ? [{ name: 'isActive', label: 'Status', type: 'select' as const, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]
      : []),
  ]

  const initial = useMemo<FormValues>(
    () =>
      supplier
        ? {
            name: supplier.name,
            contactName: supplier.contactName ?? '',
            email: supplier.email ?? '',
            phone: supplier.phone ?? '',
            city: supplier.city ?? '',
            country: supplier.country ?? '',
            paymentTerms: supplier.paymentTerms ?? '',
            leadTimeDays: supplier.leadTimeDays != null ? String(supplier.leadTimeDays) : '',
            isActive: String(supplier.isActive),
          }
        : NEW_SUPPLIER,
    [supplier],
  )

  async function onSubmit(v: FormValues) {
    const body = {
      name: v.name,
      contactName: optional(v.contactName),
      email: optional(v.email),
      phone: optional(v.phone),
      city: optional(v.city),
      country: optional(v.country),
      paymentTerms: optional(v.paymentTerms),
      leadTimeDays: optional(v.leadTimeDays) ? Number(v.leadTimeDays) : undefined,
    }
    if (supplier) {
      await api.put(`/suppliers/${supplier.id}`, { ...body, isActive: v.isActive !== 'false' })
      toast.success('Supplier updated')
    } else {
      await api.post('/suppliers', { ...body, code: v.code })
      toast.success('Supplier created')
    }
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit supplier' : 'New supplier'}
      fields={fields}
      initial={initial}
      submitLabel={editing ? 'Save changes' : 'Create supplier'}
      onSubmit={onSubmit}
    />
  )
}
