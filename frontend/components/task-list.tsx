// components/task-list.tsx
import Link from 'next/link';
import { FrontendTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';

interface TaskListProps {
	tasks: FrontendTask[];
}

export function TaskList({ tasks }: TaskListProps) {
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
				<Link key={task.taskId} href={`/tasks/${task.taskId}`}>
					<Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
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
									className="shrink-0"
								>
									{task.status}
								</Badge>
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
					</Card>
				</Link>
			))}
		</div>
	);
}
