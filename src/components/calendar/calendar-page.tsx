import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EventDialog } from './event-dialog';
import { EventList } from './event-list';
import { useEvents } from '@/lib/hooks/use-events';
import { useAuth } from '@/lib/auth';

export function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { events, isLoading, addEvent } = useEvents(date);
  const { user } = useAuth();

  const handleAddEvent = async (eventData: any) => {
    if (!user) return;

    try {
      await addEvent({
        ...eventData,
        creator: user.id,
        participants: [user.id],
      });
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to add event:', error);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {date?.toLocaleDateString(undefined, { dateStyle: 'long' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventList events={events} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddEvent}
      />
    </div>
  );
}