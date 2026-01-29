import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { EventPill } from './EventPill';

interface CalendarViewProps {
  events: CalendarEvent[];
  onDayPress?: (date: DateData) => void;
  onEventPress?: (event: CalendarEvent) => void;
  currentDate?: Date;
}

export function CalendarView({
  events,
  onDayPress,
  onEventPress,
  currentDate = new Date(),
}: CalendarViewProps) {
  const colorScheme = useColorScheme();
  const [selectedDate, setSelectedDate] = useState(
    currentDate.toISOString().split('T')[0]
  );

  // Group events by date and sort by start time within each day
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const eventDate = event.isAllDay
        ? new Date(
            event.startDate.getFullYear(),
            event.startDate.getMonth(),
            event.startDate.getDate()
          )
        : event.startDate;
      const dateKey = eventDate.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    // Sort events within each day by start time (all-day events first, then by time)
    Object.values(grouped).forEach((dayEvents) => {
      dayEvents.sort((a, b) => {
        // All-day events come first
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        // Then sort by start time
        return a.startDate.getTime() - b.startDate.getTime();
      });
    });
    
    return grouped;
  }, [events]);

  // Create marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    const today = new Date().toISOString().split('T')[0];

    Object.keys(eventsByDate).forEach((dateKey) => {
      const dateEvents = eventsByDate[dateKey];
      const isToday = dateKey === today;
      const isSelected = dateKey === selectedDate;

      marked[dateKey] = {
        marked: true,
        selected: isSelected,
        selectedColor: isToday ? '#4285F4' : '#1A73E8',
        // STRICTLY use displayColor. Fallback to default blue only if missing.
        dotColor: dateEvents[0]?.displayColor || EVENT_COLORS.default.hex,
        customStyles: {
          container: {
            backgroundColor: isToday ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
            borderRadius: isToday ? 20 : 0,
          },
          text: {
            color: isToday ? '#4285F4' : isSelected ? '#fff' : undefined,
            fontWeight: isToday ? 'bold' : 'normal',
          },
        },
      };
    });

    // Mark today if no events
    if (!marked[today]) {
      marked[today] = {
        customStyles: {
          container: {
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            borderRadius: 20,
          },
          text: {
            color: '#4285F4',
            fontWeight: 'bold',
          },
        },
      };
    }

    // Mark selected date
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#1A73E8',
      };
    }

    return marked;
  }, [eventsByDate, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    if (onDayPress) {
      onDayPress(day);
    }
  };

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  const isDark = colorScheme === 'dark';
  const theme = {
    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
    calendarBackground: isDark ? '#1A1A1A' : '#FFFFFF',
    textSectionTitleColor: isDark ? '#9BA1A6' : '#687076',
    selectedDayBackgroundColor: '#1A73E8',
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: '#4285F4',
    dayTextColor: isDark ? '#ECEDEE' : '#11181C',
    textDisabledColor: isDark ? '#3A3A3A' : '#D0D0D0',
    dotColor: '#4285F4',
    selectedDotColor: '#FFFFFF',
    arrowColor: isDark ? '#ECEDEE' : '#11181C',
    monthTextColor: isDark ? '#ECEDEE' : '#11181C',
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13,
  };

  return (
    <ThemedView style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="custom"
        theme={theme}
        style={styles.calendar}
        enableSwipeMonths
        firstDay={0} // Sunday
        hideExtraDays
        showWeekNumbers={false}
      />
      <View style={styles.eventsContainer}>
        <ThemedText type="subtitle" style={styles.eventsTitle}>
          {selectedDateEvents.length > 0
            ? `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? 's' : ''}`
            : 'No events'}
        </ThemedText>
        <ScrollView style={styles.eventsList}>
          {selectedDateEvents.map((event) => (
            <EventPill
              key={event.id}
              event={event}
              onPress={onEventPress}
            />
          ))}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  eventsTitle: {
    marginBottom: 12,
  },
  eventsList: {
    flex: 1,
  },
});
