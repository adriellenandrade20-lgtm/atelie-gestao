import express from 'express'
import cors from 'cors'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import insumoRoutes from './routes/insumos.js'
import movimentacaoRoutes from './routes/movimentacoes.js'
import producaoRoutes from './routes/producao.js'
import produtoRoutes from './routes/produtos.js'
import vendaRoutes from './routes/vendas.js'
import { requireAuth } from './middleware/auth.js'
import prisma from './prisma.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const distDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: 'sqlite' })
})
app.use('/api/auth', authRoutes)
app.use('/api/insumos', requireAuth, insumoRoutes)
app.use('/api/produtos', requireAuth, produtoRoutes)
app.use('/api/producao', requireAuth, producaoRoutes)
app.use('/api/movimentacoes', requireAuth, movimentacaoRoutes)
app.use('/api/vendas', requireAuth, vendaRoutes)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDirectory))
  app.get('/{*path}', (request, response, next) => {
    if (request.path === '/api' || request.path.startsWith('/api/')) {
      return next()
    }
    return response.sendFile(resolve(distDirectory, 'index.html'))
  })
}

app.use((error, _request, response, _next) => {
  if (error.code === 'P2002') {
    return response.status(409).json({ error: 'Já existe um registo com estes dados únicos.' })
  }
  if (error.code === 'P2025') {
    return response.status(404).json({ error: 'Registo não encontrado.' })
  }
  if (error.code === 'P2003') {
    return response.status(409).json({ error: 'Não é possível excluir este registro porque existem dados vinculados.' })
  }

  const status = Number(error.status) || 500
  if (status >= 500) {
    console.error(error)
  }
  return response.status(status).json({
    error: status >= 500 ? 'Erro interno do servidor.' : error.message,
  })
})

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API disponível na porta ${port} em todas as interfaces de rede`)
})

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
