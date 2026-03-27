
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
import React from 'react'; 

interface NoteCardProps {
  note: Annotation;
  onEdit: (note: Annotation) => void;
  onDelete: (note: Annotation) => void;
  onShare: (note: Annotation) => void; 
}

export const NoteCard = React.memo(function NoteCard({ note, onEdit, onDelete, onShare }: NoteCardProps) {

  return (
    <Card className="shadow-md flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold font-headline">{note.serviceId}</CardTitle>
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
            <div className="flex items-center">
                <UserCircle className="h-4 w-4 mr-1" />
                <span>{note.author}</span>
            </div>
            <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span>{new Date(note.date).toLocaleString('pt-BR', { timeZone: 'UTC' })}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <p className="text-sm whitespace-pre-wrap">{note.text}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onShare(note)}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Compartilhar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(note)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(note)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
});

NoteCard.displayName = 'NoteCard';
