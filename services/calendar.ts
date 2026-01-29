import {
  CalendarEvent,
  CalendarEventsResponse,
  CreateEventData,
  EVENT_COLORS,
  GoogleCalendarEvent,
  GoogleTask,
  GoogleTaskList,
  TaskStatus,
  UpdateEventData,
} from '@/types/calendar';
import { getAccessToken, refreshAccessToken } from './auth';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

/**
 * Modern Google Calendar Event Colors (vibrant, not the legacy API palette)
 * These match the Google Calendar web UI appearance
 */
const MODERN_EVENT_COLORS: Record<string, { light: string; dark: string }> = {
  '1':  { light: '#7986cb', dark: '#8e99f3' },  // Lavender
  '2':  { light: '#33b679', dark: '#2bb673' },  // Sage
  '3':  { light: '#8e24aa', dark: '#b39ddb' },  // Grape
  '4':  { light: '#e67c73', dark: '#e67c73' },  // Flamingo
  '5':  { light: '#f6bf26', dark: '#f09300' },  // Banana
  '6':  { light: '#f4511e', dark: '#f4511e' },  // Tangerine
  '7':  { light: '#039be5', dark: '#039be5' },  // Peacock
  '8':  { light: '#616161', dark: '#757575' },  // Graphite
  '9':  { light: '#3f51b5', dark: '#5c6bc0' },  // Blueberry
  '10': { light: '#0b8043', dark: '#0b8043' },  // Basil
  '11': { light: '#d50000', dark: '#d81b60' },  // Tomato
};

/**
 * Modern Google Calendar Colors (for calendars, IDs 1-24)
 * Maps legacy API backgroundColor to modern vibrant equivalents
 */
const LEGACY_TO_MODERN_CALENDAR_COLORS: Record<string, { light: string; dark: string }> = {
  '#ac725e': { light: '#795548', dark: '#8d6e63' },  // Cocoa
  '#d06b64': { light: '#e67c73', dark: '#e67c73' },  // Flamingo
  '#f83a22': { light: '#d50000', dark: '#e53935' },  // Tomato
  '#fa573c': { light: '#f4511e', dark: '#f4511e' },  // Tangerine
  '#ff7537': { light: '#ef6c00', dark: '#ff9800' },  // Pumpkin
  '#ffad46': { light: '#f6bf26', dark: '#f09300' },  // Mango
  '#42d692': { light: '#33b679', dark: '#2bb673' },  // Eucalyptus
  '#16a765': { light: '#0b8043', dark: '#43a047' },  // Basil
  '#7bd148': { light: '#7cb342', dark: '#8bc34a' },  // Pistachio
  '#b3dc6c': { light: '#c0ca33', dark: '#d4e157' },  // Avocado
  '#fbe983': { light: '#e4c441', dark: '#fdd835' },  // Citron
  '#fad165': { light: '#f6bf26', dark: '#f09300' },  // Banana
  '#92e1c0': { light: '#33b679', dark: '#57bb8a' },  // Sage
  '#9fe1e7': { light: '#039be5', dark: '#4fc3f7' },  // Peacock
  '#9fc6e7': { light: '#4285f4', dark: '#64b5f6' },  // Cobalt
  '#4986e7': { light: '#3f51b5', dark: '#5c6bc0' },  // Blueberry
  '#9a9cff': { light: '#7986cb', dark: '#8e99f3' },  // Lavender
  '#b99aff': { light: '#b39ddb', dark: '#ce93d8' },  // Wisteria
  '#c2c2c2': { light: '#616161', dark: '#757575' },  // Graphite
  '#cabdbf': { light: '#a79b8e', dark: '#bcaaa4' },  // Birch
  '#cca6ac': { light: '#ad1457', dark: '#c2185b' },  // Radicchio
  '#f691b2': { light: '#d81b60', dark: '#ec407a' },  // Cherry
  '#cd74e6': { light: '#8e24aa', dark: '#ab47bc' },  // Grape
  '#a47ae2': { light: '#7b1fa2', dark: '#9c27b0' },  // Amethyst
  // Additional common variations
  '#007b83': { light: '#00796b', dark: '#26a69a' },  // Teal variant
};

const DEFAULT_COLOR = { light: '#039be5', dark: '#039be5' }; // Peacock

