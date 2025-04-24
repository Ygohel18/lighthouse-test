// app/page.tsx
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, listTasks } from '@/lib/api';
import { FrontendTask } from '@/types';
import { TaskForm } from '@/components/task-form';
import { TaskList } from '@/components/task-list';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation'; // For redirection

export default function HomePage() {
	const queryClient = useQueryClient();
	const router = useRouter();

	// Fetch recent tasks
	const { data: tasks, isLoading: isLoadingTasks, error: tasksError } = useQuery<FrontendTask[]>({
		queryKey: ['tasks'],
		queryFn: listTasks,
		refetchInterval: 5000, // Poll for updates every 5 seconds
	});

	// Mutation for creating a new task
	const createTaskMutation = useMutation({
		mutationFn: createTask,
		onSuccess: (newTask) => {
			// Invalidate the tasks query to refetch the list
			queryClient.invalidateQueries({ queryKey: ['tasks'] });
			// Redirect to the new task's detail page
			router.push(`/tasks/${newTask.taskId}`);
		},
		onError: (error) => {
			console.error('Failed to create task:', error);
			// TODO: Show a user-friendly error message (e.g., using a toast notification)
		},
	});

	const handleCreateTask = async (url: string, configs?: any[]) => { // Adjust configs type if needed
		createTaskMutation.mutate({ url, configs });
	};

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-3xl font-bold mb-6">Lighthouse Performance Dashboard</h1>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Submit New Test</CardTitle>
				</CardHeader>
				<CardContent>
					<TaskForm onSubmit={handleCreateTask} isLoading={createTaskMutation.isPending} />
				</CardContent>
			</Card>

			<Separator className="my-8" />

			<Card>
				<CardHeader>
					<CardTitle>Recent Tasks</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingTasks && <p>Loading tasks...</p>}
					{tasksError && <p className="text-red-500">Error loading tasks: {tasksError.message}</p>}
					{tasks && <TaskList tasks={tasks} />}
				</CardContent>
			</Card>
		</div>
	);
}