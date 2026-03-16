
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  // All auth-related state and logic removed.
  // This page now serves as a placeholder.

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <UserCircle className="h-16 w-16 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Perfil
          </h1>
          <p className="text-muted-foreground">Gerenciamento de perfil de usuário.</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
          <CardDescription>Funcionalidade de perfil de usuário não está ativa nesta versão.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <ShieldAlert className="h-10 w-10 text-muted-foreground mr-2" />
                <p className="text-muted-foreground">A autenticação e os perfis de usuário foram desabilitados.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
