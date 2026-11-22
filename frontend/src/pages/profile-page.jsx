import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AuthField } from '@/components/auth/auth-field'
import { useAuth } from '@/hooks/use-auth'
import { profileSchema } from '@/lib/validation'

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: { name: user?.name || '' },
  })

  useEffect(() => {
    if (user?.name) {
      reset({ name: user.name })
    }
  }, [reset, user?.name])

  async function onSubmit(values) {
    setServerError('')
    setSuccessMessage('')

    try {
      await updateProfile({ name: values.name.trim() })
      setSuccessMessage('Perfil atualizado com sucesso.')
    } catch (error) {
      setServerError(error.message || 'Não foi possível atualizar seu perfil.')
    }
  }

  return (
    <section className="max-w-2xl rounded-xl border bg-card p-6 shadow-sm sm:p-10">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">Meu perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
      </div>

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
          label="Nome"
          autoComplete="name"
          placeholder="Seu nome"
          error={errors.name?.message}
          {...register('name')}
        />
        <Button
          className="mt-1 w-full sm:w-auto sm:justify-self-start"
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </form>
    </section>
  )
}
