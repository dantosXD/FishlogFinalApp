import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, MapPin, Scale, Ruler } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStatistics } from '@/lib/hooks/use-statistics';
import { useAuth } from '@/lib/auth-context';

export function Statistics() {
  const { user } = useAuth();
  const { stats, isLoading } = useUserStatistics(user?.id || null);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-24 mb-2" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Catches</CardTitle>
            <Fish className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">0</div>
            <p className="text-sm text-muted-foreground">No catches yet</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">0</div>
            <p className="text-sm text-muted-foreground">No locations yet</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Biggest Catch</CardTitle>
            <Scale className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">0 lbs</div>
            <p className="text-sm text-muted-foreground">No catches yet</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Longest Catch</CardTitle>
            <Ruler className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">0"</div>
            <p className="text-sm text-muted-foreground">No catches yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total Catches</CardTitle>
          <Fish className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats.totalCatches}</div>
          <p className="text-sm text-muted-foreground">
            {stats.totalCatches === 0 ? 'No catches yet' : 'Catches logged'}
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Locations</CardTitle>
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats.locations}</div>
          <p className="text-sm text-muted-foreground">
            {stats.locations === 0 ? 'No locations yet' : 'Unique locations'}
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Biggest Catch</CardTitle>
          <Scale className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats.biggestCatch.weight} lbs</div>
          <p className="text-sm text-muted-foreground">
            {stats.biggestCatch.species} on{' '}
            {new Date(stats.biggestCatch.date).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Longest Catch</CardTitle>
          <Ruler className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{stats.longestCatch.length}"</div>
          <p className="text-sm text-muted-foreground">
            {stats.longestCatch.species} on{' '}
            {new Date(stats.longestCatch.date).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
