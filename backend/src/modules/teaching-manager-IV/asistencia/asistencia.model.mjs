import { db } from '../../../../database/db.database.mjs';

export class AsistenciaModel {
    // Crear sesión de asistencia para una asignación (assignment_id) y fecha
    static async createSession({ assignment_id, week_number, open_date, close_date, created_by, frequency = 'weekly' }){
        try{
            // validar asignación
            const [assign] = await db.query(`SELECT * FROM teacher_assignments WHERE assignment_id = ?`, [assignment_id]);
            if(assign.length === 0) return { error: 'La asignación no existe.' };

            // Normalize dates to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
            const fmt = (d) => {
                if(!d) return null;
                const dt = (d instanceof Date) ? d : new Date(d);
                if(Number.isNaN(dt.getTime())) return null;
                // Use UTC to avoid timezone issues: remove milliseconds and Z
                return dt.toISOString().replace('T',' ').replace(/\.\d+Z$/,'');
            };
            const openFmt = fmt(open_date);
            const closeFmt = fmt(close_date);
            if(open_date && !openFmt) return { error: 'open_date no es una fecha válida.' };
            if(close_date && !closeFmt) return { error: 'close_date no es una fecha válida.' };

            // If frequency is daily, week_number should be null
            const weekVal = frequency === 'daily' ? null : week_number;

            // Try to insert with frequency column if DB has it; otherwise fallback to older schema
            try{
                const [res] = await db.query(`INSERT INTO attendance_sessions (assignment_id, week_number, open_date, close_date, created_by, frequency) VALUES (?, ?, ?, ?, ?, ?)`, [assignment_id, weekVal, openFmt, closeFmt, created_by || null, frequency]);
                if(res.affectedRows === 0) return { error: 'No se pudo crear la sesión.' };
                const [rows] = await db.query(`SELECT * FROM attendance_sessions WHERE session_id = ?`, [res.insertId]);
                const session = rows[0];
                // Ensure frequency present in result even when older DB schema is used
                session.frequency = frequency || session.frequency || 'weekly';
                // Poblar registros de asistencia con estado 'absent' para todos los inscritos en la sección
                // obtenemos sección de la asignación
                const sectionId = assign[0].section_id;
                const [students] = await db.query(`SELECT u.user_id FROM enrollments e JOIN users u ON e.student_user_id = u.user_id WHERE e.section_id = ?`, [sectionId]);
                if(students.length > 0){
                    const values = students.map(s => [res.insertId, s.user_id, 'absent']);
                    const placeholders = values.map(() => '(?, ?, ?)').join(',');
                    const flat = values.flat();
                    await db.query(`INSERT INTO attendance_records (session_id, student_user_id, status) VALUES ${placeholders}`, flat);
                }
                const [records] = await db.query(`SELECT ar.*, CONCAT(u.first_name,' ',u.last_name) AS student_name FROM attendance_records ar JOIN users u ON ar.student_user_id = u.user_id WHERE ar.session_id = ?`, [res.insertId]);
                return { message: 'Asistencia creada correctamente.', session, records };
            }catch(e){
                if(e && e.code === 'ER_BAD_FIELD_ERROR'){
                    // fallback: older schema without frequency column
                    const weekValFallback = (weekVal === null ? 0 : weekVal);
                    const [res] = await db.query(`INSERT INTO attendance_sessions (assignment_id, week_number, open_date, close_date, created_by) VALUES (?, ?, ?, ?, ?)`, [assignment_id, weekValFallback, openFmt, closeFmt, created_by || null]);
                    if(res.affectedRows === 0) return { error: 'No se pudo crear la sesión.' };
                    const [rows] = await db.query(`SELECT * FROM attendance_sessions WHERE session_id = ?`, [res.insertId]);
                    const session = rows[0];
                    // Ensure frequency present for older schema
                    session.frequency = frequency || session.frequency || 'weekly';
                    const sectionId = assign[0].section_id;
                    const [students] = await db.query(`SELECT u.user_id FROM enrollments e JOIN users u ON e.student_user_id = u.user_id WHERE e.section_id = ?`, [sectionId]);
                    if(students.length > 0){
                        const values = students.map(s => [res.insertId, s.user_id, 'absent']);
                        const placeholders = values.map(() => '(?, ?, ?)').join(',');
                        const flat = values.flat();
                        await db.query(`INSERT INTO attendance_records (session_id, student_user_id, status) VALUES ${placeholders}`, flat);
                    }
                    const [records] = await db.query(`SELECT ar.*, CONCAT(u.first_name,' ',u.last_name) AS student_name FROM attendance_records ar JOIN users u ON ar.student_user_id = u.user_id WHERE ar.session_id = ?`, [res.insertId]);
                    return { message: 'Asistencia creada correctamente.', session, records };                }
                throw e;
            }
        }catch(e){
            // Si falla por falta de tablas o columnas, devolver mensaje instructivo
            if(e && (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_FIELD_ERROR')){
                return { error: `La base de datos no tiene las migraciones de asistencia aplicadas (${e.code}). Por favor ejecute "backend/resources/attendance.sql" en su instancia MySQL y vuelva a intentarlo.` };
            }
            throw e;
        }
    }

    static async getSession(sessionId){
        if(!sessionId) return { error: 'No se proporcionó el ID de la sesión.' };
        const [rows] = await db.query(`SELECT * FROM attendance_sessions WHERE session_id = ?`, [sessionId]);
        if(rows.length === 0) return { error: 'Sesión no encontrada.' };
        return { session: rows[0] };
    }

    static async getRecords(sessionId){
        if(!sessionId) return { error: 'No se proporcionó el ID de la sesión.' };
        const [rows] = await db.query(`SELECT ar.*, CONCAT(u.first_name,' ',u.last_name) AS student_name FROM attendance_records ar JOIN users u ON ar.student_user_id = u.user_id WHERE ar.session_id = ?`, [sessionId]);
        return { message: `Se encontraron ${rows.length} registros.`, records: rows };
    }

    static async markPresent(sessionId, studentId){
        // Validar que la sesión exista y esté activa según open/close
        const [srows] = await db.query(`SELECT * FROM attendance_sessions WHERE session_id = ?`, [sessionId]);
        if(srows.length === 0) return { error: 'Sesión no encontrada.' };
        const s = srows[0];
        const now = new Date();
        if(s.open_date && s.close_date){
            const open = new Date(s.open_date);
            const close = new Date(s.close_date);
            if(now < open || now > close) return { error: 'La sesión no está activa en este momento.' };
        }
        // marca 'present' y set marked_at
        const [rows] = await db.query(`SELECT * FROM attendance_records WHERE session_id = ? AND student_user_id = ?`, [sessionId, studentId]);
        if(rows.length === 0) return { error: 'Registro no encontrado para ese estudiante y sesión.' };
        const [res] = await db.query(`UPDATE attendance_records SET status = 'present', marked_at = NOW() WHERE session_id = ? AND student_user_id = ?`, [sessionId, studentId]);
        if(res.affectedRows === 0) return { error: 'No se pudo actualizar el registro.' };
        const [updated] = await db.query(`SELECT ar.*, CONCAT(u.first_name,' ',u.last_name) AS student_name FROM attendance_records ar JOIN users u ON ar.student_user_id = u.user_id WHERE ar.session_id = ? AND ar.student_user_id = ?`, [sessionId, studentId]);
        return { message: 'Registro actualizado.', record: updated[0] };
    }

    static async exportSessionCSV(sessionId){
        const { records } = await this.getRecords(sessionId);
        const rows = records || [];
        let csv = 'ID,Nombre,Estado,FechaRegistro\n';
        rows.forEach(r => {
            csv += `${r.student_user_id},"${r.student_name.replace(/"/g,'""')}",${r.status},${r.marked_at || ''}\n`;
        });
        return csv;
    }

    static async listSessions(sectionId){
        if(!sectionId) return { error: 'No se proporcionó el ID de la sección.' };
        try{
            // Try to select frequency if the column exists, otherwise fall back to older schema
            try{
                const [sessions] = await db.query(`SELECT s.session_id, s.assignment_id, s.week_number, s.open_date, s.close_date, s.frequency, s.created_at FROM attendance_sessions s JOIN teacher_assignments ta ON s.assignment_id = ta.assignment_id WHERE ta.section_id = ? ORDER BY s.created_at DESC`, [sectionId]);
                if(sessions.length === 0) return { message: 'No hay sesiones registradas.', sessions: [] };
                return { message: `Se encontraron ${sessions.length} sesiones.`, sessions };
            }catch(e){
                if(e && e.code === 'ER_BAD_FIELD_ERROR'){
                    const [sessions] = await db.query(`SELECT s.session_id, s.assignment_id, s.week_number, s.open_date, s.close_date, s.created_at FROM attendance_sessions s JOIN teacher_assignments ta ON s.assignment_id = ta.assignment_id WHERE ta.section_id = ? ORDER BY s.created_at DESC`, [sectionId]);
                    if(sessions.length === 0) return { message: 'No hay sesiones registradas.', sessions: [] };
                    // default frequency to 'weekly' for older rows
                    sessions.forEach(x => { x.frequency = 'weekly'; });
                    return { message: `Se encontraron ${sessions.length} sesiones.`, sessions };
                }
                throw e;
            }
        }catch(e){
            if(e && (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_FIELD_ERROR')){
                return { error: `La base de datos no parece tener las migraciones de asistencia aplicadas (${e.code}). Por favor ejecute "backend/resources/attendance.sql".` };
            }
            throw e;
        }
    }

    static async getSectionReport(sectionId, { from, to } = {}){
        if(!sectionId) return { error: 'No se proporcionó el ID de la sección.' };
        // Obtenemos sesiones para asignaciones de esa sección en el rango (si aplica)
        let sql = `SELECT s.session_id, s.assignment_id, s.open_date FROM attendance_sessions s JOIN teacher_assignments ta ON s.assignment_id = ta.assignment_id WHERE ta.section_id = ?`;
        const params = [sectionId];
        if(from) { sql += ' AND s.open_date >= ?'; params.push(from); }
        if(to) { sql += ' AND s.open_date <= ?'; params.push(to); }
        const [sessions] = await db.query(sql, params);
        // Si no hay sesiones devolvemos empty
        if(sessions.length === 0) return { message: 'No hay sesiones en el periodo.', report: [] };
        // Para cada estudiante in section, calcular porcentaje de faltas
        const [students] = await db.query(`SELECT u.user_id, CONCAT(u.first_name,' ',u.last_name) AS student_name FROM enrollments e JOIN users u ON e.student_user_id = u.user_id WHERE e.section_id = ?`, [sectionId]);
        const report = [];
        for(const st of students){
            // contar present vs total sessions
            const [countPresent] = await db.query(`SELECT COUNT(*) as presente FROM attendance_records ar JOIN attendance_sessions s ON ar.session_id = s.session_id WHERE ar.student_user_id = ? AND ar.status = 'present' AND s.assignment_id IN (SELECT assignment_id FROM teacher_assignments WHERE section_id = ?)`, [st.user_id, sectionId]);
            const presente = countPresent[0]?.presente || 0;
            const total = sessions.length;
            const absences = total - presente;
            const absencePercentage = total === 0 ? 0 : Math.round((absences / total) * 100);
            report.push({ user_id: st.user_id, student_name: st.student_name, sessions: total, presents: presente, absences, absencePercentage });
        }
        return { message: 'Reporte generado.', report };
    }

    static async getStudentAttendance(studentId, { from, to } = {}){
        if(!studentId) return { error: 'No se proporcionó el ID del estudiante.' };
        // Try to include frequency if available
        try{
            let sql = `SELECT s.session_id, s.week_number, s.open_date, s.close_date, s.frequency, ar.status, ar.marked_at, ta.assignment_id FROM attendance_records ar JOIN attendance_sessions s ON ar.session_id = s.session_id JOIN teacher_assignments ta ON s.assignment_id = ta.assignment_id WHERE ar.student_user_id = ?`;
            const params = [studentId];
            if(from){ sql += ' AND s.open_date >= ?'; params.push(from); }
            if(to){ sql += ' AND s.open_date <= ?'; params.push(to); }
            const [rows] = await db.query(sql, params);
            return { message: `Se encontraron ${rows.length} registros.`, records: rows };
        }catch(e){
            if(e && e.code === 'ER_BAD_FIELD_ERROR'){
                let sql = `SELECT s.session_id, s.week_number, s.open_date, s.close_date, ar.status, ar.marked_at, ta.assignment_id FROM attendance_records ar JOIN attendance_sessions s ON ar.session_id = s.session_id JOIN teacher_assignments ta ON s.assignment_id = ta.assignment_id WHERE ar.student_user_id = ?`;
                const params = [studentId];
                if(from){ sql += ' AND s.open_date >= ?'; params.push(from); }
                if(to){ sql += ' AND s.open_date <= ?'; params.push(to); }
                const [rows] = await db.query(sql, params);
                // default frequency to weekly
                rows.forEach(x => { x.frequency = 'weekly'; });
                return { message: `Se encontraron ${rows.length} registros.`, records: rows };
            }
            throw e;
        }
    }
}