// lib/api.ts
import { FrontendTask, CreateTaskRequest } from '@/types'; // Use frontend types

// Get API base URL - use relative path in browser (works with nginx proxy)
// For standalone dev, set NEXT_PUBLIC_API_BASE_URL in .env.local
const getApiBaseUrl = () => {
    // In browser, check if we should use relative URLs (Docker setup)
    if (typeof window !== 'undefined') {
        // If running on localhost:3000 (standalone Next.js dev), use the env var
        if (window.location.port === '3000' && window.location.hostname === 'localhost') {
            return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        }
        // Otherwise (Docker/production), use relative path that nginx will proxy
        return '/api';
    }
    // Server-side: use env var or default
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

export const createTask = async (taskData: CreateTaskRequest): Promise<FrontendTask> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
    }

    return response.json();
};

export const getTask = async (taskId: string): Promise<FrontendTask> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Task not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch task ${taskId}`);
    }

    return response.json();
};

export const listTasks = async (): Promise<FrontendTask[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tasks');
    }

    return response.json();
};