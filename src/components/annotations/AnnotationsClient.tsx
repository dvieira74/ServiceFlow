
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Annotation } from '@/types';
import { NoteCard } from './NoteCard';
import { AddNoteForm } from './AddNoteForm';
import { EditNoteDialog } from './EditNoteDialog'; // Importar o novo diálogo
import { SuggestNoteButton } from './SuggestNoteButton';
import { Input } from '@/components/ui/input';
import { MessageSquareText, Search, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';

export function AnnotationsClient() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedNoteText, setSuggestedNoteText] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<Annotation | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<Annotation | null>(null);
  const { toast } = useToast();

  const fetchAnnotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const annotationsCollection = collection(db, 'annotations');
      const q = query(annotationsCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedAnnotations: Annotation[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let annotationDate = new Date().toISOString(); 
        if (data.date?.toDate) {
          annotationDate = (data.date as Timestamp).toDate().toISOString();
        } else if (typeof data.date === 'string') {
          const parsedDate = new Date(data.date);
          if (!isNaN(parsedDate.getTime())) {
            annotationDate = parsedDate.toISOString();
          }
        }
        return {
          id: doc.id,
          serviceId: data.serviceId || '', 
          text: data.text || '', 
          author: data.author || 'Desconhecido', 
          date: annotationDate,
          relatedTo: data.relatedTo || 'service', 
        };
      });
      setAnnotations(fetchedAnnotations);
    } catch (error) {
      console.error("Erro ao buscar anotações: ", error);
      toast({
        title: "Erro ao buscar dados",
        description: "Não foi possível carregar as anotações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  const handleNoteAdd = async (noteData: Omit<Annotation, 'id' | 'date'> & { date?: string }) => {
    setIsSubmitting(true);
    try {
      const newNotePayload = { ...noteData, date: Timestamp.now() };
      await addDoc(collection(db, 'annotations'), newNotePayload);
      await fetchAnnotations(); 
      toast({ title: "Anotação Adicionada", description: `Anotação para o serviço ${noteData.serviceId} foi adicionada.` });
      setSuggestedNoteText('');
    } catch (error) {
      console.error("Erro ao adicionar anotação: ", error);
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoteUpdate = async (updatedNote: Annotation) => {
    setIsSubmitting(true);
    try {
      const { id, ...payload } = updatedNote;
      const noteDocRef = doc(db, 'annotations', id);
      await updateDoc(noteDocRef, payload);
      await fetchAnnotations();
      toast({ title: "Anotação Atualizada", description: "Suas alterações foram salvas." });
      setNoteToEdit(null);
    } catch (error) {
      console.error("Erro ao atualizar anotação: ", error);
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionReceived = (suggestion: string) => {
    setSuggestedNoteText(suggestion);
    document.getElementById('add-note-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleEditRequest = useCallback((note: Annotation) => {
    setNoteToEdit(note);
  }, []);

  const handleDeleteRequest = useCallback((note: Annotation) => {
    setNoteToDelete(note);
  }, []);

  const handleShareToWhatsApp = (note: Annotation) => {
    const formattedDate = format(new Date(note.date), "dd/MM/yyyy HH:mm");
    const details = [
      `*ANOTAÇÃO DE SERVIÇO*`,
      "-----------------------------------------------------",
      `*ID do Serviço:* ${note.serviceId}`,
      `*Data:* ${formattedDate}`,
      `*Autor:* ${note.author}`,
      "-----------------------------------------------------",
      `*Conteúdo:*`,
      note.text,
    ];
  
    const message = details.join('\n');
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast({ title: "Compartilhando Anotação", description: `Preparando para compartilhar detalhes da anotação para o serviço ${note.serviceId}... no WhatsApp.`});
  };

  const confirmDeleteNote = async () => {
    if (noteToDelete) {
      setIsSubmitting(true);
      try {
        await deleteDoc(doc(db, 'annotations', noteToDelete.id));
        setAnnotations(prev => prev.filter(note => note.id !== noteToDelete.id));
        toast({ title: "Anotação Excluída" });
      } catch (error) {
        console.error("Erro ao excluir anotação: ", error);
        toast({ title: "Erro ao excluir", variant: "destructive" });
      } finally {
        setNoteToDelete(null);
        setIsSubmitting(false);
      }
    }
  };

  const filteredAnnotations = useMemo(() => {
    return annotations.filter(note =>
      (note.serviceId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      note.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [annotations, searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Anotações</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div id="add-note-form-card">
            <AddNoteForm onNoteAdd={handleNoteAdd} suggestedText={suggestedNoteText} isSubmitting={isSubmitting} />
          </div>
          <SuggestNoteButton onSuggestionReceived={handleSuggestionReceived} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight font-headline mb-4">Anotações Existentes</h2>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar anotações por ID do Serviço, texto ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full max-w-md"
          />
        </div>

        {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-md animate-pulse">
                        <CardHeader className="pb-2"><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader>
                        <CardContent className="py-2 space-y-2">
                            <div className="h-4 w-full bg-muted rounded"></div>
                            <div className="h-4 w-3/4 bg-muted rounded"></div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-2"><div className="h-8 w-20 bg-muted rounded"></div></CardFooter>
                    </Card>
                ))}
            </div>
        ) : filteredAnnotations.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">Nenhuma anotação encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? "Tente ajustar seus termos de busca." : "Adicione uma nova anotação para começar."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnotations.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={handleEditRequest} onDelete={handleDeleteRequest} onShare={handleShareToWhatsApp} />
            ))}
          </div>
        )}
      </div>

      {noteToEdit && (
        <EditNoteDialog
          isOpen={!!noteToEdit}
          onOpenChange={() => setNoteToEdit(null)}
          note={noteToEdit}
          onNoteUpdate={handleNoteUpdate}
          isSubmitting={isSubmitting}
        />
      )}

      {noteToDelete && (
        <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto excluirá permanentemente a anotação para o serviço <span className="font-semibold">{noteToDelete.serviceId}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteNote} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
