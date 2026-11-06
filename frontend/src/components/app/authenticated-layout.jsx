import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'
import { useAuth } from '@/hooks/use-auth'
import { walletApi } from '@/lib/api'

function WalletEmptyState() {
  const { reloadWallets } = useWallet()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await walletApi.create({ name: name.trim(), description: description.trim() || null })
      await reloadWallets()
      setName('')
      setDescription('')
    } catch (createError) {
      setError(createError.message || 'Não foi possível criar a carteira.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-xl border bg-card p-6">
      <h1 className="text-xl font-semibold">Crie sua primeira carteira</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uma carteira organiza seus lançamentos e membros.
      </p>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm font-medium">
          Nome
          <input
            className="h-10 rounded-md border bg-background px-3 font-normal"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Descrição
          <input
            className="h-10 rounded-md border bg-background px-3 font-normal"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={255}
          />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar carteira'}
        </Button>
      </form>
    </section>
  )
}

function WalletLoading() {
  return <p className="text-sm text-muted-foreground">Carregando carteiras...</p>
}

function WalletError({ message, onRetry }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
      </AlertDescription>
    </Alert>
  )
}

export function AuthenticatedLayout({ requireWallet = false }) {
  const { user, logout } = useAuth()
  const { activeWallet, activeWalletId, error, reloadWallets, status, wallets, selectWallet } = useWallet()
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
          <Link className="rounded-md px-3 py-2 hover:bg-accent" to="/app/perfil/senha">Senha</Link>
        </nav>
        <section className="min-w-0">
          {status === 'loading' && <WalletLoading />}
          {status === 'error' && <WalletError message={error} onRetry={reloadWallets} />}
          {status === 'ready' && requireWallet && !activeWallet && <WalletEmptyState />}
          {status === 'ready' && (!requireWallet || activeWallet) && <Outlet />}
        </section>
      </div>
    </main>
  )
}
