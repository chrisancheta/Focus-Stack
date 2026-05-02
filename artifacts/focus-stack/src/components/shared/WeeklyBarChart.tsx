import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface WeeklyBarChartProps {
  data: { day: string; planned: number; completed: number }[];
}

// Derive stacked segments from raw data
function buildStackData(data: WeeklyBarChartProps['data']) {
  return data.map(d => ({
    day:       d.day,
    planned:   d.planned,
    completed: d.completed,
    remaining: Math.max(0, d.planned - d.completed),
    pct:       d.planned > 0 ? Math.round((d.completed / d.planned) * 100) : 0,
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const planned   = (payload.find((p: any) => p.dataKey === 'completed')?.value ?? 0)
                  + (payload.find((p: any) => p.dataKey === 'remaining')?.value ?? 0);
  const completed = payload.find((p: any) => p.dataKey === 'completed')?.value ?? 0;
  const pct       = planned > 0 ? Math.round((completed / planned) * 100) : 0;

  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs space-y-1"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 4px 16px rgba(34,37,39,0.10)',
      }}
    >
      <p className="font-semibold text-[#222527] mb-1.5">{label}</p>
      <p className="text-[#222527]/75">
        <span className="font-medium text-[#222527]">{completed}</span> / {planned} completed
      </p>
      <p className="text-[#6B8F6E] font-medium">{pct}%</p>
    </div>
  );
};

// Custom rounded-top shape for the top (remaining) segment
const RoundedTop = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(5, width / 2, height);
  return (
    <path
      d={`M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`}
      fill={fill}
    />
  );
};

// Custom rounded-bottom shape for the bottom (completed) segment
const RoundedBottom = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(5, width / 2, height);
  return (
    <path
      d={`M${x},${y} L${x + width},${y} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x + r},${y + height} Q${x},${y + height} ${x},${y + height - r} Z`}
      fill={fill}
    />
  );
};

// When there's no remaining segment the completed bar should also round on top
const RoundedFull = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(5, width / 2, height);
  return (
    <path
      d={`M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x + r},${y + height} Q${x},${y + height} ${x},${y + height - r} Z`}
      fill={fill}
    />
  );
};

const CompletedBar = (props: any) => {
  const { remaining } = props;
  if (remaining === 0) return <RoundedFull {...props} />;
  return <RoundedBottom {...props} />;
};

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  const stackData = buildStackData(data);

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={stackData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.50)"
          />
          <XAxis
            dataKey="day"
            axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(34,37,39,0.45)', fontFamily: "'DM Sans', sans-serif" }}
            dy={8}
          />
          <YAxis
            axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(34,37,39,0.45)', fontFamily: "'DM Sans', sans-serif" }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.18)' }} />

          {/* Bottom segment — completed (dark charcoal) */}
          <Bar
            dataKey="completed"
            stackId="week"
            fill="rgba(34,37,39,0.75)"
            maxBarSize={40}
            shape={(props: any) => {
              const row = stackData.find(d => d.day === props.day);
              return <CompletedBar {...props} remaining={row?.remaining ?? 0} />;
            }}
          />

          {/* Top segment — remaining (light sage) */}
          <Bar
            dataKey="remaining"
            stackId="week"
            fill="rgba(144,157,146,0.35)"
            maxBarSize={40}
            shape={(props: any) => <RoundedTop {...props} />}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend — centred below chart */}
      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(34,37,39,0.75)' }} />
          <span className="text-[11px] text-[#222527]/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(144,157,146,0.45)' }} />
          <span className="text-[11px] text-[#222527]/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remaining</span>
        </div>
      </div>
    </div>
  );
}
