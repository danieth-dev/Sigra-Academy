import { db } from '../../../../database/db.database.mjs';
import { UPLOAD_ROOT_PATH } from '../../../api/middlewares/multer.middleware.mjs';
import fs from 'fs';
import path from 'path';

export class AssignmentsModel {
    // Teacher assignments (classes)
    static async getAll() {
        const [rows] = await db.query(`SELECT ta.*, s.section_name, su.subject_name, CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
            FROM teacher_assignments ta
            JOIN sections s ON ta.section_id = s.section_id
            JOIN subjects su ON ta.subject_id = su.subject_id
            JOIN users u ON ta.teacher_user_id = u.user_id`);
        return { message: `Se encontraron ${rows.length} asignaciones.`, assignments: rows };
    }

    static async getByTeacher(teacherId){
        if(!teacherId) return { error: 'No se proporcionó el ID del profesor.' };
        const [rows] = await db.query(
            `SELECT ta.*, s.section_name, su.subject_name FROM teacher_assignments ta
             JOIN sections s ON ta.section_id = s.section_id
             JOIN subjects su ON ta.subject_id = su.subject_id
            WHERE ta.teacher_user_id = ?`, [teacherId]
        );
        if(rows.length === 0) return { message: 'No se encontraron asignaciones para este profesor.' };
        return { message: `Se encontraron ${rows.length} asignaciones.`, assignments: rows };
    }

    static async getById(assignmentId){
        if(!assignmentId) return { error: 'No se proporcionó el ID de la asignación.' };
        const [rows] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [assignmentId]);
        if(rows.length === 0) return { error: 'La asignación no existe.' };
        return { message: 'Asignación encontrada.', assignment: rows[0] };
    }

    // Obtener estudiantes de una asignación (por sección vinculada)
    static async getStudentsByAssignment(assignmentId){
        if(!assignmentId) return { error: 'No se proporcionó el ID de la asignación.' };
        // Buscamos la sección asociada a la asignación
        const [assign] = await db.query(`SELECT section_id FROM teacher_assignments WHERE assignment_id = ?`, [assignmentId]);
        if(assign.length === 0) return { error: 'La asignación no existe.' };
        const sectionId = assign[0].section_id;
        const [rows] = await db.query(
            `SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS nombre, u.email, e.enrollment_id
            FROM enrollments e
            JOIN users u ON e.student_user_id = u.user_id
            WHERE e.section_id = ?`,
            [sectionId]
        );
        if(rows.length === 0) return { message: 'No se encontraron estudiantes en esta sección.' };
        return { message: `Se encontraron ${rows.length} estudiantes.`, students: rows };
    }

    // Obtener asignaciones relacionadas a un estudiante (por su inscripción)
    static async getAssignmentsByStudent(studentId){
        if(!studentId) return { error: 'No se proporcionó el ID del estudiante.' };
        const [rows] = await db.query(
            `SELECT ta.assignment_id, su.subject_name, s.section_name, ta.teacher_user_id
            FROM teacher_assignments ta
            JOIN subjects su ON ta.subject_id = su.subject_id
            JOIN sections s ON ta.section_id = s.section_id
            JOIN enrollments e ON e.section_id = ta.section_id
            WHERE e.student_user_id = ?`,
            [studentId]
        );
        if(rows.length === 0) return { message: 'No se encontraron asignaciones para este estudiante.' };
        return { message: `Se encontraron ${rows.length} asignaciones.`, assignments: rows };
    }

    static async create(data){
        const { teacher_user_id, subject_id, section_id } = data;
        const [result] = await db.query(
            `INSERT INTO teacher_assignments (teacher_user_id, subject_id, section_id)
            VALUES (?, ?, ?)`,
            [teacher_user_id, subject_id, section_id]
        );
        if(result.affectedRows === 0) return { error: 'No se pudo crear la asignación.' };
        const [inserted] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [result.insertId]);
        return { message: 'Asignación creada exitosamente.', assignment: inserted[0] };
    }

    static async update(assignmentId, data){
        if(!assignmentId) return { error: 'No se proporcionó el ID de la asignación.' };
        const allowed = ['teacher_user_id','subject_id','section_id'];
        const fields = [];
        const values = [];
        for(const key of allowed){
            if(data[key] !== undefined){
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        }
        if(fields.length === 0) return { error: 'No hay campos para actualizar.' };
        values.push(assignmentId);
        const [res] = await db.query(`UPDATE teacher_assignments SET ${fields.join(', ')} WHERE assignment_id = ?`, values);
        if(res.affectedRows === 0) return { error: 'No se pudo actualizar la asignación.' };
        const [updated] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [assignmentId]);
        return { message: 'Asignación actualizada.', assignment: updated[0] };
    }

    static async delete(assignmentId){
        if(!assignmentId) return { error: 'No se proporcionó el ID de la asignación.' };
        const [existing] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [assignmentId]);
        if(existing.length === 0) return { error: 'La asignación no existe.' };
        // No permitir eliminar si hay actividades asociadas para evitar pérdida accidental
        const [acts] = await db.query(`SELECT COUNT(*) AS c FROM activities WHERE assignment_id = ?`, [assignmentId]);
        if(acts[0] && acts[0].c > 0) return { error: 'La asignación tiene actividades asociadas. Elimine las actividades antes de eliminar la asignación.' };
        const [del] = await db.query(`DELETE FROM teacher_assignments WHERE assignment_id = ?`, [assignmentId]);
        if(del.affectedRows === 0) return { error: 'No se pudo eliminar la asignación.' };
        return { message: 'Asignación eliminada correctamente.' };
    }
}

