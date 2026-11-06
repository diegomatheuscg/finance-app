import { useState } from 'react'
import { ArrowLeft, CheckCircle, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthField } from '@/components/auth/auth-field'
import { PasswordStrength } from '@/components/auth/password-strength'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { userApi } from '@/lib/api'
import { changePasswordSchema } from '@/lib/validation'

export function ChangePasswordPage() {
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = useWatch({ control, name: 'newPassword' })

  async function onSubmit(values) {
    setServerError('')
    setSuccessMessage('')

    try {
      await userApi.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      reset()
      setSuccessMessage('Senha alterada com sucesso.')
    } catch (error) {
      setServerError(error.message || 'Não foi possível alterar sua senha.')
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between border-b pb-5">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao dashboard
          </Link>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LockKeyhole size={19} aria-hidden="true" />
          </span>
        </header>

        <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-10">
          <div className="mb-7">
            <p className="mb-2 text-sm font-medium text-primary">Segurança da conta</p>
            <h1 className="text-3xl font-semibold tracking-tight">Alterar senha</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Informe sua senha atual e escolha uma nova senha segura.
            </p>
          </div>

          {serverError && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success" className="mb-5">
              <CheckCircle size={17} aria-hidden="true" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <AuthField
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha atual"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <div className="grid gap-3">
              <AuthField
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                placeholder="Crie uma nova senha"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <PasswordStrength password={newPassword} />
            </div>
            <AuthField
              label="Confirme a nova senha"
              type="password"
              autoComplete="new-password"
              placeholder="Digite a nova senha novamente"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button className="mt-1 w-full sm:w-auto sm:justify-self-start" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                'Alterar senha'
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
