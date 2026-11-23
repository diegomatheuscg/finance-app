import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WalletContext } from '@/contexts/wallet-context'
import { ApiError, walletApi } from '@/lib/api'
import { subscribeToWalletEvents } from '@/lib/wallet-events'
import { useAuth } from '@/hooks/use-auth'

export function WalletProvider({ children }) {
  const { user, token, status: authStatus, logout } = useAuth()
  const navigate = useNavigate()
  const walletPreferenceKey = user?.id ? `activeWalletId:${user.id}` : 'activeWalletId'
  const [wallets, setWallets] = useState([])
  const [activeWalletId, setActiveWalletId] = useState(() => (
    window.localStorage.getItem(`activeWalletId:${user?.id}`)
      || window.localStorage.getItem('activeWalletId')
  ))
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [transactionUpdateKey, setTransactionUpdateKey] = useState(0)

  const loadWallets = useCallback(async (preferredWalletId = null) => {
    setStatus('loading')
    setError('')

    try {
      const loadedWallets = await walletApi.list()
      setWallets(loadedWallets)
      setActiveWalletId((currentId) => {
        const preferredWallet = loadedWallets.find(
          (wallet) => String(wallet.id) === String(preferredWalletId),
        )
        const currentWalletExists = loadedWallets.some(
          (wallet) => String(wallet.id) === String(currentId),
        )
        const nextId = preferredWallet?.id
          || (currentWalletExists ? currentId : loadedWallets[0]?.id)
          || null

        if (nextId) {
          window.localStorage.setItem(walletPreferenceKey, String(nextId))
        } else {
          window.localStorage.removeItem(walletPreferenceKey)
          window.localStorage.removeItem('activeWalletId')
        }

        return nextId ? String(nextId) : null
      })
      setStatus('ready')
      return loadedWallets
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }

      setError(loadError.message || 'Não foi possível carregar as carteiras.')
      setStatus('error')
    }
  }, [logout, navigate, walletPreferenceKey])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !token || !activeWalletId) return undefined

    return subscribeToWalletEvents(
      activeWalletId,
      token,
      () => setTransactionUpdateKey((key) => key + 1),
      (eventError) => {
        if (eventError instanceof ApiError && eventError.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }

        if (eventError instanceof ApiError && [403, 404].includes(eventError.status)) {
          loadWallets()
          return
        }

        console.error('Falha na conexão de eventos da carteira.', eventError)
      },
    )
  }, [activeWalletId, authStatus, loadWallets, logout, navigate, token])

  useEffect(() => {
    const timer = setTimeout(loadWallets, 0)
    return () => clearTimeout(timer)
  }, [loadWallets])

  const selectWallet = useCallback((walletId) => {
    const selectedWallet = wallets.find((wallet) => String(wallet.id) === String(walletId))
    if (!selectedWallet) return

    const nextId = String(selectedWallet.id)
    setActiveWalletId(nextId)
    window.localStorage.setItem(walletPreferenceKey, nextId)
  }, [walletPreferenceKey, wallets])

  const value = useMemo(() => ({
    wallets,
    activeWallet: wallets.find((wallet) => String(wallet.id) === String(activeWalletId)) || null,
    activeWalletId,
    status,
    error,
    transactionUpdateKey,
    selectWallet,
    reloadWallets: loadWallets,
  }), [
    activeWalletId,
    error,
    loadWallets,
    selectWallet,
    status,
    transactionUpdateKey,
    wallets,
  ])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
