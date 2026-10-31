import { redirect } from '@tanstack/react-router'
import type { AuthState } from '#/auth'

/** Route guard: send users without every listed permission back to the dashboard. */
export const requires =
  (...permissions: string[]) =>
  ({ context }: { context: { auth: AuthState } }) => {
    if (!context.auth.can(...permissions)) throw redirect({ to: '/' })
  }