export class ActivitiesModel {
    static async getByAssignment(assignmentId){
        if(!assignmentId) return { error: 'No se proporcionó el ID de la asignación.' };
        // ta.title no existe en teacher_assignments — devolvemos únicamente las actividades
        const [rows] = await db.query(`SELECT a.* FROM activities a WHERE a.assignment_id = ?`, [assignmentId]);
        if(rows.length === 0) return { message: 'No hay actividades para esta asignación.' };
        return { message: `Se encontraron ${rows.length} actividades.`, activities: rows };
    }

    static async getAllActivities(){
        const [rows] = await db.query(`SELECT a.*, ta.assignment_id, su.subject_name, s.section_name FROM activities a JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id JOIN subjects su ON ta.subject_id = su.subject_id JOIN sections s ON ta.section_id = s.section_id WHERE a.is_active = 1`);
        if(rows.length === 0) return { message: 'No hay actividades.' };
        return { message: `Se encontraron ${rows.length} actividades.`, activities: rows };
    }



    static async getById(activityId){
        if(!activityId) return { error: 'No se proporcionó el ID de la actividad.' };
        const [rows] = await db.query(`SELECT * FROM activities WHERE activity_id = ?`, [activityId]);
        if(rows.length === 0) return { error: 'La actividad no existe.' };
        return { message: 'Actividad encontrada.', activity: rows[0] };
    }

    static async create(data){
        const { assignment_id, title, description, weight_percentage, due_date } = data;
        // Validar que la asignación exista
        const [existing] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [assignment_id]);
        if(existing.length === 0) return { error: 'La asignación indicada no existe.' };

        // Normalize due_date to MySQL DATETIME format if provided
        const fmt = (d) => {
            if(!d) return null;
            const dt = (d instanceof Date) ? d : new Date(d);
            if(Number.isNaN(dt.getTime())) return null;
            return dt.toISOString().replace('T',' ').replace(/\.\d+Z$/,'');
        };
        const dueFmt = fmt(due_date);
        if(due_date && !dueFmt) return { error: 'due_date no es válida.' };

        const [res] = await db.query(
            `INSERT INTO activities (assignment_id, title, description, weight_percentage, due_date)
            VALUES (?, ?, ?, ?, ?)`,
            [assignment_id, title, description || null, weight_percentage, dueFmt]
        );
        if(res.affectedRows === 0) return { error: 'No se pudo crear la actividad.' };
        const [inserted] = await db.query(`SELECT * FROM activities WHERE activity_id = ?`, [res.insertId]);
        return { message: 'Actividad creada.', activity: inserted[0] };
    }

    static async update(activityId, data){
        if(!activityId) return { error: 'No se proporcionó el ID de la actividad.' };
        const allowed = ['title','description','weight_percentage','due_date','is_active','is_visible'];
        const fields = [];
        const values = [];

        // If due_date provided, normalize it
        if(data.due_date !== undefined){
            const dt = new Date(data.due_date);
            if(Number.isNaN(dt.getTime())) return { error: 'due_date no es válida.' };
            data.due_date = dt.toISOString().replace('T',' ').replace(/\.\d+Z$/,'');
        }

        for(const key of allowed){
            if(data[key] !== undefined){
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        }
        if(fields.length === 0) return { error: 'No hay campos para actualizar.' };
        values.push(activityId);
        const [res] = await db.query(`UPDATE activities SET ${fields.join(', ')} WHERE activity_id = ?`, values);
        if(res.affectedRows === 0) return { error: 'No se pudo actualizar la actividad.' };
        const [updated] = await db.query(`SELECT * FROM activities WHERE activity_id = ?`, [activityId]);
        return { message: 'Actividad actualizada.', activity: updated[0] };
    }

    static async delete(activityId){
        if(!activityId) return { error: 'No se proporcionó el ID de la actividad.' };
        const [existing] = await db.query(`SELECT * FROM activities WHERE activity_id = ?`, [activityId]);
        if(existing.length === 0) return { error: 'La actividad no existe.' };
        // Verificar si existen entregas asociadas a la actividad
        const [subsCount] = await db.query(`SELECT COUNT(*) AS c FROM submissions WHERE activity_id = ?`, [activityId]);
        if(subsCount[0] && subsCount[0].c > 0) return { error: 'La actividad tiene entregas asociadas. Elimine las entregas antes de eliminar la actividad.' };
        const [res] = await db.query(`DELETE FROM activities WHERE activity_id = ?`, [activityId]);
        if(res.affectedRows === 0) return { error: 'No se pudo eliminar la actividad.' };
        return { message: 'Actividad eliminada correctamente.' };
    }
}

