// components/report-viewer.tsx
'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDownIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// --- CHANGE THIS IMPORT TO 'dark' ---
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/dark'; // Try importing 'dark' style
// --- END CHANGE ---


interface ReportViewerProps {
    report: any; // Accept any type for the raw report JSON
}

export function ReportViewer({ report }: ReportViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Convert report object to formatted JSON string
    const reportJsonString = JSON.stringify(report, null, 2);

    return (
        <Card className="mt-6">
            <CardHeader className="pb-2">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                            <span className="text-lg font-semibold">Raw Lighthouse Report JSON</span>
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 pt-0">
                        <div className="max-h-96 overflow-y-auto rounded-md bg-gray-800 p-4 text-sm text-gray-200">
                            {/* Use the imported 'dark' style */}
                            <SyntaxHighlighter language="json" style={dark} customStyle={{ background: 'none', padding: 0 }}>
                                {reportJsonString}
                            </SyntaxHighlighter>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardHeader>
        </Card>
    );
}