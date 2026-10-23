import { getPasswordStrength } from '@/lib/validation'

const strengthStyles = {
  Fraca: 'bg-red-500',
  Média: 'bg-amber-500',
  Forte: 'bg-emerald-600',
}

export function PasswordStrength({ password }) {
  const { label, score } = getPasswordStrength(password)
  if (!password) return null

  return (
    <div className="grid gap-2" aria-live="polite">
      <div className="flex gap-1.5" aria-label={`Força da senha: ${label}`}>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 flex-1 rounded-full ${
              segment <= score ? strengthStyles[label] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Força da senha: <span className="font-medium text-foreground">{label}</span>
        {' · '}use 8 caracteres, números, símbolos e letras maiúsculas para fortalecê-la.
      </p>
    </div>
  )
}
