import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive = true,
  pending = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg"
      >
        <h2 id="confirm-dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? 'Confirmando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
