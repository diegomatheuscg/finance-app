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
import { Link } from 'react-router-dom'
import { useWallet } from '@/contexts/wallet-context'
import { dashboardApi, insightApi, reportApi, transactionApi } from '@/lib/api'

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

function toLocalDateInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function currentMonthPeriod() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return {
    startDate: toLocalDateInput(start),
    endDate: toLocalDateInput(end),
  }
}

function formatMonth(month) {
  const [year, monthNumber] = month.split('-')
  const date = new Date(Number(year), Number(monthNumber) - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
}

function formatLocalDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function DashboardPlaceholderPage() {
  const {
    activeWallet,
    status: walletStatus,
    transactionUpdateKey,
  } = useWallet()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportError, setReportError] = useState('')
  const [exportingReport, setExportingReport] = useState(false)
  const [insight, setInsight] = useState(null)
  const [insightError, setInsightError] = useState('')
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [period, setPeriod] = useState(currentMonthPeriod)
  const periodError = period.startDate > period.endDate
    ? 'A data inicial não pode ser posterior à data final.'
    : ''

  const loadDashboard = useCallback(async () => {
    if (!activeWallet) {
      setData(null)
      setLoading(false)
      return
    }
    if (periodError) {
      setData(null)
      setLoading(false)
      setError(periodError)
      return
    }
    setLoading(true)
    setError('')

    try {
      const [summary, recentPage] = await Promise.all([
        dashboardApi.summary(activeWallet.id, period),
        transactionApi.list(activeWallet.id, {
          startDate: period.startDate,
          endDate: period.endDate,
          page: 0,
          size: 5,
          sort: 'date,desc',
        }),
      ])
      setData({
        balance: summary.balance,
        income: summary.totalIncome,
        expense: summary.totalExpense,
        transactionCount: summary.transactionCount,
        monthly: (summary.byMonth || []).map((item) => ({
          month: formatMonth(item.month),
          income: item.income,
          expense: item.expense,
        })),
        recentTransactions: (recentPage.content || []).map((transaction) => ({
          id: transaction.id,
          description: transaction.description || 'Sem descrição',
          date: formatLocalDate(transaction.date),
          amount: transaction.amount,
          type: transaction.type === 'INCOME' ? 'income' : 'expense',
        })),
      })
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar seu resumo financeiro.')
    } finally {
      setLoading(false)
    }
  }, [activeWallet, period, periodError])

  useEffect(() => {
    const timer = setTimeout(loadDashboard, 0)
    return () => clearTimeout(timer)
  }, [loadDashboard, transactionUpdateKey])

  async function exportReport() {
    setReportError('')
    setExportingReport(true)
    try {
      await reportApi.downloadSummary(activeWallet.id, period)
    } catch (downloadError) {
      setReportError(downloadError.message || 'Não foi possível baixar o relatório.')
    } finally {
      setExportingReport(false)
    }
  }

  async function generateInsight() {
    const insightPeriod = { ...period }
    setInsight(null)
    setInsightError('')
    setGeneratingInsight(true)
    try {
      const result = await insightApi.generate(activeWallet.id, insightPeriod)
      setInsight({
        ...result,
        walletName: activeWallet.name,
        period: insightPeriod,
      })
    } catch (requestError) {
      setInsightError(requestError.message || 'Não foi possível gerar a análise.')
    } finally {
      setGeneratingInsight(false)
    }
  }

  const hasTransactions = Boolean(data?.recentTransactions?.length)
  const chartData = useMemo(() => data?.monthly || [], [data])

  return (
    <section className="grid min-w-0 gap-6">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                De
                <input
                  className="h-9 rounded-md border bg-background px-2"
                  type="date"
                  max={period.endDate}
                  value={period.startDate}
                  onChange={(event) => setPeriod((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                Até
                <input
                  className="h-9 rounded-md border bg-background px-2"
                  type="date"
                  min={period.startDate}
                  value={period.endDate}
                  onChange={(event) => setPeriod((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))}
                />
              </label>
              <Button
                variant="outline"
                onClick={generateInsight}
                disabled={!activeWallet || loading || Boolean(periodError) || generatingInsight}
              >
                {generatingInsight ? 'Analisando...' : 'Análise com IA'}
              </Button>
              <Button
                variant="outline"
                onClick={exportReport}
                disabled={!activeWallet || loading || Boolean(periodError) || exportingReport}
              >
                {exportingReport ? 'Gerando PDF...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>

          {reportError && (
            <Alert variant="destructive">
              <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          )}

          {(generatingInsight || insightError || insight) && (
            <Card>
              <CardHeader>
                <CardTitle>Análise financeira com IA</CardTitle>
                <CardDescription>
                  A análise envia o nome da carteira e valores agregados ao Google Gemini, sem descrições
                  de lançamentos.{' '}
                  {insight && `${insight.walletName} · ${formatLocalDate(insight.period.startDate)} a ${formatLocalDate(insight.period.endDate)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatingInsight && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Analisando seus dados financeiros...
                  </p>
                )}
                {!generatingInsight && insightError && (
                  <Alert variant="destructive">
                    <AlertDescription>{insightError}</AlertDescription>
                  </Alert>
                )}
                {!generatingInsight && insight && (
                  <div className="grid gap-4">
                    <p className="font-medium">{insight.resumo}</p>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Observações</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {insight.observacoes.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Sugestões</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {insight.sugestoes.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!loading && walletStatus === 'ready' && !activeWallet && (
            <div className="grid gap-3 rounded-xl border bg-card p-5">
              <p className="font-medium">Nenhuma carteira cadastrada.</p>
              <p className="text-sm text-muted-foreground">
                Crie uma carteira para visualizar o dashboard.
              </p>
              <Link
                to="/carteiras"
                className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Criar carteira
              </Link>
            </div>
          )}

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
