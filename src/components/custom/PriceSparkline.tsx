import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import type { PriceHistoryPoint } from '@/lib/productLookup';

interface PriceSparklineProps {
  data: PriceHistoryPoint[];
  height?: number;
}

function SparklineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PriceHistoryPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const dateStr = p.validFrom
    ? new Date(p.validFrom).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
    : '';
  return (
    <div className="rounded-lg bg-primary px-2.5 py-1.5 shadow-lg">
      <p className="text-[12px] font-bold text-white">
        {p.price.toFixed(2).replace('.', ',')} kr
      </p>
      <p className="text-[10px] text-muted-foreground">
        {p.store}{dateStr ? ` · ${dateStr}` : ''}
      </p>
    </div>
  );
}

export function PriceSparkline({ data, height = 100 }: PriceSparklineProps) {
  if (data.length === 0) return null;

  const lowest = Math.min(...data.map(d => d.price));
  const lowestPoint = data.find(d => d.price === lowest);
  const avg = data.reduce((sum, d) => sum + d.price, 0) / data.length;

  return (
    <div className="rounded-[8px] bg-background p-3 space-y-2">
      <p className="text-[12px] font-semibold text-muted-foreground">Prishistorik</p>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f58a2d" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f58a2d" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip content={<SparklineTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#f58a2d"
            fill="url(#priceGradient)"
            strokeWidth={2.5}
            dot={{ fill: '#f58a2d', r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#f58a2d', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          Laveste: <span className="font-semibold text-[#038141]">
            {lowest.toFixed(2).replace('.', ',')} kr
          </span>
          {lowestPoint?.store && <span className="text-muted-foreground"> ({lowestPoint.store})</span>}
        </span>
        <span className="text-muted-foreground">
          Gns: <span className="font-semibold text-foreground">
            {avg.toFixed(2).replace('.', ',')} kr
          </span>
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Baseret på {data.length} registrering{data.length !== 1 ? 'er' : ''}
      </p>
    </div>
  );
}