async function fetchPrimaryCalendarInfo(): Promise<{ backgroundColor?: string }> {
  const response = await makeRequest('/users/me/calendarList/primary');
  const data = await response.json();
  return { backgroundColor: data.backgroundColor };
}

function resolveEventDisplayColor(
  eventColorId: string | undefined,
  calendarBackgroundColor: string | undefined,
  isDarkMode: boolean = false
): string {
  // 1. If event has colorId, use modern event palette
  if (eventColorId && MODERN_EVENT_COLORS[eventColorId]) {
    const color = isDarkMode 
      ? MODERN_EVENT_COLORS[eventColorId].dark 
      : MODERN_EVENT_COLORS[eventColorId].light;
    return color;
  }

  // 2. If no event colorId, map calendar backgroundColor to modern equivalent
  if (calendarBackgroundColor) {
    const lowerBg = calendarBackgroundColor.toLowerCase();
    if (LEGACY_TO_MODERN_CALENDAR_COLORS[lowerBg]) {
      const color = isDarkMode
        ? LEGACY_TO_MODERN_CALENDAR_COLORS[lowerBg].dark
        : LEGACY_TO_MODERN_CALENDAR_COLORS[lowerBg].light;
      return color;
    }
    // If not in map, return original (might be custom)
    return calendarBackgroundColor;
  }

  return isDarkMode ? DEFAULT_COLOR.dark : DEFAULT_COLOR.light;
}

// ---------------------------

/**
 * Transform Google Calendar event to app format
 */
function transformGoogleEvent(
  googleEvent: GoogleCalendarEvent,
  calendarBackgroundColor?: string
): CalendarEvent {
  const startDate = googleEvent.start.dateTime
    ? new Date(googleEvent.start.dateTime)
    : new Date(googleEvent.start.date!);
  const endDate = googleEvent.end.dateTime
    ? new Date(googleEvent.end.dateTime)
    : new Date(googleEvent.end.date!);
  const isAllDay = !googleEvent.start.dateTime;

  // Default setup
  let color: CalendarEvent['color'] = 'default';
  // Using light mode colors for now; dark mode handled in UI
  const displayColor = resolveEventDisplayColor(
    googleEvent.colorId,
    calendarBackgroundColor,
    false // Light mode - dark mode styling handled in UI layer
  );

  return {
    id: googleEvent.id,
    itemType: 'event',
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description,
    startDate,
    endDate,
    location: googleEvent.location,
    color,
    displayColor, 
    isAllDay,
    htmlLink: googleEvent.htmlLink,
    attendees: googleEvent.attendees,
  };
}

function transformGoogleTask(
  googleTask: GoogleTask,
  taskListId: string
): CalendarEvent | null {
  if (!googleTask.due) {
    return null;
  }

  const dueDate = new Date(googleTask.due);
  const taskStatus: TaskStatus = googleTask.status ?? 'needsAction';

  return {
    id: googleTask.id,
    itemType: 'task',
    title: googleTask.title || 'Untitled Task',
    description: googleTask.notes,
    startDate: dueDate,
    endDate: dueDate,
    location: undefined,
    color: 'default',
    displayColor: EVENT_COLORS.default.hex,
    isAllDay: true,
    taskStatus,
    taskListId,
    taskCompletedAt: googleTask.completed ? new Date(googleTask.completed) : undefined,
  };
}

/**
 * Transform app event format to Google Calendar format
 */
