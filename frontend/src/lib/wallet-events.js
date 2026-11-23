import { ApiError, API_BASE_URL } from '@/lib/api'

const EVENT_NAME = 'transaction-changed'
const RETRY_DELAY = 3000

function handleEventFrame(frame, onEvent) {
  const lines = frame.split(/\r?\n/)
  const eventLine = lines.find((line) => line.startsWith('event:'))
  if (eventLine?.slice(6).trim() !== EVENT_NAME) return

  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (data) onEvent(JSON.parse(data))
}

async function readEvents(response, onEvent, signal) {
  if (!response.body) {
    throw new ApiError('O servidor não iniciou o fluxo de eventos em tempo real.', 502)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() || ''
      frames.forEach((frame) => handleEventFrame(frame, onEvent))

      if (done) return
    }
  } finally {
    reader.releaseLock()
  }
}

export function subscribeToWalletEvents(walletId, token, onEvent, onError) {
  const controller = new AbortController()
  let retryTimer

  async function connect() {
    if (controller.signal.aborted) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/wallets/${walletId}/events`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        },
      )

      if ([401, 403, 404].includes(response.status)) {
        const message = response.status === 401
          ? 'Sua sessão expirou. Entre novamente.'
          : 'Não foi possível acessar os eventos desta carteira.'
        onError(new ApiError(message, response.status))
        return
      }

      if (!response.ok) {
        throw new ApiError('Não foi possível conectar aos eventos desta carteira.', response.status)
      }

      await readEvents(response, onEvent, controller.signal)
    } catch (error) {
      if (controller.signal.aborted || error.name === 'AbortError') return
      onError(error)
    }

    if (!controller.signal.aborted) {
      retryTimer = setTimeout(connect, RETRY_DELAY)
    }
  }

  connect()

  return () => {
    clearTimeout(retryTimer)
    controller.abort()
  }
}
