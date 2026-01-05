import express from 'express'
import { getUser, getUserByName, getUserByEmail, getUserRole, getAllUsers, registerUser, loginUser, updateUser, deleteUser } from './control.controller.mjs'
import { validateGetUser, validateGetUserName, validateGetUserEmail, validateGetRole, validateUpdateUser } from './control.schema.mjs'

const router = express.Router()

// GET /users -> devuelve lista de usuarios (first_name, role_id, last_name, mail, is_active)
router.get('/users', getAllUsers)

// POST /users/login -> login por email + password
router.post('/users/login', loginUser)

// POST /users -> registrar usuario
router.post('/users', registerUser)

// PUT /users/:id -> actualizar usuario (rol, estado, etc)
router.put('/users/:id', validateGetUser, validateUpdateUser, updateUser)

// DELETE /users/:id -> eliminar usuario
router.delete('/users/:id', validateGetUser, deleteUser)

// GET /users/:id  -> devuelve usuario por user_id
router.get('/users/:id', validateGetUser, getUser)

// GET /users/name/:name -> devuelve usuario buscando por nombre (first_name o last_name)
router.get('/users/name/:name', validateGetUserName, getUserByName)

// GET /users/email/:email -> devuelve usuario por email
router.get('/users/email/:email', validateGetUserEmail, getUserByEmail)

// GET /roles/:id -> (removed) previously returned role by role_id

// GET /users/:id/role -> devuelve { role_id, first_name } por user_id
router.get('/users/:id/role', validateGetUser, getUserRole)

export default router

