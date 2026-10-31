import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { WarehouseDialog } from '#/components/inventory/warehouse-dialog'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '#/auth'
import { requires } from '#/lib/guards'
import { warehousesQuery } from '#/lib/queries'
import type { Warehouse } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/warehouses/')({
  beforeLoad: requires('warehouse:read'),
  component: WarehousesPage,
})

function WarehousesPage() {
  const { can } = useAuth()
  const { data, isPending, isError } = useQuery(warehousesQuery)
  const [dialog, setDialog] = useState<{ open: boolean; warehouse?: Warehouse }>({ open: false })

  return (
    <>
      <PageHeader
        title="Warehouses"
        description="Locations where stock is held."
        actions={
          can('warehouse:create') && (
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> New warehouse
            </Button>
          )
        }
      />
      <WarehouseDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} warehouse={dialog.warehouse} />
      {isError ? (
        <EmptyState title="Could not load warehouses" />
      ) : isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : !data.content.length ? (
        <EmptyState title="No warehouses yet" description="Create one before receiving stock or taking orders." />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                {can('warehouse:update') && <TableHead className="w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <p className="font-medium">{w.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{w.code}</p>
                  </TableCell>
                  <TableCell>{[w.city, w.country].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell>{w.contactPhone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={w.isActive ? 'default' : 'secondary'}>{w.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  {can('warehouse:update') && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${w.name}`} onClick={() => setDialog({ open: true, warehouse: w })}>
                        <Pencil />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
