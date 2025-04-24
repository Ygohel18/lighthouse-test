// src/utils/lighthouseScoring.ts
import { LighthouseResultPartial, TestConfiguration } from '../types';
import { Result } from 'lighthouse';
import path from 'path'; // Still useful for path joining for object keys
// Remove fs import
// import fs from 'fs/promises';

// Import S3 service
import { uploadFileToS3 } from '../services/s3Service';

// Remove local screenshots directory config/logic
// const SCREENSHOTS_DIR = config.screenshotsDir;
// async function ensureScreenshotsDir() { ... }
// ensureScreenshotsDir();


/**
 * Processes a raw Lighthouse report: extracts key data, saves screenshots to S3,
 * and prepares the result object for storage.
 * @param report The raw Lighthouse Result object.
 * @param taskId The ID of the task.
 * @param config The test configuration for this audit.
 * @returns An object containing extracted data and the modified report.
 */
export const processLighthouseReport = async (report: Result, taskId: string, config: TestConfiguration): Promise<Omit<LighthouseResultPartial, 'config' | 'status' | 'timestamp'>> => {
    const audits = report.audits;
    const categories = report.categories;

    // 1. Extract Key Metrics
    const metrics = {
        firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
        cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
        totalBlockingTime: audits['total-blocking-time']?.numericValue,
        speedIndex: audits['speed-index']?.numericValue,
        interactive: audits['interactive']?.numericValue, // Time to Interactive
    };

    // 2. Extract Overall Performance Score (0-100)
    const score = categories.performance?.score ? Math.round(categories.performance.score * 100) : undefined;

    // 3. Handle Screenshots (Upload to S3 and replace data URLs with object keys)
    const screenshotAudits = ['screenshot-thumbnails', 'final-screenshot'];
    const modifiedReport = JSON.parse(JSON.stringify(report)) as Result; // Create a deep copy to modify

    for (const auditName of screenshotAudits) {
        const audit = modifiedReport.audits[auditName];
        if (audit && audit.details) {
            // Handle filmstrip (screenshot-thumbnails)
            if ((audit.details as any).type === 'filmstrip' && (audit.details as any).items) {
                for (const item of (audit.details as any).items) {
                    if (item && (item as any).data && (item as any).data.startsWith('data:image/')) {
                        try {
                            const base64Data = (item as any).data.split(',')[1];
                            const imageBuffer = Buffer.from(base64Data, 'base64');

                            // Generate a unique object key for S3
                            const safeDevice = config.device.replace(/[^a-zA-Z0-9]/g, '_');
                            const safeLocation = config.location.replace(/[^a-zA-Z0-9]/g, '_');
                            const safeAuditName = auditName.replace(/[^a-zA-Z0-9]/g, '_');
                            const timestamp = Date.now();

                            // Object key structure: taskId/device_location_audit_timestamp.png
                            const objectKey = `${taskId}/${safeDevice}_${safeLocation}_${safeAuditName}_${timestamp}.png`;

                            // Upload to S3
                            await uploadFileToS3(objectKey, imageBuffer, 'image/png');

                            // Replace the base64 data with the S3 object key in the report copy
                            delete (item as any).data; // Remove the base64 data
                            // Store the object key. The API will generate signed URLs from this.
                            (item as any).s3ObjectKey = objectKey; // Use a new property name

                        } catch (uploadError: any) {
                            console.error(`Error uploading screenshot for task ${taskId}, config ${JSON.stringify(config)}, audit ${auditName}:`, uploadError);
                            (item as any).errorMessage = `Failed to upload screenshot: ${uploadError.message}`;
                            // Keep the original data or remove it depending on preference
                            // delete item.data;
                        }
                    }
                }
            } else if ((audit.details as any).type === 'thumbnail' && (audit.details as any).data && (audit.details as any).data.startsWith('data:image/')) {
                // Handle single thumbnail (final-screenshot)
                try {
                    const base64Data = (audit.details as any).data.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');

                    // Generate a unique object key for S3
                    const safeDevice = config.device.replace(/[^a-zA-Z0-9]/g, '_');
                    const safeLocation = config.location.replace(/[^a-zA-Z0-9]/g, '_');
                    const safeAuditName = auditName.replace(/[^a-zA-Z0-9]/g, '_');
                    const timestamp = Date.now();

                    // Object key structure: taskId/device_location_audit_timestamp.png
                    const objectKey = `${taskId}/${safeDevice}_${safeLocation}_${safeAuditName}_${timestamp}.png`;

                    // Upload to S3
                    await uploadFileToS3(objectKey, imageBuffer, 'image/png');

                    // Replace data with object key in the report copy
                    delete (audit.details as any).data;
                    // Store the object key. The API will generate signed URLs from this.
                    (audit.details as any).s3ObjectKey = objectKey; // Use a new property name

                } catch (uploadError: any) {
                    console.error(`Error uploading final screenshot for task ${taskId}, config ${JSON.stringify(config)}:`, uploadError);
                    (audit.details as any).errorMessage = `Failed to upload screenshot: ${uploadError.message}`;
                }
            }
        }
    }


    // 4. Return the extracted data and the modified full report
    return {
        score,
        metrics,
        report: modifiedReport, // Return the report with S3 object keys
        errorMessage: undefined,
    };
};

// Keep the calculateOverallScore function if you plan to use it for aggregation later
export const calculateOverallScore = (partialResult: Omit<LighthouseResultPartial, 'config' | 'status' | 'timestamp'>): number => {
    console.warn("calculateOverallScore is a placeholder for potential future aggregation. Using the extracted score.");
    return partialResult.score || 0;
};