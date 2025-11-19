// app/page.tsx
'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, listTasks } from '@/lib/api';
import { FrontendTask } from '@/types';
import { TaskForm } from '@/components/task-form';
import { TaskList } from '@/components/task-list';
import { TaskSearch } from '@/components/task-search';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

export default function HomePage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [filteredTasks, setFilteredTasks] = useState<FrontendTask[]>([]);

	// Fetch recent tasks
	const {
		data: tasks,
		isLoading: isLoadingTasks,
		error: tasksError,
	} = useQuery<FrontendTask[]>({
		queryKey: ['tasks'],
		queryFn: listTasks,
		refetchInterval: 5000,
	});

	// Mutation for creating a new task
	const createTaskMutation = useMutation({
		mutationFn: createTask,
		onSuccess: (newTask) => {
			queryClient.invalidateQueries({ queryKey: ['tasks'] });
			router.push(`/tasks/${newTask.taskId}`);
		},
		onError: (error) => {
			console.error('Failed to create task:', error);
		},
	});

	const handleCreateTask = async (url: string, configs?: any[]) => {
		createTaskMutation.mutate({ url, configs });
	};

	return (
		<div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
			<h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
				Lighthouse Performance Dashboard
			</h1>

			<Card className="mb-6 sm:mb-8">
				<CardHeader>
					<CardTitle className="text-lg sm:text-xl">Submit New Test</CardTitle>
				</CardHeader>
				<CardContent>
					<TaskForm
						onSubmit={handleCreateTask}
						isLoading={createTaskMutation.isPending}
					/>
				</CardContent>
			</Card>

			<Separator className="my-6 sm:my-8" />

			<Card>
				<CardHeader>
					<CardTitle className="text-lg sm:text-xl">Recent Tasks</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{tasks && tasks.length > 0 && (
						<TaskSearch
							tasks={tasks}
							onFilteredTasksChange={setFilteredTasks}
						/>
					)}
					{isLoadingTasks && (
						<p className="text-sm text-muted-foreground">Loading tasks...</p>
					)}
					{tasksError && (
						<p className="text-sm text-red-500">
							Error loading tasks: {tasksError.message}
						</p>
					)}
					{tasks && (
						<TaskList
							tasks={
								filteredTasks.length > 0 || tasks.length === 0
									? filteredTasks
									: tasks
							}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
