import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { ProductDialog, VariantDialog } from '#/components/catalog/product-dialogs'
import { useAuth } from '#/auth'
import { Button } from '@/components/ui/button'
import type { Variant } from '#/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { productQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'

export const Route = createFileRoute('/_authenticated/products/$productId')({ component: ProductPage })

function ProductPage() {
  const { productId } = Route.useParams()
  const { data: product, isPending, isError } = useQuery(productQuery(productId))
  const { can } = useAuth()
  const [editingProduct, setEditingProduct] = useState(false)
  const [variantDialog, setVariantDialog] = useState<{ open: boolean; variant?: Variant }>({ open: false })
  const canUpdate = can('product:update')

  return (
    <>
      <Link to="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Products
      </Link>
      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : isError ? (
        <EmptyState title="Product not found" />
      ) : (
        <>
          <PageHeader
            title={product.name}
            description={[product.categoryName, product.brand].filter(Boolean).join(' · ')}
            actions={
              <>
                <Badge variant={product.isActive ? 'default' : 'secondary'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
                {canUpdate && (
                  <Button variant="outline" size="sm" onClick={() => setEditingProduct(true)}>
                    <Pencil /> Edit
                  </Button>
                )}
              </>
            }
          />
          {product.description && <p className="mb-6 max-w-prose text-sm text-muted-foreground">{product.description}</p>}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Variants</CardTitle>
              {canUpdate && (
                <Button size="sm" onClick={() => setVariantDialog({ open: true })}>
                  <Plus /> Add variant
                </Button>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead>Barcodes</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Retail</TableHead>
                    {canUpdate && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((v) => (
                    <TableRow key={v.id} className={v.isActive ? '' : 'opacity-60'}>
                      <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                      <TableCell>
                        {Object.entries(v.variantAttributes ?? {})
                          .map(([k, val]) => `${k}: ${String(val)}`)
                          .join(', ') || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.barcodes.map((b) => b.barcode).join(', ') || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(v.costPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(v.retailPrice)}</TableCell>
                      {canUpdate && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" aria-label={`Edit ${v.sku}`} onClick={() => setVariantDialog({ open: true, variant: v })}>
                            <Pencil />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <ProductDialog open={editingProduct} onOpenChange={setEditingProduct} product={product} />
          <VariantDialog
            open={variantDialog.open}
            onOpenChange={(o) => setVariantDialog((d) => ({ ...d, open: o }))}
            productId={product.id}
            variant={variantDialog.variant}
          />
        </>
      )}
    </>
  )
}
