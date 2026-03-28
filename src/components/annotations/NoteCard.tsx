
'use client';

import type { Annotation } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, CalendarDays, Edit, Trash2, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react'; 

interface NoteCardProps {
  note: Annotation;
  onEdit: (note: Annotation) => void;
  onDelete: (note: Annotation) => void;
  onShare: (note: Annotation) => void; 
}

export const NoteCard = React.memo(function NoteCard({ note, onEdit, onDelete, onShare }: NoteCardProps) {
  const formattedDate = format(new Date(note.date), "dd MMM, yyyy HH:mm", { locale: ptBR });

  return (
    <Card className="group relative shadow-sm hover:shadow-md transition-all duration-300 border-none bg-background overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      
      <CardHeader className="pb-3 pt-4 pl-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight text-primary">
              {note.serviceId}
            </CardTitle>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onShare(note)}>
                <Share2 className="mr-2 h-4 w-4 text-green-500" /> Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(note)}>
                <Edit className="mr-2 h-4 w-4 text-blue-500" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(note)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="py-2 pl-6 flex-grow">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-6">
          {note.text}
        </p>
      </CardContent>

      <CardFooter className="pb-4 pt-2 pl-6 mt-auto">
        <div className="flex items-center gap-2 pt-2 border-t w-full">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20 uppercase">
            {note.author.substring(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">{note.author}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Autor da Anotação</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
});

NoteCard.displayName = 'NoteCard';
