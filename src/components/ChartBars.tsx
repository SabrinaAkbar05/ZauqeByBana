'use client';

import { money } from '@/lib/utils';

export function ChartBars({
  data,
}: {
  data: { month: string; value: number }[];
}) {
  const maximum = Math.max(...data.map((x) => x.value), 1);

  return (
    <div
      className="chart-bars"
      role="img"
      aria-label={`Revenue by month: ${data
        .map((x) => `${x.month} ${money(x.value)}`)
        .join(', ')}`}
    >
      {data.map((d) => {
        const heightPct = Math.max(4, (d.value / maximum) * 100);
        return (
          <div className="bar-column" key={d.month}>
            <div className="bar-plot">
              <div
                title={`${d.month}: ${money(d.value)}`}
                className="bar"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}
