
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { ServiceCommission, ServiceType, CommissionStatus } from "@/types";
import { PlusCircle, HandCoins, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const addCommissionSchema = z.object({
  date: z.date({ required_error: "Data do serviço é obrigatória." }),
  clientName: z.string().min(1, "Nome do cliente é obrigatório."),
  serviceType: z.enum(['printer', 'toner', 'notebook'], { required_error: "Tipo de serviço é obrigatório."}),
  printerModel: z.string().optional(),
  serviceValue: z.coerce.number().min(0, "O valor do serviço não pode ser negativo."),
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
        message: "O valor do serviço deve ser maior que zero ou marcado como 'A Faturar'.",
        path: ["serviceValue"],
    });
  }
});

type AddCommissionFormData = z.infer<typeof addCommissionSchema>;

interface AddCommissionDialogProps {
  onCommissionAdd: (newCommissionData: Omit<ServiceCommission, 'id'>) => void;
}

export function AddCommissionDialog({ onCommissionAdd }: AddCommissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<AddCommissionFormData>({
    resolver: zodResolver(addCommissionSchema),
    defaultValues: {
      date: new Date(),
      clientName: "",
      serviceType: undefined,
      printerModel: "",
      serviceValue: 0,
      commissionPercentage: 10,
      serviceDescription: "",
      isPending: false,
    },
  });

  const watchedServiceType = useWatch({ control: form.control, name: 'serviceType' });
  const watchedIsPending = useWatch({ control: form.control, name: 'isPending' });

  const onSubmit = (data: AddCommissionFormData) => {
    const finalValue = data.isPending ? 0 : data.serviceValue;
    const commissionAmount = (finalValue * data.commissionPercentage) / 100;
    
    const newCommissionData: Omit<ServiceCommission, 'id'> = {
      ...data,
      serviceValue: finalValue,
      date: data.date.toISOString(),
      serviceType: data.serviceType as ServiceType,
      commissionAmount,
      status: "Registered" as CommissionStatus, 
    };
    onCommissionAdd(newCommissionData);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Comissão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HandCoins className="mr-2 h-5 w-5" /> Adicionar Nova Comissão
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo. Marque "A Faturar" se o valor ainda não estiver definido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Data</Label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientName" className="text-right">Cliente</Label>
            <Input id="clientName" {...form.register("clientName")} className="col-span-3" placeholder="Nome do cliente" />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label className="text-right pt-2">Tipo de Serviço</Label>
            <Controller
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value} 
                  className="col-span-3 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="printer" id="printer" />
                    <Label htmlFor="printer">Impressora</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="toner" id="toner" />
                    <Label htmlFor="toner">Toner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="notebook" id="notebook" />
                    <Label htmlFor="notebook">Notebook</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {(watchedServiceType === 'printer' || watchedServiceType === 'notebook') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="printerModel" className="text-right">Modelo</Label>
              <Input id="printerModel" {...form.register("printerModel")} className="col-span-3" placeholder={watchedServiceType === 'printer' ? "Ex: HP LaserJet M125a" : "Ex: Dell Vostro 3500"} />
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
                    id="isPending" 
                    checked={field.value} 
                    onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) form.setValue('serviceValue', 0);
                    }} 
                  />
                )}
              />
              <Label htmlFor="isPending" className="text-sm font-normal cursor-pointer">A Faturar (Valor não definido)</Label>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="serviceValue" className="text-right">Valor Serviço</Label>
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
                    id="serviceValue"
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
            <Label htmlFor="commissionPercentage" className="text-right">Comissão (%)</Label>
            <Input id="commissionPercentage" type="number" step="1" {...form.register("commissionPercentage")} className="col-span-3" placeholder="Ex: 10" />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="serviceDescription" className="text-right">Descrição</Label>
            <Textarea id="serviceDescription" {...form.register("serviceDescription")} className="col-span-3" placeholder="Descrição opcional"/>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adicionando..." : "Adicionar Comissão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
