import { useState } from 'react'
import { requires } from '#/lib/guards'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RoleDialog } from '#/components/admin/role-dialog'
import { api } from '#/lib/api'
import { z } from 'zod'
import { ResetPasswordDialog, UserDialog } from '#/components/admin/user-dialogs'
import { Button } from '@/components/ui/button'
import type { Role, User } from '#/lib/types'
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
  beforeLoad: requires('user:read'),
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
  const [creating, setCreating] = useState(false)
  const [creatingRole, setCreatingRole] = useState(false)
  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Who can sign in and what they are allowed to do."
        actions={
          search.view === 'users' ? (
            can('user:create') && (
              <Button onClick={() => setCreating(true)}>
                <Plus /> New user
              </Button>
            )
          ) : (
            can('role:manage') && (
              <Button onClick={() => setCreatingRole(true)}>
                <Plus /> New role
              </Button>
            )
          )
        }
      />
      <UserDialog open={creating} onOpenChange={setCreating} />
      <RoleDialog open={creatingRole} onOpenChange={setCreatingRole} />
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
  const { can } = useAuth()
  const [editing, setEditing] = useState<User | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)
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
              {can('user:update') && <TableHead className="w-24" />}
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
                {can('user:update') && (
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${u.email}`} onClick={() => setEditing(u)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Reset password for ${u.email}`} onClick={() => setResetting(u)}>
                      <KeyRound />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
      <UserDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} user={editing ?? undefined} />
      <ResetPasswordDialog user={resetting} onOpenChange={(o) => !o && setResetting(null)} />
    </>
  )
}

function Roles() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery(rolesQuery)
  const [editing, setEditing] = useState<Role | null>(null)
  const manage = can('role:manage')

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      toast.success('Role deleted')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isError) return <EmptyState title="Could not load roles" />
  if (isPending) return <Skeleton className="h-64 w-full" />
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{r.name.replaceAll('_', ' ')}</h2>
              <div className="flex items-center gap-1">
                <span className="mr-1 text-xs text-muted-foreground">
                  {r.userCount} user{r.userCount === 1 ? '' : 's'}
                  {r.builtIn ? ' · built-in' : ''}
                </span>
                {manage && (
                  <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}>
                    <Pencil />
                  </Button>
                )}
                {manage && !r.builtIn && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Delete ${r.name}`}
                    disabled={remove.isPending}
                    onClick={() => confirm(`Delete the role ${r.name}?`) && remove.mutate(r.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
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
      <RoleDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} role={editing ?? undefined} />
    </>
  )
}
