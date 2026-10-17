import { useState } from 'react'
import RegistrarVendaModal from '../components/RegistrarVendaModal.jsx'
import {
  currencyFormat,
  getFinancialMetrics,
  getMonthlyFlow,
  getRecentSales,
} from '../data/financeiro.js'

function FinanceMetric({ label, value, note, accent }) {
  return (
    <article className="border border-[#ded9ce] bg-[#fbfaf7] p-4 sm:p-5">
      <span className={`block h-1 w-9 ${accent}`} aria-hidden="true" />
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#827b6d]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#302e27] sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-[#918b7e]">{note}</p>
    </article>
  )
}

function MonthlyComparison({ sales }) {
  const months = getMonthlyFlow(sales)
  const maximum = Math.max(...months.flatMap((month) => [month.revenue, month.expenses]))

  return (
    <section className="border border-[#ded9ce] bg-[#fbfaf7] p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-[#302e27]">Receitas e despesas</h2>
          <p className="mt-1 text-xs text-[#827b6d]">Comparativo mensal · últimos seis meses</p>
        </div>
        <div className="flex gap-4 text-[11px] text-[#625f54]">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#68745b]" />Receitas</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#c28d67]" />Despesas</span>
        </div>
      </header>
      {sales.length === 0 ? (
        <div className="mt-5 flex min-h-56 items-center justify-center border border-dashed border-[#d4cec1] text-sm text-[#827b6d]">
          Sem vendas registradas para comparar.
        </div>
      ) : (
        <div className="mt-5 space-y-4" role="img" aria-label="Comparativo de receitas e despesas nos últimos seis meses">
          {months.map((month) => (
            <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-4" key={month.month}>
              <span className="text-xs font-medium text-[#777267]">{month.month}</span>
              <div className="space-y-1.5">
                <div
                  aria-label={`Receitas ${currencyFormat.format(month.revenue)}`}
                  className="h-2.5 bg-[#68745b] transition-all"
                  style={{ width: `${maximum ? (month.revenue / maximum) * 100 : 0}%` }}
                  title={`Receitas: ${currencyFormat.format(month.revenue)}`}
                />
                <div
                  aria-label={`Despesas ${currencyFormat.format(month.expenses)}`}
                  className="h-2.5 bg-[#c28d67] transition-all"
                  style={{ width: `${maximum ? (month.expenses / maximum) * 100 : 0}%` }}
                  title={`Despesas: ${currencyFormat.format(month.expenses)}`}
                />
              </div>
              <div className="col-start-2 flex justify-between gap-3 text-[10px] tabular-nums text-[#827b6d] sm:col-start-3 sm:block sm:text-right">
                <span className="text-[#526347]">{currencyFormat.format(month.revenue)}</span>
                <span className="text-[#a36e4d]">{currencyFormat.format(month.expenses)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Financeiro({ sales = [], onRegisterSale }) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const metrics = getFinancialMetrics(sales)
  const recentSales = getRecentSales(sales).slice(0, 8)
  const netMargin = metrics.grossRevenue > 0
    ? (metrics.netProfit / metrics.grossRevenue) * 100
    : 0

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#ded9ce] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858071]">Resultados do ateliê</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-[#302e27] sm:text-[28px]">Financeiro</h1>
          <p className="mt-2 text-sm text-[#777267]">Resumo financeiro e vendas registradas.</p>
        </div>
        <button
          className="h-10 shrink-0 bg-[#59664d] px-4 text-sm font-semibold text-white transition hover:bg-[#49563e] active:scale-[0.99]"
          onClick={() => setIsSaleModalOpen(true)}
          type="button"
        >
          + Registrar Nova Venda
        </button>
      </header>

      <section aria-label="Indicadores financeiros" className="mb-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <FinanceMetric
          accent="bg-[#68745b]"
          label="Faturamento Bruto"
          note="Receita total de vendas"
          value={currencyFormat.format(metrics.grossRevenue)}
        />
        <FinanceMetric
          accent="bg-[#c28d67]"
          label="Custo de Produção / CMV"
          note="Custo das peças vendidas"
          value={currencyFormat.format(metrics.productionCost)}
        />
        <FinanceMetric
          accent="bg-[#aaa58d]"
          label="Lucro Bruto"
          note="Faturamento menos custo de produção"
          value={currencyFormat.format(metrics.grossProfit)}
        />
        <FinanceMetric
          accent="bg-[#526347]"
          label="Lucro Líquido"
          note={`Sem outras despesas lançadas · margem ${netMargin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          value={currencyFormat.format(metrics.netProfit)}
        />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <MonthlyComparison sales={sales} />

        <section className="overflow-hidden border border-[#ded9ce] bg-[#fbfaf7]">
          <header className="flex items-end justify-between gap-3 border-b border-[#e4dfd5] px-5 py-4">
            <div>
              <h2 className="font-serif text-lg text-[#302e27]">Vendas recentes</h2>
              <p className="mt-1 text-xs text-[#827b6d]">Receita, CMV e resultado por peça</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#918b7e]">Últimos registros</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e4dfd5] bg-[#f2f0e9] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777267]">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Peça</th>
                  <th className="px-4 py-3 text-right">Receita</th>
                  <th className="px-4 py-3 text-right">CMV</th>
                  <th className="px-4 py-3 text-right">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr className="border-b border-[#eeeae2] last:border-0" key={sale.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#777267]">
                      {new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#3f3d35]">
                      {sale.name}
                      <span className="mt-0.5 block text-[10px] font-normal text-[#918b7e]">{sale.quantity} un.</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-[#526347]">{currencyFormat.format(sale.total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-[#777267]">{currencyFormat.format(sale.cost)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-[#526347]">{currencyFormat.format(sale.profit)}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr><td className="px-4 py-12 text-center text-sm text-[#827b6d]" colSpan="5">Nenhuma venda registrada.</td></tr>
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

export default Financeiro
