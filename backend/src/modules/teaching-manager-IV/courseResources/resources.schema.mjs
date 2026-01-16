import {z} from 'zod';

// Esquema de validación para la creación de un recurso de curso
const createResourceSchema = z.object({
    assignment_id: z.number().int().positive(),
    title: z.string().min(1).max(255),
    resource_type: z.enum(['PDF', 'Link', 'Video', 'Slide']),
    file_path_or_url: z.string().min(1).max(500),
});

// Esquema de validación para la actualización de un recurso de curso
const updateResourceSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    resource_type: z.enum(['PDF', 'Link', 'Video', 'Slide']).optional(),
    file_path_or_url: z.string().min(1).max(500).optional(),
});

// Función para validar los datos de creación de un recurso
export function validateCreateResource(data) {
    return createResourceSchema.safeParse(data);
}

// Función para validar los datos de actualización de un recurso
export function validateUpdateResource(data) {
    return updateResourceSchema.partial().safeParse(data);
}