// src/worker/taskWorker.ts
import { Worker, Job } from 'bullmq';
import config from '../config';
import { runAllAuditsForTask } from '../services/lighthouseService';
import { TaskRepository } from '../storage/taskRepository';
import mongoose from 'mongoose'; // Import mongoose for DB connection

const taskRepository = new TaskRepository();

const connection = {
    host: config.redis.host,
    port: config.redis.port,
};

// Database Connection (Worker also needs DB access)
const connectDB = async () => {
    try {
        // Use a different connection name if running API and Worker in same process
        // or if you need separate connection pools. For simplicity here, we reuse.
        await mongoose.connect(config.mongoUri);
        console.log('Worker MongoDB connected successfully.');
    } catch (err: any) {
        console.error('Worker MongoDB connection error:', err);
        process.exit(1); // Exit process on failure
    }
};


// Define the worker
const worker = new Worker('lighthouseTasks', async (job: Job) => {
    const { taskId } = job.data;
    console.log(`Worker processing job for task: ${taskId}`);

    try {
        // Fetch task details from DB
        const task = await taskRepository.getTaskById(taskId);

        if (!task) {
            console.error(`Task ${taskId} not found in DB.`);
            // Mark job as failed? Or just log and move on?
            throw new Error(`Task ${taskId} not found.`);
        }

        if (task.status !== 'queued' && task.status !== 'running') {
            console.warn(`Task ${taskId} is not in 'queued' or 'running' status (${task.status}). Skipping.`);
            return; // Don't re-process if already completed/errored
        }

        // Run the audits for this task
        // The lighthouseService handles updating partial/final results in the DB
        await runAllAuditsForTask(task.taskId, task.url, task.plannedConfigs || config.defaultTestConfigs);

        console.log(`Worker finished job for task: ${taskId}`);

    } catch (error: any) {
        console.error(`Worker failed processing task ${taskId}:`, error);
        // Update task status to error if a fatal worker error occurred
        // (Note: runAllAuditsForTask also handles errors internally)
        try {
            await taskRepository.updateTaskStatus(taskId, 'error');
            // Update any remaining pending/running partial results to error as well
            const taskAfterError = await taskRepository.getTaskById(taskId);
            if (taskAfterError) {
                for (const result of taskAfterError.results) {
                    if (result.status === 'pending' || result.status === 'running') {
                        await taskRepository.updatePartialResultStatus(taskId, result.config, 'error', { errorMessage: `Worker failed: ${error.message || 'Unknown error'}` });
                    }
                }
            }
        } catch (dbError) {
            console.error(`Failed to update task ${taskId} status to error after worker failure:`, dbError);
        }
        throw error; // Re-throw to allow BullMQ to handle retries
    }
}, { connection });

worker.on('completed', (job) => {
    console.log(`Job ${job.id} for task ${job.data.taskId} completed.`);
});

worker.on('failed', (job, err) => {
    // Add check for job being defined
    if (job) {
        console.error(`Job ${job.id} for task ${job.data.taskId} failed with error: ${err.message}`);
    } else {
        console.error(`Worker job failed with error (job object undefined): ${err.message}`);
    }
});

worker.on('error', (err) => {
    console.error('Worker error:', err);
});

// Connect to DB and start the worker
const startWorker = async () => {
    await connectDB();
    console.log('Lighthouse worker started.');
};

startWorker();