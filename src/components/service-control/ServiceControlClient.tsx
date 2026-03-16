
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ServiceRequest, ServiceRequestStatus } from '@/types';
import { AddServiceDialog } from './AddServiceDialog';
import { EditServiceDialog } from './EditServiceDialog'; // Import EditServiceDialog
import { PdfExportButton } from '@/components/shared/PdfExportButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MoreHorizontal, Edit, Trash2, Eye, FileText, Search, CalendarDays, XIcon, ClipboardList, FileClock, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO, isValid, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, Timestamp } from 'firebase/firestore';


const translateStatus = (status: ServiceRequestStatus): string => {
  return status;
};

const statusOptions: { value: ServiceRequestStatus; label: string }[] = [
  { value: 'Orçamento', label: 'Orçamento' },
  { value: 'Andamento', label: 'Andamento' },
  { value: 'Pronto', label: 'Pronto' },
];


export function ServiceControlClient() {
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [serviceToEdit, setServiceToEdit] = useState<ServiceRequest | null>(null);
  const [isEditDialogLoading, setIsEditDialogLoading] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRequest | null>(null);
  const [serviceToView, setServiceToView] = useState<ServiceRequest | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ServiceRequestStatus | 'todos'>('todos');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const servicesCollection = collection(db, 'serviceRequests');
      const q = query(servicesCollection, orderBy('data', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedServices: ServiceRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let serviceDate = new Date().toISOString();

        if (data.data && typeof data.data.toDate === 'function') {
          serviceDate = (data.data as Timestamp).toDate().toISOString();
        } else if (data.data && typeof data.data === 'string') {
          const parsedDate = new Date(data.data);
          if (!isNaN(parsedDate.getTime())) {
            serviceDate = parsedDate.toISOString();
          }
        } else if (data.data && typeof data.data === 'number') {
           try {
                const dateFromNumber = new Date(data.data > 100000000000 ? data.data : data.data * 1000);
                if (!isNaN(dateFromNumber.getTime())) {
                    serviceDate = dateFromNumber.toISOString();
                }
            } catch (e) {
                console.warn(`Falha ao converter data numérica para o documento ${docSnap.id}:`, e);
            }
        }

        fetchedServices.push({
          id: docSnap.id,
          data: serviceDate,
          cliente: data.cliente || '',
          equipamento: data.equipamento || '',
          descricao: data.descricao || '',
          status: data.status || 'Orçamento',
          observacao: data.observacao,
          numeroOS: data.numeroOS,
        });
      });

      // Lógica para excluir OS antigas com status "Pronto"
      const sixtyOneDaysAgo = subDays(new Date(), 61);
      const servicesToDelete = fetchedServices.filter(service => {
        if (service.status !== 'Pronto' || !service.data || !isValid(parseISO(service.data))) {
          return false;
        }
        return parseISO(service.data) < sixtyOneDaysAgo;
      });

      if (servicesToDelete.length > 0) {
        const deletePromises = servicesToDelete.map(service => 
          deleteDoc(doc(db, 'serviceRequests', service.id))
        );
        await Promise.all(deletePromises);

        toast({
          title: "Limpeza Automática",
          description: `${servicesToDelete.length} Ordem(ns) de Serviço com status 'Pronto' há mais de 61 dias foram excluídas.`,
          variant: "default",
        });

        // Atualiza a lista de serviços removendo as que foram deletadas
        const remainingServices = fetchedServices.filter(s => !servicesToDelete.some(deleted => deleted.id === s.id));
        setServices(remainingServices);
      } else {
        setServices(fetchedServices);
      }
      
    } catch (error) {
      console.error("Erro ao buscar ou limpar ordens de serviço: ", error);
      toast({
        title: "Erro ao processar dados",
        description: "Não foi possível carregar ou limpar as Ordens de Serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceAdd = async (newServiceData: Omit<ServiceRequest, 'id'>) => {
    setIsLoading(true); // Use a general isLoading for add operations
    try {
      const { id, ...payloadWithoutId } = newServiceData as any;
      const firestorePayload = {
        ...payloadWithoutId,
        data: Timestamp.fromDate(parseISO(newServiceData.data)), // Ensure data is correctly parsed if coming as full ISO
      };
      await addDoc(collection(db, 'serviceRequests'), firestorePayload);
      toast({ title: "OS Adicionada", description: `OS para ${newServiceData.equipamento} foi adicionada com sucesso.` });
      await fetchServices();
    } catch (error) {
      console.error("Erro ao adicionar OS: ", error);
      toast({
        title: "Erro ao adicionar OS",
        description: "Não foi possível salvar a OS no Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditServiceRequest = (service: ServiceRequest) => {
    setServiceToEdit(service);
  };

  const handleServiceUpdate = async (updatedServiceData: ServiceRequest) => {
    if (!serviceToEdit) return;
    setIsEditDialogLoading(true);
    try {
      const serviceDocRef = doc(db, 'serviceRequests', serviceToEdit.id);
      const { id, ...payloadWithoutId } = updatedServiceData;
      const firestorePayload = {
        ...payloadWithoutId,
        data: Timestamp.fromDate(parseISO(updatedServiceData.data)), // Ensure data is correctly parsed
      };
      await updateDoc(serviceDocRef, firestorePayload);
      toast({ title: "OS Atualizada", description: `OS para ${updatedServiceData.equipamento} foi atualizada.` });
      setServiceToEdit(null);
      await fetchServices();
    } catch (error) {
      console.error("Erro ao atualizar OS: ", error);
      toast({
        title: "Erro ao atualizar OS",
        description: "Não foi possível atualizar a OS no Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsEditDialogLoading(false);
    }
  };


  const handleViewService = (service: ServiceRequest) => {
    setServiceToView(service);
  };

  const handleDeleteServiceRequest = (service: ServiceRequest) => {
    setServiceToDelete(service);
  };

  const confirmDeleteService = async () => {
    if (serviceToDelete) {
      setIsLoading(true); // Use general loading for delete
      try {
        await deleteDoc(doc(db, 'serviceRequests', serviceToDelete.id));
        toast({ title: "OS Excluída", description: `OS para ${serviceToDelete.equipamento} foi excluída.` });
        setServices(prevServices => prevServices.filter(s => s.id !== serviceToDelete.id));
        setServiceToDelete(null);
      } catch (error) {
        console.error("Erro ao excluir OS: ", error);
        toast({
          title: "Erro ao excluir OS",
          description: "Não foi possível remover a OS do Firestore.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStatusChange = async (serviceId: string, newStatus: ServiceRequestStatus) => {
    // Find the service in the current list to potentially update immediately
    const serviceToUpdate = services.find(s => s.id === serviceId);
    if (!serviceToUpdate) return;

    // Optimistically update UI
    setServices(prevServices =>
      prevServices.map(service =>
        service.id === serviceId ? { ...service, status: newStatus } : service
      )
    );
    
    try {
      const serviceDocRef = doc(db, 'serviceRequests', serviceId);
      await updateDoc(serviceDocRef, { status: newStatus });
      toast({ title: "Status Atualizado", description: `Status da OS ${serviceId.substring(0,6)}... alterado para ${translateStatus(newStatus)}.` });
      // No need to re-fetch if optimistic update is sufficient, or fetch if precise data is critical
      // await fetchServices(); 
    } catch (error) {
      console.error("Erro ao atualizar status: ", error);
      // Revert optimistic update on error
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === serviceId ? { ...service, status: serviceToUpdate.status } : service // Revert to original status
        )
      );
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da OS no Firestore. A alteração foi desfeita.",
        variant: "destructive",
      });
    }
  };

  const handleShareToWhatsApp = (service: ServiceRequest) => {
    let statusText = "";
    let descriptionLabel = "";
  
    switch (service.status) {
      case 'Pronto':
        statusText = "*✅PRONTO*";
        descriptionLabel = "FEITO";
        break;
      case 'Andamento':
        statusText = "*🕜ANDAMENTO*";
        descriptionLabel = "DESCRIÇÃO";
        break;
      case 'Orçamento':
        statusText = "*🗒ORÇAMENTO*";
        descriptionLabel = "DESCRIÇÃO";
        break;
      default:
        statusText = `*${service.status.toUpperCase()}*`;
        descriptionLabel = "DESCRIÇÃO";
    }
  
    const details = [
      statusText,
      "-----------------------------------------------------",
      `*CLIENTE:* ${service.cliente}`,
      `*EQUIPAMENTO:* ${service.equipamento}`,
      "-----------------------------------------------------",
      `*${descriptionLabel}:* ${service.descricao}`,
      "-----------------------------------------------------",
    ];
  
    const message = details.join('\n');
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast({ title: "Compartilhando OS", description: `Preparando para compartilhar detalhes da OS ${service.numeroOS || service.id.substring(0,6)}... no WhatsApp.`});
  };


  const getStatusBadgeVariant = (status: ServiceRequestStatus) => {
    switch (status) {
      case 'Pronto': return 'success';
      case 'Andamento': return 'warning';
      case 'Orçamento': return 'info';
      default: return 'default';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('todos');
    setSelectedDate(undefined);
    toast({title: "Filtros Limpos", description: "Todos os filtros foram removidos."})
  };

  const filteredServices = useMemo(() => {
    return services
      .filter(service => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          (service.cliente?.toLowerCase() || '').includes(searchTermLower) ||
          (service.equipamento?.toLowerCase() || '').includes(searchTermLower) ||
          (service.descricao?.toLowerCase() || '').includes(searchTermLower) ||
          (service.numeroOS?.toLowerCase() || '').includes(searchTermLower)
        );
      })
      .filter(service => {
        return selectedStatus === 'todos' || service.status === selectedStatus;
      })
      .filter(service => {
        if (!selectedDate) return true;
        // Ensure service.data is valid before parsing
        if (!service.data || !isValid(parseISO(service.data))) return false;
        const serviceDate = parseISO(service.data);
        return (
          serviceDate.getFullYear() === selectedDate.getFullYear() &&
          serviceDate.getMonth() === selectedDate.getMonth() &&
          serviceDate.getDate() === selectedDate.getDate()
        );
      })
      .sort((a,b) => {
        if (!a.data || !isValid(parseISO(a.data))) return 1;
        if (!b.data || !isValid(parseISO(b.data))) return -1;
        return parseISO(b.data).getTime() - parseISO(a.data).getTime()
      });
  }, [services, searchTerm, selectedStatus, selectedDate]);

  const totalServices = services.length;
  const orcamentoCount = services.filter(s => s.status === 'Orçamento').length;
  const andamentoCount = services.filter(s => s.status === 'Andamento').length;
  const prontoCount = services.filter(s => s.status === 'Pronto').length;

  const columnsForPdf = [
    { header: 'Nº OS', dataKey: 'numeroOS', align: 'center' as 'center' },
    { header: 'Cliente', dataKey: 'cliente', align: 'left' as 'left' },
    { header: 'Equipamento', dataKey: 'equipamento', align: 'left' as 'left' },
    { header: 'Descrição', dataKey: 'descricao', align: 'left' as 'left' },
    { header: 'Data', dataKey: 'data', align: 'center' as 'center' },
    { header: 'Status', dataKey: 'status', align: 'center' as 'center' },
  ];

  if (isLoading && services.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Controle de Ordens de Serviço</h1>
           <div className="flex gap-2">
            <Skeleton className="h-10 w-[220px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[50px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow">
            <Skeleton className="h-10 w-full lg:col-span-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="lg:col-span-4 flex justify-end">
                <Skeleton className="h-10 w-full sm:w-[150px]" />
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Controle de Ordens de Serviço</h1>
        <div className="flex gap-2">
          <PdfExportButton
            data={filteredServices}
            columns={columnsForPdf}
            dataLabel="Ordens de Serviço"
          />
          <AddServiceDialog onServiceAdd={handleServiceAdd} isLoading={isLoading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Orçamento</CardTitle>
            <FileClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orcamentoCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Andamento</CardTitle>
            <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{andamentoCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prontoCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por cliente, equipamento, OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ServiceRequestStatus | 'todos')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <div className="lg:col-span-4 flex justify-end">
             <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                <XIcon className="mr-2 h-4 w-4" />
                Limpar Filtros
            </Button>
        </div>
      </div>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Gerenciar Ordens de Serviço</CardTitle>
          <CardDescription>Visualize, adicione e gerencie todas as OS.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 && !isLoading ? (
            <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                {searchTerm || selectedStatus !== 'todos' || selectedDate ? 'Nenhuma OS encontrada com os filtros aplicados' : 'Nenhuma Ordem de Serviço no banco de dados.'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {services.length === 0 && !isLoading && !searchTerm && selectedStatus === 'todos' && !selectedDate ? "Nenhuma OS no banco de dados. " : ""}
                {searchTerm || selectedStatus !== 'todos' || selectedDate ? 'Tente ajustar seus filtros ou ' : ''}
                Adicione uma nova OS para começar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] hidden md:table-cell">Nº OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead className="hidden lg:table-cell">Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="hidden md:table-cell font-medium">{service.numeroOS || '-'}</TableCell>
                    <TableCell>{service.cliente}</TableCell>
                    <TableCell>{service.equipamento}</TableCell>
                    <TableCell className="hidden lg:table-cell truncate max-w-xs">{service.descricao}</TableCell>
                    <TableCell className="hidden md:table-cell">{service.data && isValid(parseISO(service.data)) ? format(parseISO(service.data), 'dd/MM/yyyy', { locale: ptBR }) : 'Data Inválida'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(service.status)}>{translateStatus(service.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewService(service)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditServiceRequest(service)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleShareToWhatsApp(service)}>
                            <Share2 className="mr-2 h-4 w-4" /> Compartilhar no WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                          {statusOptions.map(option => (
                            <DropdownMenuItem key={option.value} onClick={() => handleStatusChange(service.id, option.value)} disabled={service.status === option.value}>
                              Definir como {option.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteServiceRequest(service)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {serviceToEdit && (
        <EditServiceDialog
          initialData={serviceToEdit}
          onServiceUpdate={handleServiceUpdate}
          isOpen={!!serviceToEdit}
          onOpenChange={(open) => {
            if (!open) {
              setServiceToEdit(null);
            }
          }}
          isLoading={isEditDialogLoading}
        />
      )}

      {serviceToDelete && (
        <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto excluirá permanentemente a OS
                para o equipamento <span className="font-semibold">{serviceToDelete.equipamento}</span> do cliente <span className="font-semibold">{serviceToDelete.cliente}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {serviceToView && (
        <AlertDialog open={!!serviceToView} onOpenChange={() => setServiceToView(null)}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Detalhes da OS: {serviceToView.numeroOS || serviceToView.id.substring(0,6)}...
              </AlertDialogTitle>
              <AlertDialogDescription>
                Informações completas da Ordem de Serviço.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nº OS:</span>
                <span className="font-medium">{serviceToView.numeroOS || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{serviceToView.data && isValid(parseISO(serviceToView.data)) ? format(parseISO(serviceToView.data), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data Inválida'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{serviceToView.cliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipamento:</span>
                <span className="font-medium">{serviceToView.equipamento}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-muted-foreground">Descrição:</span>
                <p className="font-medium bg-muted/50 p-2 rounded-md mt-1">{serviceToView.descricao}</p>
              </div>
              {serviceToView.observacao && (
                <div className="flex flex-col text-left">
                  <span className="text-muted-foreground">Observação:</span>
                  <p className="font-medium bg-muted/50 p-2 rounded-md mt-1">{serviceToView.observacao}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={getStatusBadgeVariant(serviceToView.status)}>{translateStatus(serviceToView.status)}</Badge>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setServiceToView(null)}>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
