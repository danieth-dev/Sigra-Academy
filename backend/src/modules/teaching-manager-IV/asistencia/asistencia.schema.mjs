import { z } from 'zod';

export const validateCreateSession = (data) => {
    const schema = z.object({
        assignment_id: z.number().int().positive(),
        // frequency: 'weekly' (default) or 'daily' (no week_number required)
        frequency: z.enum(['weekly','daily']).optional(),
        week_number: z.number().int().min(1).optional(),
        open_date: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha de apertura inválida' }),
        close_date: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha límite inválida' }),
        created_by: z.number().int().positive().optional()
    }).refine(d => new Date(d.open_date) <= new Date(d.close_date), { message: 'open_date debe ser anterior o igual a close_date' })
      .refine(d => (d.frequency === 'weekly' ? (typeof d.week_number === 'number' && d.week_number >= 1) : true), { message: 'week_number es requerido para frecuencia weekly' });
    return schema.safeParse(data);
}

export const validateMark = (data) => {
    const schema = z.object({ student_user_id: z.number().int().positive() });
    return schema.safeParse(data);
}

export const validateReportQuery = (data) => {
    const schema = z.object({ from: z.string().optional(), to: z.string().optional() }).partial();
    return schema.safeParse(data);
}