// src/api/controllers/taskController.ts
import { Request, Response } from 'express';
import { TaskService } from '../../services/taskService';
import { CreateTaskRequest, Task, LighthouseResultPartial } from '../../types';
import { z } from 'zod';
// Import S3 service for signed URLs
import { getSignedS3Url } from '../../services/s3Service';

const taskService = new TaskService();

// Zod schema for validating the request body
const createTaskSchema = z.object({
    url: z.string().url({ message: "Invalid URL format" }),
    configs: z.array(z.object({
        device: z.enum(['mobile', 'desktop']),
        browser: z.enum(['Chrome', 'Firefox']),
        location: z.string().min(1),
    })).optional(),
});

export const createTask = async (req: Request, res: Response) => {
    try {
        const validationResult = createTaskSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ errors: validationResult.error.errors });
        }
        const requestBody: CreateTaskRequest = validationResult.data;

        const task = await taskService.createTask(requestBody);
        res.status(201).json(task);
    } catch (error: any) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Failed to create task', error: error.message });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId;
        const task = await taskService.getTaskById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // --- Logic to replace S3 object keys with signed URLs in the response ---
        const taskForResponse: Task = JSON.parse(JSON.stringify(task)); // Create a deep copy to modify

        for (const result of taskForResponse.results) {
            if (result.report && result.report.audits) {
                const screenshotAudits = ['screenshot-thumbnails', 'final-screenshot'];
                for (const auditName of screenshotAudits) {
                    const audit = result.report.audits[auditName];
                    if (audit && audit.details) {
                        // Handle filmstrip (screenshot-thumbnails)
                        if ((audit.details as any).type === 'filmstrip' && (audit.details as any).items) {
                            for (const item of (audit.details as any).items) {
                                // Check if the item has the s3ObjectKey we stored
                                if (item && (item as any).s3ObjectKey) {
                                    try {
                                        // Generate a signed URL for the object key
                                        const signedUrl = await getSignedS3Url((item as any).s3ObjectKey);
                                        // Replace the s3ObjectKey with the signed URL in the response object
                                        delete (item as any).s3ObjectKey; // Remove the key
                                        (item as any).url = signedUrl; // Add the signed URL (using 'url' property as expected by some LH viewers)
                                    } catch (urlError: any) {
                                        console.error(`Error generating signed URL for ${auditName} item:`, (item as any).s3ObjectKey, urlError);
                                        (item as any).errorMessage = `Failed to generate signed URL: ${urlError.message}`;
                                    }
                                }
                            }
                        } else if ((audit.details as any).type === 'thumbnail' && (audit.details as any).s3ObjectKey) {
                            // Handle single thumbnail (final-screenshot)
                            try {
                                // Generate a signed URL for the object key
                                const signedUrl = await getSignedS3Url((audit.details as any).s3ObjectKey);
                                // Replace the s3ObjectKey with the signed URL in the response object
                                delete (audit.details as any).s3ObjectKey; // Remove the key
                                (audit.details as any).url = signedUrl; // Add the signed URL
                            } catch (urlError: any) {
                                console.error(`Error generating signed URL for ${auditName}:`, (audit.details as any).s3ObjectKey, urlError);
                                (audit.details as any).errorMessage = `Failed to generate signed URL: ${urlError.message}`;
                            }
                        }
                    }
                }
            }
        }
        // --- End of signed URL generation logic ---


        res.status(200).json(taskForResponse); // Send the modified copy
    } catch (error: any) {
        console.error(`Error getting task ${req.params.taskId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve task', error: error.message });
    }
};

export const getRecentTasks = async (req: Request, res: Response) => {
    try {
        // For listing recent tasks, we typically don't need signed URLs immediately.
        // If you did, you'd apply similar logic here, but it might be slow for many tasks.
        const tasks = await taskService.getRecentTasks();
        res.status(200).json(tasks);
    } catch (error: any) {
        console.error('Error getting recent tasks:', error);
        res.status(500).json({ message: 'Failed to retrieve recent tasks', error: error.message });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId;
        const deleted = await taskService.deleteTask(taskId);

        if (!deleted) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully', taskId });
    } catch (error: any) {
        console.error(`Error deleting task ${req.params.taskId}:`, error);
        res.status(500).json({ message: 'Failed to delete task', error: error.message });
    }
};