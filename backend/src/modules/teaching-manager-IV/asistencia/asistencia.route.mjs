import { Router } from 'express';
import { AsistenciaController } from './asistencia.controller.mjs';

const router = Router();

// Create a session (body: { assignment_id, open_date, close_date, created_by })
router.post('/sessions', AsistenciaController.createSession);
// Mark present for a student (body: { student_user_id })
router.post('/sessions/:sessionId/mark', AsistenciaController.markPresent);
// Get records for a session
router.get('/sessions/:sessionId/records', AsistenciaController.getRecords);
// Export session CSV
router.get('/sessions/:sessionId/export', AsistenciaController.exportSession);
router.get('/sections/:sectionId/report/export', AsistenciaController.exportSectionReport);
// List sessions by section
router.get('/sections/:sectionId/sessions', AsistenciaController.listSessions);
// Reports
router.get('/sections/:sectionId/report', AsistenciaController.sectionReport);
router.get('/students/:studentId/report', AsistenciaController.studentReport);

export const AsistenciaRoutes = router;