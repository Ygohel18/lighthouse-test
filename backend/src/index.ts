import { initializeApp } from './app';
import config from './config';

// This file can be used to start different parts of the application
// based on environment variables or command line arguments.

const start = async () => {
    await initializeApp(); // Connect to DB etc.

    // Example: Start API server
    // Note: In production, you'd typically run API and Worker as separate processes.
    // require('./api/server'); // This file starts the Express server

    // Example: Start Worker
    // require('./worker/taskWorker'); // This file starts the BullMQ worker

    console.log('Application entry point reached. Choose to start API or Worker.');
    console.log(`API: node dist/api/server.js`);
    console.log(`Worker: node dist/worker/taskWorker.js`);
};

start();