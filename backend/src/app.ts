import mongoose from 'mongoose';
import config from './config';
import { taskQueue } from './queue/taskQueue'; // Import to ensure queue connection is established

export const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('MongoDB connected successfully.');
    } catch (err: any) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process on failure
    }
};

// You might initialize the queue connection here as well,
// although BullMQ handles connection internally when Queue/Worker instances are created.
// const setupQueue = async () => {
//   // Ensure queue is connected (BullMQ does this automatically)
//   console.log('BullMQ queue initialized.');
// };

export const initializeApp = async () => {
    await connectDB();
    // await setupQueue();
    console.log('Application initialized.');
};