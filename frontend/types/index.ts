// types/index.ts
import { Result } from 'lighthouse'; // Import the full backend Result type

// Define possible test configurations
export type DeviceType = 'mobile' | 'desktop';
export type BrowserType = 'Chrome' | 'Firefox'; // Puppeteer primarily supports Chrome/Chromium
export type Location = string; // e.g., 'us-east-1', 'eu-west-2'

export interface TestConfiguration {
    device: DeviceType;
    browser: BrowserType; // Note: Puppeteer primarily supports Chrome/Chromium
    location: Location; // This implies external handling (proxy, geo-server)
}

// Screenshot item structure in the report after processing by backend
export interface ReportScreenshotItem {
    data?: string; // Original base64 (should be removed by backend)
    url?: string; // Temporary signed URL from S3
    s3ObjectKey?: string; // S3 object key (should be removed by backend response)
    timing?: number; // Timestamp in ms for filmstrip
    // ... other properties from Lighthouse filmstrip/thumbnail items
    errorMessage?: string; // If S3 upload or URL generation failed
}

// --- Enhanced Types for Lighthouse Report Structure ---

// Base type for audit details items (common properties)
export interface AuditDetailsItem {
    // Properties vary greatly by audit type
    [key: string]: any;
}

// Type for Audit Details with a list of items (Opportunities, Diagnostics)
export interface AuditDetailsTable extends AuditDetailsItem {
    type: 'table';
    headings: { key: string; itemType: string; text: string; displayUnit?: string; granularity?: number; }[];
    items: AuditDetailsItem[]; // Array of items
    summary?: { [key: string]: any }; // Optional summary row
    // ... other table-specific properties
}

// Type for Audit Details with a simple list
export interface AuditDetailsList extends AuditDetailsItem {
    type: 'list';
    items: AuditDetailsItem[]; // Array of items
}

// Type for Audit Details for code/debug info
export interface AuditDetailsCode extends AuditDetailsItem {
    type: 'code';
    value: string; // The code/text content
}

// Type for Audit Details for filmstrip/screenshots
export interface AuditDetailsFilmstrip extends AuditDetailsItem {
    type: 'filmstrip';
    items: ReportScreenshotItem[]; // Array of screenshot items (with URLs)
}

// Type for Audit Details for a single thumbnail (final-screenshot)
export interface AuditDetailsThumbnail extends AuditDetailsItem {
    type: 'thumbnail';
    data?: string; // Base64 (should be removed by backend)
    url?: string; // Temporary signed URL
    s3ObjectKey?: string; // S3 key (should be removed)
    // ... other thumbnail properties
}

// Type for a single Audit
export interface FrontendAudit {
    id: string; // e.g., 'first-contentful-paint', 'render-blocking-resources'
    title: string;
    description: string;
    score?: number; // 0-1 score
    scoreDisplayMode: string; // e.g., 'numeric', 'binary', 'informative', 'manual', 'notApplicable'
    numericValue?: number; // The measured value (e.g., FCP in ms)
    numericUnit?: string; // The unit (e.g., 'ms', 's', 'bytes')
    details?: AuditDetailsTable | AuditDetailsList | AuditDetailsCode | AuditDetailsFilmstrip | AuditDetailsThumbnail | any; // Use union or any for flexibility
    displayValue?: string; // Formatted value string
    // ... other audit properties you might need
}

// Type for a Lighthouse Category (Performance, Accessibility, etc.)
export interface FrontendCategory {
    id: string; // e.g., 'performance', 'accessibility'
    title: string;
    score?: number; // 0-1 score
    description?: string;
    auditRefs: { id: string; weight: number; group?: string; acronym?: string; relevantAudits?: string[]; }[]; // References to audits in this category
    // ... other category properties
}

// Frontend representation of the full Lighthouse Report structure
export interface FrontendReport {
    audits: { [auditId: string]: FrontendAudit }; // Map of audit IDs to Audit objects
    categories: { [categoryId: string]: FrontendCategory }; // Map of category IDs to Category objects
    categoryGroups?: { [groupId: string]: { title: string; description?: string; } }; // Groups within categories
    configSettings?: { [key: string]: any }; // Test configuration settings
    lighthouseVersion: string;
    fetchTime: string; // ISO 8601 string
    requestedUrl: string;
    finalUrl: string;
    // ... other top-level report properties
}

// Frontend representation of a partial/final result for one config
export interface FrontendLighthouseResultPartial {
    config: TestConfiguration;
    status: 'pending' | 'running' | 'completed' | 'error';
    score?: number; // Overall performance score (0-100)
    metrics?: { // Key metrics extracted by backend (can keep for quick access, but rely on report.audits for detail)
        firstContentfulPaint?: number; // ms
        largestContentfulPaint?: number; // ms
        cumulativeLayoutShift?: number; // score
        totalBlockingTime?: number; // ms
        speedIndex?: number; // ms
        interactive?: number; // ms (TTI)
    };
    // The full report JSON, with screenshot data replaced by URLs
    report?: FrontendReport; // <--- Use the new FrontendReport type
    errorMessage?: string;
    timestamp: string; // Dates often come as strings from JSON APIs
}

// Frontend representation of a Task
export interface FrontendTask {
    taskId: string;
    url: string;
    createdAt: string; // Date string
    status: 'queued' | 'running' | 'completed' | 'error';
    results: FrontendLighthouseResultPartial[];
    plannedConfigs?: TestConfiguration[];
}

// API Request Body for POST /tasks (Frontend -> Backend)
export interface CreateTaskRequest {
    url: string;
    configs?: TestConfiguration[];
}