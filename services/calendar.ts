import {
  CalendarEvent,
  CalendarEventsResponse,
  CreateEventData,
  EVENT_COLORS,
  GoogleCalendarEvent,
  UpdateEventData,
} from '@/types/calendar';
import { getAccessToken, refreshAccessToken } from './auth';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

type GoogleColorDefinition = {
  background: string;
  foreground: string;
};

type GoogleColorsResponse = {
  calendar?: Record<string, GoogleColorDefinition>;
  event?: Record<string, GoogleColorDefinition>;
};

async function fetchColorPalette(): Promise<GoogleColorsResponse> {
  const response = await makeRequest('/colors');
  return response.json();
}

async function fetchPrimaryCalendarInfo(): Promise<{ colorId?: string }> {
  const response = await makeRequest('/users/me/calendarList/primary');
  const data = await response.json();
  return { colorId: data.colorId };
}

function resolveEventDisplayColor(
  eventColorId: string | undefined,
  calendarColorId: string | undefined,
  palette: GoogleColorsResponse
): string {
  const eventColor = eventColorId ? palette.event?.[eventColorId]?.background : undefined;
  if (eventColor) return eventColor;

  const calendarColor = calendarColorId ? palette.calendar?.[calendarColorId]?.background : undefined;
  if (calendarColor) return calendarColor;

  return EVENT_COLORS.default.hex;
}

// ---------------------------

/**
 * Transform Google Calendar event to app format
 */
function transformGoogleEvent(
  googleEvent: GoogleCalendarEvent,
  colorPalette: GoogleColorsResponse,
  calendarColorId?: string
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
  const displayColor = resolveEventDisplayColor(
    googleEvent.colorId,
    calendarColorId,
    colorPalette
  );

  return {
    id: googleEvent.id,
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

    const colorPalette = await fetchColorPalette();

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
          transformGoogleEvent(item, colorPalette, calendar.colorId)
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

export async function createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
  try {
    const googleEvent = transformToGoogleEvent(eventData);
    const response = await makeRequest('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(googleEvent),
    });
    const createdEvent: GoogleCalendarEvent = await response.json();
    const [colorPalette, primaryCalendar] = await Promise.all([
      fetchColorPalette(),
      fetchPrimaryCalendarInfo(),
    ]);
    return transformGoogleEvent(createdEvent, colorPalette, primaryCalendar.colorId);
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
    const [colorPalette, primaryCalendar] = await Promise.all([
      fetchColorPalette(),
      fetchPrimaryCalendarInfo(),
    ]);
    return transformGoogleEvent(updatedEvent, colorPalette, primaryCalendar.colorId);
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
    const [colorPalette, primaryCalendar] = await Promise.all([
      fetchColorPalette(),
      fetchPrimaryCalendarInfo(),
    ]);
    return transformGoogleEvent(googleEvent, colorPalette, primaryCalendar.colorId);
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}
