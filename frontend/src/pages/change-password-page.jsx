import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthField } from '@/components/auth/auth-field'
import { PasswordStrength } from '@/components/auth/password-strength'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <section className="grid min-w-0 gap-6">
      <div className="flex min-h-11 items-center">
        <h1 className="text-3xl font-semibold tracking-tight">Alterar senha</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Senha da conta</CardTitle>
          <CardDescription>Confirme a senha atual antes de definir uma nova senha.</CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success" className="mb-5">
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
                placeholder="Mínimo 8 caracteres"
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
              {isSubmitting ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
