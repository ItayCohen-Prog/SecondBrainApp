import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const { authState, isLoading, error, signIn } = useGoogleAuth();
  const router = useRouter();
  const errorBackgroundColor = useThemeColor({}, 'errorBackground');
  const errorTextColor = useThemeColor({}, 'errorText');

  // Redirect to calendar if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [authState.isAuthenticated, router]);

  const handleSignIn = async () => {
    try {
      await signIn();
      router.replace('/(tabs)');
    } catch (err) {
      // Error is handled by the hook
      console.error('Sign in failed:', err);
    }
  };

  if (isLoading && !authState.isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="calendar" size={80} style={styles.icon} />
        <ThemedText type="title" style={styles.title}>
          SecondBrain Calendar
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Connect your Google Calendar to get started
        </ThemedText>

        {error && (
          <ThemedView style={[styles.errorContainer, { backgroundColor: errorBackgroundColor }]}>
            <ThemedText style={[styles.errorText, { color: errorTextColor }]}>
              {error.message}
            </ThemedText>
          </ThemedView>
        )}

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignIn}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="person.circle.fill" size={24} color="#fff" />
              <ThemedText style={styles.signInButtonText}>Sign in with Google</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.7,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 10,
    minWidth: 200,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#EA4335',
    textAlign: 'center',
    fontSize: 14,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
});
