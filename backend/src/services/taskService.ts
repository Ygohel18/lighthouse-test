import { TaskRepository } from '../storage/taskRepository';
import { Task, CreateTaskRequest, TestConfiguration } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addTaskToQueue } from '../queue/taskQueue';
import config from '../config';

const taskRepository = new TaskRepository();

export class TaskService {
    async createTask(request: CreateTaskRequest): Promise<Task> {
        const taskId = uuidv4();
        const plannedConfigs = request.configs && request.configs.length > 0
            ? request.configs
            : config.defaultTestConfigs;

        // Basic URL validation
        try {
            new URL(request.url);
        } catch (e) {
            throw new Error('Invalid URL provided.');
        }

        // Create task in DB with initial 'queued' status and planned configs
        const task = await taskRepository.createTask(request.url, taskId, plannedConfigs);

        // Add task to the queue for processing
        await addTaskToQueue(taskId);

        return task;
    }

    async getTaskById(taskId: string): Promise<Task | null> {
        return taskRepository.getTaskById(taskId);
    }

    async getRecentTasks(): Promise<Task[]> {
        return taskRepository.getRecentTasks();
    }

    // Methods to handle status updates and results are now primarily in TaskRepository
    // and called by the worker/lighthouseService.
    // This service layer could orchestrate more complex workflows if needed.
}