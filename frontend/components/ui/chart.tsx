// components/ui/chart.tsx
'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartProps {
    data: any[];
    bars: { key: string; color: string; name: string }[];
    xAxisDataKey: string;
    title?: string;
}

export function Chart({ data, bars, xAxisDataKey, title }: ChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-64"> {/* Adjust height as needed */}
            {title && <h4 className="text-center text-sm font-medium mb-2">{title}</h4>}
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisDataKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {bars.map(bar => (
                        <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}