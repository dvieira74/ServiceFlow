
'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import type { ServiceRequest, ServiceRequestStatus } from "@/types";
import { Edit } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatISO, parse, isValid, parseISO } from 'date-fns';


const editServiceSchema = z.object({
  data: z.string().refine((dateStr) => {
    const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate);
  }, "Data válida é obrigatória (AAAA-MM-DD)"),
  cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  equipamento: z.string().min(1, "Nome do equipamento é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  status: z.enum(['Orçamento', 'Andamento', 'Pronto']),
  observacao: z.string().optional(),
  numeroOS: z.string().optional(),
});

type EditServiceFormData = z.infer<typeof editServiceSchema>;

interface EditServiceDialogProps {
  initialData: ServiceRequest;
  onServiceUpdate: (updatedService: ServiceRequest) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}

export function EditServiceDialog({ initialData, onServiceUpdate, isOpen, onOpenChange, isLoading }: EditServiceDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditServiceFormData>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      data: initialData.data ? formatISO(parseISO(initialData.data), { representation: 'date' }) : new Date().toISOString().split('T')[0],
      cliente: initialData.cliente || "",
      equipamento: initialData.equipamento || "",
      descricao: initialData.descricao || "",
      status: initialData.status || "Orçamento",
      observacao: initialData.observacao || "",
      numeroOS: initialData.numeroOS || "",
    },
  });

  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        data: initialData.data ? formatISO(parseISO(initialData.data), { representation: 'date' }) : new Date().toISOString().split('T')[0],
        cliente: initialData.cliente,
        equipamento: initialData.equipamento,
        descricao: initialData.descricao,
        status: initialData.status,
        observacao: initialData.observacao || "",
        numeroOS: initialData.numeroOS || "",
      });
    }
  }, [initialData, isOpen, form]);

  const onSubmit = (data: EditServiceFormData) => {
    // Convert yyyy-MM-dd string back to full ISO string for Firestore
    const dateObject = parse(data.data, 'yyyy-MM-dd', new Date());
    const updatedServiceData: ServiceRequest = {
      ...initialData, // Preserve ID and any other non-form fields
      ...data,
      data: formatISO(dateObject),
    };
    onServiceUpdate(updatedServiceData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        // Optionally reset form, or rely on useEffect to repopulate on next open
      }
    }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5" /> Editar Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes da OS abaixo. O status pode ser alterado diretamente na tabela.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-data" className="text-right">
              Data
            </Label>
            <Input id="edit-data" type="date" {...form.register("data")} className="col-span-3" />
            {form.formState.errors.data && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.data.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-cliente" className="text-right">
              Cliente
            </Label>
            <Input id="edit-cliente" {...form.register("cliente")} className="col-span-3" placeholder="Nome do cliente"/>
            {form.formState.errors.cliente && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.cliente.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-equipamento" className="text-right">
              Equipamento
            </Label>
            <Input id="edit-equipamento" {...form.register("equipamento")} className="col-span-3" placeholder="Ex: Impressora HP"/>
            {form.formState.errors.equipamento && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.equipamento.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-descricao" className="text-right">
              Descrição
            </Label>
            <Textarea id="edit-descricao" {...form.register("descricao")} className="col-span-3" placeholder="Descreva o problema ou serviço"/>
             {form.formState.errors.descricao && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.descricao.message}</p>
            )}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">
              Status
            </Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Orçamento">Orçamento</SelectItem>
                    <SelectItem value="Andamento">Andamento</SelectItem>
                    <SelectItem value="Pronto">Pronto</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.status && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-numeroOS" className="text-right">
              Nº da OS
            </Label>
            <Input id="edit-numeroOS" {...form.register("numeroOS")} className="col-span-3" placeholder="Número da Ordem de Serviço (opcional)"/>
            {form.formState.errors.numeroOS && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.numeroOS.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-observacao" className="text-right">
              Observação
            </Label>
            <Textarea id="edit-observacao" {...form.register("observacao")} className="col-span-3" placeholder="Observações adicionais (opcional)"/>
             {form.formState.errors.observacao && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.observacao.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting || isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

