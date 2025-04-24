// components/task-list.tsx
import Link from 'next/link';
import { FrontendTask } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns'; // Install date-fns: npm install date-fns

interface TaskListProps {
    tasks: FrontendTask[];
}

export function TaskList({ tasks }: TaskListProps) {
    if (!tasks || tasks.length === 0) {
        return <p>No recent tasks found.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Results</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map((task) => (
                    <TableRow key={task.taskId}>
                        <TableCell className="font-medium">
                            <Link href={`/tasks/${task.taskId}`} className="hover:underline">
                                {task.url}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Badge variant={
                                task.status === 'completed' ? 'default' :
                                    task.status === 'running' ? 'secondary' :
                                        task.status === 'error' ? 'destructive' : 'outline'
                            }>
                                {task.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                            {/* Display a summary of completed/total results */}
                            {task.results.length > 0 ?
                                `${task.results.filter(r => r.status === 'completed').length}/${task.results.length} completed`
                                : 'Pending'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}