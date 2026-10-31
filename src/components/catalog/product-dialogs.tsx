import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormDialog, optional, type FieldDef, type FormValues } from '#/components/common/form-dialog'
import { api } from '#/lib/api'
import { categoriesQuery } from '#/lib/queries'
import type { Category, Product, Variant } from '#/lib/types'

const flatten = (cats: Category[]): Category[] => cats.flatMap((c) => [c, ...flatten(c.subcategories ?? [])])

const NEW_PRODUCT: FormValues = { unitOfMeasure: 'each' }
const NEW_VARIANT: FormValues = {}

export function ProductDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product?: Product }) {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery(categoriesQuery)
  const editing = !!product

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'name', label: 'Name', required: true },
      {
        name: 'categoryId',
        label: 'Category',
        type: 'select',
        required: true,
        options: flatten(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
      },
      { name: 'brand', label: 'Brand' },
      { name: 'description', label: 'Description' },
      { name: 'unitOfMeasure', label: 'Unit of measure', required: true, placeholder: 'each, kg, box…' },
      ...(editing
        ? [{ name: 'isActive', label: 'Status', type: 'select' as const, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]
        : [
            { name: 'sku', label: 'First variant SKU', required: true, hint: 'A default variant is created with the product.' },
            { name: 'costPrice', label: 'Cost price', type: 'number' as const, step: '0.01', min: '0.01', required: true },
            { name: 'retailPrice', label: 'Retail price', type: 'number' as const, step: '0.01', min: '0.01', required: true },
          ]),
    ],
    [categories, editing],
  )

  const initial: FormValues = useMemo(
    () =>
      product
        ? {
            name: product.name,
            categoryId: product.categoryId,
            brand: product.brand ?? '',
            description: product.description ?? '',
            unitOfMeasure: product.unitOfMeasure,
            isActive: String(product.isActive),
          }
        : NEW_PRODUCT,
    [product],
  )

  async function onSubmit(v: FormValues) {
    if (!v.categoryId) throw new Error('Choose a category.')
    const base = {
      categoryId: v.categoryId,
      name: v.name,
      description: optional(v.description),
      brand: optional(v.brand),
      unitOfMeasure: v.unitOfMeasure,
    }
    if (product) {
      await api.put(`/products/${product.id}`, { ...base, isActive: v.isActive !== 'false' })
      toast.success('Product updated')
    } else {
      await api.post('/products', {
        ...base,
        hasVariants: false,
        variants: [{ sku: v.sku, costPrice: Number(v.costPrice), retailPrice: Number(v.retailPrice) }],
      })
      toast.success('Product created')
    }
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit product' : 'New product'}
      fields={fields}
      initial={initial}
      submitLabel={editing ? 'Save changes' : 'Create product'}
      onSubmit={onSubmit}
    />
  )
}

export function VariantDialog({
  open,
  onOpenChange,
  productId,
  variant,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  productId: string
  variant?: Variant
}) {
  const queryClient = useQueryClient()
  const editing = !!variant

  const fields: FieldDef[] = [
    ...(editing ? [] : [{ name: 'sku', label: 'SKU', required: true }]),
    { name: 'costPrice', label: 'Cost price', type: 'number', step: '0.01', min: '0.01', required: true },
    { name: 'retailPrice', label: 'Retail price', type: 'number', step: '0.01', min: '0.01', required: true },
    ...(editing
      ? [{ name: 'isActive', label: 'Status', type: 'select' as const, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]
      : [{ name: 'barcode', label: 'Barcode', hint: 'Optional. Added as an EAN-13 primary barcode.' }]),
  ]

  const initial = useMemo<FormValues>(
    () => (variant ? { costPrice: String(variant.costPrice), retailPrice: String(variant.retailPrice), isActive: String(variant.isActive) } : NEW_VARIANT),
    [variant],
  )

  async function onSubmit(v: FormValues) {
    if (variant) {
      await api.put(`/products/variants/${variant.id}`, {
        variantAttributes: variant.variantAttributes ?? undefined,
        costPrice: Number(v.costPrice),
        retailPrice: Number(v.retailPrice),
        isActive: v.isActive !== 'false',
      })
      toast.success('Variant updated')
    } else {
      await api.post(`/products/${productId}/variants`, {
        sku: v.sku,
        costPrice: Number(v.costPrice),
        retailPrice: Number(v.retailPrice),
        barcodes: optional(v.barcode) ? [{ barcode: v.barcode.trim(), type: 'EAN_13', isPrimary: true }] : undefined,
      })
      toast.success('Variant added')
    }
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${variant.sku}` : 'Add variant'}
      fields={fields}
      initial={initial}
      submitLabel={editing ? 'Save changes' : 'Add variant'}
      onSubmit={onSubmit}
    />
  )
}
