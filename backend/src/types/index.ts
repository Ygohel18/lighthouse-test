// src/types/index.ts
import { Result } from 'lighthouse';

// Define possible test configurations
export type DeviceType = 'mobile' | 'desktop';
export type BrowserType = 'Chrome' | 'Firefox'; // Puppeteer primarily supports Chrome/Chromium
export type Location = string; // e.g., 'us-east-1', 'eu-west-2'

export interface TestConfiguration {
    device: DeviceType;
    browser: BrowserType; // Note: Puppeteer primarily supports Chrome/Chromium
    location: Location; // This implies external handling (proxy, geo-server)
}

// Structure for partial/final results for a specific config
export interface LighthouseResultPartial {
    config: TestConfiguration;
    status: 'pending' | 'running' | 'completed' | 'error';
    score?: number; // Overall performance score (0-100)
    metrics?: { // Key metrics extracted from the report
        firstContentfulPaint?: number; // ms
        largestContentfulPaint?: number; // ms
        cumulativeLayoutShift?: number; // score
        totalBlockingTime?: number; // ms
        speedIndex?: number; // ms
        interactive?: number; // ms (TTI)
    };
    // Store the FULL report JSON. Screenshot data will be replaced by object keys/URLs.
    report?: Result;
    errorMessage?: string;
    timestamp: Date;
}

// Full Task structure
export interface Task {
    taskId: string; // Unique ID for API/queue
    url: string;
    createdAt: Date;
    status: 'queued' | 'running' | 'completed' | 'error';
    results: LighthouseResultPartial[]; // Array of results for each config
    plannedConfigs?: TestConfiguration[];
}

// API Request Body for POST /tasks
export interface CreateTaskRequest {
    url: string;
    configs?: TestConfiguration[];
}