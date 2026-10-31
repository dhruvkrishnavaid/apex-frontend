import { useState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Boxes, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { useAuth } from '#/auth'
import { ApiError } from '#/lib/api'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) throw redirect({ to: search.redirect ?? '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const search = Route.useSearch()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    try {
      await login(String(form.get('email')), String(form.get('password')))
      await router.invalidate()
      await router.navigate({ to: search.redirect ?? '/' })
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Invalid email or password.' : 'Unable to sign in. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Apex</h1>
          <p className="text-sm text-muted-foreground">Retail inventory management</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your work email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
