import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeeklyBarChartProps {
  data: any[];
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="planned" name="Planned" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="completed" name="Completed" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
