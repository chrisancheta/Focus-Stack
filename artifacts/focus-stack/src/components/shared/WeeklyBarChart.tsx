import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeeklyBarChartProps {
  data: { day: string; planned: number; completed: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 4px 16px rgba(34,37,39,0.10)',
        }}
      >
        <p className="font-semibold text-[#222527] mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.fill }} className="font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.50)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(34,37,39,0.45)', fontFamily: "'DM Sans', sans-serif" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(34,37,39,0.45)', fontFamily: "'DM Sans', sans-serif" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.18)' }} />
          <Legend
            wrapperStyle={{
              fontSize: '11px',
              paddingTop: '12px',
              fontFamily: "'DM Sans', sans-serif",
              color: 'rgba(34,37,39,0.55)',
            }}
          />
          <Bar
            dataKey="planned"
            name="Planned"
            fill="rgba(144,157,146,0.50)"
            radius={[5, 5, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill="rgba(34,37,39,0.70)"
            radius={[5, 5, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
