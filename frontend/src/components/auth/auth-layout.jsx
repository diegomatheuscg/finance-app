export function Brand() {
  return (
    <div className="text-lg font-bold tracking-tight text-foreground">
      Finance App
    </div>
  )
}

export function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
      <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-10">
        <div className="mb-8">
          <Brand />
        </div>
        {children}
      </section>
    </main>
  )
}
