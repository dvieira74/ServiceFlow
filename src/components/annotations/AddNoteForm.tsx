
'use client';

import { useState, useEffect } from 'react';
import type { Annotation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddNoteFormProps {
  onNoteAdd: (newNoteData: Omit<Annotation, 'id' | 'date'> & { date?: string }) => void;
  initialServiceId?: string;
  suggestedText?: string;
  isSubmitting: boolean;
}

export function AddNoteForm({ onNoteAdd, initialServiceId = '', suggestedText = '', isSubmitting }: AddNoteFormProps) {
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [text, setText] = useState(suggestedText);
  const { toast } = useToast();

  useEffect(() => {
    setServiceId(initialServiceId);
  }, [initialServiceId]);

  useEffect(() => {
    setText(suggestedText);
  }, [suggestedText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId.trim()) {
      toast({
        title: "ID do Serviço Requerido",
        description: "Por favor, insira um ID de serviço.",
        variant: "destructive"
      });
      return;
    }
    if (!text.trim()) {
      toast({ title: "Texto Obrigatório", description: "Por favor, preencha o Texto da Anotação.", variant: "destructive" });
      return;
    }

    const authorName = 'Administrador'; // Styled as a more professional role

    const newNoteData: Omit<Annotation, 'id' | 'date'> = {
      serviceId: serviceId.toUpperCase(),
      text,
      author: authorName, 
      relatedTo: 'service',
    };
    onNoteAdd(newNoteData);
    setText('');
  };

  return (
    <Card className="shadow-sm border-none bg-background/60 backdrop-blur-sm h-full overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Nova Anotação
        </CardTitle>
        <CardDescription>Registre detalhes importantes do serviço.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="serviceId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID do Serviço</Label>
            <Input
              id="serviceId"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="Ex.: SR001"
              disabled={isSubmitting}
              className="bg-muted/30 border-none focus-visible:ring-primary font-mono uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo da Anotação</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="O que aconteceu neste serviço? Detalhes técnicos, peças trocadas..."
              rows={5}
              disabled={isSubmitting}
              className="bg-muted/30 border-none focus-visible:ring-primary resize-none leading-relaxed"
            />
          </div>
          <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Salvando...' : 'Registrar Agora'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