export class SubmissionsModel {
    static async create({ activity_id, student_user_id, file_path, comments }){
        // Verificar existencia de actividad
        const [activityRes] = await db.query(`SELECT * FROM activities WHERE activity_id = ?`, [activity_id]);
        if(activityRes.length === 0) return { error: 'La actividad no existe.' };
        const activity = activityRes[0];
        // Verificar que el estudiante esté inscrito en la sección vinculada a la actividad
        const [ta] = await db.query(`SELECT ta.section_id FROM activities a JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id WHERE a.activity_id = ?`, [activity_id]);
        const sectionId = ta[0] && ta[0].section_id;
        if(sectionId){
            const [en] = await db.query(`SELECT * FROM enrollments WHERE section_id = ? AND student_user_id = ?`, [sectionId, student_user_id]);
            if(en.length === 0) return { error: 'El estudiante no está inscrito en la sección de la asignación.' };
        }

        const [res] = await db.query(
            `INSERT INTO submissions (activity_id, student_user_id, file_path, comments) VALUES (?, ?, ?, ?)`,
            [activity_id, student_user_id, file_path, comments || null]
        );
        if(res.affectedRows === 0) return { error: 'No se pudo guardar la entrega.' };
        const [inserted] = await db.query(`SELECT * FROM submissions WHERE submission_id = ?`, [res.insertId]);
        const submission = inserted[0];
        // Determinar si es tardía comparando submission_date con due_date
        const submissionDate = new Date(submission.submission_date);
        const dueDate = activity.due_date ? new Date(activity.due_date) : null;
        const is_late = dueDate ? (submissionDate > dueDate) : false;
        return { message: 'Entrega registrada.', submission: { ...submission, is_late } };
    }

    static async getByActivity(activityId){
        if(!activityId) return { error: 'No se proporcionó el ID de la actividad.' };
        const [rows] = await db.query(`SELECT s.*, CONCAT(u.first_name,' ',u.last_name) AS student_name, a.title AS activity_title, a.due_date, su.subject_name FROM submissions s JOIN users u ON s.student_user_id = u.user_id JOIN activities a ON s.activity_id = a.activity_id JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id JOIN subjects su ON ta.subject_id = su.subject_id WHERE s.activity_id = ?`, [activityId]);
        if(rows.length === 0) return { message: 'No hay entregas para esta actividad.' };
        // calcular tardias
        const submissions = rows.map(r => {
            const is_late = r.due_date ? (new Date(r.submission_date) > new Date(r.due_date)) : false;
            return { ...r, is_late };
        });
        return { message: `Se encontraron ${submissions.length} entregas.`, submissions };
    }

    static async getByStudent(studentId){
        if(!studentId) return { error: 'No se proporcionó el ID del estudiante.' };
        const [rows] = await db.query(`SELECT s.*, a.title AS activity_title, a.due_date, su.subject_name FROM submissions s JOIN activities a ON s.activity_id = a.activity_id JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id JOIN subjects su ON ta.subject_id = su.subject_id WHERE s.student_user_id = ?`, [studentId]);
        if(rows.length === 0) return { message: 'No se encontraron entregas para este estudiante.' };
        const submissions = rows.map(r => ({ ...r, is_late: r.due_date ? (new Date(r.submission_date) > new Date(r.due_date)) : false }));
        return { message: `Se encontraron ${submissions.length} entregas.`, submissions };
    }

    static async getById(submissionId){
        if(!submissionId) return { error: 'No se proporcionó el ID de la entrega.' };
        const [rows] = await db.query(`SELECT s.*, a.due_date FROM submissions s JOIN activities a ON s.activity_id = a.activity_id WHERE s.submission_id = ?`, [submissionId]);
        if(rows.length === 0) return { error: 'La entrega no existe.' };
        const r = rows[0];
        const is_late = r.due_date ? (new Date(r.submission_date) > new Date(r.due_date)) : false;
        return { message: 'Entrega encontrada.', submission: { ...r, is_late } };
    }

