import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Brand } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DashboardPlaceholderPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-primary">Sua área financeira</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Olá, {user?.name?.split(' ')[0] || 'por aqui'}!
        </h1>
        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Conta pronta para começar</CardTitle>
            <CardDescription>
              A próxima etapa conecta suas carteiras e o resumo financeiro ao dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Seu cadastro e sua sessão estão funcionando. Em seguida, você poderá escolher uma
              carteira e acompanhar receitas, despesas e lançamentos recentes.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
