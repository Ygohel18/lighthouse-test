// components/metrics-view.tsx
import { FrontendReport, FrontendAudit } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MetricCard } from './metric-card';
import { getCoreMetricsWithStatus, formatMetricValue } from '@/lib/lighthouse-utils'; // Use enhanced helper
import { Chart } from './ui/chart'; // Import the Chart component

interface MetricsViewProps {
    report: FrontendReport;
}

export function MetricsView({ report }: MetricsViewProps) {
    const coreMetrics = getCoreMetricsWithStatus(report);

    // Example data for a chart: Resource Size Breakdown
    const resourceSummaryAudit = report.audits['resource-summary'];
    const resourceChartData = resourceSummaryAudit?.details?.type === 'table' && resourceSummaryAudit.details.items
        ? resourceSummaryAudit.details.items.map(item => ({
            category: (item as any).resourceType,
            bytes: (item as any).size,
            transferBytes: (item as any).transferSize,
        }))
        : [];

    if (coreMetrics.length === 0 && resourceChartData.length === 0) return null;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Metrics & Summaries</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Core Metrics */}
                {coreMetrics.length > 0 && (
                    <>
                        <h4 className="text-md font-semibold mb-4">Core Web Vitals & Key Metrics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {coreMetrics.map(metric => (
                                <MetricCard
                                    key={metric.id}
                                    title={metric.title}
                                    value={metric.numericValue}
                                    unit={metric.numericUnit}
                                    status={metric.status} // Pass the calculated status
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Example Chart: Resource Size Breakdown */}
                {resourceChartData.length > 0 && (
                    <>
                        <h4 className="text-md font-semibold mb-4">Resource Size Breakdown</h4>
                        <Chart
                            data={resourceChartData}
                            xAxisDataKey="category"
                            bars={[
                                { key: 'bytes', color: '#8884d8', name: 'Total Size' },
                                { key: 'transferBytes', color: '#82ca9d', name: 'Transfer Size' },
                            ]}
                            title="Resource Size by Type"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            Total size is the uncompressed size, transfer size is the compressed size over the network.
                        </p>
                    </>
                )}

                {/* You could add more charts here for other audits like network-requests, third-party-summary etc. */}

            </CardContent>
        </Card>
    );
}