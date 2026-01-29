import { AuthState } from '@/types/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the auth session for web browser - MUST be called at module load
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'google_calendar_access_token',
  REFRESH_TOKEN: 'google_calendar_refresh_token',
  USER_INFO: 'google_calendar_user_info',
};

// Google OAuth Client IDs
const GOOGLE_ANDROID_CLIENT_ID = 
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  '769894456153-bfven94mmlqj3htlrda1hdo9cf4hru0r.apps.googleusercontent.com';

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '769894456153-7pi50uvao8mlkd2ne32qfklo81mgjj3c.apps.googleusercontent.com';

// Use Android client for Android, Web client for others
const CLIENT_ID = Platform.OS === 'android' ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_WEB_CLIENT_ID;

// Native redirect URI for Android - this is the format Google expects
// Format: com.googleusercontent.apps.{CLIENT_ID_PREFIX}:/oauth2redirect
const ANDROID_REDIRECT_URI = `com.googleusercontent.apps.769894456153-bfven94mmlqj3htlrda1hdo9cf4hru0r:/oauth2redirect`;

// Use the appropriate redirect URI based on platform
const REDIRECT_URI = Platform.OS === 'android' 
  ? ANDROID_REDIRECT_URI 
  : AuthSession.makeRedirectUri({ scheme: 'secondbrain' });

// Scopes - MUST include calendar scope
const SCOPES = [
  'openid',
  'profile', 
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
];

// Google OAuth discovery document
const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Authenticate with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthState> {
  try {
    // Create the auth request - use authorization code flow (required for Android client)
    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true, // Required for public clients
      extraParams: {
        prompt: 'consent',
        access_type: 'offline',
        include_granted_scopes: 'true',
      },
    });

    // Prompt the user to authenticate
    const result = await request.promptAsync(DISCOVERY);

    if (result.type !== 'success') {
      throw new Error('Authentication failed or cancelled');
    }

    // Get the authorization code
    const code = result.params?.code;
    
    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange the code for tokens
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId: CLIENT_ID,
        code,
        redirectUri: REDIRECT_URI,
        extraParams: {
          code_verifier: request.codeVerifier || '',
        },
      },
      DISCOVERY
    );

    const accessToken = tokenResult.accessToken;
    const refreshToken = tokenResult.refreshToken;

    if (!accessToken) {
      throw new Error('Failed to exchange code for token');
    }

    // Fetch user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    // Store tokens and user info
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''],
      [STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo)],
    ]);

    return {
      isAuthenticated: true,
      accessToken,
      refreshToken: refreshToken || null,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    };
  } catch (error) {
    console.error('[GoogleAuth] Sign-in error:', error);
    throw error;
  }
}

/**
 * Get stored authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const [accessToken, refreshToken, userInfoStr] = await AsyncStorage.multiGet([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_INFO,
    ]);

    if (!accessToken[1]) {
      return {
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        user: null,
      };
    }

    const userInfo = userInfoStr[1] ? JSON.parse(userInfoStr[1]) : null;

    return {
      isAuthenticated: true,
      accessToken: accessToken[1],
      refreshToken: refreshToken[1] || null,
      user: userInfo
        ? {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          }
        : null,
    };
  } catch (error) {
    console.error('Error getting auth state:', error);
    return {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    const tokenResult = await AuthSession.refreshAsync(
      {
        clientId: CLIENT_ID,
        refreshToken,
      },
      DISCOVERY
    );

    if (tokenResult.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResult.accessToken);
      if (tokenResult.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResult.refreshToken);
      }
      return tokenResult.accessToken;
    }
    return null;
  } catch (error) {
    console.error('[GoogleAuth] Refresh error', error);
    return null;
  }
}

/**
 * Sign out and clear stored authentication data
 */
export async function signOut(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_INFO,
  ]);
}

/**
 * Get current access token
 */
export async function getAccessToken(): Promise<string | null> {
  const authState = await getAuthState();
  if (!authState.isAuthenticated || !authState.accessToken) {
    return null;
  }
  return authState.accessToken;
}
