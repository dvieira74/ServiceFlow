
'use client';

import { useEffect, useState } from 'react';
// Link import removed as it's no longer used for profile navigation
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
// Button import removed as it's no longer used for profile navigation
import { Settings as SettingsIcon, Sun, Moon, Laptop, Bell, Mail, ListChecks, MessageSquarePlus, PercentIcon } from 'lucide-react'; // User icon removed
import { useTheme } from 'next-themes';
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<string | undefined>(undefined);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appOsUpdates, setAppOsUpdates] = useState(true);
  const [appNewCommission, setAppNewCommission] = useState(true);
  const [appNewNote, setAppNewNote] = useState(false);

  useEffect(() => {
    if (resolvedTheme) {
      setSelectedTheme(theme === 'system' ? 'system' : resolvedTheme);
    }
  }, [resolvedTheme, theme]);

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    setTheme(value);
  };
  
  const currentRadioValue = selectedTheme || (theme === 'system' ? 'system' : resolvedTheme) || 'system';

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
        <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
        Configurações
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={currentRadioValue} onValueChange={handleThemeChange} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center cursor-pointer">
                <Sun className="mr-2 h-5 w-5" />
                Claro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center cursor-pointer">
                <Moon className="mr-2 h-5 w-5" />
                Escuro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center cursor-pointer">
                <Laptop className="mr-2 h-5 w-5" />
                Sistema
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Card de Conta removido */}
      {/* 
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>Gerencie as informações da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button variant="outline" asChild>
            <Link href="/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Ir para Meu Perfil
            </Link>
          </Button>
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg mt-4">
            <p className="text-muted-foreground">Outras opções de conta em breve.</p>
          </div>
        </CardContent>
      </Card>
      */}

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" />Notificações</CardTitle>
          <CardDescription>Escolha como você deseja ser notificado sobre atividades importantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base font-medium flex items-center">
                <Mail className="mr-2 h-4 w-4 text-primary" />
                Notificações por Email
              </Label>
              <p className="text-sm text-muted-foreground pl-6">
                Receba alertas e resumos importantes diretamente no seu email.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-0.5">
              <Label htmlFor="app-os-updates" className="text-base font-medium flex items-center">
                <ListChecks className="mr-2 h-4 w-4 text-primary" />
                Atualizações de OS (No App)
              </Label>
              <p className="text-sm text-muted-foreground pl-6">
                Alertas sobre criação ou mudança de status de Ordens de Serviço.
              </p>
            </div>
            <Switch
              id="app-os-updates"
              checked={appOsUpdates}
              onCheckedChange={setAppOsUpdates}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-0.5">
              <Label htmlFor="app-new-commission" className="text-base font-medium flex items-center">
                 <PercentIcon className="mr-2 h-4 w-4 text-primary" />
                Novas Comissões (No App)
              </Label>
              <p className="text-sm text-muted-foreground pl-6">
                Seja notificado quando novas comissões forem registradas.
              </p>
            </div>
            <Switch
              id="app-new-commission"
              checked={appNewCommission}
              onCheckedChange={setAppNewCommission}
            />
          </div>
          
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-0.5">
              <Label htmlFor="app-new-note" className="text-base font-medium flex items-center">
                <MessageSquarePlus className="mr-2 h-4 w-4 text-primary" />
                Anotações Relevantes (No App)
              </Label>
              <p className="text-sm text-muted-foreground pl-6">
                Alertas quando uma nova anotação for adicionada a um serviço que você acompanha.
              </p>
            </div>
            <Switch
              id="app-new-note"
              checked={appNewNote}
              onCheckedChange={setAppNewNote}
            />
          </div>
          <p className="text-xs text-muted-foreground pt-2 text-center">
            A entrega real das notificações (email, push, etc.) e o armazenamento destas preferências serão implementados em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