    // Opción para borrar archivo y registro
    static async update(submissionId, newFilePath){
        if(!submissionId) return { error: 'No se proporcionó el ID de la entrega.' };
        const [existing] = await db.query(`SELECT * FROM submissions WHERE submission_id = ?`, [submissionId]);
        if(existing.length === 0) return { error: 'La entrega no existe.' };
        const current = existing[0];
        // Verificar si la actividad tiene due_date y no ha vencido
        const [activityRes] = await db.query(`SELECT due_date, assignment_id FROM activities WHERE activity_id = ?`, [current.activity_id]);
        const activity = activityRes[0];
        const dueDate = activity && activity.due_date ? new Date(activity.due_date) : null;
        if(dueDate && new Date() > dueDate) return { error: 'La fecha límite ya pasó. No se puede actualizar la entrega.' };

        // Verificar que el estudiante aún esté inscrito en la sección vinculada
        if(activity && activity.assignment_id){
            const [ta] = await db.query(`SELECT section_id FROM teacher_assignments WHERE assignment_id = ?`, [activity.assignment_id]);
            const sectionId = ta[0] && ta[0].section_id;
            if(sectionId){
                const [en] = await db.query(`SELECT * FROM enrollments WHERE section_id = ? AND student_user_id = ?`, [sectionId, current.student_user_id]);
                if(en.length === 0) return { error: 'El estudiante ya no está inscrito en la sección; no se permite actualizar la entrega.' };
            }
        }

        // Actualizar ruta de archivo y submission_date
        const [res] = await db.query(`UPDATE submissions SET file_path = ?, submission_date = CURRENT_TIMESTAMP WHERE submission_id = ?`, [newFilePath, submissionId]);
        if(res.affectedRows === 0) return { error: 'No se pudo actualizar la entrega.' };

        // Intentamos borrar archivo previo (si existe)
        try{
            const filePath = current.file_path;
            if(filePath){
                let fileLocal = filePath;
                const uploadsIndex = filePath.indexOf('/uploads');
                if(uploadsIndex !== -1){
                    fileLocal = filePath.substring(uploadsIndex);
                    const abs = path.resolve('.' + fileLocal);
                    if(fs.existsSync(abs)) fs.unlinkSync(abs);
                } else {
                    const abs = path.resolve(filePath);
                    if(fs.existsSync(abs)) fs.unlinkSync(abs);
                }
            }
        }catch(e){/* ignore fs errors */}

        const [updated] = await db.query(`SELECT * FROM submissions WHERE submission_id = ?`, [submissionId]);
        return { message: 'Entrega actualizada exitosamente.', submission: updated[0] };
    }

    static async delete(submissionId){
        const [existing] = await db.query(`SELECT * FROM submissions WHERE submission_id = ?`, [submissionId]);
        if(existing.length === 0) return { error: 'La entrega no existe.' };
        const submission = existing[0];
        // Verificar fecha límite de la actividad asociada
        const [activityRes] = await db.query(`SELECT due_date FROM activities WHERE activity_id = ?`, [submission.activity_id]);
        const activity = activityRes[0];
        const dueDate = activity && activity.due_date ? new Date(activity.due_date) : null;
        if(dueDate && new Date() > dueDate) return { error: 'La fecha límite ya pasó. No se puede eliminar la entrega.' };

        const filePath = submission.file_path;
        const [res] = await db.query(`DELETE FROM submissions WHERE submission_id = ?`, [submissionId]);
        if(res.affectedRows === 0) return { error: 'No se pudo eliminar la entrega.' };
        // intentar borrar archivo (si no es URL, borramos directamente; si es URL, extraemos ruta)
        try{
            if(filePath){
                let fileLocal = filePath;
                // si es URL, buscamos /uploads
                const uploadsIndex = filePath.indexOf('/uploads');
                if(uploadsIndex !== -1){
                    fileLocal = filePath.substring(uploadsIndex); // /uploads/...
                    // quitamos el prefijo /uploads para resolver desde root
                    const abs = path.resolve('.' + fileLocal);
                    if(fs.existsSync(abs)) fs.unlinkSync(abs);
                } else {
                    const abs = path.resolve(filePath);
                    if(fs.existsSync(abs)) fs.unlinkSync(abs);
                }
            }
        }catch(e){/* no bloquear por error en fs */}
        return { message: 'Entrega eliminada correctamente.' };
    }
}
