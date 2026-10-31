import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Search } from 'lucide-react'
import { z } from 'zod'
import { CustomerDialog } from '#/components/sales/customer-dialog'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '#/auth'
import { requires } from '#/lib/guards'
import { customersListQuery } from '#/lib/queries'
import type { Customer } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/customers/')({
  beforeLoad: requires('customer:read'),
  validateSearch: z.object({
    page: z.number().int().min(0).catch(0).default(0),
    keyword: z.string().optional(),
  }),
  component: CustomersPage,
})

function CustomersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { can } = useAuth()
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const [dialog, setDialog] = useState<{ open: boolean; customer?: Customer }>({ open: false })

  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.keyword ?? '') !== keyword) navigate({ search: { keyword: keyword || undefined, page: 0 } })
    }, 300)
    return () => clearTimeout(t)
  }, [keyword, navigate, search.keyword])

  const { data, isPending, isError } = useQuery(customersListQuery(search))

  return (
    <>
      <PageHeader
        title="Customers"
        description="People and businesses you sell to."
        actions={
          can('customer:create') && (
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> New customer
            </Button>
          )
        }
      />
      <CustomerDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} customer={dialog.customer} />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search customers…" className="pl-9" aria-label="Search customers" />
      </div>
      {isError ? (
        <EmptyState title="Could not load customers" />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !data.content.length ? (
        <EmptyState title="No customers found" />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  {can('customer:update') && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email ?? '—'}</TableCell>
                    <TableCell>{c.phone ?? '—'}</TableCell>
                    <TableCell>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    {can('customer:update') && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => setDialog({ open: true, customer: c })}>
                          <Pencil />
                        </Button>
                      </TableCell>
                    )}
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
