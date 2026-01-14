import { z } from 'zod';

export const validateCreateAssignment = (data) => {
    const schema = z.object({
        teacher_user_id: z.number().int().positive(),
        subject_id: z.number().int().positive(),
        section_id: z.number().int().positive(),
        title: z.string().min(3).max(150).optional(),
        description: z.string().max(2000).optional()
    });
    return schema.safeParse(data);
}

export const validateUpdateAssignment = (data) => {
    const schema = z.object({
        teacher_id: z.number().int().positive().optional(),
        subject_id: z.number().int().positive().optional(),
        section_id: z.number().int().positive().optional(),
        title: z.string().min(3).max(150).optional(),
        description: z.string().max(2000).optional()
    });
    return schema.partial().safeParse(data);
}

export const validateCreateActivity = (data) => {
    const schema = z.object({
        assignment_id: z.number().int().positive(),
        title: z.string().min(3).max(150),
        description: z.string().max(2000).optional(),
        weight_percentage: z.number().min(0).max(100),
        due_date: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha inválida' })
    });
    return schema.safeParse(data);
}

export const validateUpdateActivity = (data) => {
    const schema = z.object({
        title: z.string().min(3).max(150).optional(),
        description: z.string().max(2000).optional(),
        weight_percentage: z.number().min(0).max(100).optional(),
        due_date: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha inválida' }).optional()
    });
    return schema.partial().safeParse(data);
}

export const validateCreateSubmission = (data) => {
    const schema = z.object({
        activity_id: z.number().int().positive(),
        student_user_id: z.number().int().positive(),
        comments: z.string().max(1000).optional()
    });
    return schema.safeParse(data);
}