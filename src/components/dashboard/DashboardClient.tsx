
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
import { cn } from '@/lib/utils';
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
import type { ServiceCommission, Annotation } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthlyLineChart } from './MonthlyLineChart';
import { ServiceTypePieChart } from './ServiceTypePieChart';

interface MonthlyData {
  month: string;
  total: number;
}

interface ServiceTypeData {
  name: string;
  value: number;
  label: string;
}

interface DashboardSummary {
  commissions: {
    totalValue: number;
    totalServiceValue: number;
    count: number;
    faturadosCount: number;
    aFaturarCount: number;
    monthlyTrend: MonthlyData[];
    serviceTypeDistribution: ServiceTypeData[];
    averageValue: number;
    growth: number;
  };
}

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
        
        const typeCounts: Record<string, number> = {
          printer: 0,
          toner: 0,
          notebook: 0
        };

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

          if (commission.serviceType && typeCounts[commission.serviceType] !== undefined) {
             typeCounts[commission.serviceType] += (commission.commissionAmount || 0);
          }
        });

        const serviceTypeDistribution: ServiceTypeData[] = [
          { name: 'printer', value: typeCounts.printer, label: 'Impressora' },
          { name: 'toner', value: typeCounts.toner, label: 'Toner' },
          { name: 'notebook', value: typeCounts.notebook, label: 'Notebook' }
        ].filter(d => d.value > 0);

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
            serviceTypeDistribution,
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
        <Card className="shadow-md border-l-4 border-l-primary transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-primary">R$ {summary?.commissions.totalValue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Acumulado total no sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-md transition-all hover:shadow-lg">
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
                <div className={cn("text-2xl font-bold", summary?.commissions.growth! >= 0 ? "text-green-600" : "text-red-600")}>
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

        <Card className="shadow-md transition-all hover:shadow-lg">
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

        <Card className="shadow-md transition-all hover:shadow-lg">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg md:col-span-2 overflow-hidden border-none bg-gradient-to-br from-background to-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> 
              Evolução das Comissões
            </CardTitle>
            <CardDescription>Crescimento mensal nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-0 pr-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-full w-full mx-4" />
            ) : (
              <MonthlyLineChart data={summary?.commissions.monthlyTrend || []} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg overflow-hidden border-none bg-gradient-to-br from-background to-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sigma className="h-5 w-5 text-primary" /> 
              Por Tipo de Serviço
            </CardTitle>
            <CardDescription>Distribuição do valor das comissões.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-0">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ServiceTypePieChart data={summary?.commissions.serviceTypeDistribution || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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

        <Card className="shadow-md md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <span>Resumo de Status</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/service-commission" className="flex items-center gap-1">
                  Ver Relatório <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardTitle>
            <CardDescription>Status atual de todas as comissões registradas no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 py-4">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-500/20">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-900">Comissões Faturadas</p>
                            <p className="text-xs text-green-700">Serviços concluídos e pagos.</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-green-700">{summary?.commissions.faturadosCount || 0}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500/20">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-900">A Faturar / Pendentes</p>
                            <p className="text-xs text-amber-700">Aguardando definição de valor ou pagamento.</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-amber-700">{summary?.commissions.aFaturarCount || 0}</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
