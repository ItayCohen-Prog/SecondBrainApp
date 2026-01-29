import {
  createEvent,
  deleteEvent as deleteCalendarEvent,
  fetchCalendarEvents,
  fetchTaskItems,
  updateEvent as updateCalendarEvent,
  updateTaskCompletion,
} from '@/services/calendar';
import { CalendarEvent, CreateEventData, UpdateEventData } from '@/types/calendar';
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
  // Track which tasks are currently being toggled (for loading indicators)
  const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());

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

  const addEvent = useCallback(async (eventData: CreateEventData) => {
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
  }, []);

  const updateEvent = useCallback(async (eventData: UpdateEventData) => {
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
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
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
  }, []);

  const toggleTaskComplete = useCallback(async (task: CalendarEvent) => {
    if (task.itemType !== 'task' || !task.taskListId) {
      return;
    }

    const taskKey = `task-${task.id}`;
    const isCompleted = task.taskStatus !== 'completed';
    const newStatus = isCompleted ? 'completed' : 'needsAction';

    // Optimistic update - immediately update UI
    const optimisticTask: CalendarEvent = {
      ...task,
      taskStatus: newStatus as 'completed' | 'needsAction',
      taskCompletedAt: isCompleted ? new Date() : undefined,
    };

    setTogglingTasks((prev) => new Set(prev).add(taskKey));
    setEvents((prev) =>
      prev.map((event) =>
        event.itemType === 'task' && event.id === task.id ? optimisticTask : event
      )
    );

    try {
      setError(null);
      const updatedTask = await updateTaskCompletion(task.taskListId, task.id, isCompleted);
      // Update with server response (in case of any differences)
      setEvents((prev) =>
        prev.map((event) =>
          event.itemType === 'task' && event.id === updatedTask.id ? updatedTask : event
        )
      );
    } catch (err) {
      // Rollback on failure - restore original task state
      setEvents((prev) =>
        prev.map((event) => (event.itemType === 'task' && event.id === task.id ? task : event))
      );
      const error = err instanceof Error ? err : new Error('Failed to update task');
      setError(error);
      console.error('Task toggle failed:', error);
    } finally {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskKey);
        return next;
      });
    }
  }, []);

  const isTaskToggling = useCallback(
    (taskId: string) => togglingTasks.has(`task-${taskId}`),
    [togglingTasks]
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toDateString();
      return events.filter((event) => {
        const eventDate = event.isAllDay
          ? new Date(
              event.startDate.getFullYear(),
              event.startDate.getMonth(),
              event.startDate.getDate()
            )
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
    isTaskToggling,
    getEventsForDate,
    refresh: loadEvents,
  };
}
