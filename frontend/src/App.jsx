import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/app/authenticated-layout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/route-guards'
import { WalletProvider } from '@/contexts/wallet-provider'
import { DashboardPlaceholderPage } from '@/pages/dashboard-placeholder-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { ChangePasswordPage } from '@/pages/change-password-page'
import { WalletsPage } from '@/pages/wallets-page'
import { CategoriesPage } from '@/pages/categories-page'

function AuthenticatedProviders() {
  return (
    <WalletProvider>
      <Outlet />
    </WalletProvider>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha/:token" element={<ResetPasswordPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedProviders />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardPlaceholderPage />} />
          </Route>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/app/perfil/senha" element={<ChangePasswordPage />} />
            <Route path="/app/carteiras" element={<WalletsPage />} />
            <Route path="/app/categorias" element={<CategoriesPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
