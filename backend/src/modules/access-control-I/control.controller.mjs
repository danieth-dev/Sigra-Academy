import { validateCreateUser, validateLoginUser, validateUpdateUser } from "./control.schema.mjs";

// Controlador para la gestión de usuarios y control de acceso
export class ControlController {
	constructor({ModelControl}){
		this.model = ModelControl;
	}

	// Controlador para obtener todos los usuarios
	getAllUsers = async (req, res) => {
		try{
			const result = await this.model.getAllUsers();
			if(result.error) return res.status(404).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				users: result.users
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para obtener todos los usuarios que sean estudiantes
	getAllStudents = async (req, res) => {
		try{
			const result = await this.model.getAllStudents();
			if(result.error) return res.status(404).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				students: result.students
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para obtener un usuario por su ID
	getUserById = async (req, res) => {
		const { userId } = req.params;
		try{
			const result = await this.model.getUserById(userId);
			if(result.error) return res.status(404).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				user: result.user
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para obtener un usuario por su email
	getUserByEmail = async (req, res) => {
		const { email } = req.params;
		try{
			const result = await this.model.getUserByEmail(email);
			if(result.error) return res.status(404).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				user: result.user
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para obtener un usuario por su national_id
	getUserByNationalId = async (req, res) => {
		const { nationalId } = req.params;
		try{
			const result = await this.model.getUserByNationalId(nationalId);
			if(result.error) return res.status(404).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				user: result.user
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para crear un nuevo usuario
	createdUser = async (req, res) => {
		const validation = validateCreateUser(req.body);
		try{
			if(!validation.success){
				return res.status(400).json({
					error: 'Datos inválidos',
					details: validation.error
				});
			}
			const result = await this.model.createUser(validation.data);
			if(result.error) return res.status(400).json({error: result.error});
			return res.status(201).json({
				message: result.message,
				user: result.user
			});
		}
		catch(error){
			console.error(error)
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para loguear un usuario
	LoginUser = async (req, res) => {
		const validation = validateLoginUser(req.body);
		try{
			if(!validation.success){
				return res.status(400).json({
					error: 'Datos inválidos',
					details: validation.error
				});
			}
			const result = await this.model.loginUser(validation.data);
			if(result.error) return res.status(400).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				user: result.user,
				token: result.token
			});
		}
		catch(error){
			console.error(error)
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para actualizar un usuario
	updateUser = async (req, res) => {
		const { userId } = req.params;
		const validation = validateUpdateUser(req.body);
		try{
			if(!validation.success){
				return res.status(400).json({
					error: 'Datos inválidos',
					details: validation.error
				});
			}
			const payload = { ...validation.data };
			if(payload.password && !payload.password_hash){
				payload.password_hash = payload.password;
			}
			delete payload.password;
			const result = await this.model.updateUser(userId, payload);
			if(result.error) return res.status(400).json({error: result.error});
			return res.status(200).json({
				message: result.message,
				user: result.user
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para eliminar un usuario
	deleteUser = async (req, res) => {
		const { userId } = req.params;
		try{
			const result = await this.model.deleteUser(userId);
			if(result.error) return res.status(400).json({error: result.error});
			return res.status(200).json({
				message: result.message
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para cerrar la sesión de un usuario
	LogoutUser = async (req, res) => {
		const { userId } = req.params;
		try{
			const result = await this.model.LogoutUser(userId);
			if(result.error) return res.status(400).json({error: result.error});
			return res.status(200).json({
				message: result.message
			});
		}
		catch(error){
			return res.status(500).json({error: 'Error del servidor'});
		}
	}

	// Controlador para la verificar si el usuario está autenticado
	verifyAuth = async (req, res) => {
		if(!req.user){
			return res.status(401).json({
				error: 'Usuario no autenticado',
				isAuthenticated: false
			});
		}
		return res.status(200).json({
			message: 'Usuario autenticado',
			isAuthenticated: true,
			user: req.user
		});
	}
}