// components/score-overview.tsx
import { FrontendReport, FrontendCategory } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getScoreColorClass } from '@/lib/lighthouse-utils';

interface ScoreOverviewProps {
    report: FrontendReport;
}

export function ScoreOverview({ report }: ScoreOverviewProps) {
    const categoriesToShow = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']; // Main categories

    const scores = categoriesToShow
        .map(id => report.categories[id])
        .filter((category): category is FrontendCategory => category !== undefined && category.score !== undefined);

    if (scores.length === 0) return null;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Overall Scores</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {scores.map(category => (
                        <Card key={category.id} className="text-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{category.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getScoreColorClass(category.score! * 100)}`}>
                                    {Math.round(category.score! * 100)}
                                </div>
                                <p className="text-xs text-muted-foreground">/ 100</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}