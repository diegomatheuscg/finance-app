import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Tags,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'
import { useAuth } from '@/hooks/use-auth'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/carteiras', label: 'Carteiras', icon: WalletCards },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
  { to: '/perfil/senha', label: 'Senha', icon: KeyRound },
]

export function AuthenticatedLayout() {
  const { user, logout } = useAuth()
  const { activeWalletId, wallets, selectWallet } = useWallet()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    window.localStorage.removeItem(`activeWalletId:${user?.id}`)
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
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="flex flex-wrap items-start gap-2 text-sm md:grid md:content-start md:border-r md:border-border/70 md:pr-5">
          {navigationItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <section className="min-w-0 w-full max-w-6xl"><Outlet /></section>
      </div>
    </main>
  )
}
