// src/config/index.ts
import dotenv from 'dotenv';
import { TestConfiguration } from '../types';
import path from 'path';

dotenv.config();

interface S3Config {
    endpoint?: string; // Required for MinIO or other S3-compatible storage
    region: string; // e.g., 'us-east-1' or 'auto' for MinIO
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    signedUrlExpiresSeconds: number; // How long signed URLs are valid
}

interface LighthouseConfig {
    navigationTimeout: number; // Timeout for page navigation in ms
    throttlingMethod: 'simulate' | 'provided'; // How Lighthouse simulates network conditions
    // You could add more specific throttling settings here if needed
    // e.g., throttling: { cpuSlowdownMultiplier: number, downloadThroughputKbps: number, ... }
}


interface AppConfig {
    port: number;
    mongoUri: string;
    redis: {
        host: string;
        port: number;
    };
    defaultTestConfigs: TestConfiguration[];
    s3: S3Config; // Add S3 configuration
    lighthouse: LighthouseConfig; // Add Lighthouse configuration
    // proxyUrl?: string;
}

const config: AppConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/lighthouse_db',
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    defaultTestConfigs: [
        { device: 'mobile', browser: 'Chrome', location: 'us-east-1' },
        { device: 'desktop', browser: 'Chrome', location: 'us-east-1' },
        { device: 'mobile', browser: 'Chrome', location: 'eu-west-2' },
    ],
    s3: {
        endpoint: process.env.S3_ENDPOINT, // e.g., 'http://minio:9000' in Docker
        region: process.env.S3_REGION || 'us-east-1', // Use a default region
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '', // Ensure these are set in .env
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '', // Ensure these are set in .env
        bucketName: process.env.S3_BUCKET_NAME || 'lighthouse-screenshots', // Default bucket name
        signedUrlExpiresSeconds: parseInt(process.env.S3_SIGNED_URL_EXPIRES_SECONDS || '900', 10), // Default 15 minutes
    },
    lighthouse: {
        navigationTimeout: parseInt(process.env.LIGHTHOUSE_NAVIGATION_TIMEOUT || '60000', 10), // Default 60 seconds
        throttlingMethod: (process.env.LIGHTHOUSE_THROTTLING_METHOD || 'simulate') as 'simulate' | 'provided', // Default to simulate
        // Add other lighthouse options here if needed
    },
    // proxyUrl: process.env.PROXY_SERVER,
};

// Basic validation for S3 config
if (!config.s3.accessKeyId || !config.s3.secretAccessKey || !config.s3.bucketName) {
    console.error("FATAL ERROR: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET_NAME must be set in environment variables.");
    // process.exit(1); // Exit if S3 config is missing, as screenshots won't work
}


export default config;