import { TaskRepository } from '../storage/taskRepository';
import { Task, CreateTaskRequest, TestConfiguration } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addTaskToQueue } from '../queue/taskQueue';
import { deleteMultipleFilesFromS3 } from './s3Service';
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

    async deleteTask(taskId: string): Promise<boolean> {
        // First, get the task to find all S3 object keys
        const task = await taskRepository.getTaskById(taskId);
        
        if (!task) {
            return false;
        }

        // Collect all S3 object keys from the task results
        const s3ObjectKeys: string[] = [];
        
        for (const result of task.results) {
            if (result.report && result.report.audits) {
                const screenshotAudits = ['screenshot-thumbnails', 'final-screenshot'];
                
                for (const auditName of screenshotAudits) {
                    const audit = result.report.audits[auditName];
                    
                    if (audit && audit.details) {
                        // Handle filmstrip (screenshot-thumbnails)
                        if ((audit.details as any).type === 'filmstrip' && (audit.details as any).items) {
                            for (const item of (audit.details as any).items) {
                                if (item && (item as any).s3ObjectKey) {
                                    s3ObjectKeys.push((item as any).s3ObjectKey);
                                }
                            }
                        } 
                        // Handle single thumbnail (final-screenshot)
                        else if ((audit.details as any).type === 'thumbnail' && (audit.details as any).s3ObjectKey) {
                            s3ObjectKeys.push((audit.details as any).s3ObjectKey);
                        }
                    }
                }
            }
        }

        // Delete S3 objects if any exist
        if (s3ObjectKeys.length > 0) {
            try {
                console.log(`Deleting ${s3ObjectKeys.length} S3 objects for task ${taskId}`);
                await deleteMultipleFilesFromS3(s3ObjectKeys);
                console.log(`Successfully deleted S3 objects for task ${taskId}`);
            } catch (error) {
                console.error(`Error deleting S3 objects for task ${taskId}:`, error);
                // Continue with task deletion even if S3 deletion fails
            }
        }

        // Delete the task from the database
        return taskRepository.deleteTask(taskId);
    }

    // Methods to handle status updates and results are now primarily in TaskRepository
    // and called by the worker/lighthouseService.
    // This service layer could orchestrate more complex workflows if needed.
}