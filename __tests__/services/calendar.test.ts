/**
 * Unit tests for calendar utility functions
 *
 * These tests focus on pure functions that don't require Expo modules.
 */

describe('Calendar Utilities', () => {
  describe('parseTaskDueDate', () => {
    // Helper function that mirrors the implementation in services/calendar.ts
    function parseTaskDueDate(dueString: string): Date {
      const datePart = dueString.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    it('parses UTC midnight as local calendar day', () => {
      // Google Tasks returns midnight UTC for tasks due on Jan 30
      const dueString = '2026-01-30T00:00:00.000Z';
      const result = parseTaskDueDate(dueString);

      // Should be Jan 30 local time, not Jan 29
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(30);
    });

    it('handles date-only strings', () => {
      const dueString = '2026-02-15';
      const result = parseTaskDueDate(dueString);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15);
    });

    it('returns midnight local time', () => {
      const dueString = '2026-03-01T00:00:00.000Z';
      const result = parseTaskDueDate(dueString);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('Date formatting', () => {
    it('formats dates correctly for calendar keys', () => {
      const date = new Date(2026, 0, 29); // Jan 29, 2026
      const dateKey = date.toISOString().split('T')[0];

      expect(dateKey).toBe('2026-01-29');
    });

    it('groups events by date string', () => {
      const events = [
        { startDate: new Date(2026, 0, 29, 10, 0), title: 'Event 1' },
        { startDate: new Date(2026, 0, 29, 14, 0), title: 'Event 2' },
        { startDate: new Date(2026, 0, 30, 9, 0), title: 'Event 3' },
      ];

      const grouped: Record<string, typeof events> = {};
      events.forEach((event) => {
        const dateKey = event.startDate.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      });

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2026-01-29']).toHaveLength(2);
      expect(grouped['2026-01-30']).toHaveLength(1);
    });
  });
});
