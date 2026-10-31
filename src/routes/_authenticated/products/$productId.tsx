import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
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
            actions={<Badge variant={product.isActive ? 'default' : 'secondary'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>}
          />
          {product.description && <p className="mb-6 max-w-prose text-sm text-muted-foreground">{product.description}</p>}
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}
