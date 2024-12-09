import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Users } from 'lucide-react';
import { useState } from 'react';

const items = [
  {
    title: 'Overview',
    icon: Home,
    href: '#',
    view: 'overview' as const,
  },
  // Calendar temporarily hidden
  {
    title: 'Groups',
    icon: Users,
    href: '#groups',
    view: 'groups' as const,
  },
];

interface DashboardSidebarProps {
  onViewChange?: (view: 'overview' | 'calendar' | 'groups') => void;
  isMobile?: boolean; // Added prop to determine mobile context
  onCloseSheet?: () => void; // Optional prop to close the sheet on mobile
}

export function DashboardSidebar({ onViewChange, isMobile = false, onCloseSheet }: DashboardSidebarProps) {
  const [selected, setSelected] = useState('Overview');

  const handleClick = (item: typeof items[0]) => {
    setSelected(item.title);
    onViewChange?.(item.view);
    if (isMobile && onCloseSheet) {
      onCloseSheet(); // Close the sheet after selecting an option
    }
  };

  return (
    <aside
      className={cn(
        isMobile
          ? 'block' // Display as block in mobile context
          : 'fixed hidden md:block', // Fixed and visible on medium and larger screens
        'h-[calc(100vh-3.5rem)] w-[240px] border-r bg-background'
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.title}
                variant={selected === item.title ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  selected === item.title && 'bg-muted'
                )}
                onClick={() => handleClick(item)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
