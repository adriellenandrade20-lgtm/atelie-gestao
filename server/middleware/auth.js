import jwt from 'jsonwebtoken'

export function requireAuth(request, response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    return response.status(401).json({ error: 'Autenticação necessária.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'local-dev-secret-change-before-deployment')
    request.auth = {
      id: Number(payload.sub),
      email: payload.email,
    }
    return next()
  } catch {
    return response.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
}
