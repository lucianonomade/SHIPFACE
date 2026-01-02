"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
    date: string;
    vulnerabilities: number;
}

export function TrendChart({ data }: { data: ChartData[] }) {
    return (
        <div className="h-[300px] w-full mt-6 bg-black/20 border border-gray-800 p-4 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#4b5563"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#4b5563', fontFamily: 'JetBrains Mono' }}
                    />
                    <YAxis
                        stroke="#4b5563"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#4b5563', fontFamily: 'JetBrains Mono' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#050505',
                            border: '1px solid #00f0ff',
                            borderRadius: '0',
                            fontFamily: 'JetBrains Mono',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#00f0ff' }}
                        cursor={{ stroke: '#00f0ff', strokeWidth: 1 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="vulnerabilities"
                        stroke="#00f0ff"
                        strokeWidth={2}
                        dot={{ fill: '#00f0ff', strokeWidth: 2, r: 4, stroke: '#050505' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#39ff14' }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
