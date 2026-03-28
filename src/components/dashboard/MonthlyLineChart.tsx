
'use client';

import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
} from "@/components/ui/chart";

interface MonthlyLineChartProps {
  data: any[];
}

const chartConfig = {
  total: {
    label: "Comissão Total",
    color: "hsl(var(--primary))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export function MonthlyLineChart({ data }: MonthlyLineChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis 
            dataKey="month" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={12}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={12}
            tickFormatter={(value) => `R$${value}`}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="var(--color-total)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
