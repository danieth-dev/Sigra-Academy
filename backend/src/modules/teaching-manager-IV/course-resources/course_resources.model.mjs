import { db } from '../../../../database/db.database.mjs';

export class CourseResourcesModel {
    static async create(data){
        const { assignment_id, title, resource_type, file_path_or_url, is_visible } = data;
        // Validate assignment
        const [assign] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [assignment_id]);
        if(assign.length === 0) return { error: 'Asignación no encontrada.' };
        const [res] = await db.query(`INSERT INTO course_resources (assignment_id, title, resource_type, file_path_or_url, uploaded_at) VALUES (?, ?, ?, ?, NOW())`, [assignment_id, title, resource_type, file_path_or_url]);
        if(res.affectedRows === 0) return { error: 'No se pudo crear el recurso.' };
        const [inserted] = await db.query(`SELECT * FROM course_resources WHERE resource_id = ?`, [res.insertId]);
        return { message: 'Recurso creado.', resource: inserted[0] };
    }

    static async update(resourceId, data){
        if(!resourceId) return { error: 'No se proporcionó el ID del recurso.' };
        const allowed = ['title','resource_type','file_path_or_url','is_visible'];
        const fields = [];
        const values = [];
        for(const k of allowed){ if(data[k] !== undefined){ fields.push(`${k} = ?`); values.push(data[k]); }}
        if(fields.length === 0) return { error: 'No hay campos para actualizar.' };
        values.push(resourceId);
        const [res] = await db.query(`UPDATE course_resources SET ${fields.join(', ')} WHERE resource_id = ?`, values);
        if(res.affectedRows === 0) return { error: 'No se pudo actualizar el recurso.' };
        const [updated] = await db.query(`SELECT * FROM course_resources WHERE resource_id = ?`, [resourceId]);
        return { message: 'Recurso actualizado.', resource: updated[0] };
    }

    static async getByAssignment(assignmentId){
        if(!assignmentId) return { error: 'No se proporcionó el ID de la asignación.' };
        const [rows] = await db.query(`SELECT * FROM course_resources WHERE assignment_id = ? ORDER BY uploaded_at DESC`, [assignmentId]);
        if(rows.length === 0) return { message: 'No hay recursos para esta asignación.' };
        return { message: `Se encontraron ${rows.length} recursos.`, resources: rows };
    }

    static async getById(resourceId){
        if(!resourceId) return { error: 'No se proporcionó el ID del recurso.' };
        const [rows] = await db.query(`SELECT * FROM course_resources WHERE resource_id = ?`, [resourceId]);
        if(rows.length === 0) return { error: 'Recurso no encontrado.' };
        return { message: 'Recurso encontrado.', resource: rows[0] };
    }

    static async delete(resourceId){
        if(!resourceId) return { error: 'No se proporcionó el ID del recurso.' };
        const [existing] = await db.query(`SELECT * FROM course_resources WHERE resource_id = ?`, [resourceId]);
        if(existing.length === 0) return { error: 'Recurso no encontrado.' };
        const [res] = await db.query(`DELETE FROM course_resources WHERE resource_id = ?`, [resourceId]);
        if(res.affectedRows === 0) return { error: 'No se pudo eliminar el recurso.' };
        return { message: 'Recurso eliminado.' };
    }
}