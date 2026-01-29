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

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function colorDistance(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Find closest vibrant EventColor hex from our palette
 */
function findClosestVibrantColorHex(fadedHex: string): string {
  let minDistance = Infinity;
  let closestHex = EVENT_COLORS.default.hex;

  Object.values(EVENT_COLORS).forEach((config) => {
    // Skip default if you want specific colors, but default is also a valid vibrant blue
    const distance = colorDistance(fadedHex, config.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closestHex = config.hex;
    }
  });
  
  return closestHex;
}

function findColorNameByHex(hex: string): CalendarEvent['color'] {
  let minDistance = Infinity;
  let closestColor: CalendarEvent['color'] = 'default';

  Object.entries(EVENT_COLORS).forEach(([name, config]) => {
    const distance = colorDistance(hex, config.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = name as CalendarEvent['color'];
    }
  });
  
  return closestColor;
}

// ---------------------------

/**
 * Transform Google Calendar event to app format
 */
function transformGoogleEvent(
  googleEvent: GoogleCalendarEvent, 
  calendarColorHex?: string,
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
  let displayColor: string = EVENT_COLORS.default.hex;

  // Helper to find config by ID
  const findConfigById = (id: string) => Object.values(EVENT_COLORS).find(
    (c) => c.googleColorId && String(c.googleColorId) === String(id)
  );

  if (googleEvent.colorId) {
    // Case 1: Event has specific color (Use exact ID match)
    const colorConfig = findConfigById(googleEvent.colorId);
    if (colorConfig) {
      color = colorConfig.name;
      displayColor = colorConfig.hex;
    } else {
      console.log('Unknown event colorId:', googleEvent.colorId);
    }
  } else if (calendarColorId) {
    // Case 2: Inherit from Calendar ID (Use exact ID match)
    const colorConfig = findConfigById(calendarColorId);
    if (colorConfig) {
      color = colorConfig.name;
      displayColor = colorConfig.hex;
    } else if (calendarColorHex) {
      // Fallback: Use hex matching if ID not found (e.g. custom color)
      displayColor = findClosestVibrantColorHex(calendarColorHex);
      color = findColorNameByHex(displayColor);
    }
  } else if (calendarColorHex) {
    // Case 3: Only have hex (e.g. custom color)
    displayColor = findClosestVibrantColorHex(calendarColorHex);
    color = findColorNameByHex(displayColor);
  }

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
        return (data.items || []).map(item => transformGoogleEvent(item, calendar.backgroundColor, calendar.colorId));
      } catch (err) {
        console.warn(`Failed to fetch events for calendar ${calendar.summary}`, err);
        return [];
      }
    });

    const results = await Promise.all(eventPromises);
    const allEvents = results.flat();
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
    return transformGoogleEvent(createdEvent);
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
    return transformGoogleEvent(updatedEvent);
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
    return transformGoogleEvent(googleEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}
