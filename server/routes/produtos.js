import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()

router.get('/', async (_request, response) => {
  const produtos = await prisma.produto.findMany({
    include: {
      fichaTecnica: { include: { insumo: true } },
    },
    orderBy: { nome: 'asc' },
  })
  return response.json({ data: produtos })
})

router.post('/', async (request, response) => {
  const { nome, categoria } = request.body
  if (!String(nome ?? '').trim() || !String(categoria ?? '').trim()) {
    return response.status(400).json({ error: 'Nome e categoria são obrigatórios.' })
  }

  const precoVenda = Number(request.body.precoVenda)
  const estoqueQtd = Number(request.body.estoqueQtd ?? 0)
  if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
    return response.status(400).json({ error: 'Preço de venda deve ser maior que zero.' })
  }
  if (!Number.isInteger(estoqueQtd) || estoqueQtd < 0) {
    return response.status(400).json({ error: 'Estoque inicial deve ser um inteiro não negativo.' })
  }

  const recipe = Array.isArray(request.body.fichaTecnica) ? request.body.fichaTecnica : []
  const recipeRows = recipe.map((part) => ({
    insumoId: Number(part.insumoId),
    quantidadeNecessaria: Number(part.quantidadeNecessaria),
  }))
  if (recipeRows.some((part) => (
    !Number.isInteger(part.insumoId)
    || !Number.isFinite(part.quantidadeNecessaria)
    || part.quantidadeNecessaria <= 0
  ))) {
    return response.status(400).json({ error: 'A ficha técnica contém insumo ou quantidade inválida.' })
  }

  const produto = await prisma.produto.create({
    data: {
      nome: String(nome).trim(),
      categoria: String(categoria).trim(),
      descricao: String(request.body.descricao ?? '').trim(),
      precoVenda,
      estoqueQtd,
      imagemUrl: request.body.imagemUrl ? String(request.body.imagemUrl).trim() : null,
      fichaTecnica: {
        create: recipeRows.map((part) => ({
          quantidadeNecessaria: part.quantidadeNecessaria,
          insumo: { connect: { id: part.insumoId } },
        })),
      },
    },
    include: { fichaTecnica: { include: { insumo: true } } },
  })

  return response.status(201).json({ data: produto })
})

router.put('/:id', async (request, response) => {
  const id = Number(request.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: 'ID de produto inválido.' })
  }

  const { nome, categoria } = request.body
  if (!String(nome ?? '').trim() || !String(categoria ?? '').trim()) {
    return response.status(400).json({ error: 'Nome e categoria são obrigatórios.' })
  }

  const precoVenda = Number(request.body.precoVenda)
  const estoqueQtd = Number(request.body.estoqueQtd)
  if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
    return response.status(400).json({ error: 'Preço de venda deve ser maior que zero.' })
  }
  if (!Number.isInteger(estoqueQtd) || estoqueQtd < 0) {
    return response.status(400).json({ error: 'Estoque deve ser um inteiro não negativo.' })
  }

  const recipe = Array.isArray(request.body.fichaTecnica) ? request.body.fichaTecnica : []
  const recipeRows = recipe.map((part) => ({
    insumoId: Number(part.insumoId),
    quantidadeNecessaria: Number(part.quantidadeNecessaria),
  }))
  if (recipeRows.some((part) => (
    !Number.isInteger(part.insumoId)
    || !Number.isFinite(part.quantidadeNecessaria)
    || part.quantidadeNecessaria <= 0
  )) || new Set(recipeRows.map((part) => part.insumoId)).size !== recipeRows.length) {
    return response.status(400).json({ error: 'A ficha técnica contém insumo ou quantidade inválida.' })
  }

  const produto = await prisma.produto.update({
    where: { id },
    data: {
      nome: String(nome).trim(),
      categoria: String(categoria).trim(),
      descricao: String(request.body.descricao ?? '').trim(),
      precoVenda,
      estoqueQtd,
      imagemUrl: request.body.imagemUrl ? String(request.body.imagemUrl).trim() : null,
      fichaTecnica: {
        deleteMany: {},
        create: recipeRows.map((part) => ({
          quantidadeNecessaria: part.quantidadeNecessaria,
          insumo: { connect: { id: part.insumoId } },
        })),
      },
    },
    include: { fichaTecnica: { include: { insumo: true } } },
  })

  return response.json({ data: produto })
})

router.delete('/:id', async (request, response) => {
  const id = Number.parseInt(request.params.id, 10)
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: 'ID de produto inválido.' })
  }

  const movements = await prisma.movimentacao.count({
    where: { itemTipo: 'PRODUTO', itemId: id },
  })
  if (movements > 0) {
    return response.status(409).json({ error: 'Não é possível excluir este produto porque existem movimentações vinculadas.' })
  }

  const produto = await prisma.produto.delete({ where: { id } })
  return response.json({ data: produto })
})

export default router
