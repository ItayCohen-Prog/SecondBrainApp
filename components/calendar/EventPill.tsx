import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface EventPillProps {
  event: CalendarEvent;
  onPress?: (event: CalendarEvent) => void;
  onToggleTask?: (task: CalendarEvent) => void;
  isToggling?: boolean;
  maxWidth?: number;
}

export function EventPill({ event, onPress, onToggleTask, isToggling, maxWidth }: EventPillProps) {
  // STRICTLY use displayColor (exact hex). Fallback to default blue ONLY if displayColor is missing.
  const baseColor = event.displayColor || EVENT_COLORS.default.hex;
  const isTask = event.itemType === 'task';
  const isTaskCompleted = isTask && event.taskStatus === 'completed';

  // Tasks get a slightly different appearance - lighter background with border
  const backgroundColor = isTask ? `${baseColor}CC` : baseColor; // CC = 80% opacity for tasks

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
      testID={isTask ? `task-pill-${event.id}` : `event-pill-${event.id}`}
      style={[
        styles.pill,
        { backgroundColor },
        isTask ? styles.taskPill : undefined,
        isTask ? { borderColor: baseColor } : undefined,
        maxWidth ? { maxWidth } : undefined,
      ]}>
      <View style={styles.pillContent}>
        {isTask && (
          <TouchableOpacity
            testID={`task-checkbox-${event.id}`}
            onPress={() => !isToggling && onToggleTask?.(event)}
            activeOpacity={0.7}
            disabled={isToggling}
            style={styles.checkboxButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
            {isToggling ? (
              <ActivityIndicator size={12} color="#fff" />
            ) : (
              <IconSymbol
                name={isTaskCompleted ? 'checkmark.circle.fill' : 'circle'}
                size={14}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        )}
        {iconName && <IconSymbol name={iconName} size={12} color="#fff" style={styles.icon} />}
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 2,
    minHeight: 24,
    justifyContent: 'center',
  },
  taskPill: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
  icon: {
    marginRight: 2,
  },
  checkboxButton: {
    padding: 2,
    marginRight: 2,
  },
});
