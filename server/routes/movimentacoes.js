import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()
const movementTypes = new Set(['ENTRADA', 'SAIDA', 'PERDA'])
const itemTypes = new Set(['INSUMO', 'PRODUTO'])

router.get('/', async (_request, response) => {
  const movimentacoes = await prisma.movimentacao.findMany({
    include: { usuario: { select: { id: true, nome: true } } },
    orderBy: { data: 'desc' },
  })
  return response.json({ data: movimentacoes })
})

router.post('/', async (request, response) => {
  const tipo = String(request.body.tipo ?? '').toUpperCase()
  const itemTipo = String(request.body.itemTipo ?? '').toUpperCase()
  const itemId = Number(request.body.itemId)
  const quantidade = Number(request.body.quantidade)
  const valorUnitario = request.body.valorUnitario === undefined || request.body.valorUnitario === ''
    ? null
    : Number(request.body.valorUnitario)
  const motivo = String(request.body.motivo ?? '').trim()

  if (!movementTypes.has(tipo) || !itemTypes.has(itemTipo)) {
    return response.status(400).json({ error: 'Tipo de movimentação ou item inválido.' })
  }
  if (!Number.isInteger(itemId) || !Number.isFinite(quantidade) || quantidade <= 0 || !motivo) {
    return response.status(400).json({ error: 'Item, quantidade positiva e motivo são obrigatórios.' })
  }
  if (valorUnitario !== null && (!Number.isFinite(valorUnitario) || valorUnitario < 0)) {
    return response.status(400).json({ error: 'Valor unitário inválido.' })
  }
  if (itemTipo === 'PRODUTO' && !Number.isInteger(quantidade)) {
    return response.status(400).json({ error: 'Quantidade de produto deve ser um número inteiro.' })
  }

  const movimentacao = await prisma.$transaction(async (transaction) => {
    const model = itemTipo === 'INSUMO' ? transaction.insumo : transaction.produto
    const item = await model.findUnique({ where: { id: itemId } })
    if (!item) {
      const error = new Error('Item não encontrado.')
      error.status = 404
      throw error
    }

    const currentQuantity = itemTipo === 'INSUMO' ? item.quantidade : item.estoqueQtd
    const nextQuantity = tipo === 'ENTRADA'
      ? currentQuantity + quantidade
      : currentQuantity - quantidade
    if (nextQuantity < 0) {
      const error = new Error(`Estoque insuficiente. Disponível: ${currentQuantity}.`)
      error.status = 409
      throw error
    }

    await model.update({
      where: { id: itemId },
      data: itemTipo === 'INSUMO'
        ? { quantidade: nextQuantity }
        : { estoqueQtd: nextQuantity },
    })

    return transaction.movimentacao.create({
      data: {
        tipo,
        itemTipo,
        itemId,
        quantidade,
        valorUnitario,
        motivo,
        data: request.body.data ? new Date(request.body.data) : new Date(),
        usuarioId: request.auth.id,
      },
      include: { usuario: { select: { id: true, nome: true } } },
    })
  })

  return response.status(201).json({ data: movimentacao })
})

export default router
