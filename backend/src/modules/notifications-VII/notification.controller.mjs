import { validateCreateNotification, validateUpdateNotification } from "./notification.schema.mjs";
export class NotificationController {
    constructor ({NotificationModel}){
        this.NotificationModel = NotificationModel;
    }
    
    // Controlador para obtener todas las notificaciones del sistema
    getAllNotifications = async (req, res) => {
        try {
            const result = await this.NotificationModel.getAllNotifications();
            if (result.error) return res.status(404).json({error: result.error});
            return res.status(200).json({ 
                message: result.message,
                notifications: result.notifications
            });
        } catch (error) {
            return res.status(500).json({error: error.message});
        }
    }

    // Controlador para obtener una notificación por su ID
    getNotificationById = async (req, res) => {
        const { notificationId } = req.params;
        try {
            const result = await this.NotificationModel.getNotificationById(notificationId);
            if (result.error) return res.status(404).json({error: result.error});
            return res.status(200).json({
                message: result.message,
                notification: result.notification
            });
        }
        catch(error){
            console.error(error);
            return res.status(500).json({error: 'Error interno del servidor.'});
        }
    }
    
    // Controlador para obtener todas las notificaciones de un usuario específico
    getNotificationsByUserId = async (req, res) => {
        const { userId } = req.params;
        try{
            const result = await this.NotificationModel.getNotificationsByUserId(userId);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json({
                message: result.message,
                notifications: result.notifications
            });
        }
        catch(error){
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }

    // Controlador para marcar una notificación como leída
    markNotificationAsRead = async (req, res) => {
        const { notificationId } = req.params;
        try {
            const result = await this.NotificationModel.markNotificationAsRead(notificationId);
            if (result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json({
                message: result.message
            });
        }
        catch (error) {
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }

    // Controlador para crear una nueva notificación
    createNotification = async (req, res) => {
        const validation = validateCreateNotification(req.body);
        try{
            if(!validation.success) {
                return res.status(400).json({
                    error: 'Datos de notificación inválidos.',
                    details: validation.error
                })
            }
            const result = await this.NotificationModel.createNotification(validation.data);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(201).json({
                message: result.message,
                notification: result.notification
            });
        }
        catch(error){
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
    
    
    // Controlador para actualizar una notificación
    updateNotification = async (req, res) => {
        const {notificationId} = req.params;
        const validation = validateUpdateNotification(req.body);
        try{
            if(!validation.success) {
                return res.status(400).json({
                    error: 'Datos de notificación inválidos.',
                    details: validation.error
                });
            }
            const result = await this.NotificationModel.updateNotification(notificationId, validation.data);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json({
                message: result.message,
                notification: result.notification
            });
        }
        catch(error){
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
    // Controlador para eliminar una notificación
    deleteNotification = async (req, res) => {
        const {notificationId} = req.params;
        try{
            const result = await this.NotificationModel.deleteNotification(notificationId);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json({
                message: result.message
            });
        }
        catch(error){
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
}



