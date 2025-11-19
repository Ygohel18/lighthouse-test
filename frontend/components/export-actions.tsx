'use client';

import { useState } from 'react';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FrontendTask } from '@/types';
import { downloadPDF } from '@/lib/pdf-generator';

interface ExportActionsProps {
	task: FrontendTask;
}

export function ExportActions({ task }: ExportActionsProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const handlePDFExport = async () => {
		setIsGenerating(true);
		try {
			await downloadPDF(task);
		} catch (error) {
			console.error('Failed to generate PDF:', error);
			alert('Failed to generate PDF report. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleJSONExport = () => {
		const dataStr = JSON.stringify(task, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `lighthouse-data-${task.taskId}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleCSVExport = () => {
		const rows = [
			[
				'Device',
				'Browser',
				'Location',
				'Status',
				'Performance Score',
				'FCP',
				'LCP',
				'CLS',
				'TBT',
				'Speed Index',
			],
		];

		task.results.forEach((result) => {
			const perfScore = result.report?.categories.performance?.score
				? Math.round(result.report.categories.performance.score * 100)
				: 'N/A';

			const audits = result.report?.audits || {};
			const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
			const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
			const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
			const tbt = audits['total-blocking-time']?.displayValue || 'N/A';
			const si = audits['speed-index']?.displayValue || 'N/A';

			rows.push([
				result.config.device,
				result.config.browser,
				result.config.location,
				result.status,
				perfScore.toString(),
				fcp,
				lcp,
				cls,
				tbt,
				si,
			]);
		});

		const csvContent = rows.map((row) => row.join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `lighthouse-metrics-${task.taskId}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={isGenerating}
					className="w-full sm:w-auto"
				>
					{isGenerating ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Generating...
						</>
					) : (
						<>
							<Download className="mr-2 h-4 w-4" />
							Export Report
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem onClick={handlePDFExport} disabled={isGenerating}>
					<FileText className="mr-2 h-4 w-4" />
					Export as PDF
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleJSONExport}>
					<FileJson className="mr-2 h-4 w-4" />
					Export as JSON
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleCSVExport}>
					<FileText className="mr-2 h-4 w-4" />
					Export as CSV
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
