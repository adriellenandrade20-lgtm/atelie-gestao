import { useEffect, useState } from 'react'
import { apiRequest, clearSessionToken, getSessionToken, setSessionToken } from './api.js'
import Dashboard from './pages/Dashboard.jsx'
import Financeiro from './pages/Financeiro.jsx'
import Insumos from './pages/Insumos.jsx'
import Configuracoes from './pages/Configuracoes.jsx'
import Login from './pages/Login.jsx'
import Movimentacoes from './pages/Movimentacoes.jsx'
import Produtos from './pages/Produtos.jsx'

const menuItems = [
  'Dashboard',
  'Insumos & Pedras',
  'Produtos Acabados',
  'Movimentações',
  'Financeiro',
  '⚙️ Configurações',
]

function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(() => !getSessionToken())
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [sales, setSales] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!getSessionToken()) return
    let isCurrent = true
    apiRequest('/auth/me')
      .then(({ user: authenticatedUser }) => {
        if (isCurrent) setUser(authenticatedUser)
      })
      .catch(() => clearSessionToken())
      .finally(() => {
        if (isCurrent) setAuthChecked(true)
      })
    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    if (!user) return
    let isCurrent = true
    apiRequest('/vendas')
      .then(({ data }) => {
        if (isCurrent) setSales(data)
      })
      .catch((error) => {
        console.error('Não foi possível carregar as vendas:', error)
      })
    return () => { isCurrent = false }
  }, [user, refreshKey])

  async function handleLogin(email, password) {
    const { token, user: authenticatedUser } = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setSessionToken(token)
    setUser(authenticatedUser)
    return true
  }

  async function handleRegisterSale(sale) {
    const { data } = await apiRequest('/vendas', {
      method: 'POST',
      body: sale,
    })
    setSales((current) => [data, ...current])
    setRefreshKey((current) => current + 1)
    return data
  }

  function handleLogout() {
    clearSessionToken()
    setUser(null)
    setSales([])
  }

  function handleCredentialsChanged(session) {
    setSessionToken(session.token)
    setUser(session.user)
  }

  function handleDataChanged() {
    setRefreshKey((current) => current + 1)
  }

  if (!authChecked) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f1eb] text-sm text-[#777267]">A validar sessão local...</main>
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-[#f3f1eb] text-[#302e27] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-[#ded9ce] bg-[#fbfaf7] lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-6 py-5 lg:border-b lg:border-[#e8e4db] lg:py-7">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center border border-[#a5a58b] text-[#56614b]"
          >
            <span className="size-4 rotate-45 border border-current" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#67705b]">
              Ateliê
            </p>
            <p className="mt-0.5 text-xs text-[#827b6d]">Gestão e Estoque</p>
          </div>
          <button
            className="ml-auto text-xs font-medium text-[#68745b] underline underline-offset-4 hover:text-[#3f4a36] lg:hidden"
            onClick={handleLogout}
            type="button"
          >
            Sair
          </button>
        </div>

        <nav aria-label="Menu principal" className="px-3 py-3 lg:flex-1 lg:px-4 lg:py-7">
          <p className="hidden px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#918b7e] lg:block">
            Menu
          </p>
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1.5">
            {menuItems.map((item) => {
              const isActive = activeSection === item

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 shrink-0 items-center gap-3 px-3 text-left text-sm transition lg:w-full ${
                    isActive
                      ? 'bg-[#e8e9df] font-semibold text-[#46523c]'
                      : 'text-[#69665c] hover:bg-[#f0eee8] hover:text-[#302e27]'
                  }`}
                  key={item}
                  onClick={() => setActiveSection(item)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 shrink-0 rounded-full ${isActive ? 'bg-[#68745b]' : 'bg-[#c5c0b4]'}`}
                  />
                  {item}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="hidden items-center justify-between border-t border-[#e8e4db] px-5 py-4 lg:flex">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[#4c4a40]">{user.nome}</p>
            <p className="mt-0.5 text-[11px] text-[#918b7e]">Sessão local</p>
          </div>
          <button
            className="ml-3 text-xs font-medium text-[#68745b] underline underline-offset-4 hover:text-[#3f4a36]"
            onClick={handleLogout}
            type="button"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        {activeSection === 'Dashboard' ? (
          <Dashboard refreshKey={refreshKey} sales={sales} onRegisterSale={handleRegisterSale} />
        ) : activeSection === 'Financeiro' ? (
          <Financeiro sales={sales} onRegisterSale={handleRegisterSale} />
        ) : activeSection === '⚙️ Configurações' ? (
          <Configuracoes user={user} onCredentialsChanged={handleCredentialsChanged} />
        ) : activeSection === 'Insumos & Pedras' ? (
          <Insumos refreshKey={refreshKey} onDataChanged={handleDataChanged} />
        ) : activeSection === 'Produtos Acabados' ? (
          <Produtos refreshKey={refreshKey} onDataChanged={handleDataChanged} />
        ) : activeSection === 'Movimentações' ? (
          <Movimentacoes refreshKey={refreshKey} onDataChanged={handleDataChanged} />
        ) : (
          <>
            <header className="mb-8 flex items-center justify-between border-b border-[#ded9ce] pb-5">
              <div>
                <p className="text-xs font-medium text-[#827b6d]">Ateliê / Gestão</p>
                <h1 className="mt-1 font-serif text-2xl text-[#302e27]">{activeSection}</h1>
              </div>
            </header>

            <section className="min-h-56 border border-[#ded9ce] bg-[#fbfaf7] p-6 sm:p-8">
              <h2 className="font-serif text-xl text-[#4c4a40]">{activeSection}</h2>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
