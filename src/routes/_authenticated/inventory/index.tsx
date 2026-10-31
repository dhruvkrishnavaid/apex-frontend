import { useState } from 'react'
import { requires } from '#/lib/guards'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { AdjustStockDialog } from '#/components/inventory/adjust-stock-dialog'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '#/auth'
import { movementsQuery, stockQuery, warehousesQuery } from '#/lib/queries'
import { formatNumber } from '#/lib/format'
import type { StockLevel } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/inventory/')({
  beforeLoad: requires('inventory:read'),
  validateSearch: z.object({
    view: z.enum(['stock', 'movements']).catch('stock').default('stock'),
    page: z.number().int().min(0).catch(0).default(0),
    warehouseId: z.string().optional(),
  }),
  component: InventoryPage,
})

function InventoryPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: warehouses } = useQuery(warehousesQuery)

  return (
    <>
      <PageHeader title="Inventory" description="Stock on hand across warehouses and the movement ledger." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={search.view} onValueChange={(v) => navigate({ search: (s) => ({ ...s, view: v as 'stock' | 'movements', page: 0 }) })}>
          <TabsList>
            <TabsTrigger value="stock">Stock levels</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={search.warehouseId ?? 'all'}
          onValueChange={(v) => navigate({ search: (s) => ({ ...s, warehouseId: v === 'all' ? undefined : v, page: 0 }) })}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by warehouse">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All warehouses</SelectItem>
            {warehouses?.content.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.code} · {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {search.view === 'stock' ? <StockTable /> : <MovementsTable />}
    </>
  )
}

function Loading() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function StockTable() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { can } = useAuth()
  const [adjusting, setAdjusting] = useState<StockLevel | null>(null)
  const { data, isPending, isError } = useQuery(stockQuery({ page: search.page, warehouseId: search.warehouseId }))

  if (isError) return <EmptyState title="Could not load stock" />
  if (isPending) return <Loading />
  if (!data.content.length) return <EmptyState title="No stock records" description="Receive a purchase order or adjust stock to get started." />

  return (
    <>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              {can('inventory:adjust') && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.productName}</TableCell>
                <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                <TableCell>
                  {s.warehouseCode}
                  {s.locationCode && <span className="text-muted-foreground"> · {s.locationCode}</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(s.quantityOnHand)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(s.quantityReserved)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.quantityAvailable <= 0 ? <Badge variant="destructive">{s.quantityAvailable}</Badge> : formatNumber(s.quantityAvailable)}
                </TableCell>
                {can('inventory:adjust') && (
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setAdjusting(s)}>
                      Adjust
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
      <AdjustStockDialog stock={adjusting} onClose={() => setAdjusting(null)} />
    </>
  )
}

function MovementsTable() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isPending, isError } = useQuery(movementsQuery({ page: search.page, warehouseId: search.warehouseId }))

  if (isError) return <EmptyState title="Could not load movements" />
  if (isPending) return <Loading />
  if (!data.content.length) return <EmptyState title="No movements yet" />

  return (
    <>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">After</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{m.sku}</TableCell>
                <TableCell>{m.warehouseCode}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{m.type.replaceAll('_', ' ').toLowerCase()}</Badge>
                </TableCell>
                <TableCell className={`text-right tabular-nums ${m.quantityChange < 0 ? 'text-destructive' : 'text-success'}`}>
                  {m.quantityChange > 0 ? '+' : ''}
                  {m.quantityChange}
                </TableCell>
                <TableCell className="text-right tabular-nums">{m.quantityAfter}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">{m.reason ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
    </>
  )
}
