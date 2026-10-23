import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthField } from '@/components/auth/auth-field'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { loginSchema } from '@/lib/validation'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    setServerError('')
    setSuccessMessage('')
    try {
      await login({ email: values.email.trim(), password: values.password })
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error.message || 'Não foi possível entrar. Tente novamente.')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-primary">Bem-vindo de volta</p>
        <h2 className="text-3xl font-semibold tracking-tight">Acesse sua conta</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Entre para acompanhar sua vida financeira.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" className="mb-5">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
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
        <div className="grid gap-2">
          <div className="flex justify-end">
            <Link
              to="/recuperar-senha"
              className="text-sm font-medium text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <AuthField
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button className="mt-1 w-full" size="lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Ainda não tem uma conta?{' '}
        <Link to="/cadastro" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
