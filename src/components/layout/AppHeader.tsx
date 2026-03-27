
import { SidebarTrigger } from '@/components/ui/sidebar';
// UserProfileDropdown import removed

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 flex h-16 items-center">
        <SidebarTrigger className="mr-4 md:hidden" /> 
        <div className="ml-auto flex items-center space-x-4">
          {/* UserProfileDropdown removed */}
        </div>
      </div>
    </header>
  );
}
