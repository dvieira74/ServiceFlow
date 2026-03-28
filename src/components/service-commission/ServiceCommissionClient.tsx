
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ServiceCommission, CommissionStatus, ServiceType } from '@/types';
import { PdfExportButton } from '@/components/shared/PdfExportButton';
import { AddCommissionDialog } from './AddCommissionDialog';
import { EditCommissionDialog } from './EditCommissionDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HandCoins, Printer, Droplet, Monitor, Filter, CalendarDays, XIcon, Sigma, MoreHorizontal, Edit, Trash2, Search, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';

const serviceTypeOptions: { value: ServiceType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'printer', label: 'Impressora' },
  { value: 'toner', label: 'Toner' },
  { value: 'notebook', label: 'Notebook' },
];

export function ServiceCommissionClient() {
  const [commissions, setCommissions] = useState<ServiceCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterServiceType, setFilterServiceType] = useState<ServiceType | 'all'>('all');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [commissionToDelete, setCommissionToDelete] = useState<ServiceCommission | null>(null);
  const [commissionToEdit, setCommissionToEdit] = useState<ServiceCommission | null>(null);

  const fetchCommissions = async () => {
    setIsLoading(true);
    try {
      const commissionsCollection = collection(db, 'serviceCommissions');
      const q = query(commissionsCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedCommissions: ServiceCommission[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let commissionDate = new Date().toISOString(); 

        if (data.date && typeof data.date.toDate === 'function') {
          commissionDate = (data.date as Timestamp).toDate().toISOString();
        } else if (data.date && typeof data.date === 'string') {
          const parsedDate = new Date(data.date);
          if (!isNaN(parsedDate.getTime())) {
            commissionDate = parsedDate.toISOString();
          }
        }
        
        fetchedCommissions.push({
          id: docSnap.id,
          date: commissionDate,
          clientName: data.clientName || '',
          serviceType: data.serviceType || 'printer',
          printerModel: data.printerModel,
          serviceDescription: data.serviceDescription,
          serviceValue: data.serviceValue || 0,
          commissionPercentage: data.commissionPercentage || 0,
          commissionAmount: data.commissionAmount || 0,
          status: data.status || 'Registered',
        });
      });
      setCommissions(fetchedCommissions);

      const uniqueMonthYears = Array.from(
        new Set(fetchedCommissions.map(c => format(parseISO(c.date), 'yyyy-MM')))
      ).sort((a, b) => b.localeCompare(a));

      const currentMonthYearKey = format(new Date(), 'yyyy-MM');
      let initialMonthYear = currentMonthYearKey;

      if (uniqueMonthYears.length > 0) {
        const currentMonthOption = uniqueMonthYears.find(my => my === currentMonthYearKey);
        initialMonthYear = currentMonthOption || uniqueMonthYears[0];
      }
      setSelectedMonthYear(initialMonthYear);

    } catch (error) {
      console.error("Erro ao buscar comissões: ", error);
      toast({ title: "Erro ao buscar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCommissions();
  }, []);
  
  const handleCommissionAdd = async (newCommissionData: Omit<ServiceCommission, 'id'>) => {
    setIsLoading(true);
    try {
      const firestorePayload = {
        ...newCommissionData,
        date: Timestamp.fromDate(new Date(newCommissionData.date)),
      };
      await addDoc(collection(db, 'serviceCommissions'), firestorePayload);
      toast({ title: "Comissão Adicionada" });
      await fetchCommissions(); 
    } catch (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommissionUpdate = async (updatedCommissionData: ServiceCommission) => {
    if (!commissionToEdit) return;
    setIsLoading(true);
    try {
      const commissionDocRef = doc(db, 'serviceCommissions', commissionToEdit.id);
      const { id, ...payload } = updatedCommissionData;
      const firestorePayload = {
        ...payload,
        date: Timestamp.fromDate(new Date(updatedCommissionData.date)),
      };

      await updateDoc(commissionDocRef, firestorePayload);
      toast({ title: "Comissão Atualizada" });
      setCommissionToEdit(null);
      await fetchCommissions();
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteCommission = async () => {
    if (commissionToDelete) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, 'serviceCommissions', commissionToDelete.id));
        setCommissions(prev => prev.filter(c => c.id !== commissionToDelete.id));
        toast({ title: "Comissão Excluída" });
        setCommissionToDelete(null);
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const { 
    filteredCommissions, 
    totalPrinterCommissions, 
    totalTonerCommissions, 
    totalNotebookCommissions, 
    overallTotalCommissions, 
    overallTotalServiceValue,
    faturadoCommissions,
    aFaturarCount
  } = useMemo(() => {
    const defaultReturn = { 
        filteredCommissions: [], 
        totalPrinterCommissions: 0, 
        totalTonerCommissions: 0, 
        totalNotebookCommissions: 0, 
        overallTotalCommissions: 0, 
        overallTotalServiceValue: 0,
        faturadoCommissions: 0,
        aFaturarCount: 0
    };
    if (commissions.length === 0 && !isLoading) return defaultReturn;

    const currentFiltered = commissions
      .filter(c => {
        if (filterServiceType !== 'all' && c.serviceType !== filterServiceType) return false;
        if (selectedMonthYear && format(parseISO(c.date), 'yyyy-MM') !== selectedMonthYear) return false;
        if (searchTerm && !c.clientName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    let printerComm = 0, tonerComm = 0, notebookComm = 0;
    let printerServ = 0, tonerServ = 0, notebookServ = 0;
    let faturado = 0, aFaturar = 0;
    
    currentFiltered.forEach(c => {
      if (c.serviceType === 'printer') {
        printerComm += c.commissionAmount;
        printerServ += c.serviceValue;
      } else if (c.serviceType === 'toner') {
        tonerComm += c.commissionAmount;
        tonerServ += c.serviceValue;
      } else if (c.serviceType === 'notebook') {
        notebookComm += c.commissionAmount;
        notebookServ += c.serviceValue;
      }

      if (c.serviceValue > 0) {
        faturado += c.commissionAmount;
      } else {
        aFaturar++;
      }
    });
    
    return { 
      filteredCommissions: currentFiltered,
      totalPrinterCommissions: printerComm,
      totalTonerCommissions: tonerComm,
      totalNotebookCommissions: notebookComm,
      overallTotalCommissions: printerComm + tonerComm + notebookComm,
      overallTotalServiceValue: printerServ + tonerServ + notebookServ,
      faturadoCommissions: faturado,
      aFaturarCount: aFaturar
    };
  }, [commissions, filterServiceType, selectedMonthYear, searchTerm, isLoading]);

  const monthYearOptions = useMemo(() => {
    const unique = Array.from(new Set(commissions.map(c => format(parseISO(c.date), 'yyyy-MM')))).sort((a, b) => b.localeCompare(a));
    return unique.map(my => ({
      value: my,
      label: format(parseISO(my + '-02T00:00:00Z'), 'MMMM \'de\' yyyy', { locale: ptBR }),
    }));
  }, [commissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Comissão de Serviços</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <PdfExportButton
            commissions={commissions.filter(c => selectedMonthYear ? format(parseISO(c.date), 'yyyy-MM') === selectedMonthYear : true)}
            selectedMonthLabel={monthYearOptions.find(o => o.value === selectedMonthYear)?.label || ''}
            totalPrinterCommissions={totalPrinterCommissions}
            totalTonerCommissions={totalTonerCommissions}
            totalNotebookCommissions={totalNotebookCommissions}
          />
          <AddCommissionDialog onCommissionAdd={handleCommissionAdd} />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total em Serviços <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {overallTotalServiceValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor bruto total do mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Faturado <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {faturadoCommissions.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ganhos com filtros selecionados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              A Faturar <Clock className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {aFaturarCount} Serviços
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando fechamento</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md border-none bg-muted/30">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full md:w-auto">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Buscar Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Digite o nome do cliente..." 
                  className="pl-10 bg-background border-muted-foreground/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Mês/Ano</label>
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                  <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthYearOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Tipo de Serviço</label>
              <Select value={filterServiceType} onValueChange={(v) => setFilterServiceType(v as ServiceType | 'all')}>
                <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                  <Filter className="h-4 w-4 mr-2 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filterServiceType !== 'all') && (
              <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(''); setFilterServiceType('all'); }} className="h-10 w-10 text-muted-foreground hover:text-primary">
                <XIcon className="h-4 w-4" />
              </Button>
            )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-none overflow-hidden bg-background">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex justify-between items-center">
             <div>
                <CardTitle className="text-xl">Listagem de Comissões</CardTitle>
                <CardDescription>Visualizando {filteredCommissions.length} registros no período.</CardDescription>
             </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                <Sigma className="h-4 w-4" /> Total Serv: <strong>R$ {overallTotalServiceValue.toFixed(2)}</strong>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCommissions.length === 0 && !isLoading ? (
             <div className="text-center py-20 flex flex-col items-center justify-center">
                <div className="bg-muted p-6 rounded-full mb-4">
                    <HandCoins className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Nada por aqui ainda</h3>
                <p className="text-muted-foreground max-w-[250px]">Ajuste seus filtros ou adicione uma nova comissão para começar.</p>
                {(searchTerm || filterServiceType !== 'all') && (
                  <Button variant="link" onClick={() => { setSearchTerm(''); setFilterServiceType('all'); }} className="mt-2">Limpar todos os filtros</Button>
                )}
             </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] font-bold text-primary">Data</TableHead>
                  <TableHead className="font-bold text-primary">Cliente</TableHead>
                  <TableHead className="text-center font-bold text-primary">Tipo</TableHead>
                  <TableHead className="font-bold text-primary">Valor Serv. (R$)</TableHead>
                  <TableHead className="font-bold text-primary">% Com.</TableHead>
                  <TableHead className="font-bold text-primary">Comissão (R$)</TableHead>
                  <TableHead className="text-right font-bold text-primary w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((c) => (
                  <TableRow key={c.id} className="group transition-colors hover:bg-primary/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{format(parseISO(c.date), "dd/MM/yy", { locale: ptBR })}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{format(parseISO(c.date), "EEEE", { locale: ptBR })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{c.clientName}</span>
                        {c.printerModel && <span className="text-xs text-muted-foreground">{c.printerModel}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                         {c.serviceType === 'printer' ? (
                            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                                <Printer className="h-4 w-4" />
                            </div>
                         ) : c.serviceType === 'toner' ? (
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                <Droplet className="h-4 w-4" />
                            </div>
                         ) : (
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                <Monitor className="h-4 w-4" />
                            </div>
                         )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.serviceValue === 0 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">A Faturar</Badge>
                      ) : (
                        <span className="font-medium">R$ {c.serviceValue.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                       <span className="text-xs bg-muted px-2 py-1 rounded-md">{c.commissionPercentage}%</span>
                    </TableCell>
                    <TableCell>
                      {c.serviceValue === 0 ? (
                        <span className="text-muted-foreground/30 italic text-sm">Pendente</span>
                      ) : (
                        <span className="font-bold text-primary">R$ {c.commissionAmount.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 border opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setCommissionToEdit(c)}>
                            <Edit className="mr-2 h-4 w-4 text-blue-500" /> Editar Registro
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setCommissionToDelete(c)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {commissionToEdit && (
        <EditCommissionDialog initialData={commissionToEdit} onCommissionUpdate={handleCommissionUpdate} isOpen={!!commissionToEdit} onOpenChange={(o) => !o && setCommissionToEdit(null)} />
      )}

      {commissionToDelete && (
        <AlertDialog open={!!commissionToDelete} onOpenChange={() => setCommissionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCommission} className="bg-destructive">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
