/**
 * Type definitions for Google Calendar integration
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  htmlLink?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

export type TaskStatus = 'needsAction' | 'completed';

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status?: TaskStatus;
  completed?: string;
}

export interface CalendarEvent {
  id: string;
  itemType: 'event' | 'task';
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  color: EventColor;
  displayColor?: string; // The exact hex color for display
  isAllDay: boolean;
  htmlLink?: string;
  taskStatus?: TaskStatus;
  taskListId?: string;
  taskCompletedAt?: Date;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export type EventColor = 
  | 'cocoa'
  | 'flamingo'
  | 'tomato'
  | 'tangerine'
  | 'pumpkin'
  | 'mango'
  | 'eucalyptus'
  | 'basil'
  | 'pistachio'
  | 'avocado'
  | 'citron'
  | 'banana'
  | 'sage'
  | 'peacock'
  | 'cobalt'
  | 'blueberry'
  | 'lavender'
  | 'wisteria'
  | 'graphite'
  | 'birch'
  | 'radicchio'
  | 'cherry'
  | 'grape'
  | 'amethyst'
  | 'default';

export interface EventColorConfig {
  id: string;
  name: EventColor;
  hex: string;
  googleColorId?: string;
}

export const EVENT_COLORS: Record<EventColor, EventColorConfig> = {
  cocoa: { id: '1', name: 'cocoa', hex: '#795548' },
  flamingo: { id: '2', name: 'flamingo', hex: '#e67c73', googleColorId: '4' },
  tomato: { id: '3', name: 'tomato', hex: '#d50000', googleColorId: '11' },
  tangerine: { id: '4', name: 'tangerine', hex: '#f4511e', googleColorId: '6' },
  pumpkin: { id: '5', name: 'pumpkin', hex: '#ef6c00' },
  mango: { id: '6', name: 'mango', hex: '#f09300' },
  eucalyptus: { id: '7', name: 'eucalyptus', hex: '#009688' },
  basil: { id: '8', name: 'basil', hex: '#0b8043', googleColorId: '10' },
  pistachio: { id: '9', name: 'pistachio', hex: '#7cb342' },
  avocado: { id: '10', name: 'avocado', hex: '#c0ca33' },
  citron: { id: '11', name: 'citron', hex: '#e4c441' },
  banana: { id: '12', name: 'banana', hex: '#f6bf26', googleColorId: '5' },
  sage: { id: '13', name: 'sage', hex: '#33b679', googleColorId: '2' },
  peacock: { id: '14', name: 'peacock', hex: '#039be5', googleColorId: '7' },
  cobalt: { id: '15', name: 'cobalt', hex: '#4285f4' }, // Google Blue
  blueberry: { id: '16', name: 'blueberry', hex: '#3f51b5', googleColorId: '9' },
  lavender: { id: '17', name: 'lavender', hex: '#7986cb', googleColorId: '1' },
  wisteria: { id: '18', name: 'wisteria', hex: '#b39ddb' },
  graphite: { id: '19', name: 'graphite', hex: '#616161', googleColorId: '8' },
  birch: { id: '20', name: 'birch', hex: '#a79b8e' },
  radicchio: { id: '21', name: 'radicchio', hex: '#ad1457' },
  cherry: { id: '22', name: 'cherry', hex: '#d81b60' },
  grape: { id: '23', name: 'grape', hex: '#8e24aa', googleColorId: '3' },
  amethyst: { id: '24', name: 'amethyst', hex: '#9e69af' },
  
  default: {
    id: '25',
    name: 'default',
    hex: '#4285f4', // Same as Cobalt
    googleColorId: undefined,
  },
};

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    email?: string;
    name?: string;
    picture?: string;
  } | null;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  color?: EventColor;
  isAllDay?: boolean;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface CalendarEventsResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}
