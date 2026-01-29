import { render, RenderOptions } from '@testing-library/react-native';
import { ReactElement } from 'react';
import { CalendarEvent } from '@/types/calendar';

/**
 * Create a mock calendar event for testing
 */
export function createMockEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: `event-${Date.now()}`,
    itemType: 'event',
    title: 'Test Event',
    startDate: new Date('2026-01-29T10:00:00'),
    endDate: new Date('2026-01-29T11:00:00'),
    isAllDay: false,
    color: 'default',
    displayColor: '#4285F4',
    ...overrides,
  };
}

/**
 * Create a mock task for testing
 */
export function createMockTask(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: `task-${Date.now()}`,
    itemType: 'task',
    title: 'Test Task',
    startDate: new Date('2026-01-29T00:00:00'),
    endDate: new Date('2026-01-29T00:00:00'),
    isAllDay: true,
    color: 'default',
    displayColor: '#4285F4',
    taskStatus: 'needsAction',
    taskListId: 'list-1',
    ...overrides,
  };
}

/**
 * Custom render function with providers if needed
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  // Add any providers here if needed in the future
  return render(ui, options);
}

// Re-export everything from testing-library
export * from '@testing-library/react-native';

// Override render with custom render
export { customRender as render };
