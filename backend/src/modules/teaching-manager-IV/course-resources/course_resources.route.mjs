import { Router } from 'express';
import { CourseResourcesController } from './course_resources.controller.mjs';
import { CourseResourcesModel } from './course_resources.model.mjs';
import { uploadSingle, useResourcesUpload } from '../../../api/middlewares/multer.middleware.mjs';

const router = Router();
const controller = new CourseResourcesController({ ModelResources: CourseResourcesModel });

router.post('/resources', useResourcesUpload, uploadSingle('file'), controller.create);
router.get('/resources/assignment/:assignmentId', controller.getByAssignment);
router.get('/resources/:resourceId', controller.getById);
router.put('/resources/:resourceId', useResourcesUpload, uploadSingle('file'), controller.update);
router.delete('/resources/:resourceId', controller.delete);

export const CourseResourcesRoutes = router;