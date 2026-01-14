import { db } from '../../../../database/db.database.mjs';

export class AlumnosModel {
    // Verifica si un profesor está asignado a una sección
    static async isTeacherAssignedToSection(teacherId, sectionId){
        if(!teacherId || !sectionId) return false;
        const [rows] = await db.query(`SELECT * FROM teacher_assignments WHERE teacher_user_id = ? AND section_id = ?`, [teacherId, sectionId]);
        return rows.length > 0;
    }

    // Obtener secciones asignadas a un profesor
    static async getSectionsByTeacher(teacherId){
        if(!teacherId) return { error: 'No se proporcionó el ID del profesor.' };
        const [rows] = await db.query(`SELECT ta.assignment_id, ta.section_id, s.section_name, ta.subject_id, su.subject_name FROM teacher_assignments ta JOIN sections s ON ta.section_id = s.section_id JOIN subjects su ON ta.subject_id = su.subject_id WHERE ta.teacher_user_id = ?`, [teacherId]);
        if(rows.length === 0) return { message: 'No se encontraron secciones asignadas a este profesor.' };
        return { message: `Se encontraron ${rows.length} secciones.`, sections: rows };
    }

    // Obtener nombre de sección
    static async getSectionName(sectionId){
        if(!sectionId) return null;
        const [rows] = await db.query(`SELECT section_name FROM sections WHERE section_id = ?`, [sectionId]);
        return rows && rows[0] ? rows[0].section_name : null;
    }

    // Obtener alumnos por sección con filtros (q, orderBy, order, limit, offset)
    static async getStudentsBySection(sectionId, { q, orderBy = 'nombre', order = 'asc', limit = 100, offset = 0 } = {}){
        if(!sectionId) return { error: 'No se proporcionó el ID de la sección.' };
        // Buscamos por nombre, email o user_id
        const whereClauses = ['e.section_id = ?'];
        const params = [sectionId];
        if(q){
            whereClauses.push(`(CONCAT(u.first_name,' ',u.last_name) LIKE ? OR u.email LIKE ? OR u.user_id LIKE ?)`);
            const qLike = `%${q}%`;
            params.push(qLike, qLike, qLike);
        }
        let orderSql = 'ORDER BY u.first_name ASC';
        if(orderBy === 'user_id') orderSql = `ORDER BY u.user_id ${order.toUpperCase()}`;
        else if(orderBy === 'email') orderSql = `ORDER BY u.email ${order.toUpperCase()}`;
        else orderSql = `ORDER BY u.first_name ${order.toUpperCase()}`;

        // Count total
        const [countRows] = await db.query(`SELECT COUNT(*) as total FROM enrollments e JOIN users u ON e.student_user_id = u.user_id WHERE ${whereClauses.join(' AND ')}`, params);
        const total = countRows[0]?.total || 0;

        // Pagination
        params.push(Number(limit), Number(offset));
        const [rows] = await db.query(`SELECT u.user_id, CONCAT(u.first_name,' ',u.last_name) AS nombre, u.email, e.enrollment_id FROM enrollments e JOIN users u ON e.student_user_id = u.user_id WHERE ${whereClauses.join(' AND ')} ${orderSql} LIMIT ? OFFSET ?`, params);
        return { message: `Se encontraron ${rows.length} estudiantes.`, total, students: rows };
    }
}