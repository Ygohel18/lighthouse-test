// app/tasks/[taskId]/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getTask } from '@/lib/api';
import { FrontendTask } from '@/types';
import { TaskDetailView } from '@/components/task-detail-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation'; // To get taskId from URL
import { Badge } from '@/components/ui/badge';

export default function TaskDetailPage() {
    const params = useParams();
    const taskId = params.taskId as string; // Get taskId from the URL

    // Fetch the specific task
    const { data: task, isLoading, error } = useQuery<FrontendTask>({
        queryKey: ['task', taskId], // Query key includes taskId
        queryFn: () => getTask(taskId),
        refetchInterval: (data) => (data?.status === 'running' ? 3000 : false), // Poll if status is 'running'
    });

    if (isLoading) {
        return <div className="container mx-auto py-8">Loading task...</div>;
    }

    if (error) {
        return <div className="container mx-auto py-8 text-red-500">Error loading task: {error.message}</div>;
    }

    if (!task) {
        return <div className="container mx-auto py-8">Task not found.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Task Details: {task.taskId}</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Task Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <p><strong>URL:</strong> {task.url}</p>
                    <p><strong>Status:</strong> <Badge variant={
                        task.status === 'completed' ? 'default' :
                            task.status === 'running' ? 'secondary' :
                                task.status === 'error' ? 'destructive' : 'outline'
                    }>{task.status}</Badge></p>
                    <p><strong>Created At:</strong> {new Date(task.createdAt).toLocaleString()}</p>
                </CardContent>
            </Card>

            <Separator className="my-8" />

            <TaskDetailView task={task} />
        </div>
    );
}