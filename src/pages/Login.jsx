import { useState } from 'react'

function Login({ onLogin }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsError(false)
    setIsSubmitting(true)

    try {
      const authenticated = await onLogin(email.trim(), password)
      setIsSubmitting(false)
      if (!authenticated) {
        setMessage('E-mail ou senha incorretos')
        setIsError(true)
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível ligar ao servidor local.')
      setIsError(true)
      setIsSubmitting(false)
    }
  }

  function handleForgotPassword() {
    setIsError(false)
    setMessage('A recuperação de senha estará disponível após configurar a autenticação.')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f0ede5] px-5 py-10 text-[#302e27]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_14%_16%,rgba(111,126,102,0.16),transparent_38%),radial-gradient(ellipse_at_86%_82%,rgba(171,139,103,0.15),transparent_40%),linear-gradient(135deg,#f5f2eb_0%,#e9e4da_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#827a68_0.6px,transparent_0.6px)] [background-size:18px_18px]"
      />

      <section className="relative w-full max-w-[420px] rounded-lg border border-[#dcd6ca] bg-[#fbfaf7]/95 px-7 py-9 shadow-[0_24px_70px_-36px_rgba(48,46,39,0.42)] sm:px-10 sm:py-11">
        <header className="mb-8">
          <div className="mb-7 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center border border-[#a5a58b] text-[#56614b]"
            >
              <span className="size-4 rotate-45 border border-current" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#67705b]">
              Ateliê
            </span>
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#827b6d]">
            Acesso restrito
          </p>
          <h1 className="font-serif text-[28px] leading-tight text-[#302e27] sm:text-[30px]">
            Ateliê - Gestão e Estoque
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777267]">
            Entre com os seus dados para continuar.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#4c4a40]"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              autoComplete="email"
              className="h-12 w-full border border-[#d8d2c6] bg-white/70 px-3.5 text-sm text-[#302e27] outline-none transition placeholder:text-[#aaa497] hover:border-[#a8a18f] focus:border-[#68745b] focus:ring-2 focus:ring-[#68745b]/15"
              id="email"
              name="email"
              placeholder="nome@exemplo.com"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#4c4a40]"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="h-12 w-full border border-[#d8d2c6] bg-white/70 px-3.5 text-sm text-[#302e27] outline-none transition placeholder:text-[#aaa497] hover:border-[#a8a18f] focus:border-[#68745b] focus:ring-2 focus:ring-[#68745b]/15"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Introduza a sua senha"
              required
              type="password"
              value={password}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-0.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#625f54]">
              <input
                className="size-4 accent-[#68745b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68745b]"
                name="remember"
                type="checkbox"
              />
              Lembrar-me
            </label>
            <button
              className="text-sm font-medium text-[#59664d] underline decoration-[#a6a28f] underline-offset-4 transition hover:text-[#353f2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#68745b]"
              onClick={handleForgotPassword}
              type="button"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 bg-[#59664d] px-4 text-sm font-semibold text-white transition duration-150 hover:bg-[#49563e] active:scale-[0.99] active:bg-[#3f4a36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#59664d] disabled:cursor-wait disabled:opacity-80"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {isSubmitting ? 'A verificar...' : 'Entrar no Sistema'}
          </button>

          <p
            aria-live={isError ? 'assertive' : 'polite'}
            className={`min-h-5 text-center text-sm ${isError ? 'text-red-700' : 'text-[#777267]'}`}
            role={isError ? 'alert' : undefined}
          >
            {message}
          </p>
        </form>
      </section>
    </main>
  )
}

export default Login
