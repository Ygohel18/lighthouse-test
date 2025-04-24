// components/metric-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// Import MetricStatus from lib/lighthouse-utils
import { formatMetricValue, getMetricStatusColorClass, getScoreColorClass, MetricStatus } from '@/lib/lighthouse-utils'; // <--- Import MetricStatus here


interface MetricCardProps {
    title: string;
    value?: number | null; // Allow null
    unit?: string;
    isScore?: boolean; // Flag for overall scores (0-100)
    status?: MetricStatus; // Add status for core metrics
}

export function MetricCard({ title, value, unit, isScore, status }: MetricCardProps) {
    const formattedValue = formatMetricValue(value, unit); // Use helper for formatting
    const statusText = status ? status.replace('-', ' ') : ''; // Format status text

    // Determine color class based on whether it's an overall score or a metric with status
    const colorClass = isScore
        ? getScoreColorClass(value)
        : status ? getMetricStatusColorClass(status) : 'text-gray-500';


    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${colorClass}`}>
                    {formattedValue}
                </div>
                {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
                {status && status !== 'not-applicable' && (
                    <p className={`text-xs font-semibold capitalize ${colorClass}`}>{statusText}</p>
                )}
            </CardContent>
        </Card>
    );
}