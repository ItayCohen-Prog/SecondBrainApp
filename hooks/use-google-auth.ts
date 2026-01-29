import {
    signOut as authSignOut,
    getAuthState,
    signInWithGoogle,
} from '@/services/auth';
import { AuthState } from '@/types/calendar';
import { useCallback, useEffect, useState } from 'react';

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await getAuthState();
      setAuthState(state);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load auth state'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const state = await signInWithGoogle();
      setAuthState(state);
      return state;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign in');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authSignOut();
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        user: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign out');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    authState,
    isLoading,
    error,
    isReady: true,
    signIn,
    signOut,
    reload: loadAuthState,
  };
}
