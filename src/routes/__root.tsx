import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AuthState } from '#/auth'
import '../styles.css'

export const Route = createRootRouteWithContext<{ auth: AuthState }>()({
  component: Outlet,
  notFoundComponent: () => (
    <div className="grid min-h-svh place-items-center p-8 text-center">
      <div>
        <p className="text-5xl font-semibold">404</p>
        <p className="mt-2 text-muted-foreground">This page does not exist.</p>
      </div>
    </div>
  ),
})
