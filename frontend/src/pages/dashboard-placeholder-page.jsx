import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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

function SummaryCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCurrency(value)}</p>
        </div>
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
  const { user } = useAuth()
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

  return (
    <section className="min-w-0">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Olá, {firstName}!
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">Março de 2025</p>
          </div>

          {loading && <DashboardLoading />}

          {!loading && error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={loadDashboard}>Tentar novamente</Button>
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && data && (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                  label="Saldo atual"
                  value={data.balance}
                />
                <SummaryCard
                  label="Total de receitas"
                  value={data.income}
                />
                <SummaryCard
                  label="Total de despesas"
                  value={data.expense}
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
  )
}
