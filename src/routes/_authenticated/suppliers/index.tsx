import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { z } from 'zod'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { suppliersQuery } from '#/lib/queries'

export const Route = createFileRoute('/_authenticated/suppliers/')({
  validateSearch: z.object({
    page: z.number().int().min(0).catch(0).default(0),
    keyword: z.string().optional(),
  }),
  component: SuppliersPage,
})

function SuppliersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [keyword, setKeyword] = useState(search.keyword ?? '')

  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.keyword ?? '') !== keyword) navigate({ search: { keyword: keyword || undefined, page: 0 } })
    }, 300)
    return () => clearTimeout(t)
  }, [keyword, navigate, search.keyword])

  const { data, isPending, isError } = useQuery(suppliersQuery(search))

  return (
    <>
      <PageHeader title="Suppliers" description="Vendors you purchase stock from." />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search suppliers…" className="pl-9" aria-label="Search suppliers" />
      </div>
      {isError ? (
        <EmptyState title="Could not load suppliers" />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !data.content.length ? (
        <EmptyState title="No suppliers found" />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead className="text-right">Lead time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{s.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                    </TableCell>
                    <TableCell>
                      <p>{s.contactName ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </TableCell>
                    <TableCell>{[s.city, s.country].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>{s.paymentTerms ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.leadTimeDays != null ? `${s.leadTimeDays} d` : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
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
