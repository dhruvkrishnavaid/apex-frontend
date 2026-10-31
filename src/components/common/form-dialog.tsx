import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'select'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  hint?: string
  step?: string
  min?: string
}

export type FormValues = Record<string, string>

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = 'Save',
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FieldDef[]
  initial?: FormValues
  submitLabel?: string
  onSubmit: (values: FormValues) => Promise<unknown>
}) {
  const [values, setValues] = useState<FormValues>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(initial ?? {})
      setError(null)
    }
  }, [open, initial])

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={`f-${f.name}`}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === 'select' ? (
                <Select value={values[f.name] ?? ''} onValueChange={(v) => set(f.name, v)}>
                  <SelectTrigger id={`f-${f.name}`} className="w-full">
                    <SelectValue placeholder={f.placeholder ?? 'Select…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`f-${f.name}`}
                  type={f.type ?? 'text'}
                  step={f.step}
                  min={f.min}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
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
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Empty strings become undefined so optional backend fields are omitted. */
export const optional = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined)
