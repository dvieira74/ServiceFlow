
'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceRequest, ServiceRequestStatus } from "@/types";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatISO, parse } from 'date-fns';

const addServiceSchema = z.object({
  data: z.string().refine((dateStr) => {
    // Verifica se a string pode ser parseada para uma data válida no formato yyyy-MM-dd
    const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    return !isNaN(parsedDate.getTime());
  }, "Data válida é obrigatória (AAAA-MM-DD)"),
  cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  equipamento: z.string().min(1, "Nome do equipamento é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  status: z.enum(['Orçamento', 'Andamento', 'Pronto']).default('Orçamento'),
  observacao: z.string().optional(),
  numeroOS: z.string().optional(),
});

type AddServiceFormData = z.infer<typeof addServiceSchema>;

interface AddServiceDialogProps {
  onServiceAdd: (newService: Omit<ServiceRequest, 'id'>) => void;
  isLoading: boolean;
}

export function AddServiceDialog({ onServiceAdd, isLoading }: AddServiceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<AddServiceFormData>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0], 
      cliente: "",
      equipamento: "",
      descricao: "",
      status: "Orçamento",
      observacao: "",
      numeroOS: "",
    },
  });

  const onSubmit = (data: AddServiceFormData) => {
    // A data do formulário (yyyy-MM-dd) já está como string.
    // Para consistência e para garantir que é um ISO string completo se precisar de hora,
    // podemos converter para um objeto Date e depois para ISO string.
    // Se a hora não for relevante, pode-se usar a data string diretamente,
    // mas para Timestamps do Firestore, é bom ter o ISO completo.
    const dateObject = parse(data.data, 'yyyy-MM-dd', new Date());

    const newServiceData: Omit<ServiceRequest, 'id'> = { 
      ...data, 
      data: formatISO(dateObject), // Converte para ISO string completo: "2023-10-26T00:00:00.000Z" (ou com fuso horário)
    };
    onServiceAdd(newServiceData);
    // Toast é agora tratado no ServiceControlClient após a operação no Firestore
    form.reset({ 
        data: new Date().toISOString().split('T')[0], 
        cliente: "",
        equipamento: "",
        descricao: "",
        status: "Orçamento",
        observacao: "",
        numeroOS: "",
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        form.reset({
            data: new Date().toISOString().split('T')[0], 
            cliente: "",
            equipamento: "",
            descricao: "",
            status: "Orçamento",
            observacao: "",
            numeroOS: "",
        });
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova OS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar uma nova OS.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data" className="text-right">
              Data
            </Label>
            <Input id="data" type="date" {...form.register("data")} className="col-span-3" />
            {form.formState.errors.data && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.data.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cliente" className="text-right">
              Cliente
            </Label>
            <Input id="cliente" {...form.register("cliente")} className="col-span-3" placeholder="Nome do cliente"/>
            {form.formState.errors.cliente && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.cliente.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equipamento" className="text-right">
              Equipamento
            </Label>
            <Input id="equipamento" {...form.register("equipamento")} className="col-span-3" placeholder="Ex: Impressora HP"/>
            {form.formState.errors.equipamento && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.equipamento.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">
              Descrição
            </Label>
            <Textarea id="descricao" {...form.register("descricao")} className="col-span-3" placeholder="Descreva o problema ou serviço"/>
             {form.formState.errors.descricao && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.descricao.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numeroOS" className="text-right">
              Nº da OS
            </Label>
            <Input id="numeroOS" {...form.register("numeroOS")} className="col-span-3" placeholder="Número da Ordem de Serviço (opcional)"/>
            {form.formState.errors.numeroOS && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.numeroOS.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observacao" className="text-right">
              Observação
            </Label>
            <Textarea id="observacao" {...form.register("observacao")} className="col-span-3" placeholder="Observações adicionais (opcional)"/>
             {form.formState.errors.observacao && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.observacao.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
                setIsOpen(false);
                form.reset({
                    data: new Date().toISOString().split('T')[0],
                    cliente: "",
                    equipamento: "",
                    descricao: "",
                    status: "Orçamento",
                    observacao: "",
                    numeroOS: "",
                });
            }}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting || isLoading ? "Adicionando..." : "Adicionar OS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
