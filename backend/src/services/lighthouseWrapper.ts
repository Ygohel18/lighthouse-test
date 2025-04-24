// src/services/lighthouseWrapper.ts
// This file is specifically designed to handle the dynamic import of lighthouse
// to avoid ERR_REQUIRE_ESM in the main CommonJS code.

import type { Flags, Result } from 'lighthouse'; // Use type-only import if TS version supports it (TS 3.8+)
// If type-only import causes issues, use a regular import:
// import { Flags, Result } from 'lighthouse';

/**
 * Dynamically imports and runs the Lighthouse audit.
 * @param url The URL to audit.
 * @param options Lighthouse flags/options.
 * @returns The Lighthouse Result object.
 */
export async function runLighthouseAudit(url: string, options: Flags): Promise<Result> { // Ensure options are passed
    try {
        const lighthouseModule = await import('lighthouse');
        const lighthouse = lighthouseModule.default;

        if (typeof lighthouse !== 'function') {
            throw new Error('Lighthouse module default export is not a function.');
        }

        // Run the audit, passing the options
        const runnerResult = await lighthouse(url, options); // Pass options here

        if (!runnerResult || !runnerResult.lhr) {
            throw new Error("Lighthouse audit failed to produce a valid result object.");
        }

        return runnerResult.lhr; // Return the Lighthouse Result object

    } catch (error: any) {
        console.error('Error during dynamic import or execution of lighthouse:', error);
        // Re-throw the error so the calling service can handle it
        throw error;
    }
}