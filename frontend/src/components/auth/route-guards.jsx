import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle, RotateCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

function SessionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="animate-spin text-primary" size={20} aria-hidden="true" />
        Verificando sua sessão...
      </div>
    </main>
  )
}

export function ProtectedRoute() {
  const { status, sessionError, restoreSession } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <SessionLoading />
  if (status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Não foi possível validar sua sessão</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sessionError}</p>
          <Button className="mt-5" onClick={restoreSession}>
            <RotateCw size={16} aria-hidden="true" />
            Tentar novamente
          </Button>
        </div>
      </main>
    )
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { status } = useAuth()
  if (status === 'loading') return <SessionLoading />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
