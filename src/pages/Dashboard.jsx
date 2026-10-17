import { useEffect, useState } from 'react'
import RegistrarVendaModal from '../components/RegistrarVendaModal.jsx'
import { apiRequest } from '../api.js'
import {
  currencyFormat,
  getBestSellers,
  getFinancialMetrics,
  getMonthlyFlow,
  numberFormat,
} from '../data/financeiro.js'

function MetricCard({ icon, label, value, detail, tone }) {
  return (
    <article className="border border-[#ded9ce] bg-[#fbfaf7] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <span className={`mt-1 size-2 rounded-full ${tone}`} aria-hidden="true" />
      </div>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#827b6d]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#302e27] sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-[#918b7e]">{detail}</p>
    </article>
  )
}

function RevenueChart({ sales }) {
  const monthlyData = getMonthlyFlow(sales)
  const maxValue = Math.max(...monthlyData.flatMap((month) => [month.revenue, month.expenses]))

  return (
    <section className="border border-[#ded9ce] bg-[#fbfaf7] p-5 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-serif text-lg text-[#302e27]">Receitas vs Despesas</h2>
          <p className="mt-1 text-xs text-[#827b6d]">Últimos seis meses · valores em R$</p>
        </div>
        <div className="flex gap-4 text-[11px] text-[#625f54]">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#68745b]" />Receitas</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#c28d67]" />Despesas</span>
        </div>
      </header>

      {sales.length === 0 ? (
        <div className="mt-6 flex h-48 items-center justify-center border border-dashed border-[#d4cec1] text-sm text-[#827b6d]">
          Sem vendas registradas neste período.
        </div>
      ) : (
        <div aria-label="Gráfico de receitas e despesas por mês" className="mt-6 grid h-48 grid-cols-6 items-end gap-2 border-b border-[#e6e1d7] px-1 sm:gap-4" role="img">
          {monthlyData.map((month) => (
            <div className="flex h-full min-w-0 flex-col justify-end" key={month.month}>
              <div className="flex h-[calc(100%-22px)] items-end justify-center gap-1.5 sm:gap-2">
                <div
                  aria-label={`Receitas ${currencyFormat.format(month.revenue)}`}
                  className="w-3.5 bg-[#68745b] transition-all sm:w-5"
                  style={{ height: `${Math.max((month.revenue / maxValue) * 100, 2)}%` }}
                  title={`Receitas: ${currencyFormat.format(month.revenue)}`}
                />
                <div
                  aria-label={`Despesas ${currencyFormat.format(month.expenses)}`}
                  className="w-3.5 bg-[#c28d67] transition-all sm:w-5"
                  style={{ height: `${Math.max((month.expenses / maxValue) * 100, 2)}%` }}
                  title={`Despesas: ${currencyFormat.format(month.expenses)}`}
                />
              </div>
              <span className="mt-2 text-center text-[10px] text-[#827b6d]">{month.month}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Dashboard({ sales = [], onRegisterSale, refreshKey = 0 }) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [requestedItems, setRequestedItems] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const metrics = getFinancialMetrics(sales)
  const sellers = getBestSellers(sales)

  useEffect(() => {
    let isCurrent = true
    apiRequest('/insumos')
      .then(({ data }) => {
        if (!isCurrent) return
        setLowStockItems(data
          .filter((item) => item.quantidade <= item.estoqueMinimo)
          .map((item) => ({
            id: item.id,
            name: item.nome,
            stock: item.quantidade,
            minimum: item.estoqueMinimo,
            unit: item.unidadeMedida,
          })))
      })
      .catch(() => {
        if (isCurrent) setLowStockItems([])
      })
    return () => { isCurrent = false }
  }, [refreshKey])

  function markRequested(itemId) {
    setRequestedItems((current) => current.includes(itemId) ? current : [...current, itemId])
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#ded9ce] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">Resumo do ateliê</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-[#302e27] sm:text-[28px]">Visão Geral</h1>
          <p className="mt-2 text-sm text-[#777267]">Acompanhe o ritmo das vendas, produção e estoque.</p>
        </div>
        <button
          className="h-10 shrink-0 bg-[#59664d] px-4 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99]"
          onClick={() => setIsSaleModalOpen(true)}
          type="button"
        >
          + Registrar Nova Venda
        </button>
      </header>

      <section aria-label="Indicadores principais" className="mb-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          detail="Vendas acumuladas"
          icon="💵"
          label="Faturamento Bruto"
          tone="bg-[#68745b]"
          value={currencyFormat.format(metrics.grossRevenue)}
        />
        <MetricCard
          detail="Custo das peças vendidas"
          icon="📉"
          label="Custo de Produção / CMV"
          tone="bg-[#c28d67]"
          value={currencyFormat.format(metrics.productionCost)}
        />
        <MetricCard
          detail={`Lucro bruto: ${currencyFormat.format(metrics.grossProfit)} · sem despesas adicionais registradas`}
          icon="❇️"
          label="Lucro Líquido"
          tone="bg-[#8a9877]"
          value={currencyFormat.format(metrics.netProfit)}
        />
        <MetricCard
          detail="Abaixo do estoque mínimo"
          icon="🚨"
          label="Alertas de Estoque Baixo"
          tone="bg-[#b66c58]"
          value={numberFormat.format(lowStockItems.length)}
        />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
        <RevenueChart sales={sales} />

        <section className="border border-[#ded9ce] bg-[#fbfaf7] p-5 sm:p-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg text-[#302e27]">Estoque em atenção</h2>
              <p className="mt-1 text-xs text-[#827b6d]">Insumos abaixo do mínimo definido</p>
            </div>
            <span className="bg-[#f2e3df] px-2 py-1 text-xs font-semibold text-[#984f43]">
              {lowStockItems.length} alertas
            </span>
          </header>
          <ul className="mt-4 divide-y divide-[#eeeae2]">
            {lowStockItems.map((item) => {
              const isRequested = requestedItems.includes(item.id)

              return (
                <li className="py-3 first:pt-0 last:pb-0" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#4c4a40]">{item.name}</p>
                      <p className="mt-1 text-[11px] text-[#827b6d]">
                        {numberFormat.format(item.stock)} {item.unit} · mínimo {numberFormat.format(item.minimum)} {item.unit}
                      </p>
                    </div>
                    <button
                      className={`shrink-0 text-[11px] font-semibold underline underline-offset-4 ${isRequested ? 'text-[#68745b]' : 'text-[#87544a] hover:text-[#6d382f]'}`}
                      disabled={isRequested}
                      onClick={() => markRequested(item.id)}
                      type="button"
                    >
                      {isRequested ? 'Solicitada' : 'Solicitar Reposição'}
                    </button>
                  </div>
                </li>
              )
            })}
            {lowStockItems.length === 0 && (
              <li className="py-8 text-center text-sm text-[#827b6d]">
                Nenhum insumo atingiu o estoque mínimo.
              </li>
            )}
          </ul>
        </section>

        <section className="overflow-hidden border border-[#ded9ce] bg-[#fbfaf7] 2xl:col-span-2">
          <header className="flex items-end justify-between gap-3 border-b border-[#e4dfd5] px-5 py-4">
            <div>
              <h2 className="font-serif text-lg text-[#302e27]">Peças Mais Vendidas</h2>
              <p className="mt-1 text-xs text-[#827b6d]">Margem calculada sobre preço e custo por peça</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#918b7e]">Este mês</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e4dfd5] bg-[#f2f0e9] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777267]">
                  <th className="px-5 py-3">Peça</th>
                  <th className="px-5 py-3 text-right">Unidades vendidas</th>
                  <th className="px-5 py-3 text-right">Preço médio</th>
                  <th className="px-5 py-3 text-right">Margem de lucro</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr className="border-b border-[#eeeae2] last:border-0" key={seller.id}>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#3f3d35]">{seller.name}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-[#625f54]">{numberFormat.format(seller.quantity)}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-[#625f54]">{currencyFormat.format(seller.unitPrice)}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#526347]">
                      {seller.margin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                    </td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr><td className="px-5 py-10 text-center text-sm text-[#827b6d]" colSpan="4">Nenhuma venda cadastrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isSaleModalOpen && (
        <RegistrarVendaModal
          onClose={() => setIsSaleModalOpen(false)}
          onSave={onRegisterSale}
        />
      )}
    </section>
  )
}

export default Dashboard
