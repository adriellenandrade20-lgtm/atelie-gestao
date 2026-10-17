import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const jwtSecret = process.env.JWT_SECRET ?? 'local-dev-secret-change-before-deployment'

router.post('/login', async (request, response) => {
  const email = String(request.body.email ?? '').trim().toLowerCase()
  const password = String(request.body.password ?? '')

  if (!email || !password) {
    return response.status(400).json({ error: 'Informe e-mail e senha.' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.senha))) {
    return response.status(401).json({ error: 'E-mail ou senha incorretos.' })
  }

  const token = jwt.sign(
    { sub: String(user.id), email: user.email },
    jwtSecret,
    { expiresIn: '8h' },
  )

  return response.json({
    token,
    user: { id: user.id, nome: user.nome, email: user.email },
  })
})

router.get('/me', requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth.id },
    select: { id: true, nome: true, email: true },
  })

  if (!user) {
    return response.status(401).json({ error: 'Usuário não encontrado.' })
  }

  return response.json({ user })
})

router.patch('/credentials', requireAuth, async (request, response) => {
  const currentPassword = String(request.body.currentPassword ?? '')
  const requestedEmail = String(request.body.email ?? '').trim().toLowerCase()
  const newPassword = String(request.body.newPassword ?? '')

  const existingUser = await prisma.user.findUnique({ where: { id: request.auth.id } })
  if (!existingUser || !(await bcrypt.compare(currentPassword, existingUser.senha))) {
    return response.status(401).json({ error: 'A senha atual está incorreta.' })
  }

  const email = requestedEmail || existingUser.email
  const changesEmail = email !== existingUser.email
  if (!changesEmail && !newPassword) {
    return response.status(400).json({ error: 'Informe um novo e-mail ou uma nova senha.' })
  }
  if (changesEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: 'Informe um e-mail válido.' })
  }
  if (newPassword && newPassword.length < 8) {
    return response.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' })
  }

  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      email,
      ...(newPassword ? { senha: await bcrypt.hash(newPassword, 12) } : {}),
    },
    select: { id: true, nome: true, email: true },
  })
  const token = jwt.sign(
    { sub: String(updatedUser.id), email: updatedUser.email },
    jwtSecret,
    { expiresIn: '8h' },
  )

  return response.json({ token, user: updatedUser })
})

export default router
