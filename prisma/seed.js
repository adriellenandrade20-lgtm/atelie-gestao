import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existingUser = await prisma.user.findFirst({ select: { id: true, email: true } })
  if (existingUser) {
    console.log(`Usuário existente preservado: ${existingUser.email}`)
    return
  }

  const email = (process.env.ADMIN_EMAIL ?? 'admin@atelie.local').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? 'change-this-password'
  const senha = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      nome: process.env.ADMIN_NAME ?? 'Administradora',
      email,
      senha,
    },
    select: { email: true },
  })

  console.log(`Usuário local criado: ${user.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
