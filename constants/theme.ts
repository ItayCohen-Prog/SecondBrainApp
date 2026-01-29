/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#4285F4';
const tintColorDark = '#4285F4';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: 'rgba(0, 0, 0, 0.1)',
    placeholder: '#9BA1A6',
    errorBackground: 'rgba(234, 67, 53, 0.1)',
    errorText: '#EA4335',
    calendarBackground: '#FFFFFF',
    calendarText: '#11181C',
    calendarToday: '#4285F4',
    calendarSelected: '#1A73E8',
  },
  dark: {
    text: '#ECEDEE',
    background: '#1A1A1A',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: 'rgba(255, 255, 255, 0.12)',
    placeholder: '#7A8288',
    errorBackground: 'rgba(234, 67, 53, 0.2)',
    errorText: '#F28B82',
    calendarBackground: '#1A1A1A',
    calendarText: '#ECEDEE',
    calendarToday: '#4285F4',
    calendarSelected: '#1A73E8',
  },
};

// Google Calendar event colors
export const CalendarEventColors = {
  blue: '#4285F4',
  green: '#34A853',
  orange: '#FBBC04',
  pink: '#EA4335',
  purple: '#9C27B0',
  default: '#80868B',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
