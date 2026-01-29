import {
    createEvent,
    deleteEvent as deleteCalendarEvent,
    fetchCalendarEvents,
    fetchTaskItems,
    updateEvent as updateCalendarEvent,
    updateTaskCompletion,
} from '@/services/calendar';
import {
    CalendarEvent,
    CreateEventData,
    UpdateEventData,
} from '@/types/calendar';
import { useCallback, useEffect, useState } from 'react';

interface UseCalendarEventsOptions {
  startDate: Date;
  endDate: Date;
  autoFetch?: boolean;
}

export function useCalendarEvents(options: UseCalendarEventsOptions) {
  const { startDate, endDate, autoFetch = true } = options;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [eventsResult, tasksResult] = await Promise.allSettled([
        fetchCalendarEvents(startDate, endDate),
        fetchTaskItems(startDate, endDate),
      ]);

      if (eventsResult.status === 'rejected') {
        throw eventsResult.reason;
      }

      if (tasksResult.status === 'rejected') {
        console.warn('Failed to load tasks:', tasksResult.reason);
      }

      const fetchedEvents = eventsResult.value;
      const fetchedTasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];

      const merged = [...fetchedEvents, ...fetchedTasks].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      setEvents(merged);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load events');
      setError(error);
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (autoFetch) {
      loadEvents();
    }
  }, [loadEvents, autoFetch]);

  const addEvent = useCallback(
    async (eventData: CreateEventData) => {
      try {
        setIsLoading(true);
        setError(null);
        const newEvent = await createEvent(eventData);
        setEvents((prev) => [...prev, newEvent]);
        return newEvent;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create event');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateEvent = useCallback(
    async (eventData: UpdateEventData) => {
      try {
        setIsLoading(true);
        setError(null);
        const updatedEvent = await updateCalendarEvent(eventData);
        setEvents((prev) =>
          prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
        );
        return updatedEvent;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update event');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await deleteCalendarEvent(eventId);
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete event');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const toggleTaskComplete = useCallback(
    async (task: CalendarEvent) => {
      if (task.itemType !== 'task' || !task.taskListId) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const isCompleted = task.taskStatus !== 'completed';
        const updatedTask = await updateTaskCompletion(
          task.taskListId,
          task.id,
          isCompleted
        );
        setEvents((prev) =>
          prev.map((event) => (event.id === updatedTask.id ? updatedTask : event))
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update task');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toDateString();
      return events.filter((event) => {
        const eventDate = event.isAllDay
          ? new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate())
          : event.startDate;
        return eventDate.toDateString() === dateStr;
      });
    },
    [events]
  );

  return {
    events,
    isLoading,
    error,
    loadEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleTaskComplete,
    getEventsForDate,
    refresh: loadEvents,
  };
}
