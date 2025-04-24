// components/detailed-audits.tsx
import { FrontendReport, FrontendCategory, FrontendAudit } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Remove AuditDetailsRenderer import as it's no longer called directly from here
// import { AuditDetailsRenderer } from './audit-details-renderer';
import { getAuditsByCategoryGrouped, getAuditStatusBadgeVariant, getAuditStatusColorClass, getScoreColorClass } from '@/lib/lighthouse-utils';
import { CircleCheck, CircleAlert, CircleX, Info } from 'lucide-react';

interface DetailedAuditsProps {
    report: FrontendReport;
}

const categoryOrder = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']; // Define display order

export function DetailedAudits({ report }: DetailedAuditsProps) {
    const categories = categoryOrder
        .map(id => report.categories[id])
        .filter((category): category is FrontendCategory => category !== undefined);

    if (categories.length === 0) return null;

    // Helper to get icon based on scoreDisplayMode
    const getStatusIcon = (scoreDisplayMode: string) => {
        switch (scoreDisplayMode) {
            case 'pass': return <CircleCheck className="h-4 w-4 text-green-600" />;
            case 'warning':
            case 'manual': return <CircleAlert className="h-4 w-4 text-yellow-600" />;
            case 'fail':
            case 'binary': return <CircleX className="h-4 w-4 text-red-600" />;
            case 'informative':
            case 'notApplicable':
            default: return <Info className="h-4 w-4 text-gray-500" />;
        }
    };


    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Detailed Audits</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full">
                    {categories.map(category => {
                        const groupedAudits = getAuditsByCategoryGrouped(report, category.id);
                        const hasAudits = Object.values(groupedAudits).some(arr => arr.length > 0);

                        if (!hasAudits) return null; // Don't show category if it has no audits

                        // Calculate category summary (e.g., score, passed/failed count)
                        const categoryScore = category.score !== undefined ? Math.round(category.score * 100) : undefined;
                        const passedCount = groupedAudits.passed.length;
                        const failedCount = groupedAudits.failed.length;
                        const warningCount = groupedAudits.warnings.length;
                        const informativeCount = groupedAudits.informative.length;


                        return (
                            <AccordionItem key={category.id} value={category.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center">
                                        <span className="font-semibold">{category.title}</span>
                                        {categoryScore !== undefined && (
                                            <span className={`ml-4 font-bold ${getScoreColorClass(categoryScore)}`}>Score: {categoryScore}</span>
                                        )}
                                        <span className="ml-4 text-sm text-muted-foreground">
                                            {passedCount > 0 && <span className="text-green-600">{passedCount} passed</span>}
                                            {failedCount > 0 && <span className="ml-1 text-red-600">{failedCount} failed</span>}
                                            {warningCount > 0 && <span className="ml-1 text-yellow-600">{warningCount} warnings</span>}
                                            {informativeCount > 0 && <span className="ml-1 text-gray-500">{informativeCount} informative</span>}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {/* Render audits grouped by status */}
                                    {groupedAudits.failed.length > 0 && (
                                        <AuditGroupSection title="Failed Audits" audits={groupedAudits.failed} getStatusIcon={getStatusIcon} />
                                    )}
                                    {groupedAudits.warnings.length > 0 && (
                                        <AuditGroupSection title="Warnings" audits={groupedAudits.warnings} getStatusIcon={getStatusIcon} />
                                    )}
                                    {groupedAudits.passed.length > 0 && (
                                        <AuditGroupSection title="Passed Audits" audits={groupedAudits.passed} getStatusIcon={getStatusIcon} />
                                    )}
                                    {groupedAudits.informative.length > 0 && (
                                        <AuditGroupSection title="Informative Audits" audits={groupedAudits.informative} getStatusIcon={getStatusIcon} />
                                    )}

                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}

// Helper component to render a group of audits
function AuditGroupSection({ title, audits, getStatusIcon }: { title: string; audits: FrontendAudit[]; getStatusIcon: (mode: string) => JSX.Element }) {
    if (audits.length === 0) return null;
    return (
        <div className="mb-6 last:mb-0">
            <h5 className="text-md font-semibold mb-3">{title}</h5>
            <div className="space-y-4">
                {audits.map(audit => (
                    <div key={audit.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center mb-2">
                            {getStatusIcon(audit.scoreDisplayMode)}
                            <span className="ml-2 font-medium">{audit.title}</span>
                            {audit.displayValue && (
                                <span className="ml-2 text-sm text-muted-foreground">({audit.displayValue})</span>
                            )}
                            {audit.scoreDisplayMode === 'numeric' && audit.score !== undefined && (
                                <span className={`ml-auto font-bold text-sm ${getScoreColorClass(audit.score * 100)}`}>
                                    {Math.round(audit.score * 100)}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{audit.description}</p>

                        {/* --- REMOVE THIS BLOCK --- */}
                        {/* {audit.details && (
                            <AuditDetailsRenderer details={audit.details} auditId={audit.id} />
                        )} */}
                        {/* --- END REMOVE --- */}
                    </div>
                ))}
            </div>
        </div>
    );
}