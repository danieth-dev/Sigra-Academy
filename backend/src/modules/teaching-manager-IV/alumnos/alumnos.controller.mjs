import { AlumnosModel } from './alumnos.model.mjs';
import { validateGetStudentsQuery, validateTeacherIdParam } from './alumnos.schema.mjs';
import ExcelJS from 'exceljs';

export class AlumnosController {
    // GET /sections/:sectionId/students
    static async getStudentsBySection(req, res){
        const { sectionId } = req.params;
        const validation = validateGetStudentsQuery(req.query);
        try{
            if(!validation.success) return res.status(400).json({ error: 'Parámetros inválidos', details: validation.error });
            const { teacherId, q, orderBy, order, limit, offset } = validation.data;
            if(!teacherId) return res.status(400).json({ error: 'Se requiere teacherId en query (ej. ?teacherId=2) para validar permisos.' });
            // validar permiso
            const allowed = await AlumnosModel.isTeacherAssignedToSection(teacherId, sectionId);
            if(!allowed) return res.status(403).json({ error: 'No autorizado: el profesor no está asignado a esta sección.' });
            const result = await AlumnosModel.getStudentsBySection(sectionId, { q, orderBy, order, limit: limit || 100, offset: offset || 0 });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error en AlumnosController.getStudentsBySection:', e);
            return res.status(500).json({ error: 'Error al obtener estudiantes.' });
        }
    }

    // GET /sections/:sectionId/students/export
    static async exportStudentsBySection(req, res){
        const { sectionId } = req.params;
        const validation = validateGetStudentsQuery(req.query);
        try{
            if(!validation.success) return res.status(400).json({ error: 'Parámetros inválidos', details: validation.error });
            const { teacherId, q, orderBy, order } = validation.data;
            if(!teacherId) return res.status(400).json({ error: 'Se requiere teacherId en query para validar permisos.' });
            const allowed = await AlumnosModel.isTeacherAssignedToSection(teacherId, sectionId);
            if(!allowed) return res.status(403).json({ error: 'No autorizado: el profesor no está asignado a esta sección.' });
            const result = await AlumnosModel.getStudentsBySection(sectionId, { q, orderBy, order, limit: 100000, offset: 0 });
            const rows = result.students || [];
            const sectionName = await AlumnosModel.getSectionName(sectionId) || '';

            const filenameSafe = sectionName ? sectionName.replace(/[^a-z0-9\-_.]/gi, '_') : String(sectionId);
            const format = (req.query.format || 'csv').toLowerCase();

            // XLSX export
            if(format === 'xlsx'){
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('Alumnos');
                sheet.columns = [
                    { header: 'ID', key: 'user_id', width: 10 },
                    { header: 'Nombre', key: 'nombre', width: 40 },
                    { header: 'Email', key: 'email', width: 30 },
                    { header: 'EnrollmentID', key: 'enrollment_id', width: 18 },
                    { header: 'Sección', key: 'seccion', width: 30 },
                ];

                // add rows
                rows.forEach(r => {
                    sheet.addRow({ user_id: r.user_id, nombre: r.nombre || '', email: r.email || '', enrollment_id: r.enrollment_id || '', seccion: sectionName });
                });

                // style header
                sheet.getRow(1).font = { bold: true };
                sheet.autoFilter = 'A1:E1';

                const buffer = await workbook.xlsx.writeBuffer();
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="alumnos_${filenameSafe}.xlsx"`);
                return res.status(200).send(Buffer.from(buffer));
            }

            // Fallback: Build CSV with BOM and 'Sección' column
            const BOM = '\uFEFF';
            const escapeCell = (v) => `"${String(v || '').replace(/"/g,'""')}"`;
            const headers = ['ID','Nombre','Email','EnrollmentID','Sección'];
            let csvRows = [];
            csvRows.push(headers.map(h => escapeCell(h)).join(','));
            rows.forEach(r => {
                const line = [r.user_id, r.nombre || '', r.email || '', r.enrollment_id || '', sectionName].map(c => escapeCell(c)).join(',');
                csvRows.push(line);
            });
            const csvString = BOM + csvRows.join('\r\n');

            const buf = Buffer.from(csvString, 'utf8');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="alumnos_${filenameSafe}.csv"`);
            return res.status(200).send(buf);
        }catch(e){
            console.error('Error en AlumnosController.exportStudentsBySection:', e);
            return res.status(500).json({ error: 'Error al exportar estudiantes.' });
        }
    }

    // GET /teacher/:teacherId/sections
    static async getSectionsByTeacher(req, res){
        const { teacherId } = req.params;
        const validation = validateTeacherIdParam({ teacherId });
        try{
            if(!validation.success) return res.status(400).json({ error: 'Parámetros inválidos', details: validation.error });
            const result = await AlumnosModel.getSectionsByTeacher(validation.data.teacherId);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){
            console.error('Error en AlumnosController.getSectionsByTeacher:', e);
            return res.status(500).json({ error: 'Error al obtener secciones.' });
        }
    }
}