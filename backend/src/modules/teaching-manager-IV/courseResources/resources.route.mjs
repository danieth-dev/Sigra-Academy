import { Router } from "express";
import { ResourceController } from "./resources.controller.mjs";
import { ResourceModel } from "./resources.model.mjs";
import { resourceUploadMiddleware } from "../../../api/middlewares/multer.middleware.mjs";

const router = Router();
const controller = new ResourceController({ResourceModel: ResourceModel});

// Rutas relacionadas a los recursos de curso
// Ruta para obtener todos los recursos de una asignación
router.get('/assignments/:assignmentId/resources', controller.getResourcesByAssignment);
// Ruta para obtener un recurso por su ID
router.get('/resource/:resourceId', controller.getResourceById);
// Ruta para crear un nuevo recurso
router.post('/create', resourceUploadMiddleware, controller.createResource);
// Ruta para actualizar un recurso existente
router.patch('/update/:resourceId', resourceUploadMiddleware, controller.updateResource);
// Ruta para eliminar un recurso
router.delete('/delete/:resourceId', controller.deleteResource);

export const ResourceRoute = router;