import { useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, RefreshControl, ScrollView, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { CalendarView } from '@/components/calendar/CalendarView';
import { EventModal } from '@/components/calendar/EventModal';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { CalendarEvent, CreateEventData, UpdateEventData } from '@/types/calendar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { DateData } from 'react-native-calendars';

export default function CalendarScreen() {
  const router = useRouter();
  const { authState, signOut } = useGoogleAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Calculate date range for current month
  const { startDate, endDate } = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return { startDate: start, endDate: end };
  }, [selectedDate]);

  const {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refresh,
  } = useCalendarEvents({
    startDate,
    endDate,
    autoFetch: authState.isAuthenticated,
  });

  const handleDayPress = (day: DateData) => {
    const date = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(date);
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setModalVisible(true);
  };

  const handleSaveEvent = async (eventData: CreateEventData | UpdateEventData) => {
    if ('id' in eventData && eventData.id) {
      await updateEvent(eventData as UpdateEventData);
    } else {
      await addEvent(eventData as CreateEventData);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  if (!authState.isAuthenticated) {
    return null; // Will be redirected by layout
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Calendar
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSignOut} style={styles.headerButton}>
            <IconSymbol name="person.circle" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }>
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error.message}</ThemedText>
          </ThemedView>
        )}

        <CalendarView
          events={events}
          onDayPress={handleDayPress}
          onEventPress={handleEventPress}
          currentDate={selectedDate}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateEvent}
        activeOpacity={0.8}>
        <IconSymbol name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <EventModal
        visible={modalVisible}
        event={selectedEvent}
        initialDate={selectedDate}
        onClose={() => {
          setModalVisible(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#EA4335',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
