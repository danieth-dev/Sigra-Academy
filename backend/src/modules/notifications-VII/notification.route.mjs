import { Router} from "express";
import { NotificationController } from "./notification.controller.mjs";
import { NotificationModel } from "./notification.model.mjs";

const router = Router();
const notificationController = new NotificationController({NotificationModel: NotificationModel});

// Rutas relacionadas con las notificaciones 
// Rutas para obtener todas las notificaciones del sistema
router.get('/all', notificationController.getAllNotifications);
// Ruta para obtener todas las notificaciones de un usuario específico
router.get('/user/:userId', notificationController.getNotificationsByUserId);
// Ruta para obtener una notificación por su ID
router.get('/notification/:notificationId', notificationController.getNotificationById);
// Ruta para crear una nueva notificación
router.post('/create', notificationController.createNotification);
// Ruta para actualizar una notificación
router.patch('/update/:notificationId', notificationController.updateNotification);
// Ruta para marcar una notificación como leída
router.patch('/mark-as-read/:notificationId', notificationController.markNotificationAsRead);
// NUEVA RUTA: Eliminar notificación
router.delete('/delete/:notificationId', notificationController.deleteNotification);

export const NotificationRoutes = router;
