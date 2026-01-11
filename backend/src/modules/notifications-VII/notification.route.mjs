import { Router} from "express";
import { NotificationController } from "./notification.controller.mjs";
import { NotificationModel } from "./notification.model.mjs";

const router = Router();
const notificationController = new NotificationController({NotificationModel: NotificationModel});

// Rutas relacionadas con las notificaciones 
//Rutas para obtener todas las notificaciones del sistema
router.get('/all', notificationController.getAllNotifications);

//################################################################
// NUEVA RUTA: Obtener todas las de UN USUARIO por el ID
router.get('/user/:userId', notificationController.getNotificationsByUserId);
// NUEVA RUTA: Obtener una específica
router.get('/notification/:id', notificationController.getNotificationById);
// NUEVA RUTA: Crear una notificación
router.post('/create', notificationController.createNotification);
// NUEVA RUTA: Actualizar (usa :id como parámetro dinámico)
router.patch('/update/:id', notificationController.updateNotification); 
// NUEVA RUTA: Eliminar notificación
router.delete('/delete/:id', notificationController.deleteNotification);

export const NotificationRoutes = router;
