'use client';

import Link from 'next/link';
import { FrontendTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTask } from '@/lib/api';

interface TaskListProps {
	tasks: FrontendTask[];
}

export function TaskList({ tasks }: TaskListProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: deleteTask,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tasks'] });
		},
		onError: (error) => {
			console.error('Failed to delete task:', error);
			alert('Failed to delete task. Please try again.');
		},
	});

	const handleDelete = (e: React.MouseEvent, taskId: string) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (confirm('Are you sure you want to delete this task?')) {
			deleteMutation.mutate(taskId);
		}
	};

	if (!tasks || tasks.length === 0) {
		return (
			<p className="text-sm text-muted-foreground text-center py-8">
				No tasks found.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{tasks.map((task) => (
				<Card key={task.taskId} className="p-4 hover:bg-accent transition-colors group">
					<Link href={`/tasks/${task.taskId}`} className="block">
						<div className="space-y-2">
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate flex items-center gap-1">
										{task.url}
										<ExternalLink className="h-3 w-3 shrink-0" />
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										{formatDistanceToNow(new Date(task.createdAt), {
											addSuffix: true,
										})}
									</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
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
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => handleDelete(e, task.taskId)}
										disabled={deleteMutation.isPending}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>Task ID: {task.taskId}</span>
								<span>
									{task.results.length > 0
										? `${task.results.filter((r) => r.status === 'completed').length}/${task.results.length} completed`
										: 'Pending'}
								</span>
							</div>
						</div>
					</Link>
				</Card>
			))}
		</div>
	);
}
