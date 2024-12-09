import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from './dashboard-header';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardContent } from './dashboard-content';

export function DashboardLayout() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'calendar' | 'groups'>('overview');

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar onViewChange={setCurrentView} /> {/* Desktop Sidebar */}
        <DashboardContent currentView={currentView} />
      </div>
    </div>
  );
}
