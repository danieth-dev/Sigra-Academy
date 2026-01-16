import {z} from 'zod';

// Esquema para validar la creación de una notificación
const createNotficationSchema = z.object({
    user_id: z.number().int().positive(),
    title: z.string().min(1).max(255),
    message: z.string().min(1),
    type: z.enum(['Alerta', 'Info', 'Academico', 'Recordatorio'])
});

// Esquema para validar la actualización de una notificación
const updateNotificationSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    message: z.string().min(1).optional(),
    type: z.enum(['Alerta', 'Info', 'Academico', 'Recordatorio']).optional(),
    is_read: z.boolean().optional()
});

// Función para validar la creación de una notificación
export function validateCreateNotification(data) {
    return createNotficationSchema.safeParse(data);
}

// Función para validar la actualización de una notificación
export function validateUpdateNotification(data) {
    return updateNotificationSchema.partial().safeParse(data);
}