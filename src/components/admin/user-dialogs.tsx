import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormDialog, type FieldDef, type FormValues } from '#/components/common/form-dialog'
import { api } from '#/lib/api'
import { rolesQuery } from '#/lib/queries'
import type { User } from '#/lib/types'

const NEW_USER: FormValues = {}

export function UserDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user?: User }) {
  const queryClient = useQueryClient()
  const { data: roles } = useQuery(rolesQuery)
  const editing = !!user
  const roleOptions = (roles ?? []).map((r) => ({ value: r.id, label: r.name.replaceAll('_', ' ').toLowerCase() }))

  const fields: FieldDef[] = [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    ...(editing
      ? []
      : [
          { name: 'email', label: 'Email', type: 'email' as const, required: true },
          { name: 'password', label: 'Temporary password', type: 'password' as const, required: true, hint: 'At least 8 characters.' },
        ]),
    { name: 'roleId', label: 'Role', type: 'select', required: true, options: roleOptions },
    ...(editing
      ? [{ name: 'isActive', label: 'Status', type: 'select' as const, options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]
      : []),
  ]

  const initial = useMemo<FormValues>(
    () =>
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: roles?.find((r) => r.name === user.roleName)?.id ?? '',
            isActive: String(user.isActive),
          }
        : NEW_USER,
    [user, roles],
  )

  async function onSubmit(v: FormValues) {
    if (!v.roleId) throw new Error('Choose a role.')
    if (user) {
      await api.put(`/users/${user.id}`, { firstName: v.firstName, lastName: v.lastName, roleId: v.roleId, isActive: v.isActive !== 'false' })
      toast.success('User updated')
    } else {
      await api.post('/auth/register', { firstName: v.firstName, lastName: v.lastName, email: v.email, password: v.password, roleId: v.roleId })
      toast.success('User created')
    }
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit user' : 'New user'}
      fields={fields}
      initial={initial}
      submitLabel={editing ? 'Save changes' : 'Create user'}
      onSubmit={onSubmit}
    />
  )
}

const RESET_FIELDS: FieldDef[] = [{ name: 'newPassword', label: 'New password', type: 'password', required: true, hint: 'At least 8 characters. Existing sessions are signed out.' }]

export function ResetPasswordDialog({ user, onOpenChange }: { user: User | null; onOpenChange: (o: boolean) => void }) {
  return (
    <FormDialog
      open={!!user}
      onOpenChange={onOpenChange}
      title="Reset password"
      description={user ? `Set a new password for ${user.firstName} ${user.lastName}.` : undefined}
      fields={RESET_FIELDS}
      submitLabel="Reset password"
      onSubmit={async (v) => {
        if (v.newPassword.length < 8) throw new Error('Password must be at least 8 characters long.')
        await api.patch(`/users/${user!.id}/password`, { newPassword: v.newPassword })
        toast.success('Password reset')
      }}
    />
  )
}
