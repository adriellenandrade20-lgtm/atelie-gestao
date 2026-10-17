import { useState } from 'react'
import { apiRequest } from '../api.js'

const inputClassName = 'h-11 w-full border border-[#d9d4c9] bg-white px-3.5 text-sm text-[#302e27] outline-none transition placeholder:text-[#a09b90] focus:border-[#758064] focus:ring-2 focus:ring-[#758064]/15'
const labelClassName = 'mb-2 block text-sm font-medium text-[#4c4a40]'

function Configuracoes({ user, onCredentialsChanged }) {
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('A confirmação da nova senha não corresponde.')
      return
    }

    setIsSaving(true)
    try {
      const result = await apiRequest('/auth/credentials', {
        method: 'PATCH',
        body: {
          currentPassword,
          email: email.trim(),
          newPassword: newPassword || undefined,
        },
      })
      onCredentialsChanged(result)
      setEmail(result.user.email)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Credenciais atualizadas com sucesso.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 border-b border-[#ded9ce] pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">Conta e acesso</p>
        <h1 className="mt-1 font-serif text-2xl leading-tight text-[#302e27] sm:text-[28px]">Configurações</h1>
        <p className="mt-2 text-sm text-[#777267]">Atualize as credenciais usadas para entrar no sistema.</p>
      </header>

      <section className="max-w-2xl border border-[#ded9ce] bg-[#fbfaf7]">
        <header className="border-b border-[#e6e1d7] px-5 py-4 sm:px-7">
          <h2 className="text-sm font-semibold text-[#4c4a40]">Credenciais de acesso</h2>
          <p className="mt-1 text-xs text-[#827b6d]">A senha atual é necessária para confirmar qualquer alteração.</p>
        </header>
        <form className="space-y-5 px-5 py-5 sm:px-7 sm:py-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className={labelClassName}>E-mail de acesso</span>
            <input
              autoComplete="username"
              className={inputClassName}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <div className="border-t border-[#e6e1d7] pt-5">
            <label className="mb-4 block">
              <span className={labelClassName}>Senha atual</span>
              <input
                autoComplete="current-password"
                className={inputClassName}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>Nova senha</span>
                <input
                  autoComplete="new-password"
                  className={inputClassName}
                  minLength="8"
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Deixe em branco para manter"
                  type="password"
                  value={newPassword}
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Confirmar nova senha</span>
                <input
                  autoComplete="new-password"
                  className={inputClassName}
                  minLength="8"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a nova senha"
                  type="password"
                  value={confirmPassword}
                />
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          {success && <p className="text-sm text-[#496543]" role="status">{success}</p>}

          <footer className="flex justify-end border-t border-[#e6e1d7] pt-5">
            <button
              className="h-11 bg-[#59664d] px-5 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'A atualizar...' : 'Guardar alterações'}
            </button>
          </footer>
        </form>
      </section>
    </section>
  )
}

export default Configuracoes
