
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Annotation } from '@/types';
import { NoteCard } from './NoteCard';
import { AddNoteForm } from './AddNoteForm';
import { EditNoteDialog } from './EditNoteDialog'; // Importar o novo diálogo
import { SuggestNoteButton } from './SuggestNoteButton';
import { Input } from '@/components/ui/input';
import { MessageSquareText, Search, Loader2, Sigma, CalendarDays, HandCoins } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const { totalNotes, totalThisMonth, totalAISuggested } = useMemo(() => {
    const now = new Date();
    const thisMonth = format(now, 'yyyy-MM');
    
    return {
      totalNotes: annotations.length,
      totalThisMonth: annotations.filter(a => format(parseISO(a.date), 'yyyy-MM') === thisMonth).length,
      totalAISuggested: annotations.filter(a => a.author.includes('IA') || a.author.includes('AI')).length || 0,
    };
  }, [annotations]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Anotações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie registros extras e observações sobre os serviços.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <span>{totalNotes} Registros</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Geral <Sigma className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotes}</div>
            <p className="text-xs text-muted-foreground mt-1">Anotações salvas no histórico</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Criadas este Mês <CalendarDays className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas em {format(new Date(), 'MMMM', { locale: ptBR })}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Sugestões de IA <HandCoins className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalAISuggested}</div>
            <p className="text-xs text-muted-foreground mt-1">Anotações geradas via assistente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div id="add-note-form-card">
            <AddNoteForm onNoteAdd={handleNoteAdd} suggestedText={suggestedNoteText} isSubmitting={isSubmitting} />
          </div>
          <SuggestNoteButton onSuggestionReceived={handleSuggestionReceived} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <h2 className="text-xl font-semibold tracking-tight font-headline">Histórico de Anotações</h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, texto ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>
          </div>

          {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                      <Card key={i} className="shadow-sm animate-pulse border-none bg-muted/30">
                          <CardHeader className="pb-2"><div className="h-6 w-1/3 bg-muted rounded"></div></CardHeader>
                          <CardContent className="py-2 space-y-2">
                              <div className="h-3 w-full bg-muted rounded"></div>
                              <div className="h-3 w-4/5 bg-muted rounded"></div>
                          </CardContent>
                          <CardFooter className="flex justify-end pt-2"><div className="h-8 w-8 bg-muted rounded-full"></div></CardFooter>
                      </Card>
                  ))}
              </div>
          ) : filteredAnnotations.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
              <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Nada por aqui</h3>
              <p className="mt-1 text-muted-foreground max-w-xs mx-auto">
                {searchTerm ? "Nenhum resultado para sua busca." : "Suas anotações aparecerão aqui assim que forem registradas."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAnnotations.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={handleEditRequest} onDelete={handleDeleteRequest} onShare={handleShareToWhatsApp} />
              ))}
            </div>
          )}
        </div>
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
              <AlertDialogTitle>Excluir Anotação?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá permanentemente a anotação para o serviço <span className="font-bold text-foreground">{noteToDelete.serviceId}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não, manter</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteNote} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
