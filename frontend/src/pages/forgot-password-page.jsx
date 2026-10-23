import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LoaderCircle, MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AuthField } from '@/components/auth/auth-field'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authApi } from '@/lib/api'
import { forgotPasswordSchema } from '@/lib/validation'

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [debugResetToken, setDebugResetToken] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values) {
    setServerError('')
    try {
      const response = await authApi.forgotPassword(values.email.trim())
      setDebugResetToken(response?.debugToken || '')
      setSubmitted(true)
    } catch (error) {
      setServerError(error.message || 'Não foi possível solicitar a recuperação agora.')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
        <MailCheck size={23} aria-hidden="true" />
      </div>
      <div className="mb-7">
        <h2 className="text-3xl font-semibold tracking-tight">Recuperar senha</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
        </p>
      </div>

      {submitted ? (
        <Alert variant="success">
          <AlertDescription>
            Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.
            {debugResetToken && (
              <span className="mt-3 block">
                <Link
                  to={`/redefinir-senha/${encodeURIComponent(debugResetToken)}`}
                  className="font-semibold underline underline-offset-4"
                >
                  Abrir link de teste para redefinir a senha
                </Link>
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {serverError && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <AuthField
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                'Enviar instruções'
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
