'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2 } from 'lucide-react';
import { suggestNote, type SuggestNoteInput } from '@/ai/flows/suggest-note';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface SuggestNoteButtonProps {
  onSuggestionReceived: (suggestion: string) => void;
}

export function SuggestNoteButton({ onSuggestionReceived }: SuggestNoteButtonProps) {
  const [serviceDetails, setServiceDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSuggestNotes = async () => {
    if (!serviceDetails.trim()) {
      toast({ title: "Detalhes Faltando", description: "Forneça detalhes do serviço para obter sugestões.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    try {
      const input: SuggestNoteInput = { serviceRecordDetails: serviceDetails };
      const result = await suggestNote(input);
      if (result.suggestedNotes && result.suggestedNotes.length > 0) {
        setSuggestions(result.suggestedNotes);
        toast({ title: "Sugestões Prontas", description: "A IA gerou algumas sugestões de anotações." });
      } else {
        toast({ title: "Nenhuma Sugestão", description: "A IA não conseguiu gerar sugestões para os detalhes fornecidos." });
      }
    } catch (error) {
      console.error("Erro ao sugerir anotações:", error);
      toast({ title: "Erro na Sugestão", description: "Falha ao obter sugestões da IA. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Assistente de Anotações IA</CardTitle>
        <CardDescription>Insira os detalhes do serviço abaixo e deixe a IA sugerir anotações relevantes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="serviceDetails">Detalhes do Registro de Serviço</Label>
          <Textarea
            id="serviceDetails"
            value={serviceDetails}
            onChange={(e) => setServiceDetails(e.target.value)}
            placeholder="ex.: Cliente João Silva, ID Serviço SR005, Problema: Impressora não funciona, tentou reiniciar, verificou cabos. Cliente frustrado."
            rows={4}
            data-ai-hint="service details"
          />
        </div>
        <Button onClick={handleSuggestNotes} disabled={isLoading}>
          <Wand2 className="mr-2 h-4 w-4" />
          {isLoading ? 'Gerando...' : 'Sugerir Anotações'}
        </Button>
        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Anotações Sugeridas:</h4>
            {suggestions.map((suggestion, index) => (
              <Alert key={index} className="bg-primary/10 border-primary/30">
                <Wand2 className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Sugestão {index + 1}</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                  {suggestion}
                  <Button variant="outline" size="sm" onClick={() => onSuggestionReceived(suggestion)}>Usar esta</Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
