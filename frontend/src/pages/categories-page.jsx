import { useCallback, useEffect, useState } from 'react'
import {
  Car,
  HeartPulse,
  House,
  Plus,
  ShoppingBasket,
  Utensils,
  WalletCards,
  CircleDollarSign,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { categoryApi } from '@/lib/api'

const categoryColors = [
  { value: '#16A34A', label: 'Verde' },
  { value: '#22C55E', label: 'Verde claro' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#64748B', label: 'Cinza' },
]

const categoryIcons = [
  { value: 'wallet', label: 'Carteira', icon: WalletCards },
  { value: 'plus', label: 'Receita', icon: CircleDollarSign },
  { value: 'utensils', label: 'Alimentação', icon: Utensils },
  { value: 'shopping', label: 'Compras', icon: ShoppingBasket },
  { value: 'car', label: 'Transporte', icon: Car },
  { value: 'home', label: 'Moradia', icon: House },
  { value: 'heart', label: 'Saúde', icon: HeartPulse },
]

function CategoryIcon({ icon, color }) {
  const option = categoryIcons.find((item) => item.value === icon)
  const Icon = option?.icon || WalletCards
  return (
    <span
      className="flex size-8 items-center justify-center rounded-md"
      style={{ backgroundColor: `${color || '#64748B'}20`, color: color || '#64748B' }}
      aria-hidden="true"
    >
      <Icon size={16} strokeWidth={1.8} />
    </span>
  )
}

function CategoryModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [type, setType] = useState(category?.type || 'EXPENSE')
  const [color, setColor] = useState(category?.color || '#64748B')
  const [icon, setIcon] = useState(category?.icon || 'wallet')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [typeChangeDetails, setTypeChangeDetails] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const details = { name: name.trim(), type, color, icon }
      if (category && category.type !== type) {
        setTypeChangeDetails(details)
        setIsSubmitting(false)
        return
      }
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

  async function confirmTypeChange() {
    if (!category || !typeChangeDetails) return
    setIsSubmitting(true)
    setError('')
    try {
      await categoryApi.update(category.id, typeChangeDetails)
      await onSaved()
      setTypeChangeDetails(null)
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
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="grid gap-2 text-sm font-medium">
              <legend>Cor</legend>
              <div className="flex flex-wrap gap-2">
                {categoryColors.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex size-9 items-center justify-center rounded-md border transition ${
                      color === option.value
                        ? 'border-foreground ring-2 ring-foreground/20'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                    aria-label={`Cor ${option.label}`}
                    aria-pressed={color === option.value}
                    onClick={() => setColor(option.value)}
                  >
                    {color === option.value && (
                      <span className="size-2 rounded-full bg-white shadow-sm" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-2 text-sm font-medium">
              <legend>Ícone</legend>
              <div className="grid grid-cols-4 gap-2">
                {categoryIcons.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`flex h-9 items-center justify-center rounded-md border transition ${
                        icon === option.value
                          ? 'border-foreground bg-accent text-accent-foreground'
                          : 'border-border bg-background'
                      }`}
                      title={option.label}
                      aria-label={`Ícone ${option.label}`}
                      aria-pressed={icon === option.value}
                      onClick={() => setIcon(option.value)}
                    >
                      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : category ? 'Salvar alterações' : 'Criar categoria'}
          </Button>
        </form>
          <ConfirmDialog
            open={Boolean(typeChangeDetails)}
            title="Alterar tipo da categoria"
            description="Os lançamentos vinculados ficarão sem categoria. Continuar?"
            confirmLabel="Alterar tipo"
            pending={isSubmitting}
            onClose={() => setTypeChangeDetails(null)}
            onConfirm={confirmTypeChange}
          />
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
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  async function handleDelete() {
    if (!categoryToDelete) return
    setIsDeleting(true)
    setListError('')
    try {
      await categoryApi.remove(categoryToDelete.id)
      await loadCategories()
      setCategoryToDelete(null)
    } catch (error) {
      setListError(error.message || 'Não foi possível excluir a categoria.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading' && categories.length === 0) {
    return <p className="text-sm text-muted-foreground">Carregando categorias...</p>
  }

  return (
    <section className="grid min-w-0 gap-6">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
        <Button type="button" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} aria-hidden="true" />
          Nova categoria
        </Button>
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
                    <div className="flex items-center gap-3">
                      <CategoryIcon icon={category.icon} color={category.color} />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
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
                        onClick={() => setCategoryToDelete(category)}
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
      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Excluir categoria"
        description={`Excluir "${categoryToDelete?.name}" permanentemente? Esta ação não é permitida se houver lançamentos vinculados.`}
        confirmLabel="Excluir categoria"
        pending={isDeleting}
        onClose={() => {
          if (!isDeleting) setCategoryToDelete(null)
        }}
        onConfirm={handleDelete}
      />
    </section>
  )
}
