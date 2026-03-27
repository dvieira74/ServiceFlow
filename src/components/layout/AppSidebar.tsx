'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Percent, MessageSquarePlus, Settings, Users } from 'lucide-react'; 
import type { ReactNode } from 'react';
import { LogoIcon } from '@/components/icons/LogoIcon';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  segment: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: <Home />, segment: 'dashboard' },
  { href: '/service-commission', label: 'Comissão de Serviços', icon: <Percent />, segment: 'service-commission' },
  { href: '/annotations', label: 'Anotações', icon: <MessageSquarePlus />, segment: 'annotations' },
  { href: '/settings', label: 'Configurações', icon: <Settings />, segment: 'settings' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const currentSegment = pathname.split('/')[1] || navItems[0]?.segment || '';

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon className="h-7 w-7 text-primary" />
          <span className="font-bold sm:inline-block font-headline text-xl group-data-[collapsible=icon]:hidden">
            ServiceFlow
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={currentSegment === item.segment}
                tooltip={{ children: item.label, side: 'right', className: "ml-2"}}
                className="px-4" 
              >
                <Link href={item.href}>
                  {item.icon}
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Users className="h-8 w-8 text-muted-foreground" /> 
            <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden truncate">
              Modo Visitante
            </span>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}
