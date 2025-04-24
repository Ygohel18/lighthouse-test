// lib/api.ts
import { FrontendTask, CreateTaskRequest } from '@/types'; // Use frontend types

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; // Default or from .env.local

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