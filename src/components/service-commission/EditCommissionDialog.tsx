
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { ServiceCommission, ServiceType, CommissionStatus } from "@/types";
import { Edit, HandCoins, CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const editCommissionSchema = z.object({
  date: z.date({ required_error: "Data do serviço é obrigatória." }),
  clientName: z.string().min(1, "Nome do cliente é obrigatório."),
  serviceType: z.enum(['printer', 'toner', 'notebook'], { required_error: "Tipo de serviço é obrigatório."}),
  printerModel: z.string().optional(),
  serviceValue: z.coerce.number().min(0, "O valor não pode ser negativo."),
  commissionPercentage: z.coerce.number().min(0, "Porcentagem não pode ser negativa.").max(100, "Porcentagem não pode ser maior que 100."),
  serviceDescription: z.string().optional(),
  isPending: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if ((data.serviceType === 'printer' || data.serviceType === 'notebook') && (!data.printerModel || data.printerModel.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Modelo é obrigatório para o tipo de serviço selecionado.",
      path: ["printerModel"],
    });
  }
  if (!data.isPending && data.serviceValue <= 0) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O valor deve ser maior que zero ou marcado como 'A Faturar'.",
        path: ["serviceValue"],
    });
  }
});

type EditCommissionFormData = z.infer<typeof editCommissionSchema>;

interface EditCommissionDialogProps {
  initialData: ServiceCommission;
  onCommissionUpdate: (updatedCommissionData: ServiceCommission) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCommissionDialog({ initialData, onCommissionUpdate, isOpen, onOpenChange }: EditCommissionDialogProps) {
  const form = useForm<EditCommissionFormData>({
    resolver: zodResolver(editCommissionSchema),
    defaultValues: {
      date: initialData.date ? parseISO(initialData.date) : new Date(),
      clientName: initialData.clientName || "",
      serviceType: initialData.serviceType || undefined,
      printerModel: initialData.printerModel || "",
      serviceValue: initialData.serviceValue || 0,
      commissionPercentage: initialData.commissionPercentage || 0,
      serviceDescription: initialData.serviceDescription || "",
      isPending: initialData.serviceValue === 0,
    },
  });

  const watchedServiceType = useWatch({ control: form.control, name: 'serviceType' });
  const watchedIsPending = useWatch({ control: form.control, name: 'isPending' });

  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        date: initialData.date ? parseISO(initialData.date) : new Date(),
        clientName: initialData.clientName,
        serviceType: initialData.serviceType,
        printerModel: initialData.printerModel || "",
        serviceValue: initialData.serviceValue,
        commissionPercentage: initialData.commissionPercentage,
        serviceDescription: initialData.serviceDescription || "",
        isPending: initialData.serviceValue === 0,
      });
    }
  }, [initialData, isOpen, form]);

  const onSubmit = (data: EditCommissionFormData) => {
    const finalValue = data.isPending ? 0 : data.serviceValue;
    const commissionAmount = (finalValue * data.commissionPercentage) / 100;
    
    const updatedCommissionData: ServiceCommission = {
      ...initialData,
      ...data,
      serviceValue: finalValue,
      date: data.date.toISOString(),
      serviceType: data.serviceType as ServiceType,
      commissionAmount,
    };
    onCommissionUpdate(updatedCommissionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5" /> Editar Comissão
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes abaixo. Marque "A Faturar" se o valor ainda for indefinido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-date" className="text-right">Data</Label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent>
                </Popover>
              )}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-clientName" className="text-right">Cliente</Label>
            <Input id="edit-clientName" {...form.register("clientName")} className="col-span-3" />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label className="text-right pt-2">Tipo de Serviço</Label>
            <Controller
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="col-span-3 flex flex-col sm:flex-row sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="printer" id="edit-printer" />
                    <Label htmlFor="edit-printer">Impressora</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="toner" id="edit-toner" />
                    <Label htmlFor="edit-toner">Toner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="notebook" id="edit-notebook" />
                    <Label htmlFor="edit-notebook">Notebook</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {(watchedServiceType === 'printer' || watchedServiceType === 'notebook') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-printerModel" className="text-right">Modelo</Label>
              <Input id="edit-printerModel" {...form.register("printerModel")} className="col-span-3" />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Opção</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Controller
                control={form.control}
                name="isPending"
                render={({ field }) => (
                  <Checkbox 
                    id="edit-isPending" 
                    checked={field.value} 
                    onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) form.setValue('serviceValue', 0);
                    }} 
                  />
                )}
              />
              <Label htmlFor="edit-isPending" className="text-sm font-normal cursor-pointer">A Faturar (Valor não definido)</Label>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-serviceValue" className="text-right">Valor Serviço</Label>
            <Controller
              control={form.control}
              name="serviceValue"
              render={({ field }) => {
                const displayValue = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(field.value || 0);

                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  const numberValue = rawValue ? parseInt(rawValue, 10) / 100 : 0;
                  field.onChange(numberValue);
                };

                return (
                  <Input 
                    id="edit-serviceValue"
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    className="col-span-3 font-mono font-bold text-primary"
                    disabled={watchedIsPending}
                  />
                );
              }}
            />
            {form.formState.errors.serviceValue && (
              <p className="col-span-4 text-right text-xs text-destructive">{form.formState.errors.serviceValue.message}</p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-commissionPercentage" className="text-right">Comissão (%)</Label>
            <Input id="edit-commissionPercentage" type="number" step="1" {...form.register("commissionPercentage")} className="col-span-3" />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-serviceDescription" className="text-right">Descrição</Label>
            <Textarea id="edit-serviceDescription" {...form.register("serviceDescription")} className="col-span-3" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
