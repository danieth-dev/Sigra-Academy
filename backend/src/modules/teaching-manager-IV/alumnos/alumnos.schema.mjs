import { z } from 'zod';

export const validateGetStudentsQuery = (data) => {
    const schema = z.object({
        teacherId: z.string().regex(/^\d+$/).transform(s => Number(s)),
        q: z.string().optional(),
        orderBy: z.enum(['nombre','email','user_id']).optional(),
        order: z.enum(['asc','desc']).optional(),
        limit: z.string().regex(/^\d+$/).transform(s => Number(s)).optional(),
        offset: z.string().regex(/^\d+$/).transform(s => Number(s)).optional()
    }).partial();
    return schema.safeParse(data);
}

export const validateTeacherIdParam = (data) => {
    const schema = z.object({ teacherId: z.string().regex(/^\d+$/).transform(s => Number(s)) });
    return schema.safeParse(data);
}