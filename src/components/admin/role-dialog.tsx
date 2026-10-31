import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '#/lib/api'
import { permissionsQuery } from '#/lib/queries'
import type { Role } from '#/lib/types'

export function RoleDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (o: boolean) => void; role?: Role }) {
  const queryClient = useQueryClient()
  const { data: catalogue } = useQuery({ ...permissionsQuery, enabled: open })
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setSelected(new Set(role?.permissions ?? []))
      setError(null)
    }
  }, [open, role])

  // Group "resource:action" permissions by resource.
  const groups = new Map<string, string[]>()
  for (const p of catalogue ?? []) {
    const [resource] = p.split(':')
    groups.set(resource, [...(groups.get(resource) ?? []), p])
  }

  const toggle = (p: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const body = { name: name.trim(), permissions: [...selected] }
      if (role) await api.put(`/roles/${role.id}`, body)
      else await api.post('/roles', body)
      toast.success(role ? 'Role updated' : 'Role created')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{role ? `Edit ${role.name.replaceAll('_', ' ')}` : 'New role'}</DialogTitle>
            <DialogDescription>Choose what people with this role may do.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} disabled={role?.builtIn} />
            {role?.builtIn && <p className="text-xs text-muted-foreground">Built-in role names cannot be changed.</p>}
          </div>
          <div className="space-y-3">
            {[...groups.entries()].map(([resource, perms]) => (
              <fieldset key={resource} className="rounded-md border p-3">
                <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{resource}</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {perms.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 accent-primary" checked={selected.has(p)} onChange={() => toggle(p)} />
                      {p.split(':')[1]}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {role ? 'Save changes' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
