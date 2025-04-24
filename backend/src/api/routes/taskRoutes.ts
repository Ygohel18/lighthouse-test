import { Router } from 'express';
import { createTask, getTaskById, getRecentTasks } from '../controllers/taskController';

const router = Router();

router.post('/', createTask);
router.get('/:taskId', getTaskById);
router.get('/', getRecentTasks); // Optional route

export default router;