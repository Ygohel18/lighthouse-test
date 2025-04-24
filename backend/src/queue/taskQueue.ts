import { Queue, QueueOptions } from 'bullmq';
import config from '../config';

const connection = {
    host: config.redis.host,
    port: config.redis.port,
};

const queueOptions: QueueOptions = {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs
        backoff: {
            type: 'exponential',
            delay: 1000, // Start with 1 second delay
        },
    },
};

export const taskQueue = new Queue('lighthouseTasks', queueOptions);

export const addTaskToQueue = async (taskId: string) => {
    await taskQueue.add('runAudit', { taskId });
    console.log(`Task ${taskId} added to queue.`);
};