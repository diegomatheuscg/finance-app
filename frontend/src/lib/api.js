const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')
  .replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getErrorMessage(payload, fallback) {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors
      .map((fieldError) => fieldError.message)
      .filter(Boolean)
      .join('. ')
  }

  const knownMessages = {
    'Invalid email or password': 'E-mail ou senha incorretos.',
    'An account with this email already exists':
      'Este e-mail já está cadastrado. Entre ou use outro e-mail.',
    'Password reset token is invalid or expired':
      'O link de redefinição é inválido ou expirou. Solicite um novo.',
  }

  return knownMessages[payload?.message] || payload?.message || fallback
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = new Headers()
  const accessToken = token ?? window.localStorage.getItem('accessToken')

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.', 0)
    }
    throw error
  }

  let payload = null
  const contentType = response.headers.get('content-type') || ''
  if (response.status !== 204 && contentType.includes('application/json')) {
    payload = await response.json()
  }

  if (!response.ok) {
    const fallback = response.status >= 500
      ? 'O servidor não conseguiu concluir a solicitação. Tente novamente.'
      : 'Não foi possível concluir a solicitação.'
    throw new ApiError(getErrorMessage(payload, fallback), response.status)
  }

  return payload
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (details) => apiRequest('/auth/register', { method: 'POST', body: details }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, newPassword) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    }),
  getCurrentUser: (token) => apiRequest('/api/v1/users/me', { token }),
}

export const userApi = {
  updatePassword: (details) =>
    apiRequest('/api/v1/users/me/password', {
      method: 'PUT',
      body: details,
    }),
}
