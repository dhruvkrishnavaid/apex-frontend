import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '#/auth'
import { rolesQuery, usersQuery } from '#/lib/queries'

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: z.object({
    view: z.enum(['users', 'roles']).catch('users').default('users'),
    page: z.number().int().min(0).catch(0).default(0),
  }),
  component: UsersPage,
})

function UsersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { can } = useAuth()
  return (
    <>
      <PageHeader title="Users & roles" description="Who can sign in and what they are allowed to do." />
      <Tabs className="mb-4" value={search.view} onValueChange={(v) => navigate({ search: { view: v as 'users' | 'roles', page: 0 } })}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          {can('role:read') && <TabsTrigger value="roles">Roles</TabsTrigger>}
        </TabsList>
      </Tabs>
      {search.view === 'roles' ? <Roles /> : <Users />}
    </>
  )
}

function Users() {
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isPending, isError } = useQuery(usersQuery(page))
  if (isError) return <EmptyState title="Could not load users" />
  if (isPending) return <Skeleton className="h-64 w-full" />
  if (!data.content.length) return <EmptyState title="No users" />
  return (
    <>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.firstName} {u.lastName}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.roleName.replaceAll('_', ' ').toLowerCase()}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'default' : 'secondary'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
    </>
  )
}

function Roles() {
  const { data, isPending, isError } = useQuery(rolesQuery)
  if (isError) return <EmptyState title="Could not load roles" />
  if (isPending) return <Skeleton className="h-64 w-full" />
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">{r.name.replaceAll('_', ' ')}</h2>
            <span className="text-xs text-muted-foreground">
              {r.userCount} user{r.userCount === 1 ? '' : 's'}
              {r.builtIn ? ' · built-in' : ''}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.permissions.map((p) => (
              <Badge key={p} variant="outline" className="font-mono text-[11px] font-normal">
                {p}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
