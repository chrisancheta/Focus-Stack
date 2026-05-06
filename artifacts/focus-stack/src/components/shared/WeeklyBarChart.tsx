import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceArea,
} from 'recharts';

interface WeeklyBarChartProps {
  data: { day: string; planned: number; completed: number }[];
  todayIndex?: number;
}

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
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.80)',
        boxShadow: '0 4px 16px rgba(34,37,39,0.12)',
      }}
    >
      <p className="font-semibold text-[#222527] mb-1.5">{label}</p>
      <p className="text-[#222527]/70">
        <span className="font-semibold text-[#222527]">{completed}</span>
        <span className="text-[#222527]/50"> / {planned} done</span>
      </p>
      <p style={{ color: pct >= 80 ? '#2a4e2d' : pct >= 50 ? '#6b4800' : 'rgba(150,35,35,0.80)' }} className="font-semibold">
        {pct}%
      </p>
    </div>
  );
};

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

export function WeeklyBarChart({ data, todayIndex }: WeeklyBarChartProps) {
  const stackData = buildStackData(data);
  const maxVal = Math.max(...data.map(d => d.planned), 6);

  return (
    <div className="w-full">
      {/* Ideal zone legend */}
      <div className="flex items-center gap-1.5 mb-3">
        <span
          className="w-3 h-3 rounded-sm inline-block"
          style={{ background: 'rgba(107,143,110,0.25)', border: '1px solid rgba(107,143,110,0.30)' }}
        />
        <span className="text-[10px] text-[#222527]/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Ideal range (3–5 tasks/day)
        </span>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stackData}
            margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
            barCategoryGap="30%"
          >
            {/* Ideal zone — shaded band between 3 and 5 */}
            <ReferenceArea
              y1={3} y2={5}
              fill="rgba(107,143,110,0.10)"
              fillOpacity={1}
              stroke="rgba(107,143,110,0.18)"
              strokeDasharray="3 3"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.55)"
            />
            <XAxis
              dataKey="day"
              axisLine={false} tickLine={false}
              tick={({ x, y, payload, index }: any) => (
                <text
                  x={x} y={y + 10}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="'DM Sans', sans-serif"
                  fill={index === todayIndex
                    ? 'rgba(34,37,39,0.85)'
                    : 'rgba(34,37,39,0.50)'}
                  fontWeight={index === todayIndex ? 700 : 400}
                >
                  {payload.value}
                </text>
              )}
            />
            <YAxis
              axisLine={false} tickLine={false}
              domain={[0, maxVal]}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'rgba(34,37,39,0.52)', fontFamily: "'DM Sans', sans-serif" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.20)' }} />

            {/* Bottom segment — completed */}
            <Bar
              dataKey="completed"
              stackId="week"
              maxBarSize={42}
              shape={(props: any) => {
                const row = stackData.find(d => d.day === props.day);
                return (
                  <CompletedBar
                    {...props}
                    remaining={row?.remaining ?? 0}
                    fill={props.index === todayIndex ? 'rgba(34,37,39,0.90)' : 'rgba(34,37,39,0.82)'}
                  />
                );
              }}
            >
              {stackData.map((_, i) => (
                <Cell key={i} />
              ))}
            </Bar>

            {/* Top segment — remaining */}
            <Bar
              dataKey="remaining"
              stackId="week"
              maxBarSize={42}
              shape={(props: any) => (
                <RoundedTop
                  {...props}
                  fill={props.index === todayIndex
                    ? 'rgba(144,157,146,0.65)'
                    : 'rgba(144,157,146,0.52)'}
                />
              )}
            >
              {stackData.map((_, i) => (
                <Cell key={i} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(34,37,39,0.82)' }} />
          <span className="text-[11px] text-[#222527]/55" style={{ fontFamily: "'DM Sans', sans-serif" }}>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(144,157,146,0.55)' }} />
          <span className="text-[11px] text-[#222527]/55" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remaining</span>
        </div>
      </div>
    </div>
  );
}
