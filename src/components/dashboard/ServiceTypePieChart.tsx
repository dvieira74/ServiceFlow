
'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";

interface ServiceTypePieChartProps {
  data: { name: string; value: number }[];
}

const chartConfig = {
  printer: {
    label: "Impressora",
    color: "hsl(var(--primary))",
  },
  toner: {
    label: "Toner",
    color: "hsl(var(--chart-2))",
  },
  notebook: {
    label: "Notebook",
    color: "hsl(var(--chart-3))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
];

export function ServiceTypePieChart({ data }: ServiceTypePieChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1500}
            animationBegin={200}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
