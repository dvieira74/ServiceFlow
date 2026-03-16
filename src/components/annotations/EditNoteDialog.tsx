
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Annotation } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const editNoteSchema = z.object({
  text: z.string().min(1, "O texto da anotação não pode estar em branco."),
});

type EditNoteFormData = z.infer<typeof editNoteSchema>;

interface EditNoteDialogProps {
  note: Annotation;
  onNoteUpdate: (updatedNote: Annotation) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
}

export function EditNoteDialog({ note, onNoteUpdate, isOpen, onOpenChange, isSubmitting }: EditNoteDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditNoteFormData>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: {
      text: note.text,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ text: note.text });
    }
  }, [note, isOpen, form]);

  const onSubmit = (data: EditNoteFormData) => {
    const updatedNote = { ...note, ...data };
    onNoteUpdate(updatedNote);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5" /> Editar Anotação
          </DialogTitle>
          <DialogDescription>
            Modifique o texto da anotação para o serviço <strong>{note.serviceId}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <Label htmlFor="edit-text" className="sr-only">
              Texto da Anotação
            </Label>
            <Textarea
              id="edit-text"
              {...form.register("text")}
              className="col-span-3 min-h-[120px]"
              placeholder="Digite sua anotação aqui..."
              disabled={isSubmitting}
            />
            {form.formState.errors.text && (
              <p className="col-span-1 text-xs text-destructive">{form.formState.errors.text.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
