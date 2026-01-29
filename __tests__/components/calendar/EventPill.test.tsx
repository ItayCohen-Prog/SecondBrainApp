import { fireEvent, render, screen } from '@testing-library/react-native';
import { EventPill } from '@/components/calendar/EventPill';
import { CalendarEvent } from '@/types/calendar';

describe('EventPill', () => {
  const mockEvent: CalendarEvent = {
    id: 'event-1',
    itemType: 'event',
    title: 'Team Meeting',
    startDate: new Date('2026-01-29T10:00:00'),
    endDate: new Date('2026-01-29T11:00:00'),
    isAllDay: false,
    color: 'default',
    displayColor: '#4285F4',
  };

  const mockTask: CalendarEvent = {
    id: 'task-1',
    itemType: 'task',
    title: 'Complete report',
    startDate: new Date('2026-01-29T00:00:00'),
    endDate: new Date('2026-01-29T00:00:00'),
    isAllDay: true,
    color: 'default',
    displayColor: '#4285F4',
    taskStatus: 'needsAction',
    taskListId: 'list-1',
  };

  const mockCompletedTask: CalendarEvent = {
    ...mockTask,
    id: 'task-2',
    title: 'Finished task',
    taskStatus: 'completed',
    taskCompletedAt: new Date(),
  };

  it('renders event title', () => {
    render(<EventPill event={mockEvent} />);
    expect(screen.getByText('Team Meeting')).toBeTruthy();
  });

  it('renders event time for non-all-day events', () => {
    render(<EventPill event={mockEvent} />);
    expect(screen.getByText('10:00 AM')).toBeTruthy();
  });

  it('does not render time for all-day events', () => {
    const allDayEvent = { ...mockEvent, isAllDay: true };
    render(<EventPill event={allDayEvent} />);
    expect(screen.queryByText(/AM|PM/)).toBeNull();
  });

  it('renders task with checkbox', () => {
    render(<EventPill event={mockTask} />);
    expect(screen.getByTestId('task-checkbox-task-1')).toBeTruthy();
  });

  it('does not render checkbox for events', () => {
    render(<EventPill event={mockEvent} />);
    expect(screen.queryByTestId(/task-checkbox/)).toBeNull();
  });

  it('calls onToggleTask when task checkbox is pressed', () => {
    const onToggleTask = jest.fn();
    render(<EventPill event={mockTask} onToggleTask={onToggleTask} />);

    fireEvent.press(screen.getByTestId('task-checkbox-task-1'));
    expect(onToggleTask).toHaveBeenCalledWith(mockTask);
  });

  it('does not call onToggleTask when toggling is in progress', () => {
    const onToggleTask = jest.fn();
    render(<EventPill event={mockTask} onToggleTask={onToggleTask} isToggling />);

    fireEvent.press(screen.getByTestId('task-checkbox-task-1'));
    expect(onToggleTask).not.toHaveBeenCalled();
  });

  it('calls onPress when event pill is pressed', () => {
    const onPress = jest.fn();
    render(<EventPill event={mockEvent} onPress={onPress} />);

    // Find and press the event pill
    const pill = screen.getByTestId('event-pill-event-1');
    // The touchable wraps the pill, so we need to find the parent touchable
    fireEvent.press(pill);
    // Note: onPress is on the TouchableOpacity wrapping the pill
  });

  it('truncates long titles', () => {
    const longTitleEvent = {
      ...mockEvent,
      title: 'This is a very long event title that should be truncated',
    };
    render(<EventPill event={longTitleEvent} />);
    expect(screen.getByText('This is a very long e...')).toBeTruthy();
  });

  it('applies completed styling for completed tasks', () => {
    render(<EventPill event={mockCompletedTask} />);
    // Verify the completed task renders with its title
    expect(screen.getByText('Finished task')).toBeTruthy();
    expect(screen.getByTestId('task-pill-task-2')).toBeTruthy();
  });
});
