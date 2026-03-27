
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
import { HandCoins, Printer, Droplet, Monitor, Filter, CalendarDays, XIcon, Sigma, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
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

  const { filteredCommissions, totalPrinterCommissions, totalTonerCommissions, totalNotebookCommissions, overallTotalCommissions, overallTotalServiceValue } = useMemo(() => {
    const defaultReturn = { filteredCommissions: [], totalPrinterCommissions: 0, totalTonerCommissions: 0, totalNotebookCommissions: 0, overallTotalCommissions: 0, overallTotalServiceValue: 0 };
    if (commissions.length === 0 && !isLoading) return defaultReturn;

    const currentFiltered = commissions
      .filter(c => {
        if (filterServiceType !== 'all' && c.serviceType !== filterServiceType) return false;
        if (selectedMonthYear && format(parseISO(c.date), 'yyyy-MM') !== selectedMonthYear) return false;
        return true;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    let printerComm = 0, tonerComm = 0, notebookComm = 0;
    let printerServ = 0, tonerServ = 0, notebookServ = 0;
    
    const monthOnly = commissions.filter(c => selectedMonthYear ? format(parseISO(c.date), 'yyyy-MM') === selectedMonthYear : true);

    monthOnly.forEach(c => {
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
    });
    
    return { 
      filteredCommissions: currentFiltered,
      totalPrinterCommissions: printerComm,
      totalTonerCommissions: tonerComm,
      totalNotebookCommissions: notebookComm,
      overallTotalCommissions: printerComm + tonerComm + notebookComm,
      overallTotalServiceValue: printerServ + tonerServ + notebookServ
    };
  }, [commissions, filterServiceType, selectedMonthYear, isLoading]);

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
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
            <div className="flex-grow min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">Mês/Ano</label>
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger className="w-full">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthYearOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <Select value={filterServiceType} onValueChange={(v) => setFilterServiceType(v as ServiceType | 'all')}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listagem de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length === 0 && !isLoading ? (
             <div className="text-center py-10">
                <HandCoins className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">Nenhuma comissão encontrada</h3>
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead>Valor Serv. (R$)</TableHead>
                <TableHead>% Com.</TableHead>
                <TableHead>Comissão (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{format(parseISO(c.date), "dd/MM/yy", { locale: ptBR })}</TableCell>
                  <TableCell className="font-medium">{c.clientName}</TableCell>
                  <TableCell className="text-center">
                    {c.serviceType === 'printer' ? <Printer className="h-4 w-4 text-muted-foreground inline-block" /> : 
                     c.serviceType === 'toner' ? <Droplet className="h-4 w-4 text-muted-foreground inline-block" /> :
                     <Monitor className="h-4 w-4 text-muted-foreground inline-block" />}
                  </TableCell>
                  <TableCell>
                    {c.serviceValue === 0 ? (
                      <Badge variant="warning">A Faturar</Badge>
                    ) : (
                      c.serviceValue.toFixed(2)
                    )}
                  </TableCell>
                  <TableCell>{c.commissionPercentage}%</TableCell>
                  <TableCell className="font-semibold">
                    {c.serviceValue === 0 ? '-' : c.commissionAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setCommissionToEdit(c)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setCommissionToDelete(c)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
         {filteredCommissions.length > 0 && (
          <CardFooter className="flex flex-col items-stretch gap-4 pt-4 border-t">
            <div className="space-y-2">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Geral Serviços:</span>
                    <span className="text-right">R$ {overallTotalServiceValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Geral Comissões:</span>
                    <span className="text-right">R$ {overallTotalCommissions.toFixed(2)}</span>
                </div>
            </div>
          </CardFooter>
        )}
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
