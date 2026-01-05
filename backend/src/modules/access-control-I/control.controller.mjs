import { getUser as getUserModel, getUserByName as getUserByNameModel, getUserByEmail as getUserByEmailModel, getUserRoleById as getUserRoleByIdModel, getAllUsers as getAllUsersModel, createUser as createUserModel, updateUser as updateUserModel, deleteUser as deleteUserModel } from './control.model.mjs'
import bcrypt from 'bcryptjs'

export async function getUser(req, res) {
	try {
		const { id } = req.params
		const userId = Number(id)
		if (!userId || Number.isNaN(userId)) {
			return res.status(400).json({ message: 'Invalid user id' })
		}

		const user = await getUserModel(userId)
		if (!user) return res.status(404).json({ message: 'User not found' })

		
		const result = {
			id: user.user_id,
			role_id: user.role_id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			phone: user.phone,
			is_active: Boolean(user.is_active),
			created_at: user.created_at,
			updated_at: user.updated_at
		}

		return res.status(200).json(result)
	} catch (error) {
		console.error('getUser controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export async function getUserByName(req, res) {
	try {
		const { name } = req.params
		if (!name || typeof name !== 'string' || name.trim() === '') {
			return res.status(400).json({ message: 'Invalid name parameter' })
		}

		const user = await getUserByNameModel(name)
		if (!user) return res.status(404).json({ message: 'User not found' })

		const result = {
			id: user.user_id,
			role_id: user.role_id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			phone: user.phone,
			is_active: Boolean(user.is_active),
			created_at: user.created_at,
			updated_at: user.updated_at
		}

		return res.status(200).json(result)
	} catch (error) {
		console.error('getUserByName controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}



export async function getUserByEmail(req, res) {
	try {
		const { email } = req.params
		if (!email || typeof email !== 'string' || email.trim() === '') {
			return res.status(400).json({ message: 'Invalid email parameter' })
		}

		const user = await getUserByEmailModel(email)
		if (!user) return res.status(404).json({ message: 'User not found' })

		const result = {
			id: user.user_id,
			role_id: user.role_id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			phone: user.phone,
			password_hash: user.password_hash,
			is_active: Boolean(user.is_active),
			created_at: user.created_at,
			updated_at: user.updated_at
		}

		return res.status(200).json(result)
	} catch (error) {
		console.error('getUserByEmail controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export async function getUserRole(req, res) {
	try {
		const { id } = req.params
		const userId = Number(id)
		if (Number.isNaN(userId)) {
			return res.status(400).json({ message: 'Invalid user id' })
		}

		const user = await getUserRoleByIdModel(userId)
		if (!user) return res.status(404).json({ message: 'User not found' })

		const result = {
			role_id: user.role_id,
			first_name: user.first_name,
			last_name: user.last_name
		}

		return res.status(200).json(result)
	} catch (error) {
		console.error('getUserRole controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export async function getAllUsers(req, res) {
	try {
		const users = await getAllUsersModel()
		const result = (users || []).map((u) => ({
			first_name: u.first_name,
			last_name: u.last_name,
			role_id: u.role_id,
			mail: u.mail,
			is_active: Boolean(u.is_active)
		}))

		return res.status(200).json(result)
	} catch (error) {
		console.error('getAllUsers controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export default { getUser, getUserByName, getUserByEmail, getUserRole, getAllUsers }

export async function loginUser(req, res) {
	try {
		const { email, password } = req.body || {}
		if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

		const user = await getUserByEmailModel(email)
		if (!user) return res.status(401).json({ message: 'Invalid credentials' })

		const hash = user.password_hash || ''
		const match = bcrypt.compareSync(password, hash)
		if (!match) return res.status(401).json({ message: 'Invalid credentials' })

		// Excluir password_hash antes de responder
		const { password_hash, ...safeUser } = user
		return res.status(200).json({ ok: true, user: safeUser })
	} catch (error) {
		console.error('loginUser controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export async function registerUser(req, res) {
	try {
		const { email, first_name, last_name, phone } = req.body || {}
		const { password } = req.body || {}
		if (!email || typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ message: 'Email inválido' })
		if (!first_name || typeof first_name !== 'string') return res.status(400).json({ message: 'first_name es requerido' })
		if (!last_name || typeof last_name !== 'string') return res.status(400).json({ message: 'last_name es requerido' })
		if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: 'Password es requerido (min 6 caracteres)' })

		// Verificar si correo ya existe
		const existing = await getUserByEmailModel(email)
		if (existing) return res.status(409).json({ message: 'Email already registered' })

		// Hashear la contraseña antes de guardar
		const hashed = bcrypt.hashSync(password, 10)
		const created = await createUserModel({ email, first_name, last_name, phone, password_hash: hashed })
		if (!created) return res.status(500).json({ message: 'Could not create user' })

		const result = {
			id: created.user_id,
			role_id: created.role_id,
			first_name: created.first_name,
			last_name: created.last_name,
			email: created.email,
			phone: created.phone,
			is_active: Boolean(created.is_active),
			created_at: created.created_at,
			updated_at: created.updated_at
		}

		return res.status(201).json({ ok: true, user: result })
	} catch (error) {
		console.error('registerUser controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export async function updateUser(req, res) {
	try {
		const { id } = req.params
		const userId = Number(id)
		if (!userId || Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' })

		const existing = await getUserModel(userId)
		if (!existing) return res.status(404).json({ message: 'User not found' })

		const { role_id, is_active, first_name, last_name, phone, email, password } = req.body || {}

		const payload = {}
		if (role_id !== undefined) payload.role_id = Number(role_id)
		if (is_active !== undefined) payload.is_active = Boolean(is_active)
		if (first_name !== undefined) payload.first_name = first_name
		if (last_name !== undefined) payload.last_name = last_name
		if (phone !== undefined) payload.phone = phone
		if (email !== undefined) {
			if (typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ message: 'Email inválido' })
			const duplicated = await getUserByEmailModel(email)
			if (duplicated && duplicated.user_id !== userId) return res.status(409).json({ message: 'Email already registered' })
			payload.email = email
		}
		if (password !== undefined) {
			if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: 'Password min 6 caracteres' })
			payload.password_hash = bcrypt.hashSync(password, 10)
		}

		if (Object.keys(payload).length === 0) return res.status(400).json({ message: 'No fields to update' })

		const updated = await updateUserModel(userId, payload)
		if (!updated) return res.status(500).json({ message: 'Could not update user' })

		const result = {
			id: updated.user_id,
			role_id: updated.role_id,
			first_name: updated.first_name,
			last_name: updated.last_name,
			email: updated.email,
			phone: updated.phone,
			is_active: Boolean(updated.is_active),
			created_at: updated.created_at,
			updated_at: updated.updated_at
		}

		return res.status(200).json({ ok: true, user: result })
	} catch (error) {
		console.error('updateUser controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

export async function deleteUser(req, res) {
	try {
		const { id } = req.params
		const userId = Number(id)
		if (!userId || Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' })

		const existing = await getUserModel(userId)
		if (!existing) return res.status(404).json({ message: 'User not found' })

		const ok = await deleteUserModel(userId)
		if (!ok) return res.status(500).json({ message: 'Could not delete user' })

		return res.status(200).json({ ok: true })
	} catch (error) {
		console.error('deleteUser controller error:', error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

