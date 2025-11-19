// app/tasks/[taskId]/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getTask } from '@/lib/api';
import { FrontendTask } from '@/types';
import { TaskDetailView } from '@/components/task-detail-view';
import { ExportActions } from '@/components/export-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TaskDetailPage() {
	const params = useParams();
	const router = useRouter();
	const taskId = params.taskId as string;

	// Fetch the specific task
	const {
		data: task,
		isLoading,
		error,
	} = useQuery<FrontendTask>({
		queryKey: ['task', taskId],
		queryFn: () => getTask(taskId),
		refetchInterval: (query) =>
			query.state.data?.status === 'running' ? 3000 : false,
	});

	if (isLoading) {
		return (
			<div className="container mx-auto py-4 px-4 sm:py-8">
				Loading task...
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-4 px-4 sm:py-8 text-red-500">
				Error loading task: {error.message}
			</div>
		);
	}

	if (!task) {
		return (
			<div className="container mx-auto py-4 px-4 sm:py-8">
				Task not found.
			</div>
		);
	}

	return (
		<div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="shrink-0"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
						Task: {task.taskId}
					</h1>
				</div>
				{task.status === 'completed' && <ExportActions task={task} />}
			</div>

			<Card className="mb-6 sm:mb-8">
				<CardHeader>
					<CardTitle className="text-lg sm:text-xl">Task Overview</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
						<strong className="text-sm sm:text-base">URL:</strong>
						<span className="text-sm sm:text-base break-all">{task.url}</span>
					</div>
					<div className="flex items-center gap-2">
						<strong className="text-sm sm:text-base">Status:</strong>
						<Badge
							variant={
								task.status === 'completed'
									? 'default'
									: task.status === 'running'
										? 'secondary'
										: task.status === 'error'
											? 'destructive'
											: 'outline'
							}
						>
							{task.status}
						</Badge>
					</div>
					<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
						<strong className="text-sm sm:text-base">Created:</strong>
						<span className="text-sm sm:text-base">
							{new Date(task.createdAt).toLocaleString()}
						</span>
					</div>
				</CardContent>
			</Card>

			<Separator className="my-6 sm:my-8" />

			<TaskDetailView task={task} />
		</div>
	);
}
