import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, Thermometer, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { weatherService } from '@/lib/services/weather';

interface WeatherData {
  temperature: number;
  conditions: string;
  icon: 'sun' | 'cloud' | 'rain';
  location: string;
}

interface WeatherCardProps {
  isLoading?: boolean;
}

export function WeatherCard({ isLoading: initialLoading }: WeatherCardProps) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await weatherService.getCurrentWeather();
        setWeather(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load weather data';
        setError(message);
        toast({
          variant: 'destructive',
          title: 'Weather Error',
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [toast]);

  if (isLoading) {
    return (
      <Card className="md:w-[240px]">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Local Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="md:w-[240px]">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Local Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const WeatherIcon = (() => {
    switch (weather.icon) {
      case 'sun':
        return Sun;
      case 'rain':
        return CloudRain;
      default:
        return Cloud;
    }
  })();

  return (
    <Card className="md:w-[240px]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Local Weather</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <WeatherIcon className="h-8 w-8 text-yellow-500" />
          <div>
            <div className="flex items-center">
              <Thermometer className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{weather.temperature}°F</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Cloud className="mr-2 h-4 w-4" />
              <span>{weather.conditions}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{weather.location}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
