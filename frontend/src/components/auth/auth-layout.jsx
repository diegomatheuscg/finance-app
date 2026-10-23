import { ArrowUpRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react'

export function Brand({ inverse = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${
          inverse ? 'bg-white/15 text-white' : 'bg-primary text-primary-foreground'
        }`}
      >
        <Leaf size={21} aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${inverse ? 'text-white' : 'text-foreground'}`}>
        fluxo
      </span>
    </div>
  )
}

export function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-slate-900/5 lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#183d2d] p-10 text-white lg:flex">
          <div className="absolute -right-28 -top-28 size-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-36 -left-24 size-96 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-12 size-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
            <Brand inverse />
          </div>
          <div className="relative max-w-sm">
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
              <Sparkles size={23} aria-hidden="true" />
            </div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">
              Mais clareza, menos correria
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Seu dinheiro em sintonia com a sua vida.
            </h1>
            <p className="mt-5 text-base leading-7 text-emerald-50/75">
              Organize suas finanças e acompanhe o que importa em um só lugar.
            </p>
          </div>
          <div className="relative flex items-center gap-2 text-sm text-emerald-50/70">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Seus dados, no seu controle</span>
            <ArrowUpRight className="ml-auto" size={17} aria-hidden="true" />
          </div>
        </aside>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Brand />
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
