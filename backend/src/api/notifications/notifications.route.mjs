import { Router } from 'express';
import { sseHandler } from './notifications.service.mjs';

const router = Router();

// SSE endpoint: clients open EventSource to receive events
router.get('/stream', (req, res) => sseHandler(req, res));

export const NotificationsRoutes = router;
