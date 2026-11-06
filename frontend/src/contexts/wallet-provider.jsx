import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WalletContext } from '@/contexts/wallet-context'
import { ApiError, walletApi } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

export function WalletProvider({ children }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [wallets, setWallets] = useState([])
  const [activeWalletId, setActiveWalletId] = useState(() => (
    window.localStorage.getItem('activeWalletId')
  ))
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

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
          window.localStorage.setItem('activeWalletId', String(nextId))
        } else {
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
  }, [logout, navigate])

  useEffect(() => {
    const timer = setTimeout(loadWallets, 0)
    return () => clearTimeout(timer)
  }, [loadWallets])

  const selectWallet = useCallback((walletId) => {
    const selectedWallet = wallets.find((wallet) => String(wallet.id) === String(walletId))
    if (!selectedWallet) return

    const nextId = String(selectedWallet.id)
    setActiveWalletId(nextId)
    window.localStorage.setItem('activeWalletId', nextId)
  }, [wallets])

  const value = useMemo(() => ({
    wallets,
    activeWallet: wallets.find((wallet) => String(wallet.id) === String(activeWalletId)) || null,
    activeWalletId,
    status,
    error,
    selectWallet,
    reloadWallets: loadWallets,
  }), [activeWalletId, error, loadWallets, selectWallet, status, wallets])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
