import express from 'express';
import taskRoutes from './routes/taskRoutes';
import config from '../config';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/tasks', taskRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('MongoDB connected successfully.');
    } catch (err: any) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Start server
const startServer = async () => {
    await connectDB();
    app.listen(config.port, "0.0.0.0", () => {
        console.log(`API Server listening on port ${config.port}`);
    });
};

startServer();

export default app;
