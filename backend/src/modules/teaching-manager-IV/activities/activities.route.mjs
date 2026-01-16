import {Router} from 'express';
import { ActivitiesController } from './activities.controller.mjs';
import { ActivitiesModel } from './activities.model.mjs';

const router = Router();
const controller = new ActivitiesController({ActivitiesModel});

// Rutas relacionadas a las actividades
// Ruta para obtener todas las actividades de una asignación
router.get('/assignments/:assignmentId/activities', controller.getActivitiesByAssignment);
// Ruta para obtener una actividad por su ID
router.get('/activity/:activityId', controller.getActivityById);
// Ruta para cambiar la visibilidad de una actividad
router.patch('/activity/:activityId/visibility', controller.toggleActivityVisibility);
// Ruta para crear una nueva actividad
router.post('/create', controller.createActivity);
// Ruta para actualizar una actividad existente
router.patch('/update/:activityId', controller.updateActivity);
// Ruta para eliminar una actividad
router.delete('/delete/:activityId', controller.deleteActivity);

export const ActivitiesRoute = router;