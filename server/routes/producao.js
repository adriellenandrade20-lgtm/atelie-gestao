import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()

router.post('/', async (request, response) => {
  const produtoId = Number(request.body.produtoId)
  const quantidade = Number(request.body.quantidade)

  if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade <= 0) {
    return response.status(400).json({ error: 'Produto e quantidade inteira positiva são obrigatórios.' })
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
    if (produto.fichaTecnica.length === 0) {
      const error = new Error('Cadastre a Ficha Técnica antes de registrar a produção.')
      error.status = 409
      throw error
    }

    const requiredMaterials = produto.fichaTecnica.map((part) => ({
      ...part,
      totalRequired: part.quantidadeNecessaria * quantidade,
    }))
    const unavailable = requiredMaterials.find((part) => part.insumo.quantidade < part.totalRequired)
    if (unavailable) {
      const error = new Error(
        `Estoque insuficiente de ${unavailable.insumo.nome}. Disponível: ${unavailable.insumo.quantidade} ${unavailable.insumo.unidadeMedida}; necessário: ${unavailable.totalRequired} ${unavailable.insumo.unidadeMedida}.`,
      )
      error.status = 409
      throw error
    }

    const motivo = String(request.body.motivo ?? `Consumo para produção de ${produto.nome}`).trim()
    const movements = []
    let custoTotal = 0

    for (const part of requiredMaterials) {
      const custoConsumo = part.totalRequired * part.insumo.custoUnitario
      custoTotal += custoConsumo
      await transaction.insumo.update({
        where: { id: part.insumoId },
        data: { quantidade: { decrement: part.totalRequired } },
      })
      movements.push(await transaction.movimentacao.create({
        data: {
          tipo: 'SAIDA',
          itemTipo: 'INSUMO',
          itemId: part.insumoId,
          quantidade: part.totalRequired,
          valorUnitario: part.insumo.custoUnitario,
          motivo,
          usuarioId: request.auth.id,
        },
      }))
    }

    const updatedProduct = await transaction.produto.update({
      where: { id: produtoId },
      data: { estoqueQtd: { increment: quantidade } },
    })
    movements.push(await transaction.movimentacao.create({
      data: {
        tipo: 'ENTRADA',
        itemTipo: 'PRODUTO',
        itemId: produtoId,
        quantidade,
        motivo: `Produção de ${produto.nome}`,
        usuarioId: request.auth.id,
      },
    }))

    return {
      produto: updatedProduct,
      quantidade,
      custoTotal,
      custoUnitario: custoTotal / quantidade,
      movimentacoes: movements,
    }
  })

  return response.status(201).json({ data: result })
})

export default router
