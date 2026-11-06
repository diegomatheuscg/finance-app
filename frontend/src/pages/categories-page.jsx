import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { categoryApi } from '@/lib/api'

function CategoryModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [type, setType] = useState(category?.type || 'EXPENSE')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const details = { name: name.trim(), type, color: null, icon: null }
      if (category) {
        await categoryApi.update(category.id, details)
      } else {
        await categoryApi.create(details)
      }
      await onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar a categoria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        aria-labelledby="category-modal-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold" id="category-modal-title">
            {category ? 'Editar categoria' : 'Nova categoria'}
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
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
              maxLength={80}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Tipo
            <select
              className="h-10 rounded-md border bg-background px-3 font-normal"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : category ? 'Salvar alterações' : 'Criar categoria'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [listError, setListError] = useState('')
  const [modalCategory, setModalCategory] = useState(undefined)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadCategories = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const loadedCategories = await categoryApi.list()
      setCategories(loadedCategories)
      setStatus('ready')
    } catch (error) {
      setLoadError(error.message || 'Não foi possível carregar as categorias.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadCategories, 0)
    return () => clearTimeout(timer)
  }, [loadCategories])

  function closeModal() {
    setShowCreateModal(false)
    setModalCategory(undefined)
  }

  async function handleDelete(category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return

    setListError('')
    try {
      await categoryApi.remove(category.id)
      await loadCategories()
    } catch (error) {
      setListError(error.message || 'Não foi possível excluir a categoria.')
    }
  }

  if (status === 'loading' && categories.length === 0) {
    return <p className="text-sm text-muted-foreground">Carregando categorias...</p>
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button type="button" onClick={() => setShowCreateModal(true)}>Nova categoria</Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{loadError}</span>
            <Button variant="outline" size="sm" onClick={loadCategories}>Tentar novamente</Button>
          </AlertDescription>
        </Alert>
      )}
      {listError && (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}
      {status === 'ready' && categories.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {['INCOME', 'EXPENSE'].map((type) => {
          const typeCategories = categories.filter((category) => category.type === type)
          return (
            <section className="rounded-xl border bg-card p-5" key={type}>
              <h2 className="text-lg font-semibold">
                {type === 'INCOME' ? 'Receitas' : 'Despesas'}
              </h2>
              <div className="mt-4 grid gap-3">
                {typeCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria.</p>
                )}
                {typeCategories.map((category) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border p-3" key={category.id}>
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setModalCategory(category)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {(showCreateModal || modalCategory) && (
        <CategoryModal
          category={modalCategory}
          onClose={closeModal}
          onSaved={loadCategories}
        />
      )}
    </div>
  )
}
