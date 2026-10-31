import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { z } from 'zod'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { ProductDialog } from '#/components/catalog/product-dialogs'
import { useAuth } from '#/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { categoriesQuery, productsQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'
import type { Category, Product } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/products/')({
  validateSearch: z.object({
    page: z.number().int().min(0).catch(0).default(0),
    keyword: z.string().optional(),
    categoryId: z.string().optional(),
  }),
  component: ProductsPage,
})

const flatten = (cats: Category[]): Category[] => cats.flatMap((c) => [c, ...flatten(c.subcategories ?? [])])

function priceRange(p: Product) {
  const prices = p.variants.filter((v) => v.isActive).map((v) => v.retailPrice)
  if (!prices.length) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`
}

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const { can } = useAuth()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.keyword ?? '') !== keyword) {
        navigate({ search: (s) => ({ ...s, keyword: keyword || undefined, page: 0 }) })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [keyword, navigate, search.keyword])

  const { data, isPending, isError } = useQuery(productsQuery(search))
  const { data: categories } = useQuery(categoriesQuery)
  const options = flatten(categories ?? [])

  return (
    <>
      <PageHeader
        title="Products"
        description="Browse the catalogue, variants and prices."
        actions={
          can('product:create') && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> New product
            </Button>
          )
        }
      />
      <ProductDialog open={creating} onOpenChange={setCreating} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select
          value={search.categoryId ?? 'all'}
          onValueChange={(v) => navigate({ search: (s) => ({ ...s, categoryId: v === 'all' ? undefined : v, page: 0 }) })}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {options.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <EmptyState title="Could not load products" description="Check your connection and permissions, then try again." />
      ) : isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState title="No products found" description="Try a different search or category." />
      ) : (
        <>
          {/* Cards on small screens */}
          <ul className="space-y-3 md:hidden">
            {data.content.map((p) => (
              <li key={p.id}>
                <Link to="/products/$productId" params={{ productId: p.id }}>
                  <Card className="transition-colors hover:bg-accent/40">
                    <CardContent className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{p.name}</p>
                        {!p.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.categoryName}
                        {p.brand ? ` · ${p.brand}` : ''}
                      </p>
                      <p className="text-sm tabular-nums">
                        {priceRange(p)} · {p.variants.length} variant{p.variants.length === 1 ? '' : 's'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {/* Table from md up */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Variants</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to="/products/$productId" params={{ productId: p.id }} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>{p.categoryName}</TableCell>
                    <TableCell>{p.brand ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.variants.length}</TableCell>
                    <TableCell className="text-right tabular-nums">{priceRange(p)}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
        </>
      )}
    </>
  )
}
