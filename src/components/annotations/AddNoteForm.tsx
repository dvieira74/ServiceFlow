
'use client';

import { useState, useEffect } from 'react';
import type { Annotation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    const authorName = 'Usuário do Sistema';

    const newNoteData: Omit<Annotation, 'id' | 'date'> = {
      serviceId: serviceId,
      text,
      author: authorName, 
      relatedTo: 'service',
    };
    onNoteAdd(newNoteData);
    setText('');
  };

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline">Adicionar Nova Anotação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="serviceId">ID do Serviço</Label>
            <Input
              id="serviceId"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="Digite o ID do serviço (ex.: SR001)"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="text">Texto da Anotação</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite sua anotação aqui..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Adicionando...' : 'Adicionar Anotação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
