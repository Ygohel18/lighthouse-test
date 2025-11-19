import { TaskModel, TaskDocument } from './models/TaskModel';
import { Task, LighthouseResultPartial, TestConfiguration } from '../types';
import mongoose from 'mongoose';

export class TaskRepository {
    async createTask(url: string, taskId: string, plannedConfigs: TestConfiguration[]): Promise<Task> {
        const newTask = new TaskModel({
            taskId,
            url,
            createdAt: new Date(),
            status: 'queued',
            results: [],
            plannedConfigs,
        });
        const savedTask = await newTask.save();
        return savedTask.toJSON() as Task; // Convert Mongoose doc to plain object
    }

    async getTaskById(taskId: string): Promise<Task | null> {
        const task = await TaskModel.findOne({ taskId }).lean(); // Use .lean() for plain objects
        return task as Task | null;
    }

    async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
        await TaskModel.updateOne({ taskId }, { $set: { status } });
    }

    async addPartialResult(taskId: string, result: LighthouseResultPartial): Promise<void> {
        await TaskModel.updateOne(
            { taskId },
            {
                $push: { results: result },
                // Optionally update status if this is the first result or final result
                // $set: { status: 'running' } // Could set to running on first result
            }
        );
    }

    async getRecentTasks(limit: number = 100): Promise<Task[]> {
        const tasks = await TaskModel.find().sort({ createdAt: -1 }).limit(limit).lean();
        return tasks as Task[];
    }

    // Helper to initialize partial results with 'pending' status
    async initializePartialResults(taskId: string, configs: TestConfiguration[]): Promise<void> {
        const initialResults: LighthouseResultPartial[] = configs.map(config => ({
            config,
            status: 'pending',
            timestamp: new Date(),
        }));
        await TaskModel.updateOne(
            { taskId },
            { $set: { results: initialResults, plannedConfigs: configs } }
        );
    }

    // Update status for a specific partial result
    async updatePartialResultStatus(taskId: string, config: TestConfiguration, status: LighthouseResultPartial['status'], data?: Partial<Omit<LighthouseResultPartial, 'config' | 'status'>>): Promise<void> {
        const update: any = {
            $set: {
                'results.$[elem].status': status,
                'results.$[elem].timestamp': new Date(), // Update timestamp on status change
            }
        };
        if (data) {
            // Merge data fields into the update
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    update.$set[`results.$[elem].${key}`] = (data as any)[key];
                }
            }
        }

        await TaskModel.updateOne(
            { taskId },
            update,
            {
                arrayFilters: [{
                    'elem.config.device': config.device,
                    'elem.config.browser': config.browser,
                    'elem.config.location': config.location,
                }]
            }
        );
    }

    // Delete a task by taskId
    async deleteTask(taskId: string): Promise<boolean> {
        const result = await TaskModel.deleteOne({ taskId });
        return result.deletedCount > 0;
    }
}