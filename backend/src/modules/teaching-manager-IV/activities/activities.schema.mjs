import {z} from 'zod';

// Esquema de validación para la creación de una actividad
const createActivitySchema = z.object({
    assignment_id: z.number().int().positive(),
    title: z.string().min(1).max(255),
    description: z.string().min(1).max(1000),
    weight_percentage: z.number().min(0).max(100),
    due_date: z.string().refine((date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
    }).transform((date) => new Date(date))
});

// Esquema de validación para la actualización de una actividad
const updateActivitySchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().min(1).max(1000).optional(),
    weight_percentage: z.number().min(0).max(100).optional(),
    due_date: z.string().refine((date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
    }).transform((date) => new Date(date)).optional(),
    is_active: z.boolean().optional()
});

// Función para validar los datos de creación de una actividad
export function validateCreateActivity(data) {
    return createActivitySchema.safeParse(data);
}

// Función para validar los datos de actualización de una actividad
export function validateUpdateActivity(data) {
    return updateActivitySchema.partial().safeParse(data);
}