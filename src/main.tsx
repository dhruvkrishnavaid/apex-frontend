import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AuthProvider, useAuth } from './auth'
import { router } from './router'
import { Toaster } from '#/components/ui/sonner'
import { TooltipProvider } from '#/components/ui/tooltip'
import { ApiError } from '#/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
})

function InnerApp() {
  const auth = useAuth()
  if (auth.status === 'loading') {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground" role="status">
        Loading…
      </div>
    )
  }
  return <RouterProvider router={router} context={{ auth }} />
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <InnerApp />
          </TooltipProvider>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}
