// src/services/lighthouseService.ts
import puppeteer, { Browser, LaunchOptions, KnownDevices } from 'puppeteer';
import { Result, Flags } from 'lighthouse';
import { URL } from 'url';
import { TaskRepository } from '../storage/taskRepository';
import { TestConfiguration, LighthouseResultPartial } from '../types';
// Import the updated processing function
import { processLighthouseReport } from '../utils/lighthouseScoring';
// Import the lighthouse wrapper (assuming you kept this fix)
import { runLighthouseAudit } from './lighthouseWrapper';
import config from '../config';


const taskRepository = new TaskRepository();

// Helper to launch Puppeteer with specific configurations
const launchBrowser = async (config: TestConfiguration): Promise<Browser> => {
    const launchOptions: LaunchOptions = {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage', // Important for Docker environments
            // Add proxy args if using a central proxy
            // ...(config.location === 'via-proxy' && config.proxyUrl ? [`--proxy-server=${config.proxyUrl}`] : []),
        ],
        headless: true, // Use 'new' for newer Puppeteer versions
    };

    const browser = await puppeteer.launch(launchOptions);
    return browser;
};

// Helper to run a single Lighthouse audit
const runSingleAudit = async (browser: Browser, taskId: string, url: string, config: TestConfiguration): Promise<Omit<LighthouseResultPartial, 'config' | 'status' | 'timestamp'>> => { // Added taskId parameter
    const page = await browser.newPage();

    if (config.device === 'mobile') {
        const mobile = KnownDevices['Pixel 5'];
        if (mobile) {
            await page.emulate(mobile);
        }
    }

    const browserWSEndpoint = browser.wsEndpoint();
    const browserPort = new URL(browserWSEndpoint).port;

    const lighthouseOptions: Flags = {
        port: parseInt(browserPort, 10),
        output: 'json',
        // Add throttling settings if needed
        // throttlingMethod: 'simulate',
        // throttling: lighthouse.config.constants.throttling.mobileSlow4G, // Note: lighthouse.config might not be directly available here
    };

    try {
        // Run Lighthouse using the wrapper
        const rawReport = await runLighthouseAudit(url, lighthouseOptions); // Get the full raw report

        // Process the report: extract metrics/score, save screenshots, modify report JSON
        const processedData = await processLighthouseReport(rawReport, taskId, config); // Pass taskId and config

        return processedData; // Returns score, metrics, and the modified report

    } catch (error: any) {
        console.error(`Lighthouse audit failed for ${url} (${config.device}, ${config.location}):`, error);
        return {
            score: undefined,
            metrics: undefined,
            report: undefined, // Report might be undefined on fatal error
            errorMessage: error.message || 'Unknown error during audit',
        };
    } finally {
        if (!page.isClosed()) { // Check if page is already closed
            await page.close();
        }
    }
};

// Main function to run all audits for a given task
export const runAllAuditsForTask = async (taskId: string, url: string, plannedConfigs: TestConfiguration[]) => {
    console.log(`Starting audits for task ${taskId} on URL: ${url}`);

    await taskRepository.initializePartialResults(taskId, plannedConfigs);
    await taskRepository.updateTaskStatus(taskId, 'running');

    let browser: Browser | undefined;

    try {
        // Launch browser once for potentially multiple audits (can be more efficient)
        // Note: If using geo-specific servers, each worker instance *is* the location,
        // and it would launch its own browser. If using proxies, launching once is fine.
        // This structure assumes a single worker instance might run multiple configs.
        // For true geo-distribution, you'd have workers in different locations.
        // Launching based on the first config is a simplification here.
        browser = await launchBrowser(plannedConfigs[0]);

        for (const config of plannedConfigs) {
            console.log(`Running audit for ${url} with config: ${JSON.stringify(config)}`);

            await taskRepository.updatePartialResultStatus(taskId, config, 'running');

            let auditResultData: Omit<LighthouseResultPartial, 'config' | 'status' | 'timestamp'>;

            try {
                // Pass taskId to runSingleAudit
                auditResultData = await runSingleAudit(browser, taskId, url, config);
                await taskRepository.updatePartialResultStatus(taskId, config, 'completed', auditResultData);
                console.log(`Audit completed for ${url} (${JSON.stringify(config)}). Score: ${auditResultData.score}`);

            } catch (auditError: any) {
                console.error(`Error during single audit for ${url} (${JSON.stringify(config)}):`, auditError);
                await taskRepository.updatePartialResultStatus(taskId, config, 'error', { errorMessage: auditError.message || 'Audit failed' });
            }
        }

        const updatedTask = await taskRepository.getTaskById(taskId);
        const allCompleted = updatedTask?.results.length === plannedConfigs.length &&
            updatedTask.results.every(r => r.status === 'completed' || r.status === 'error');

        if (allCompleted) {
            await taskRepository.updateTaskStatus(taskId, 'completed');
            console.log(`Task ${taskId} completed.`);
        } else {
            console.warn(`Task ${taskId} finished processing configs, but not all results recorded?`);
            await taskRepository.updateTaskStatus(taskId, 'error');
        }


    } catch (error: any) {
        console.error(`Fatal error running audits for task ${taskId}:`, error);
        await taskRepository.updateTaskStatus(taskId, 'error');
        const taskBeforeError = await taskRepository.getTaskById(taskId);
        if (taskBeforeError) {
            for (const result of taskBeforeError.results) {
                if (result.status === 'pending' || result.status === 'running') {
                    await taskRepository.updatePartialResultStatus(taskId, result.config, 'error', { errorMessage: `Task failed: ${error.message || 'Unknown error'}` });
                }
            }
        }

    } finally {
        if (browser) {
            await browser.close();
        }
    }
};