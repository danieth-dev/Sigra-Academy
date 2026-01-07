import {z} from 'zod';

// Esquema para validar la creación de un registro de calificación
const createGradeLogSchema = z.object({
    activity_id: z.number().int().positive(),
    student_user_id: z.number().int().positive(),
    score: z.number().min(0).max(100),
    feedback: z.string().max(500).optional()
});

// Esquema para validar la actualización de un registro de calificación
const updateGradeLogSchema = z.object({
    score: z.number().min(0).max(100).optional(),
    feedback: z.string().max(500).optional()
});

// Aqui vas a realizar dos funciones una para validar la creación y otra para la actualización (utiliza safeParse() y partial())
export function validateCreateGradeLog(data){
    return createGradeLogSchema.safeParse(data);
}

// Función para validar los datos a la hora de actualizar la nota
export function validateUpdateGradeLog(data){
    return updateGradeLogSchema.partial().safeParse(data);
}