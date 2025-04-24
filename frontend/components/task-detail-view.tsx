// components/task-detail-view.tsx
import { FrontendTask, FrontendLighthouseResultPartial } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreOverview } from './score-overview';
import { MetricsView } from './metrics-view';
import { DetailedAudits } from './detailed-audits';
// ScreenshotGallery is now typically rendered by AuditDetailsRenderer
// import { ScreenshotGallery } from './screenshot-gallery';
// --- REMOVE THIS IMPORT ---
// import { ReportViewer } from './report-viewer';
// --- END REMOVE ---
import { getScoreColorClass } from '@/lib/lighthouse-utils';

interface TaskDetailViewProps {
    task: FrontendTask;
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
    if (!task.results || task.results.length === 0) {
        return <p>No results available yet.</p>;
    }

    return (
        <Accordion type="multiple" className="w-full">
            {task.results.map((result, index) => (
                <AccordionItem key={index} value={`result-${index}`}>
                    <AccordionTrigger>
                        Result for {result.config.device} ({result.config.location}) - {result.config.browser}
                        <Badge variant={
                            result.status === 'completed' ? 'default' :
                                result.status === 'running' ? 'secondary' :
                                    result.status === 'error' ? 'destructive' : 'outline'
                        } className="ml-4">
                            {result.status}
                        </Badge>
                        {result.status === 'completed' && result.score !== undefined && (
                            <span className={`ml-4 font-bold ${getScoreColorClass(result.score)}`}>Score: {result.score}</span>
                        )}
                    </AccordionTrigger>
                    <AccordionContent>
                        {result.status === 'error' && (
                            <div className="text-red-500 mb-4">Error: {result.errorMessage || 'An unknown error occurred.'}</div>
                        )}

                        {result.status === 'completed' && result.report ? (
                            <>
                                {/* Display Overall Scores */}
                                <ScoreOverview report={result.report} />

                                {/* Display Core Metrics and Charts */}
                                <MetricsView report={result.report} />

                                {/* Display Screenshots */}
                                {/* ScreenshotGallery is now typically rendered by AuditDetailsRenderer for filmstrip/thumbnail audits */}
                                {/* If you want a dedicated screenshot section here, you'd need to find the audits and pass them */}
                                {/* Example (simplified): */}
                                {/* <ScreenshotGallery audits={result.report.audits} /> */}


                                {/* Display Detailed Audits by Category */}
                                <DetailedAudits report={result.report} />

                                {/* --- REMOVE THIS COMPONENT USAGE --- */}
                                {/* <ReportViewer report={result.report} /> */}
                                {/* --- END REMOVE --- */}
                            </>
                        ) : (
                            result.status === 'running' && <p>Test is still running. Results will appear here when completed.</p>
                        )}

                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}