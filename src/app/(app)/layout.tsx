
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import type { ReactNode } from 'react';
// Auth related imports and hooks removed: useAuth, useRouter, usePathname, useEffect, Skeleton, Loader2

export default function AppPagesLayout({ children }: { children: ReactNode }) {
  // Auth-related logic, loading states, and currentUser checks removed.
  // The layout now directly renders children without authentication checks.

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarRail />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-grow px-4 py-8">
            {children}
          </main>
          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="px-4 flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                © {new Date().getFullYear()} ServiceFlow Control. Gildeon Vieira.
              </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
