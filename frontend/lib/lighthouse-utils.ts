// lib/lighthouse-utils.ts
import { FrontendReport, FrontendAudit, FrontendCategory, AuditDetailsTable, AuditDetailsFilmstrip, AuditDetailsThumbnail } from '@/types';

// Define Lighthouse metric thresholds (values are inclusive)
// Based on https://web.dev/vitals/ and Lighthouse scoring guide
const METRIC_THRESHOLDS = {
    'first-contentful-paint': { good: 1800, needsImprovement: 3000 }, // ms
    'largest-contentful-paint': { good: 2500, needsImprovement: 4000 }, // ms
    'cumulative-layout-shift': { good: 0.1, needsImprovement: 0.25 }, // score (lower is better)
    'total-blocking-time': { good: 200, needsImprovement: 600 }, // ms
    'speed-index': { good: 3400, needsImprovement: 5800 }, // ms (Note: SI thresholds can vary slightly)
    'interactive': { good: 3800, needsImprovement: 7300 }, // ms (Time to Interactive - TTI thresholds can vary)
    // Add other metric thresholds if needed
};

// Export MetricStatus type so it can be imported elsewhere
export type MetricStatus = 'good' | 'needs-improvement' | 'poor' | 'not-applicable'; // <--- EXPORTED THIS


/**
 * Gets the status (Good, Needs Improvement, Poor) for a metric based on its value and thresholds.
 * @param auditId The ID of the metric audit.
 * @param value The numeric value of the metric.
 * @returns The status string.
 */
export function getMetricStatus(auditId: string, value?: number | null): MetricStatus {
    if (value === undefined || value === null) return 'not-applicable';

    const thresholds = (METRIC_THRESHOLDS as any)[auditId];
    if (!thresholds) return 'not-applicable'; // No thresholds defined for this metric

    // CLS is lower-is-better, others are typically lower-is-better too for performance metrics
    // (except for score-based metrics where higher is better, but we handle raw values here)
    // Assuming all defined thresholds are for lower-is-better metrics for simplicity here.
    // If you add higher-is-better metrics, you'll need conditional logic.
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
}

/**
 * Gets the color class for a metric status.
 * @param status The metric status ('good', 'needs-improvement', 'poor', 'not-applicable').
 * @returns Tailwind CSS color class.
 */
export function getMetricStatusColorClass(status: MetricStatus): string {
    switch (status) {
        case 'good': return 'text-green-600';
        case 'needs-improvement': return 'text-yellow-600';
        case 'poor': return 'text-red-600';
        default: return 'text-gray-500';
    }
}

/**
 * Formats a numeric value based on its unit.
 * @param value The numeric value.
 * @param unit The unit (e.g., 'ms', 's', 'bytes', 'score').
 * @returns Formatted string.
 */
export function formatMetricValue(value?: number | null, unit?: string): string {
    if (value === undefined || value === null) return 'N/A';

    switch (unit) {
        case 'ms': return `${value.toFixed(value < 1000 ? 0 : 1)} ms`;
        case 's': return `${value.toFixed(value < 10 ? 2 : 1)} s`;
        case 'bytes':
            const kb = value / 1024;
            if (kb < 1024) return `${kb.toFixed(1)} KB`;
            const mb = kb / 1024;
            return `${mb.toFixed(1)} MB`;
        case 'score': return value.toFixed(3); // CLS score
        default: return value.toFixed(value < 10 ? 2 : 0); // Default formatting
    }
}


/**
 * Gets the core performance metrics audits from the report, with status.
 * @param report The FrontendReport object.
 * @returns An array of core metric audits with calculated status.
 */
export function getCoreMetricsWithStatus(report: FrontendReport): (FrontendAudit & { status: MetricStatus })[] {
    const metricIds = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'cumulative-layout-shift',
        'total-blocking-time',
        'speed-index',
        'interactive', // Time to Interactive
    ];
    return metricIds
        .map(id => report.audits[id])
        .filter((audit): audit is FrontendAudit => audit !== undefined && audit.numericValue !== undefined) // Only include audits with numeric values
        .map(audit => ({
            ...audit,
            status: getMetricStatus(audit.id, audit.numericValue),
        }));
}

/**
 * Gets audits for a specific category, grouped by scoreDisplayMode.
 * @param report The FrontendReport object.
 * @param categoryId The ID of the category (e.g., 'performance', 'accessibility').
 * @returns An object grouping audits by status.
 */
export function getAuditsByCategoryGrouped(report: FrontendReport, categoryId: string): {
    passed: FrontendAudit[];
    warnings: FrontendAudit[]; // Includes 'warning' and 'manual'
    failed: FrontendAudit[]; // Includes 'fail' and 'binary'
    informative: FrontendAudit[]; // Includes 'informative' and 'notApplicable'
} {
    const category = report.categories[categoryId];
    if (!category) return { passed: [], warnings: [], failed: [], informative: [] };

    const audits = category.auditRefs
        .map(ref => report.audits[ref.id])
        .filter((audit): audit is FrontendAudit => audit !== undefined);

    const passed = audits.filter(a => a.scoreDisplayMode === 'pass');
    const warnings = audits.filter(a => a.scoreDisplayMode === 'warning' || a.scoreDisplayMode === 'manual');
    const failed = audits.filter(a => a.scoreDisplayMode === 'fail' || a.scoreDisplayMode === 'binary');
    const informative = audits.filter(a => a.scoreDisplayMode === 'informative' || a.scoreDisplayMode === 'notApplicable');

    // Optional: Sort within groups if desired (e.g., by weight or score)
    // Example: Sort failed/warning audits by score ascending (lower score is worse)
    failed.sort((a, b) => (a.score || 0) - (b.score || 0));
    warnings.sort((a, b) => (a.score || 0) - (b.score || 0));


    return { passed, warnings, failed, informative };
}


/**
 * Determines the color class for a score (0-100).
 * @param score The score (0-100).
 * @returns Tailwind CSS color class.
 */
export function getScoreColorClass(score?: number | null): string {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

/**
 * Determines the badge variant for an audit status.
 * @param scoreDisplayMode The audit's scoreDisplayMode.
 * @returns Shadcn Badge variant.
 */
export function getAuditStatusBadgeVariant(scoreDisplayMode: string): 'default' | 'secondary' | 'destructive' | 'outline' {
     switch (scoreDisplayMode) {
        case 'pass': return 'default'; // Greenish
        case 'warning': // Or 'average'
        case 'manual': return 'secondary'; // Yellowish/Grayish
        case 'fail': // Or 'error'
        case 'binary': return 'destructive'; // Reddish
        case 'informative': // Or 'notApplicable'
        default: return 'outline'; // Gray outline
    }
}

// Keep getAuditStatusColorClass if still used elsewhere
export function getAuditStatusColorClass(scoreDisplayMode: string): string {
    switch (scoreDisplayMode) {
        case 'pass': return 'text-green-600';
        case 'warning': // Or 'average'
        case 'manual': return 'text-yellow-600';
        case 'fail': // Or 'error'
        case 'binary': return 'text-red-600';
        case 'informative': // Or 'notApplicable'
        default: return 'text-gray-500';
    }
}