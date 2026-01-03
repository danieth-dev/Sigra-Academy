import {Router} from 'express';
import managerRoutes from '../../modules/academic-manager-III/manager.route.mjs'

const router = Router();

router.use('/academic-manager', managerRoutes)

// Definir todas las rutas de los modulos aquí
export const ListRoutes = {
    academicManager: '/academic-manager',
}

export default router