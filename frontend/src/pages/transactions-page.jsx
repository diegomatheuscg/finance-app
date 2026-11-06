import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'
import { categoryApi, transactionApi } from '@/lib/api'

function TransactionModal({ categories, transaction, onClose, onSaved, walletId }) {
  const [type, setType] = useState(transaction?.type || 'EXPENSE')
  const [amount, setAmount] = useState(transaction?.amount || '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const compatibleCategories = categories.filter((category) => category.type === type)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const details = {
        type,
        amount: Number(amount),
        description: description.trim() || null,
        date,
        categoryId: categoryId ? Number(categoryId) : null,
      }
      if (transaction) {
        await transactionApi.update(walletId, transaction.id, details)
      } else {
        await transactionApi.create(walletId, details)
      }
      await onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o lançamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">{transaction ? 'Editar lançamento' : 'Novo lançamento'}</h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
        {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Tipo
            <select className="h-10 rounded-md border bg-background px-3 font-normal" value={type} onChange={(event) => {
              setType(event.target.value)
              setCategoryId('')
            }}>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Valor
            <input className="h-10 rounded-md border bg-background px-3 font-normal" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Data
            <input className="h-10 rounded-md border bg-background px-3 font-normal" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Categoria
            <select className="h-10 rounded-md border bg-background px-3 font-normal" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Sem categoria</option>
              {compatibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Descrição
            <input className="h-10 rounded-md border bg-background px-3 font-normal" maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : transaction ? 'Salvar alterações' : 'Criar lançamento'}</Button>
        </form>
      </div>
    </div>
  )
}

export function TransactionsPage() {
  const { activeWallet, activeWalletId } = useWallet()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [pageData, setPageData] = useState({ number: 0, totalPages: 0, totalElements: 0 })
  const [filters, setFilters] = useState({ type: '', categoryId: '', startDate: '', endDate: '', page: 0, size: 10 })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [modalTransaction, setModalTransaction] = useState(undefined)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadTransactions = useCallback(async () => {
    if (!activeWalletId) return
    setStatus('loading')
    setError('')
    try {
      const [response, loadedCategories] = await Promise.all([
        transactionApi.list(activeWalletId, filters),
        categoryApi.list(),
      ])
      setTransactions(response.content || [])
      setCategories(loadedCategories)
      setPageData({
        number: response.number || 0,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
      })
      setStatus('ready')
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar os lançamentos.')
      setStatus('error')
    }
  }, [activeWalletId, filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadTransactions])

  async function handleDelete(transaction) {
    if (!window.confirm('Excluir este lançamento?')) return
    try {
      await transactionApi.remove(activeWallet.id, transaction.id)
      await loadTransactions()
    } catch (deleteError) {
      setError(deleteError.message || 'Não foi possível excluir o lançamento.')
    }
  }

  function updateFilter(key, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value, page: 0 }))
  }

  if (!activeWallet) {
    return (
      <div className="grid gap-3">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <p className="text-sm text-muted-foreground">Crie ou selecione uma carteira antes de registrar lançamentos.</p>
      </div>
    )
  }

  const canEdit = ['OWNER', 'EDITOR'].includes(activeWallet.userRole)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        {canEdit && <Button type="button" onClick={() => setShowCreateModal(true)}>Novo lançamento</Button>}
      </div>
      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.categoryId} onChange={(event) => updateFilter('categoryId', event.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input className="h-10 rounded-md border bg-background px-3 text-sm" type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} />
        <input className="h-10 rounded-md border bg-background px-3 text-sm" type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} />
        <Button type="button" variant="outline" onClick={() => setFilters({ type: '', categoryId: '', startDate: '', endDate: '', page: 0, size: 10 })}>Limpar filtros</Button>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {status === 'loading' && <p className="text-sm text-muted-foreground">Carregando lançamentos...</p>}
      {status === 'ready' && transactions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lançamento encontrado.</p>}
      <div className="grid gap-3">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === 'INCOME'
          return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4" key={transaction.id}>
              <div>
                <p className="font-medium">{transaction.description || 'Sem descrição'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{transaction.date} · {transaction.categoryName || 'Sem categoria'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={isIncome ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                  {isIncome ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2).replace('.', ',')}
                </span>
                {canEdit && <Button type="button" variant="outline" size="sm" onClick={() => setModalTransaction(transaction)}>Editar</Button>}
                {canEdit && <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(transaction)}>Excluir</Button>}
              </div>
            </div>
          )
        })}
      </div>
      {pageData.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span>Página {pageData.number + 1} de {pageData.totalPages} ({pageData.totalElements} lançamentos)</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={pageData.number === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Anterior</Button>
            <Button type="button" variant="outline" size="sm" disabled={pageData.number >= pageData.totalPages - 1} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Próxima</Button>
          </div>
        </div>
      )}
      {(showCreateModal || modalTransaction) && (
        <TransactionModal
          categories={categories}
          transaction={modalTransaction}
          walletId={activeWallet.id}
          onClose={() => {
            setShowCreateModal(false)
            setModalTransaction(undefined)
          }}
          onSaved={loadTransactions}
        />
      )}
    </div>
  )
}
