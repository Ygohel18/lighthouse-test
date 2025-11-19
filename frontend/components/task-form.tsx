// components/task-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Loader2, Play } from 'lucide-react';

const formSchema = z.object({
	url: z.string().url({ message: 'Please enter a valid URL.' }),
});

interface TaskFormProps {
	onSubmit: (url: string, configs?: any[]) => void;
	isLoading: boolean;
}

export function TaskForm({ onSubmit, isLoading }: TaskFormProps) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			url: '',
		},
	});

	function handleSubmit(values: z.infer<typeof formSchema>) {
		onSubmit(values.url);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="url"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-sm sm:text-base">
								URL to Test
							</FormLabel>
							<FormControl>
								<Input
									placeholder="https://example.com"
									{...field}
									className="text-sm sm:text-base"
								/>
							</FormControl>
							<FormMessage className="text-xs sm:text-sm" />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Running Test...
						</>
					) : (
						<>
							<Play className="mr-2 h-4 w-4" />
							Run Test
						</>
					)}
				</Button>
			</form>
		</Form>
	);
}
