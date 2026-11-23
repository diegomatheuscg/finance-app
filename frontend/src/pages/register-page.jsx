import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField } from '@/components/auth/auth-field'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordStrength } from '@/components/auth/password-strength'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api'
import { registerSchema } from '@/lib/validation'

export function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const password = useWatch({ control, name: 'password' })

  async function onSubmit(values) {
    setServerError('')
    try {
      await authApi.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Conta criada! Entre com seu e-mail e senha.' },
      })
    } catch (error) {
      setServerError(error.message || 'Não foi possível criar sua conta. Tente novamente.')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Criar conta</h2>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          label="Nome"
          autoComplete="name"
          placeholder="Nome completo"
          error={errors.name?.message}
          {...register('name')}
        />
        <AuthField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="grid gap-3">
          <AuthField
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength password={password} />
        </div>
        <AuthField
          label="Confirme sua senha"
          type="password"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button className="mt-2 w-full" size="lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
              Criando conta...
            </>
          ) : (
            <>
              Criar conta
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
