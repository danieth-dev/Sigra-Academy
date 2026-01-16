import {db} from '../../../database/db.database.mjs';

export class NotificationModel {
    // Metodo para obtener todas las notificaciones del sistema
    static async getAllNotifications() {
        const [notifications] = await db.query ('SELECT * FROM notifications');
        if (notifications.length === 0) return {error: ' no hay notificaciones en el sistema'};
        return {
            message: 'notificaciones obtenidas exitosamente',
            notifications: notifications
        }
    }
    // Método para obtener una notificación por su ID
    static async getNotificationById(notificationId) {
        if(!notificationId) return { error: 'El ID de la notificación es requerido.' };
        const [notification] = await db.query(
            `SELECT noti.*, u.email, CONCAT(u.first_name, ' ', u.last_name) AS user_name 
            FROM notifications noti JOIN users u ON noti.user_id = u.user_id WHERE noti.notification_id = ?`,
            [notificationId]
        );
        if(notification.length === 0) return { error: 'Notificación no encontrada.' };
        return {
            message: 'Notificación obtenida correctamente.',
            notification: notification[0]
        }
    }
    // Método para obtener todas las notificaciones de un usuario específico
    static async getNotificationsByUserId(userId) {
        if(!userId) return { error: 'El ID del usuario es requerido.' };
        // Se verifica si el usuario existe
        const [existingUser] = await db.query(
            `SELECT * FROM users WHERE user_id = ?`,
            [userId]
        );
        if(existingUser.length === 0) return { error: 'Usuario no encontrado.' };
        // Si existe, se obtienen sus notificaciones
        const [notifications] = await db.query(
            `SELECT noti.*, u.email, CONCAT(u.first_name, ' ', u.last_name) AS user_name 
            FROM notifications noti JOIN users u ON noti.user_id = u.user_id WHERE noti.user_id = ?`,
            [userId]
        );
        if(notifications.length === 0) return { error: 'El usuario no tiene notificaciones.' };
        return {
            message: 'Notificaciones del usuario obtenidas correctamente.',
            notifications: notifications
        }
    }

    // Método para crear una nueva notificación
    static async createNotification(data) {
        if(!data) return { error: 'Los datos de la notificación son requeridos.' };
        const {user_id, ...rest} = data;
        // Se verifica que exista el usuario 
        const [existingUser] = await db.query(
            `SELECT * FROM users WHERE user_id = ?`,
            [user_id]
        );
        if(existingUser.length === 0) return { error: 'Usuario no encontrado.' };
        // Si existe, se crea la notificación
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)`, [user_id, rest.title, rest.message, rest.type]
        );
        if(result.affectedRows === 0) return {error: 'Error al crear la notificación.' };
        // Se obteiene la nueva notificación creada
        const [newNotification] = await db.query(
            `SELECT * FROM notifications WHERE notification_id = ?`,
            [result.insertId]
        );
        if(newNotification.length === 0) return { error: 'Error al obtener la notificación creada.' };
        return {
            message: 'Notificación creada correctamente.',
            notification: newNotification[0]
        }
    }

    // Método para cambiar el estado de lectura de una notificación
    static async markNotificationAsRead(notificationId) {
        if(!notificationId) return { error: 'ID de notificación es requerido.' };
        // Se verifica que la notificación exista
        const [existingNotification] = await db.query(
            `SELECT * FROM notifications WHERE notification_id = ?`,
            [notificationId]
        );
        if(existingNotification.length === 0) return { error: 'Notificación no encontrada.' };
        // Si existe, se actualiza el estado de lectura
        await db.query(
            `UPDATE notifications SET is_read = TRUE WHERE notification_id = ?`,
            [notificationId]
        );
        return { message: 'Notificación marcada como leída.' };
    }

    // Método para actualizar una notificación
    static async updateNotification(notificationId, data) {
        if(!notificationId || !data) return { error: 'ID de notificación y datos son requeridos.' };
        const allowedFields = ['title', 'message', 'type', 'is_read'];
        const updateTofields = {};
        for(const field of allowedFields) {
            if(data[field] !== undefined) {
                updateTofields[field] = data[field];
            }
        }
        // Se verifica que la notificación exista
        const [existingNotification] = await db.query(
            `SELECT * FROM notifications WHERE notification_id = ?`,
            [notificationId]
        );
        if(existingNotification.length === 0) return { error: 'Notificación no encontrada.' };
        // Si existe, se actualiza la notificación
        const fields = [];
        const values = [];

        Object.entries(updateTofields).forEach(([key, value]) => {
            fields.push(`${key} = ?`);
            values.push(value);
        });
        values.push(notificationId); // Para la cláusula WHERE
        const [result] = await db.query(
            `UPDATE notifications SET ${fields.join(', ')} WHERE notification_id = ?`,
            values
        );
        if(result.affectedRows === 0) return { error: 'Error al actualizar la notificación.' };
        // Se obtiene la notificación actualizada
        const [updatedNotification] = await db.query(
            `SELECT * FROM notifications WHERE notification_id = ?`,
            [notificationId]
        );
        if(updatedNotification.length === 0) return { error: 'Error al obtener la notificación actualizada.' };
        return {
            message: 'Notificación actualizada correctamente.',
            notification: updatedNotification[0]
        }
    }
    // Método para eliminar una notificación
    static async deleteNotification(notificationId) {
        if(!notificationId) return { error: 'ID de notificación es requerido.' };
        // Se verifica que la notificación exista
        const [existingNotification] = await db.query(
            `SELECT * FROM notifications WHERE notification_id = ?`,
            [notificationId]
        );
        if(existingNotification.length === 0) return { error: 'Notificación no encontrada.' };
        // Si existe, se elimina la notificación
        await db.query(
            `DELETE FROM notifications WHERE notification_id = ?`,
            [notificationId]
        );
        return { message: 'Notificación eliminada correctamente.' };
    }
}

