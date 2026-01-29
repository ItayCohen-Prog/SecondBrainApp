import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface EventPillProps {
  event: CalendarEvent;
  onPress?: (event: CalendarEvent) => void;
  onToggleTask?: (task: CalendarEvent) => void;
  maxWidth?: number;
}

export function EventPill({ event, onPress, onToggleTask, maxWidth }: EventPillProps) {
  // STRICTLY use displayColor (exact hex). Fallback to default blue ONLY if displayColor is missing.
  const backgroundColor = event.displayColor || EVENT_COLORS.default.hex;
  const isTask = event.itemType === 'task';
  const isTaskCompleted = isTask && event.taskStatus === 'completed';

  // Determine icon based on event properties
  let iconName: string | null = null;
  if (event.location) {
    iconName = 'location.fill';
  } else if (event.attendees && event.attendees.length > 0) {
    iconName = 'person.fill';
  }

  // Format time for display
  const formatTime = (date: Date): string => {
    if (event.isAllDay) {
      return '';
    }
    
    // Use getHours/getMinutes which always return local time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours12}:${minutesStr} ${ampm}`;
  };

  const timeStr = event.isAllDay ? '' : formatTime(event.startDate);
  const displayTitle = event.title.length > 20 ? `${event.title.substring(0, 20)}...` : event.title;

  const content = (
    <View
      style={[
        styles.pill,
        { backgroundColor },
        maxWidth && { maxWidth },
      ]}>
      <View style={styles.pillContent}>
        {isTask && (
          <TouchableOpacity
            onPress={() => onToggleTask?.(event)}
            activeOpacity={0.7}
            style={styles.checkboxButton}>
            <IconSymbol
              name={isTaskCompleted ? 'checkmark.circle.fill' : 'circle'}
              size={12}
              color="#fff"
            />
          </TouchableOpacity>
        )}
        {iconName && (
          <IconSymbol
            name={iconName}
            size={12}
            color="#fff"
            style={styles.icon}
          />
        )}
        <ThemedText
          style={[styles.pillText, isTaskCompleted && styles.completedText]}
          numberOfLines={1}>
          {displayTitle}
        </ThemedText>
        {timeStr && (
          <ThemedText style={styles.timeText} numberOfLines={1}>
            {timeStr}
          </ThemedText>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginVertical: 1,
    minHeight: 18,
    justifyContent: 'center',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  timeText: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.9,
  },
  icon: {
    marginRight: 2,
  },
  checkboxButton: {
    marginRight: 2,
  },
});
