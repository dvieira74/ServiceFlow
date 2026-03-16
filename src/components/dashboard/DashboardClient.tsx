
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { 
  Briefcase, 
  Wallet, 
  BarChart3, 
  CalendarDays, 
  Sigma, 
  TrendingUp, 
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip as RechartsTooltip, 
  Legend,
  Line,
  LineChart
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";
import { Skeleton } from '@/components/ui/skeleton';
import type { ServiceRequest, ServiceCommission, Annotation } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyData {
  month: string;
  total: number;
}

interface DashboardSummary {
  commissions: {
    totalValue: number;
    totalServiceValue: number;
    count: number;
    faturadosCount: number;
    aFaturarCount: number;
    monthlyTrend: MonthlyData[];
    averageValue: number;
    growth: number;
  };
}

const chartConfig = {
  total: {
    label: "Total Comissões",
    color: "hsl(var(--primary))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export function DashboardClient() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setDate(new Date());

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const commissionsRef = collection(db, 'serviceCommissions');
        const commissionsSnap = await getDocs(commissionsRef);
        const allCommissions: ServiceCommission[] = [];
        
        let faturadosCount = 0;
        let aFaturarCount = 0;

        commissionsSnap.forEach(doc => {
          const data = doc.data();
          const commission = {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
          } as ServiceCommission;
          
          allCommissions.push(commission);

          if (commission.serviceValue > 0) {
            faturadosCount++;
          } else {
            aFaturarCount++;
          }
        });

        const monthlyData: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const m = subMonths(new Date(), i);
          const monthKey = format(m, 'MMM/yy', { locale: ptBR });
          const monthTotal = allCommissions
            .filter(c => isSameMonth(parseISO(c.date), m))
            .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
          
          monthlyData.push({ month: monthKey, total: monthTotal });
        }

        const currentMonthTotal = monthlyData[5].total;
        const lastMonthTotal = monthlyData[4].total;
        const growth = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        const totalCommissionValue = allCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const totalServiceValue = allCommissions.reduce((sum, c) => sum + (c.serviceValue || 0), 0);
        
        const averageTicket = allCommissions.length > 0 ? totalServiceValue / allCommissions.length : 0;

        setSummary({
          commissions: {
            totalValue: totalCommissionValue,
            totalServiceValue: totalServiceValue,
            count: allCommissions.length,
            faturadosCount,
            aFaturarCount,
            monthlyTrend: monthlyData,
            averageValue: averageTicket,
            growth: growth
          }
        });

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Relatório de Comissões</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho financeiro e o status dos seus serviços.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">R$ {summary?.commissions.totalValue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Acumulado total no sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desempenho Mensal</CardTitle>
            {summary && summary.commissions.growth >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-500" /> : 
              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
            }
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {summary?.commissions.growth.toFixed(1)}%
                </div>
                {summary && summary.commissions.growth !== 0 && (
                  summary.commissions.growth > 0 ? 
                  <ArrowUpRight className="h-4 w-4 text-green-500" /> : 
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Comparado ao mês anterior</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">R$ {summary?.commissions.averageValue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Média por serviço realizado</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Serviços</CardTitle>
            <Sigma className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">R$ {summary?.commissions.totalServiceValue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Soma bruta de todos os serviços</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> 
              Evolução das Comissões
            </CardTitle>
            <CardDescription>Total mensal de comissões nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.commissions.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar 
                      dataKey="total" 
                      fill="var(--color-total)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-0">
              {mounted && (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-0"
                  locale={ptBR}
                />
              )}
              {!mounted && <Skeleton className="h-[300px] w-full" />}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Resumo de Faturamento</CardTitle>
              <CardDescription>Status das comissões registradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Total Faturados</span>
                </div>
                <span className="font-bold">{summary?.commissions.faturadosCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Total não Faturados</span>
                </div>
                <span className="font-bold">{summary?.commissions.aFaturarCount || 0}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href="/service-commission">Ver Relatório Completo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
