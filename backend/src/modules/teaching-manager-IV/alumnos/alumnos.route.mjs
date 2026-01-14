import { Router } from 'express';
import { AlumnosController } from './alumnos.controller.mjs';

const router = Router();

// Students by section (requires teacherId query param to validate permission)
router.get('/sections/:sectionId/students', AlumnosController.getStudentsBySection);
router.get('/sections/:sectionId/students/export', AlumnosController.exportStudentsBySection);
// Sections assigned to teacher
router.get('/teacher/:teacherId/sections', AlumnosController.getSectionsByTeacher);

export const AlumnosRoutes = router;