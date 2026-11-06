import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'
import { walletApi } from '@/lib/api'

export function WalletsPage() {
  const { error: loadError, reloadWallets, selectWallet, status, wallets } = useWallet()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const createdWallet = await walletApi.create({
        name: name.trim(),
        description: description.trim() || null,
      })
      await reloadWallets()
      selectWallet(createdWallet.id)
      setName('')
      setDescription('')
    } catch (createError) {
      setError(createError.message || 'Não foi possível criar a carteira.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-2xl font-semibold">Carteiras</h1>
        {status === 'loading' && (
          <p className="mt-4 text-sm text-muted-foreground">Carregando carteiras...</p>
        )}
        {loadError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{loadError}</span>
              <Button variant="outline" size="sm" onClick={reloadWallets}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}
        {status === 'ready' && wallets.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma carteira cadastrada.</p>
        )}
        <div className="mt-4 grid gap-3">
          {wallets.map((wallet) => (
            <button
              className="rounded-lg border bg-card p-4 text-left hover:bg-accent"
              key={wallet.id}
              onClick={() => selectWallet(wallet.id)}
              type="button"
            >
              <p className="font-medium">{wallet.name}</p>
              {wallet.description && (
                <p className="mt-1 text-sm text-muted-foreground">{wallet.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{wallet.userRole}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="h-fit rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Nova carteira</h2>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
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
    </div>
  )
}
