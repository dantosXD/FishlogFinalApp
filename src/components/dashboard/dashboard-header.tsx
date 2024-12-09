import { Fish, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context'; // Updated import path
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardSidebar } from './dashboard-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import type { User } from '@/lib/pocketbase/types';
import { useState } from 'react';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false); // Manage Sheet state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center gap-4">
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 hover:bg-muted/50">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0">
                <DashboardSidebar
                  isMobile
                  onViewChange={() => setIsSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-2.5 font-semibold">
            <Fish className="h-5 w-5 text-primary" />
            <span className="text-lg">FishLog</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem className="flex-col items-start px-4 py-3">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{user.email}</div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()} className="gap-3 px-4">
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
