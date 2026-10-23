import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Digite um e-mail válido.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Informe sua senha.')
    .min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Seu nome deve ter pelo menos 2 caracteres.')
      .max(100, 'Seu nome deve ter no máximo 100 caracteres.'),
    email: emailSchema,
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .max(100, 'A senha deve ter no máximo 100 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .max(100, 'A senha deve ter no máximo 100 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export function getPasswordStrength(password) {
  if (!password) {
    return { label: '', score: 0 }
  }

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  if (score <= 1) return { label: 'Fraca', score }
  if (score <= 3) return { label: 'Média', score }
  return { label: 'Forte', score }
}
