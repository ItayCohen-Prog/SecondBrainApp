import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CalendarEvent, CreateEventData, EVENT_COLORS, EventColor, UpdateEventData } from '@/types/calendar';
import { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface EventModalProps {
  visible: boolean;
  event?: CalendarEvent | null;
  initialDate?: Date;
  onClose: () => void;
  onSave: (eventData: CreateEventData | UpdateEventData) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

export function EventModal({
  visible,
  event,
  initialDate,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedColor, setSelectedColor] = useState<EventColor>('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStartDate(event.startDate);
      setEndDate(event.endDate);
      setIsAllDay(event.isAllDay);
      setSelectedColor(event.color);
    } else if (initialDate) {
      const start = new Date(initialDate);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(10, 0, 0, 0);
      setStartDate(start);
      setEndDate(end);
      setIsAllDay(false);
    }
  }, [event, initialDate]);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      const eventData: CreateEventData | UpdateEventData = {
        ...(event ? { id: event.id } : {}),
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startDate,
        endDate,
        isAllDay,
        color: selectedColor,
      };
      await onSave(eventData);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) {
      return;
    }

    try {
      setIsSaving(true);
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {event ? 'Edit Event' : 'New Event'}
          </ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!title.trim() || isSaving}
            style={[styles.saveButton, (!title.trim() || isSaving) && styles.saveButtonDisabled]}>
            <ThemedText style={styles.saveText}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="Event title"
              placeholderTextColor="#9BA1A6"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dateTimeRow}
              onPress={() => {
                // TODO: Implement date/time picker
                console.log('Date/time picker not implemented yet');
              }}>
              <IconSymbol name="calendar" size={20} style={styles.icon} />
              <View style={styles.dateTimeContent}>
                <ThemedText style={styles.dateTimeLabel}>Start</ThemedText>
                <ThemedText>{formatDateTime(startDate)}</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeRow}
              onPress={() => {
                // TODO: Implement date/time picker
                console.log('Date/time picker not implemented yet');
              }}>
              <IconSymbol name="calendar" size={20} style={styles.icon} />
              <View style={styles.dateTimeContent}>
                <ThemedText style={styles.dateTimeLabel}>End</ThemedText>
                <ThemedText>{formatDateTime(endDate)}</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsAllDay(!isAllDay)}>
              <ThemedText style={styles.toggleLabel}>All day</ThemedText>
              <View style={[styles.toggle, isAllDay && styles.toggleActive]}>
                {isAllDay && <View style={styles.toggleThumb} />}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TextInput
              style={styles.textInput}
              placeholder="Location (optional)"
              placeholderTextColor="#9BA1A6"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.section}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#9BA1A6"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Color</ThemedText>
            <View style={styles.colorPicker}>
              {Object.values(EVENT_COLORS).map((colorConfig) => {
                if (colorConfig.name === 'default') return null;
                return (
                  <TouchableOpacity
                    key={colorConfig.id}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: colorConfig.hex,
                        borderWidth: selectedColor === colorConfig.name ? 3 : 0,
                        borderColor: '#fff',
                      },
                    ]}
                    onPress={() => setSelectedColor(colorConfig.name)}>
                    {selectedColor === colorConfig.name && (
                      <IconSymbol name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {event && onDelete && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isSaving}>
                <ThemedText style={styles.deleteText}>Delete Event</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#4285F4',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.7,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 8,
    minHeight: 40,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 44,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  icon: {
    marginRight: 12,
    opacity: 0.7,
  },
  dateTimeContent: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4285F4',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteText: {
    color: '#EA4335',
    fontSize: 16,
    fontWeight: '600',
  },
});
