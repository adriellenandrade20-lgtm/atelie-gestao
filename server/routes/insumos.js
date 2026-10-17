import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()

function toNumber(value, field) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    const error = new Error(`${field} deve ser um número válido.`)
    error.status = 400
    throw error
  }
  return parsed
}

router.get('/', async (_request, response) => {
  const insumos = await prisma.insumo.findMany({ orderBy: { nome: 'asc' } })
  return response.json({ data: insumos })
})

router.post('/', async (request, response) => {
  const { nome, categoria, unidadeMedida } = request.body
  if (!String(nome ?? '').trim() || !String(categoria ?? '').trim() || !String(unidadeMedida ?? '').trim()) {
    return response.status(400).json({ error: 'Nome, categoria e unidade de medida são obrigatórios.' })
  }

  const quantidade = toNumber(request.body.quantidade ?? 0, 'Quantidade')
  const custoUnitario = toNumber(request.body.custoUnitario ?? 0, 'Custo unitário')
  const estoqueMinimo = toNumber(request.body.estoqueMinimo ?? 0, 'Estoque mínimo')
  if (quantidade < 0 || custoUnitario < 0 || estoqueMinimo < 0) {
    return response.status(400).json({ error: 'Quantidade, custo e estoque mínimo não podem ser negativos.' })
  }

  const insumo = await prisma.insumo.create({
    data: {
      nome: String(nome).trim(),
      categoria: String(categoria).trim(),
      unidadeMedida: String(unidadeMedida).trim(),
      quantidade,
      custoUnitario,
      estoqueMinimo,
    },
  })
  return response.status(201).json({ data: insumo })
})

router.put('/:id', async (request, response) => {
  const id = Number(request.params.id)
  if (!Number.isInteger(id)) {
    return response.status(400).json({ error: 'ID de insumo inválido.' })
  }

  const body = request.body
  const data = {}
  for (const field of ['nome', 'categoria', 'unidadeMedida']) {
    if (body[field] !== undefined) data[field] = String(body[field]).trim()
  }
  for (const field of ['quantidade', 'custoUnitario', 'estoqueMinimo']) {
    if (body[field] !== undefined) {
      data[field] = toNumber(body[field], field)
      if (data[field] < 0) {
        return response.status(400).json({ error: `${field} não pode ser negativo.` })
      }
    }
  }

  const insumo = await prisma.insumo.update({ where: { id }, data })
  return response.json({ data: insumo })
})

router.delete('/:id', async (request, response) => {
  const id = Number.parseInt(request.params.id, 10)
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: 'ID de insumo inválido.' })
  }

  const movements = await prisma.movimentacao.count({
    where: { itemTipo: 'INSUMO', itemId: id },
  })
  if (movements > 0) {
    return response.status(409).json({ error: 'Não é possível excluir este insumo porque existem movimentações vinculadas.' })
  }

  const insumo = await prisma.insumo.delete({ where: { id } })
  return response.json({ data: insumo })
})

export default router
