export const currencyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const numberFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const reportingMonth = new Date()

function saleRevenue(sale) {
  return Number(sale.valorTotal) || 0
}

function saleCost(sale) {
  return Number(sale.custoTotal) || 0
}

export function getFinancialMetrics(sales = []) {
  const grossRevenue = sales.reduce((total, sale) => total + saleRevenue(sale), 0)
  const productionCost = sales.reduce((total, sale) => total + saleCost(sale), 0)

  return {
    grossRevenue,
    productionCost,
    expenses: productionCost,
    grossProfit: grossRevenue - productionCost,
    netProfit: grossRevenue - productionCost,
  }
}

export function getMonthlyFlow(sales = []) {
  return Array.from({ length: 6 }, (_unused, index) => {
    const date = new Date(
      reportingMonth.getFullYear(),
      reportingMonth.getMonth() - 5 + index,
      1,
    )
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthSales = sales.filter((sale) => String(sale.data).slice(0, 7) === key)
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(date)
      .replace('.', '')

    return {
      month: `${month[0].toLocaleUpperCase('pt-BR')}${month.slice(1)}`,
      revenue: monthSales.reduce((total, sale) => total + saleRevenue(sale), 0),
      expenses: monthSales.reduce((total, sale) => total + saleCost(sale), 0),
    }
  })
}

export function getBestSellers(sales = []) {
  const products = new Map()

  for (const sale of sales) {
    const product = products.get(sale.produtoId) ?? {
      id: sale.produtoId,
      name: sale.produto?.nome ?? 'Produto',
      quantity: 0,
      revenue: 0,
      cost: 0,
    }
    product.quantity += Number(sale.quantidade) || 0
    product.revenue += saleRevenue(sale)
    product.cost += saleCost(sale)
    products.set(sale.produtoId, product)
  }

  return [...products.values()]
    .map((product) => ({
      ...product,
      unitPrice: product.quantity ? product.revenue / product.quantity : 0,
      margin: product.revenue ? ((product.revenue - product.cost) / product.revenue) * 100 : 0,
    }))
    .sort((first, second) => second.quantity - first.quantity)
}

export function getRecentSales(sales = []) {
  return [...sales]
    .map((sale) => ({
      id: sale.id,
      date: sale.data,
      name: sale.produto?.nome ?? 'Produto',
      quantity: sale.quantidade,
      total: saleRevenue(sale),
      cost: saleCost(sale),
      profit: sale.lucroBruto ?? saleRevenue(sale) - saleCost(sale),
      netProfit: sale.lucroLiquido ?? saleRevenue(sale) - saleCost(sale),
    }))
    .sort((first, second) => new Date(second.date) - new Date(first.date))
}
