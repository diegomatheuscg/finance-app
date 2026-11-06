import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'
import { useAuth } from '@/hooks/use-auth'

export function AuthenticatedLayout() {
  const { user, logout } = useAuth()
  const { activeWalletId, wallets, selectWallet } = useWallet()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    window.localStorage.removeItem('activeWalletId')
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/dashboard" className="text-lg font-bold tracking-tight">Finance App</Link>
          <div className="flex items-center gap-4 text-sm">
            {wallets.length > 0 && (
              <label className="flex items-center gap-2">
                Carteira
                <select
                  className="h-9 rounded-md border bg-background px-2"
                  value={activeWalletId || ''}
                  onChange={(event) => selectWallet(event.target.value)}
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                  ))}
                </select>
              </label>
            )}
            <span className="hidden text-muted-foreground sm:inline">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 text-sm lg:grid lg:content-start">
          <Link className="rounded-md px-3 py-2 hover:bg-accent" to="/dashboard">Dashboard</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-accent" to="/app/carteiras">Carteiras</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-accent" to="/app/categorias">Categorias</Link>
          <Link className="rounded-md px-3 py-2 hover:bg-accent" to="/app/perfil/senha">Senha</Link>
        </nav>
        <section className="min-w-0"><Outlet /></section>
      </div>
    </main>
  )
}
