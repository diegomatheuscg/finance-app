import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleAlert,
  LogOut,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '@/components/auth/auth-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

const mockDashboardData = {
  balance: 2840.5,
  income: 5200,
  expense: 2359.5,
  monthly: [
    { month: 'Jan', income: 4200, expense: 2100 },
    { month: 'Fev', income: 4700, expense: 2500 },
    { month: 'Mar', income: 5200, expense: 2359.5 },
  ],
  recentTransactions: [
    { id: 1, description: 'Salário', date: '05 mar 2025', amount: 4200, type: 'income' },
    { id: 2, description: 'Aluguel', date: '03 mar 2025', amount: 1450, type: 'expense' },
    { id: 3, description: 'Supermercado', date: '02 mar 2025', amount: 386.75, type: 'expense' },
    { id: 4, description: 'Freelance de design', date: '28 fev 2025', amount: 1000, type: 'income' },
  ],
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value) {
  return currencyFormatter.format(value)
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCurrency(value)}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}

function DashboardLoading() {
  return (
    <div className="grid gap-6" role="status" aria-label="Carregando dashboard">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <span className="sr-only">Carregando seus dados financeiros...</span>
    </div>
  )
}

export function DashboardPlaceholderPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      await new Promise((resolve) => setTimeout(resolve, 700))
      setData(mockDashboardData)
    } catch {
      setError('Não foi possível carregar seu resumo financeiro.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadDashboard, 0)
    return () => clearTimeout(timer)
  }, [loadDashboard])

  const firstName = user?.name?.split(' ')[0] || 'por aqui'
  const hasTransactions = Boolean(data?.recentTransactions?.length)
  const chartData = useMemo(() => data?.monthly || [], [data])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            <Link
              to="/app/perfil/senha"
              className="hidden text-sm font-medium text-primary hover:underline sm:inline"
            >
              Alterar senha
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user?.name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          <nav className="mt-3 grid gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              <BarChart3 size={17} aria-hidden="true" />
              Dashboard
            </Link>
            <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
              <ReceiptText size={17} aria-hidden="true" />
              Lançamentos
            </span>
            <Link
              to="/app/perfil/senha"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <WalletCards size={17} aria-hidden="true" />
              Minha conta
            </Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Visão geral</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Olá, {firstName}!
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Acompanhe sua movimentação financeira de março.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
              <CalendarDays size={16} aria-hidden="true" />
              Março de 2025
            </div>
          </div>

          {loading && <DashboardLoading />}

          {!loading && error && (
            <Alert variant="destructive">
              <CircleAlert size={17} aria-hidden="true" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={loadDashboard}>
                  <RefreshCw size={15} aria-hidden="true" />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && data && (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                  label="Saldo atual"
                  value={data.balance}
                  icon={WalletCards}
                  tone="bg-secondary text-primary"
                />
                <SummaryCard
                  label="Total de receitas"
                  value={data.income}
                  icon={ArrowUpRight}
                  tone="bg-emerald-50 text-emerald-700"
                />
                <SummaryCard
                  label="Total de despesas"
                  value={data.expense}
                  icon={ArrowDownRight}
                  tone="bg-red-50 text-red-700"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Receitas e despesas</CardTitle>
                    <CardDescription>Comparativo dos últimos meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe6e0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `R$${value / 1000}k`}
                          />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', borderColor: '#dfe6e0' }}
                          />
                          <Bar dataKey="income" name="Receitas" fill="#24734f" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Despesas" fill="#e99a7c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        Receitas
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#e99a7c]" />
                        Despesas
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lançamentos recentes</CardTitle>
                    <CardDescription>Movimentações mais recentes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!hasTransactions ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum lançamento neste período.
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {data.recentTransactions.map((transaction) => {
                          const isIncome = transaction.type === 'income'
                          return (
                            <div key={transaction.id} className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                                    isIncome
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {isIncome ? (
                                    <ArrowUpRight size={16} aria-hidden="true" />
                                  ) : (
                                    <ArrowDownRight size={16} aria-hidden="true" />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{transaction.description}</p>
                                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                                </div>
                              </div>
                              <span
                                className={`shrink-0 text-sm font-semibold ${
                                  isIncome ? 'text-emerald-700' : 'text-red-700'
                                }`}
                              >
                                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
