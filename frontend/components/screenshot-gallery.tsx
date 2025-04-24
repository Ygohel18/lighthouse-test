// components/screenshot-gallery.tsx
import { ScreenshotAudit, ScreenshotAuditDetails, ReportScreenshotItem } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image'; // Use Next.js Image component for optimization

interface ScreenshotGalleryProps {
    audits: { [auditId: string]: any }; // Accept the audits object
}

export function ScreenshotGallery({ audits }: ScreenshotGalleryProps) {
    const screenshots: { src: string; alt: string; timing?: number; }[] = [];

    // Find screenshot audits
    const screenshotThumbnailsAudit: ScreenshotAudit | undefined = audits['screenshot-thumbnails'];
    const finalScreenshotAudit: ScreenshotAudit | undefined = audits['final-screenshot'];

    // Process filmstrip thumbnails
    if (screenshotThumbnailsAudit?.details && (screenshotThumbnailsAudit.details as ScreenshotAuditDetails).type === 'filmstrip' && (screenshotThumbnailsAudit.details as ScreenshotAuditDetails).items) {
        const items = (screenshotThumbnailsAudit.details as ScreenshotAuditDetails).items as ReportScreenshotItem[];
        items.forEach(item => {
            if (item.url) { // Use the signed URL
                screenshots.push({
                    src: item.url,
                    alt: `Screenshot at ${item.timing}ms`,
                    timing: item.timing,
                });
            } else if (item.errorMessage) {
                console.warn(`Screenshot item failed to load/upload: ${item.errorMessage}`);
                // Optionally add a placeholder or error indicator
            }
        });
        // Sort filmstrip screenshots by timing
        screenshots.sort((a, b) => (a.timing || 0) - (b.timing || 0));
    }

    // Process final screenshot
    if (finalScreenshotAudit?.details && (finalScreenshotAudit.details as ScreenshotAuditDetails).type === 'thumbnail' && (finalScreenshotAudit.details as ScreenshotAuditDetails).url) {
        const url = (finalScreenshotAudit.details as ScreenshotAuditDetails).url as string;
        if (url) {
            screenshots.push({
                src: url,
                alt: 'Final Screenshot',
                // No timing for final screenshot typically
            });
        } else if ((finalScreenshotAudit.details as ScreenshotAuditDetails).errorMessage) {
            console.warn(`Final screenshot failed to load/upload: ${((finalScreenshotAudit.details as ScreenshotAuditDetails).errorMessage)}`);
            // Optionally add a placeholder or error indicator
        }
    }


    if (screenshots.length === 0) {
        // Only show this message if the audits existed but had no valid URLs
        if (screenshotThumbnailsAudit || finalScreenshotAudit) {
            return <p className="text-muted-foreground">No screenshots available for this report.</p>;
        }
        return null; // Don't render anything if no screenshot audits were found
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Screenshots</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {screenshots.map((screenshot, index) => (
                        <div key={index} className="relative w-full aspect-video overflow-hidden rounded-md border">
                            {/* Use Next.js Image component */}
                            <Image
                                src={screenshot.src}
                                alt={screenshot.alt}
                                fill // Fill the parent container
                                style={{ objectFit: 'cover' }} // Cover the area without distorting aspect ratio
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizes
                                className="transition-transform hover:scale-105"
                            />
                            {screenshot.timing !== undefined && (
                                <Badge className="absolute top-1 left-1">{screenshot.timing}ms</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}