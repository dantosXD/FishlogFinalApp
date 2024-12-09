import { useState } from 'react';
import { RecentCatches } from './recent-catches';
import { Statistics } from './statistics';
import { GroupsPage } from '../groups/groups-page';
import { useAuth } from '@/lib/auth-context';

interface DashboardContentProps {
  currentView: 'overview' | 'calendar' | 'groups';
}

export function DashboardContent({ currentView }: DashboardContentProps) {
  const { user } = useAuth();
  const [isLoading] = useState(true);

  const renderContent = () => {
    if (!user) return null;

    switch (currentView) {
      case 'groups':
        return <GroupsPage />;
      default:
        return (
          <div className="container py-8 space-y-10 px-4 md:px-6">
            <Statistics />
            <RecentCatches user={user} isLoading={isLoading} />
          </div>
        );
    }
  };

  return (
    <main className="flex-1 md:ml-[240px] min-h-[calc(100vh-3.5rem)] bg-background/50">
      {renderContent()}
    </main>
  );
}
