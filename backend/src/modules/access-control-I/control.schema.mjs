import { z } from 'zod'

// Esquema para validar params de GET /users/:id
export const getUserParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export function validateGetUser(req, res, next) {
  const result = getUserParamsSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid parameters', errors: result.error.errors })
  }

  // Reemplazamos el id en params por su versión numérica
  req.params.id = result.data.id
  return next()
}

// Esquema para validar params de GET /users/name/:name
export const getUserNameParamsSchema = z.object({
  name: z.string().min(1)
})

export function validateGetUserName(req, res, next) {
  const result = getUserNameParamsSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid parameters', errors: result.error.errors })
  }

  req.params.name = result.data.name
  return next()
}

// Esquema para validar params de GET /users/email/:email
export const getUserEmailParamsSchema = z.object({
  email: z.string().email()
})

export function validateGetUserEmail(req, res, next) {
  const result = getUserEmailParamsSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid parameters', errors: result.error.errors })
  }

  req.params.email = result.data.email
  return next()
}

// Esquema para validar params de GET /roles/:id
export const getRoleParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export function validateGetRole(req, res, next) {
  const result = getRoleParamsSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid parameters', errors: result.error.errors })
  }

  req.params.id = result.data.id
  return next()
}

export default { getUserParamsSchema, validateGetUser }

// Body schema for updating user
export const updateUserBodySchema = z.object({
  role_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional()
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' })

export function validateUpdateUser(req, res, next) {
  const bodyResult = updateUserBodySchema.safeParse(req.body)
  if (!bodyResult.success) {
    return res.status(400).json({ message: 'Invalid body', errors: bodyResult.error.errors })
  }

  req.body = bodyResult.data
  return next()
}
