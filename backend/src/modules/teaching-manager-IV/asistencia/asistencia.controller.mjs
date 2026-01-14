import { AsistenciaModel } from './asistencia.model.mjs';
import { validateCreateSession, validateMark, validateReportQuery } from './asistencia.schema.mjs';
import ExcelJS from 'exceljs';

export class AsistenciaController {
    static async createSession(req, res){
        try{
            const validation = validateCreateSession(req.body);
            if(!validation.success) return res.status(400).json({ error: 'Datos inválidos', details: validation.error });
            const result = await AsistenciaModel.createSession(validation.data);
            if(result.error) return res.status(400).json({ error: result.error });
            try{ const { notify } = await import('../../../api/notifications/notifications.service.mjs'); notify('attendance_created', { session: result.session, records: result.records }); }catch(e){ /* don't block */ }
            return res.status(201).json(result);
        }catch(e){
            console.error('Error creando sesión:', e);
            return res.status(500).json({ error: 'Error al crear sesión.' });
        }
    }

    static async markPresent(req, res){
        const { sessionId } = req.params;
        const validation = validateMark(req.body);
        try{
            if(!validation.success) return res.status(400).json({ error: 'Datos inválidos', details: validation.error });
            const result = await AsistenciaModel.markPresent(sessionId, validation.data.student_user_id);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error marcando presente:', e);
            return res.status(500).json({ error: 'Error al marcar asistencia.' });
        }
    }

    static async getRecords(req, res){
        const { sessionId } = req.params;
        try{
            const result = await AsistenciaModel.getRecords(sessionId);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error obteniendo registros:', e);
            return res.status(500).json({ error: 'Error al obtener registros.' });
        }
    }

    static async exportSession(req, res){
        const { sessionId } = req.params;
        const format = (req.query.format || 'csv').toLowerCase();
        try{
            const { records } = await AsistenciaModel.getRecords(sessionId);
            const rows = records || [];

            if(format === 'xlsx'){
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('Sesión');
                sheet.columns = [
                    { header: 'RecordID', key: 'record_id', width: 12 },
                    { header: 'Alumno ID', key: 'student_user_id', width: 12 },
                    { header: 'Alumno', key: 'student_name', width: 30 },
                    { header: 'Estado', key: 'status', width: 12 },
                    { header: 'Marcado En', key: 'marked_at', width: 24 },
                ];

                rows.forEach(r => sheet.addRow({ record_id: r.record_id, student_user_id: r.student_user_id, student_name: r.student_name, status: r.status, marked_at: r.marked_at }));
                sheet.getRow(1).font = { bold: true };
                sheet.autoFilter = 'A1:E1';

                const buffer = await workbook.xlsx.writeBuffer();
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="attendance_session_${sessionId}.xlsx"`);
                return res.status(200).send(Buffer.from(buffer));
            }

            // fallback CSV
            const csv = await AsistenciaModel.exportSessionCSV(sessionId);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_session_${sessionId}.csv"`);
            return res.status(200).send(csv);
        }catch(e){
            console.error('Error exportando sesión:', e);
            return res.status(500).json({ error: 'Error al exportar sesión.' });
        }
    }

    // Listar sesiones por sección (reciente primero)
    static async listSessions(req, res){
        const { sectionId } = req.params;
        try{
            const result = await AsistenciaModel.listSessions(sectionId);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error listando sesiones:', e);
            return res.status(500).json({ error: 'Error al listar sesiones.' });
        }
    }

    static async sectionReport(req, res){
        const { sectionId } = req.params;
        const validation = validateReportQuery(req.query);
        try{
            if(!validation.success) return res.status(400).json({ error: 'Query inválida', details: validation.error });
            const result = await AsistenciaModel.getSectionReport(sectionId, validation.data);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error generando reporte de sección:', e);
            return res.status(500).json({ error: 'Error en reporte de sección.' });
        }
    }

    static async exportSectionReport(req, res){
        const { sectionId } = req.params;
        const validation = validateReportQuery(req.query);
        const format = (req.query.format || 'csv').toLowerCase();
        try{
            if(!validation.success) return res.status(400).json({ error: 'Query inválida', details: validation.error });
            const result = await AsistenciaModel.getSectionReport(sectionId, validation.data);
            if(result.error) return res.status(400).json({ error: result.error });
            const rows = result.report || [];

            if(format === 'xlsx'){
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('Reporte Asistencia');
                sheet.columns = [
                    { header: 'Alumno ID', key: 'user_id', width: 12 },
                    { header: 'Alumno', key: 'student_name', width: 30 },
                    { header: 'Sesiones', key: 'sessions', width: 10 },
                    { header: 'Presencias', key: 'presents', width: 12 },
                    { header: 'Ausencias', key: 'absences', width: 10 },
                    { header: '% Ausencia', key: 'absencePercentage', width: 12 },
                ];
                rows.forEach(r => sheet.addRow(r));
                sheet.getRow(1).font = { bold: true };
                sheet.autoFilter = 'A1:F1';
                const buffer = await workbook.xlsx.writeBuffer();
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="attendance_report_section_${sectionId}.xlsx"`);
                return res.status(200).send(Buffer.from(buffer));
            }

            // fallback to CSV
            let csv = 'Alumno ID,Alumno,Sesiones,Presencias,Ausencias,%Ausencia\n';
            rows.forEach(r => { csv += `${r.user_id},"${String(r.student_name || '').replace(/"/g,'""')}",${r.sessions},${r.presents},${r.absences},${r.absencePercentage}\n`; });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_report_section_${sectionId}.csv"`);
            return res.status(200).send(csv);
        }catch(e){
            console.error('Error exportando reporte de sección:', e);
            return res.status(500).json({ error: 'Error exportando reporte de sección.' });
        }
    }

    static async studentReport(req, res){
        const { studentId } = req.params;
        const validation = validateReportQuery(req.query);
        try{
            if(!validation.success) return res.status(400).json({ error: 'Query inválida', details: validation.error });
            const result = await AsistenciaModel.getStudentAttendance(studentId, validation.data);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error generando reporte de estudiante:', e);
            return res.status(500).json({ error: 'Error en reporte de estudiante.' });
        }
    }
}