function transformToGoogleEvent(
  eventData: CreateEventData | UpdateEventData
): Partial<GoogleCalendarEvent> {
  const colorConfig = eventData.color
    ? EVENT_COLORS[eventData.color]
    : EVENT_COLORS.default;

  const googleEvent: Partial<GoogleCalendarEvent> = {
    summary: eventData.title,
    description: eventData.description,
    location: eventData.location,
    colorId: colorConfig.googleColorId,
  };

  if (eventData.isAllDay) {
    const startDate = eventData.startDate.toISOString().split('T')[0];
    const endDate = eventData.endDate.toISOString().split('T')[0];
    googleEvent.start = { date: startDate };
    googleEvent.end = { date: endDate };
  } else {
    googleEvent.start = {
      dateTime: eventData.startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    googleEvent.end = {
      dateTime: eventData.endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  return googleEvent;
}

/**
 * Make authenticated request to Google Calendar API
 */
async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Authentication failed');
    }

    return fetch(`${CALENDAR_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  return response;
}

async function makeTasksRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${TASKS_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Authentication failed');
    }

    return fetch(`${TASKS_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  return response;
}

/**
 * Fetch calendar events for a date range
 */
export async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const calendarsResponse = await makeRequest('/users/me/calendarList');
    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];
    
    console.log(`Found ${calendars.length} calendars`);
    calendars.forEach((cal: any) => {
      console.log(`Calendar: "${cal.summary}", ID: ${cal.colorId}, BG: ${cal.backgroundColor}`);
    });

    const eventPromises = calendars.map(async (calendar: any) => {
      if (!calendar.selected) return [];

      try {
        const response = await makeRequest(
          `/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
        );
        const data: CalendarEventsResponse = await response.json();
        return (data.items || []).map(item =>
          transformGoogleEvent(item, calendar.backgroundColor)
        );
      } catch (err) {
        console.warn(`Failed to fetch events for calendar ${calendar.summary}`, err);
        return [];
      }
    });

    const results = await Promise.all(eventPromises);
    const allEvents = results.flat();
    
    // Sort events by start time
    allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    console.log(`Total events found: ${allEvents.length}`);
    
    return allEvents;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export async function fetchTaskItems(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const dueMin = startDate.toISOString();
    const dueMax = endDate.toISOString();

    const listsResponse = await makeTasksRequest('/users/@me/lists');
    const listsData = await listsResponse.json();
    const lists: GoogleTaskList[] = listsData.items || [];

    const taskPromises = lists.map(async (list) => {
      try {
        const response = await makeTasksRequest(
          `/lists/${encodeURIComponent(list.id)}/tasks?showCompleted=true&showHidden=true&showDeleted=false&dueMin=${encodeURIComponent(dueMin)}&dueMax=${encodeURIComponent(dueMax)}`
        );
        const data = await response.json();
        return (data.items || [])
          .map((task: GoogleTask) => transformGoogleTask(task, list.id))
          .filter(Boolean) as CalendarEvent[];
      } catch (err) {
        console.warn(`Failed to fetch tasks for list ${list.title}`, err);
        return [];
      }
    });

    const results = await Promise.all(taskPromises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function updateTaskCompletion(
  taskListId: string,
  taskId: string,
  isCompleted: boolean
): Promise<CalendarEvent> {
  try {
    const payload: Partial<GoogleTask> = {
      status: isCompleted ? 'completed' : 'needsAction',
      completed: isCompleted ? new Date().toISOString() : undefined,
    };

    const response = await makeTasksRequest(
      `/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    const updatedTask: GoogleTask = await response.json();
    const transformed = transformGoogleTask(updatedTask, taskListId);
    if (!transformed) {
      throw new Error('Task is missing a due date');
    }
    return transformed;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
  try {
    const googleEvent = transformToGoogleEvent(eventData);
    const response = await makeRequest('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(googleEvent),
    });
    const createdEvent: GoogleCalendarEvent = await response.json();
    const primaryCalendar = await fetchPrimaryCalendarInfo();
    return transformGoogleEvent(createdEvent, primaryCalendar.backgroundColor);
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

export async function updateEvent(eventData: UpdateEventData): Promise<CalendarEvent> {
  try {
    const { id, ...updateData } = eventData;
    const googleEvent = transformToGoogleEvent(updateData as CreateEventData);
    const response = await makeRequest(`/calendars/primary/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(googleEvent),
    });
    const updatedEvent: GoogleCalendarEvent = await response.json();
    const primaryCalendar = await fetchPrimaryCalendarInfo();
    return transformGoogleEvent(updatedEvent, primaryCalendar.backgroundColor);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await makeRequest(`/calendars/primary/events/${eventId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

export async function getEvent(eventId: string): Promise<CalendarEvent> {
  try {
    const response = await makeRequest(`/calendars/primary/events/${eventId}`);
    const googleEvent: GoogleCalendarEvent = await response.json();
    const primaryCalendar = await fetchPrimaryCalendarInfo();
    return transformGoogleEvent(googleEvent, primaryCalendar.backgroundColor);
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}
