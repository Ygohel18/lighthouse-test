'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FrontendTask } from '@/types';

interface TaskSearchProps {
	tasks: FrontendTask[];
	onFilteredTasksChange: (tasks: FrontendTask[]) => void;
}

export function TaskSearch({
	tasks,
	onFilteredTasksChange,
}: TaskSearchProps) {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredTasks = useMemo(() => {
		if (!searchQuery.trim()) {
			return tasks;
		}

		const query = searchQuery.toLowerCase();
		return tasks.filter((task) => {
			return (
				task.taskId.toLowerCase().includes(query) ||
				task.url.toLowerCase().includes(query) ||
				task.status.toLowerCase().includes(query) ||
				task.results.some(
					(result) =>
						result.config.device.toLowerCase().includes(query) ||
						result.config.browser.toLowerCase().includes(query) ||
						result.config.location.toLowerCase().includes(query)
				)
			);
		});
	}, [tasks, searchQuery]);

	// Update parent component when filtered tasks change
	useMemo(() => {
		onFilteredTasksChange(filteredTasks);
	}, [filteredTasks, onFilteredTasksChange]);

	const handleClear = () => {
		setSearchQuery('');
	};

	return (
		<div className="relative w-full">
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by URL, task ID, device, status..."
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="pl-9 pr-9 w-full"
			/>
			{searchQuery && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
					onClick={handleClear}
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Clear search</span>
				</Button>
			)}
		</div>
	);
}
