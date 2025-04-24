// components/audit-details-renderer.tsx
import { AuditDetailsTable, AuditDetailsList, AuditDetailsCode, AuditDetailsFilmstrip, AuditDetailsThumbnail, AuditDetailsItem } from '@/types';
import { DataTable } from './ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ScreenshotGallery } from './screenshot-gallery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { formatMetricValue } from '@/lib/lighthouse-utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
// Remove SyntaxHighlighter imports as per previous decision
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import vs2015 from 'react-syntax-highlighter/dist/esm/styles/prism/vs2015';


interface AuditDetailsRendererProps {
    details: AuditDetailsTable | AuditDetailsList | AuditDetailsCode | AuditDetailsFilmstrip | AuditDetailsThumbnail | any;
    auditId: string; // Pass audit ID for context if needed
}

export function AuditDetailsRenderer({ details, auditId }: AuditDetailsRendererProps) {
    if (!details) return null;

    // Helper function to render a single list item
    const renderListItem = (item: AuditDetailsItem, index: number) => {
        // Safety check for null/undefined items in the list
        if (item === null || item === undefined) {
            console.warn(`AuditDetailsRenderer: Found null or undefined item in list for audit ${auditId}`);
            return <li key={index} className="text-sm text-yellow-600">Invalid item data (null/undefined)</li>;
        }

        // Explicitly check if the item is an object before accessing properties
        if (typeof item !== 'object') {
            // Handle primitives directly
            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                return <li key={index}>{String(item)}</li>;
            }
            // Fallback for non-object, non-primitive types (shouldn't happen)
            console.warn(`AuditDetailsRenderer: Found non-object, non-primitive item in list for audit ${auditId}:`, item);
            return <li key={index} className="text-sm text-yellow-600">Invalid item data (non-object)</li>;
        }

        const itemAny = item as any; // Use 'any' for flexible access on the object


        // --- Handle common list item types (now that we know it's an object) ---

        // 1. Handle Node details (common in accessibility, best-practices, performance audits)
        // These items often have type: 'node' and properties like nodeLabel, selector, snippet
        if (itemAny.type === 'node' && (itemAny.nodeLabel || itemAny.selector)) {
            return (
                <li key={index}>
                    Node: <span className="font-mono text-xs bg-gray-100 p-0.5 rounded">{itemAny.nodeLabel || itemAny.selector}</span>
                    {itemAny.snippet && typeof itemAny.snippet === 'string' && ( // Ensure snippet is a string
                        <pre className="rounded-md bg-gray-100 p-1 text-xs overflow-x-auto mt-1">
                            {/* Fallback to basic code tag */}
                            <code>{itemAny.snippet}</code>
                        </pre>
                    )}
                    {/* You could add more details like path, boundingRect here if needed */}
                    {/* Example: {itemAny.path && <span className="ml-2 text-muted-foreground">Path: {itemAny.path}</span>} */}
                </li>
            );
        }

        // 2. Handle Code snippets (common in unused-css/js, render-blocking)
        // These items often have type: 'code'
        if (itemAny.type === 'code' && itemAny.value !== undefined && typeof itemAny.value === 'string') { // Ensure value is a string
            return (
                <li key={index}>
                    <pre className="rounded-md bg-gray-100 p-1 text-xs overflow-x-auto">
                        {/* Fallback to basic code tag */}
                        <code>{itemAny.value}</code>
                    </pre>
                </li>
            );
        }

        // 3. Handle Text descriptions (common in many audits)
        // These items often have a 'text' property
        if (itemAny.text && typeof itemAny.text === 'string') { // Ensure text is a string
            // Check if text contains a URL and render as link
            if (itemAny.text.startsWith('http://') || itemAny.text.startsWith('https://')) {
                try {
                    new URL(itemAny.text);
                    return <li key={index}><a href={itemAny.text} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{itemAny.text}</a></li>;
                } catch {
                    // Not a valid URL, render as text
                    return <li key={index}>{itemAny.text}</li>;
                }
            }
            return <li key={index}>{itemAny.text}</li>;
        }

        // 4. Handle URL items (common in resource audits)
        // These items often have a 'url' property
        if (itemAny.url && typeof itemAny.url === 'string') { // Ensure url is a string
            try {
                new URL(itemAny.url);
                return <li key={index}><a href={itemAny.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{itemAny.url}</a></li>;
            } catch {
                // Not a valid URL, render as text
                return <li key={index}>{itemAny.url}</li>;
            }
        }

        // 5. Handle simple objects with a single common key (e.g., { value: '...' })
        // This is a heuristic and might need refinement
        const keys = Object.keys(itemAny);
        if (keys.length === 1 && typeof itemAny[keys[0]] !== 'object') {
            return <li key={index}>{String(itemAny[keys[0]])}</li>;
        }


        // Fallback: If none of the specific structures matched, stringify the item.
        // This should handle any remaining complex object types safely.
        console.warn(`AuditDetailsRenderer: Falling back to stringify for unhandled list item structure in audit ${auditId}:`, item);
        // Ensure JSON.stringify doesn't fail on circular references (though unlikely in LH report)
        try {
            return <li key={index}><pre className="text-xs">{JSON.stringify(item, null, 2)}</pre></li>;
        } catch (e) {
            console.error(`AuditDetailsRenderer: Failed to stringify item for audit ${auditId}:`, item, e);
            return <li key={index} className="text-sm text-red-600">Could not render item details.</li>;
        }
    };


    // Use type guards or check the 'type' property
    if ((details as AuditDetailsTable).type === 'table' && (details as AuditDetailsTable).items) {
        const tableDetails = details as AuditDetailsTable;

        const columns: ColumnDef<AuditDetailsItem>[] = tableDetails.headings.map(heading => ({
            accessorKey: heading.key,
            header: heading.text,
            cell: ({ row }) => {
                const value = row.getValue(heading.key) as any;
                if (typeof value === 'string' && (heading.key === 'url' || heading.key.toLowerCase().includes('url'))) {
                    try {
                        new URL(value);
                        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value}</a>;
                    } catch {
                        return value;
                    }
                }
                if (heading.displayUnit === 'bytes') {
                    return formatMetricValue(value, 'bytes');
                }
                if (heading.displayUnit === 'ms' || heading.displayUnit === 's') {
                    return formatMetricValue(value, heading.displayUnit);
                }
                return value;
            },
        }));

        return (
            <div className="rounded-md border overflow-hidden">
                <DataTable columns={columns} data={tableDetails.items} />
                {tableDetails.summary && (
                    <div className="p-4 text-sm text-muted-foreground">
                        Summary: {JSON.stringify(tableDetails.summary)}
                    </div>
                )}
            </div>
        );
    }

    if ((details as AuditDetailsList).type === 'list' && (details as AuditDetailsList).items) {
        const listDetails = details as AuditDetailsList;
        // Ensure listDetails.items is an array before mapping
        if (!Array.isArray(listDetails.items)) {
            console.error(`AuditDetailsRenderer: Expected items array for list type, but got`, listDetails.items, `for audit ${auditId}`);
            return <div className="text-sm text-red-600">Invalid list data structure.</div>;
        }
        return (
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {/* Use the helper function to render each item */}
                {listDetails.items.map((item, index) => renderListItem(item, index))}
            </ul>
        );
    }

    if ((details as AuditDetailsCode).type === 'code' && (details as AuditDetailsCode).value !== undefined && typeof (details as AuditDetailsCode).value === 'string') { // Ensure value is a string
        const codeDetails = details as AuditDetailsCode;
        return (
            <pre className="rounded-md bg-gray-100 p-3 text-sm overflow-x-auto">
                {/* Fallback to basic code tag */}
                <code>{codeDetails.value}</code>
            </pre>
        );
    }

    if ((details as AuditDetailsFilmstrip).type === 'filmstrip' || (details as AuditDetailsThumbnail).type === 'thumbnail') {
        const auditsObjectForGallery = { [auditId]: { details: details } };
        return <ScreenshotGallery audits={auditsObjectForGallery} />;
    }

    if ((details as any).errorMessage) {
        return (
            <Alert variant="destructive">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Audit Details Error</AlertTitle>
                <AlertDescription>{(details as any).errorMessage}</AlertDescription>
            </Alert>
        );
    }


    // Fallback for other types or unknown structures
    console.warn(`AuditDetailsRenderer: Falling back for unknown details type for audit ${auditId}:`, details);
    return (
        <div className="text-sm text-muted-foreground italic">
            Unsupported or unknown audit details type: {(details as any).type || 'N/A'}.
            <Collapsible>
                <CollapsibleTrigger asChild><Button variant="link" size="sm">Show Raw Details</Button></CollapsibleTrigger>
                <CollapsibleContent>
                    <pre className="text-xs overflow-x-auto">
                        {/* Ensure JSON.stringify doesn't fail */}
                        {(() => {
                            try {
                                return JSON.stringify(details, null, 2);
                            } catch (e) {
                                console.error(`AuditDetailsRenderer: Failed to stringify unknown details for audit ${auditId}:`, details, e);
                                return "Could not display raw details.";
                            }
                        })()}
                    </pre>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}