import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AppleAuthenticationScope, signInAsync, isAvailableAsync } from 'expo-apple-authentication';
import { supabase } from './supabase';
import { AuthResponse } from './auth';

// Initialize Google OAuth
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export const useGoogleAuth = () => {
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId,
    webClientId,
  });

  return { googleRequest, googleResponse, googlePromptAsync };
};

/**
 * Handle Google OAuth sign-in
 */
export async function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Google sign-in failed. Please try again.',
      };
    }

    // Create or update user profile (upsert by ID so we never corrupt an
    // existing email/password user's row by overwriting their primary key)
    if (data.user) {
      const { error: profileError } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
        avatar_url: data.user.user_metadata?.avatar_url,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

      if (profileError) {
        console.warn('Profile creation warning:', profileError);
        // Continue even if profile creation fails
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during Google sign-in.',
    };
  }
}

/**
 * Handle Apple OAuth sign-in
 */
export async function signInWithApple(): Promise<AuthResponse> {
  try {
    // Check if Apple Authentication is available
    const available = await isAvailableAsync();
    if (!available) {
      return {
        success: false,
        error: 'Apple Sign-In is not available on this device.',
      };
    }

    // Request Apple Sign-In
    const credential = await signInAsync({
      requestedScopes: [
        AppleAuthenticationScope.FULL_NAME,
        AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return {
        success: false,
        error: 'Failed to get identity token from Apple.',
      };
    }

    // Sign in with Supabase using Apple identity token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Apple sign-in failed. Please try again.',
      };
    }

    // Create or update user profile
    if (data.user) {
      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : data.user.user_metadata?.full_name || 'User';

      const { error: profileError } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email || credential.email,
        full_name: fullName,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

      if (profileError) {
        console.warn('Profile creation warning:', profileError);
        // Continue even if profile creation fails
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Apple Sign-In was cancelled.',
      };
    }

    console.error('Apple sign-in error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during Apple sign-in.',
    };
  }
}

/**
 * Handle OAuth redirect callback
 */
export async function handleOAuthCallback(redirectUrl: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return {
        success: false,
        error: 'OAuth callback processing failed.',
      };
    }

    return {
      success: true,
      user: data.session.user,
      session: data.session,
    };
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred processing OAuth callback.',
    };
  }
}
