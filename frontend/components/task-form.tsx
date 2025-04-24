// components/task-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react'; // Example icon

const formSchema = z.object({
    url: z.string().url({ message: "Please enter a valid URL." }),
    // Add fields for configs if you want to allow selecting them in the form
    // e.g., device: z.enum(['mobile', 'desktop']).optional(),
});

interface TaskFormProps {
    onSubmit: (url: string, configs?: any[]) => void; // Adjust configs type
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
        // TODO: Get selected configs from form if implemented
        onSubmit(values.url); // Pass URL and configs
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL to Test</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* TODO: Add form fields for selecting configurations */}

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Test
                </Button>
            </form>
        </Form>
    );
}