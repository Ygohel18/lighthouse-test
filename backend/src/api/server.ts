import express from 'express';
import taskRoutes from './routes/taskRoutes';
import config from '../config';
import mongoose from 'mongoose'; // Import mongoose for DB connection
import cors from 'cors'; // Import cors

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors());

// Routes
app.use('/tasks', taskRoutes);

// Basic error handling middleware
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
        process.exit(1); // Exit process on failure
    }
};

// Start server function
const startServer = async () => {
    await connectDB(); // Connect to DB before starting server
    app.listen(config.port, () => {
        console.log(`API Server listening on port ${config.port}`);
    });
};

// Call the start function
startServer();

// Export app for testing if needed
export default app;