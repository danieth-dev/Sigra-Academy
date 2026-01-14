import { Router } from 'express';
import { AssignmentsController } from './asignaciones.controller.mjs';
import { AssignmentsModel, ActivitiesModel, SubmissionsModel } from './asignaciones.model.mjs';
import { uploadSingle } from '../../../api/middlewares/multer.middleware.mjs';

const router = Router();
const controller = new AssignmentsController({ ModelAssignments: AssignmentsModel, ModelActivities: ActivitiesModel, ModelSubmissions: SubmissionsModel });

// ASSIGNMENTS
router.get('/all', controller.getAll);
router.get('/teacher/:teacherId', controller.getByTeacher);
router.post('/', controller.create);
router.put('/:assignmentId', controller.update);
router.delete('/:assignmentId', controller.delete);

// ACTIVITIES
router.get('/assignment/:assignmentId/activities', controller.getActivitiesByAssignment);
router.get('/activities-all', controller.getAllActivities);
router.post('/activities', controller.createActivity);
router.get('/activities/:activityId', controller.getActivityById);
router.put('/activities/:activityId', controller.updateActivity);
router.delete('/activities/:activityId', controller.deleteActivity);

// SUBMISSIONS
router.post('/submissions', uploadSingle('file'), controller.createSubmission);
router.put('/submissions/:submissionId', uploadSingle('file'), controller.updateSubmission);
router.get('/activity/:activityId/submissions', controller.getSubmissionsByActivity);
router.get('/student/:studentId/submissions', controller.getSubmissionsByStudent);
router.get('/submissions/:submissionId', controller.getSubmissionById);
router.delete('/submissions/:submissionId', controller.deleteSubmission);

// STUDENTS / ASSIGNMENTS helpers
router.get('/assignment/:assignmentId/students', controller.getStudentsByAssignment);
router.get('/student/:studentId/assignments', controller.getAssignmentsByStudent);

// Mover ruta genérica /:assignmentId al final para no capturar rutas con prefijos específicos
router.get('/:assignmentId', controller.getById);

export const AsignacionesRoutes = router;