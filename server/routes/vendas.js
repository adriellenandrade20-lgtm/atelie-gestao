import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()

function includeProfit(sale) {
  const lucroBruto = sale.valorTotal - sale.custoTotal
  return {
    ...sale,
    lucroBruto,
    lucroLiquido: lucroBruto,
  }
}

router.get('/', async (_request, response) => {
  const vendas = await prisma.venda.findMany({
    include: { produto: true },
    orderBy: { data: 'desc' },
  })
  return response.json({ data: vendas.map(includeProfit) })
})

router.post('/', async (request, response) => {
  const produtoId = Number(request.body.produtoId)
  const quantidade = Number(request.body.quantidade)
  const unitPrice = Number(request.body.valorUnitario ?? 0)

  if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade <= 0) {
    return response.status(400).json({ error: 'Produto e quantidade inteira positiva são obrigatórios.' })
  }
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return response.status(400).json({ error: 'Valor unitário deve ser maior que zero.' })
  }

  const result = await prisma.$transaction(async (transaction) => {
    const produto = await transaction.produto.findUnique({
      where: { id: produtoId },
      include: { fichaTecnica: { include: { insumo: true } } },
    })

    if (!produto) {
      const error = new Error('Produto não encontrado.')
      error.status = 404
      throw error
    }
    if (produto.estoqueQtd < quantidade) {
      const error = new Error(`Estoque insuficiente. Disponível: ${produto.estoqueQtd} un.`)
      error.status = 409
      throw error
    }

    const unitCost = produto.fichaTecnica.reduce(
      (total, part) => total + part.quantidadeNecessaria * part.insumo.custoUnitario,
      0,
    )
    const venda = await transaction.venda.create({
      data: {
        produtoId,
        quantidade,
        valorTotal: unitPrice * quantidade,
        custoTotal: unitCost * quantidade,
        data: request.body.data ? new Date(request.body.data) : new Date(),
      },
    })

    await transaction.produto.update({
      where: { id: produtoId },
      data: { estoqueQtd: { decrement: quantidade } },
    })
    await transaction.movimentacao.create({
      data: {
        tipo: 'SAIDA',
        itemTipo: 'PRODUTO',
        itemId: produtoId,
        quantidade,
        valorUnitario: unitPrice,
        motivo: String(request.body.motivo ?? 'Venda registrada no sistema'),
        usuarioId: request.auth.id,
      },
    })

    return transaction.venda.findUnique({
      where: { id: venda.id },
      include: { produto: true },
    })
  })

  return response.status(201).json({ data: includeProfit(result) })
})

export default router
