import { Router } from 'express';
import { createTask, getTaskById, getRecentTasks, deleteTask } from '../controllers/taskController';

const router = Router();

router.post('/', createTask);
router.get('/:taskId', getTaskById);
router.delete('/:taskId', deleteTask);
router.get('/', getRecentTasks); // Optional route

export default router;