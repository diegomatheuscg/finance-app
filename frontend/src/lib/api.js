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

function buildQueryString(params) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
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
  getCurrentUser: (token) => userApi.getMe(token),
}

export const userApi = {
  getMe: (token) => apiRequest('/api/v1/users/me', { token }),
  updateMe: (details) =>
    apiRequest('/api/v1/users/me', {
      method: 'PUT',
      body: details,
    }),
  updatePassword: (details) =>
    apiRequest('/api/v1/users/me/password', {
      method: 'PUT',
      body: details,
    }),
}

export const walletApi = {
    list: () => apiRequest('/api/v1/wallets'),
    get: (walletId) => apiRequest(`/api/v1/wallets/${walletId}`),
    create: (details) =>
      apiRequest('/api/v1/wallets', {
        method: 'POST',
        body: details,
      }),
    update: (walletId, details) =>
      apiRequest(`/api/v1/wallets/${walletId}`, {
        method: 'PUT',
        body: details,
      }),
    remove: (walletId) =>
      apiRequest(`/api/v1/wallets/${walletId}`, { method: 'DELETE' }),
    listMembers: (walletId) =>
      apiRequest(`/api/v1/wallets/${walletId}/members`),
    addMember: (walletId, details) =>
      apiRequest(`/api/v1/wallets/${walletId}/members`, {
        method: 'POST',
        body: details,
      }),
    updateMemberRole: (walletId, memberUserId, details) =>
      apiRequest(`/api/v1/wallets/${walletId}/members/${memberUserId}`, {
        method: 'PATCH',
        body: details,
      }),
    removeMember: (walletId, memberUserId) =>
      apiRequest(`/api/v1/wallets/${walletId}/members/${memberUserId}`, {
        method: 'DELETE',
      }),
}

export const memberApi = {
    list: (walletId) => walletApi.listMembers(walletId),
    add: (walletId, details) => walletApi.addMember(walletId, details),
    updateRole: (walletId, memberUserId, details) =>
      walletApi.updateMemberRole(walletId, memberUserId, details),
    remove: (walletId, memberUserId) =>
      walletApi.removeMember(walletId, memberUserId),
}

export const categoryApi = {
    list: (type) =>
      apiRequest(`/api/v1/categories${buildQueryString({ type })}`),
    create: (details) =>
      apiRequest('/api/v1/categories', {
        method: 'POST',
        body: details,
      }),
    update: (categoryId, details) =>
      apiRequest(`/api/v1/categories/${categoryId}`, {
        method: 'PUT',
        body: details,
      }),
    remove: (categoryId) =>
      apiRequest(`/api/v1/categories/${categoryId}`, { method: 'DELETE' }),
}

export const transactionApi = {
    list: (walletId, filters = {}) =>
      apiRequest(
        `/api/v1/wallets/${walletId}/transactions${buildQueryString({
          type: filters.type,
          categoryId: filters.categoryId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          page: filters.page,
          size: filters.size,
          sort: filters.sort,
        })}`,
      ),
    get: (walletId, transactionId) =>
      apiRequest(`/api/v1/wallets/${walletId}/transactions/${transactionId}`),
    create: (walletId, details) =>
      apiRequest(`/api/v1/wallets/${walletId}/transactions`, {
        method: 'POST',
        body: details,
      }),
    update: (walletId, transactionId, details) =>
      apiRequest(`/api/v1/wallets/${walletId}/transactions/${transactionId}`, {
        method: 'PUT',
        body: details,
      }),
    remove: (walletId, transactionId) =>
      apiRequest(`/api/v1/wallets/${walletId}/transactions/${transactionId}`, {
        method: 'DELETE',
      }),
}

export const dashboardApi = {
    summary: (walletId, filters = {}) =>
      apiRequest(
        `/api/v1/wallets/${walletId}/summary${buildQueryString({
          startDate: filters.startDate,
          endDate: filters.endDate,
        })}`,
      ),
}
