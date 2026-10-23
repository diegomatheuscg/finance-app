import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthField } from '@/components/auth/auth-field'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordStrength } from '@/components/auth/password-strength'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api'
import { resetPasswordSchema } from '@/lib/validation'

export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: { password: '', confirmPassword: '' },
  })
  const password = useWatch({ control, name: 'password' })

  async function onSubmit(values) {
    setServerError('')
    try {
      await authApi.resetPassword(token, values.password)
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Senha redefinida. Entre com sua nova senha.' },
      })
    } catch (error) {
      setServerError(error.message || 'Não foi possível redefinir sua senha.')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
        <LockKeyhole size={22} aria-hidden="true" />
      </div>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Crie uma nova senha</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Escolha uma senha segura para voltar a acessar sua conta.
        </p>
      </div>

      {!token ? (
        <Alert variant="destructive">
          <AlertDescription>O link de redefinição está incompleto ou inválido.</AlertDescription>
        </Alert>
      ) : (
        <>
          {serverError && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-3">
              <AuthField
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                placeholder="Digite sua nova senha"
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordStrength password={password} />
            </div>
            <AuthField
              label="Confirme a nova senha"
              type="password"
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button className="mt-2" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                'Redefinir senha'
              )}
            </Button>
          </form>
        </>
      )}

      <Link
        to="/login"
        className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para o login
      </Link>
    </AuthLayout>
  )
}
