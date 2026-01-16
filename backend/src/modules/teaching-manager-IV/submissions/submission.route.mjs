import {Router} from "express";
import { SubmissionController } from './submission.controller.mjs';
import { SubmissionModel } from './submission.model.mjs';
import { submissionUploadMiddleware } from "../../../api/middlewares/multer.middleware.mjs";
const router = Router();
const controller = new SubmissionController({SubmissionModel: SubmissionModel});

// Rutas relacionadas a las entregas
// Ruta para obtener todas las entregas de una actividad
router.get('/activities/:activityId/submissions', controller.getSubmissionByActivityId);
// Ruta para obtener una entrega por su ID
router.get('/submission/:submissionId', controller.getSubmissionById);
// Ruta para obtener todas las entregas de un estudiante
router.get('/students/:studentUserId/submissions', controller.getSubmissionByUserId);
// Ruta para crear una nueva entrega
router.post('/create', submissionUploadMiddleware, controller.createSubmission);
// Ruta para actualizar una entrega existente
router.patch('/update/:submissionId', submissionUploadMiddleware, controller.updateSubmission);
// Ruta para eliminar una entrega
router.delete('/delete/:submissionId', controller.deleteSubmission);

export const SubmissionRoute = router;
