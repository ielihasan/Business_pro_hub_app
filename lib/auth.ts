import { supabase } from './supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { DEEP_LINKS } from './deepLinks';

export interface AuthResponse {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Ensure the authenticated Supabase user is mirrored in public.users.
 * Useful for OAuth + email-confirmation flows where initial signup may not
 * have a writable session for table insert.
 */
export async function syncAuthUserToUsersTable(
  authUser: User,
  overrides?: { fullName?: string; phone?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const metadata = (authUser.user_metadata as any) || {};

    const phone = overrides?.phone ?? metadata.phone_number ?? null;
    const payload: Record<string, unknown> = {
      id: authUser.id,
      email: normalizeEmail(authUser.email || ''),
      full_name: overrides?.fullName ?? metadata.full_name ?? null,
      avatar_url: metadata.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    };
    // Only include phone_number when we actually have a value — otherwise the
    // upsert would overwrite the user's saved phone with null (e.g. Google OAuth
    // metadata never carries a phone number).
    if (phone) payload.phone_number = phone;

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('syncAuthUserToUsersTable error:', error);
    return { success: false, error: 'Could not sync user profile.' };
  }
}

/**
 * Send (or resend) a 6-digit OTP code to the given email.
 * type='signup'  → resend the signup confirmation OTP (unconfirmed users)
 * type='email'   → send a signInWithOtp code (existing confirmed users, e.g. Google flow)
 */
export async function sendVerificationOtp(
  email: string,
  type: 'signup' | 'email' = 'signup',
): Promise<AuthResponse> {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (type === 'signup') {
      const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('sendVerificationOtp error:', error);
    return { success: false, error: 'Could not send verification code. Please try again.' };
  }
}

/**
 * Verify the 6-digit OTP code entered by the user.
 * type='signup' for new registration confirmations (default).
 * type='email'  for signInWithOtp codes (e.g. Google-completed registration).
 */
export async function verifyEmailOtp(
  email: string,
  token: string,
  type: 'signup' | 'email' = 'signup',
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token,
      type,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('verifyEmailOtp error:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

/**
 * Resend signup verification email
 */
export async function resendVerificationEmail(email: string): Promise<AuthResponse> {
  try {
    const normalizedEmail = normalizeEmail(email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return {
      success: false,
      error: 'Could not resend verification email. Please try again.',
    };
  }
}

/**
 * Send verification link after Google register-complete step.
 * Uses OTP magic-link as primary method because Google users are already
 * confirmed and signup-resend may silently no-op.
 */
export async function sendGoogleVerificationEmail(email: string): Promise<AuthResponse> {
  try {
    const normalizedEmail = normalizeEmail(email);

    // Primary: magic-link email for existing user (no duplicate user creation).
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: DEEP_LINKS.authCallback,
      },
    });

    if (!otpError) {
      return { success: true };
    }

    // Fallback: try signup resend in case project has OTP disabled.
    const resendResult = await resendVerificationEmail(normalizedEmail);
    if (resendResult.success) {
      return { success: true };
    }

    return {
      success: false,
      error: otpError.message || resendResult.error || 'Could not send verification link.',
    };
  } catch (error) {
    console.error('sendGoogleVerificationEmail error:', error);
    return {
      success: false,
      error: 'Could not send verification link. Please try again.',
    };
  }
}

/**
 * Register a new user with email and password
 * Creates both auth user and User table entry
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  try {
    const normalizedEmail = normalizeEmail(data.email);

    // Step 1: Sign up with Supabase Auth
    // No emailRedirectTo — with "Email OTP" enabled in Supabase Auth settings,
    // signUp sends a 6-digit code instead of a magic link.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone_number: data.phone,
        },
      },
    });

    if (authError) {
      // Check for user already exists error
      let errorMessage = authError.message;
      if (authError.message.includes('User already registered') ||
          authError.message.includes('already been registered')) {
        const resend = await resendVerificationEmail(normalizedEmail);
        errorMessage = resend.success
          ? 'EMAIL_EXISTS_VERIFICATION_RESENT'
          : 'This email is already registered. Please sign in or use a different email.';
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }

    // Check if user already exists (Supabase returns user but no session when email exists)
    // This happens when email confirmation is enabled and user tries to register again
    if (authData.user && !authData.session && authData.user.identities?.length === 0) {
      return {
        success: false,
        error: 'This email is already registered. Please sign in or use a different email.',
      };
    }

    // Step 2: Best-effort profile sync.
    // If email confirmation is enabled, session can be null here, so RLS may
    // block insert. We retry this sync on login/auth-init as well.
    const syncResult = await syncAuthUserToUsersTable(authData.user, {
      fullName: data.fullName,
      phone: data.phone,
    });

    if (!syncResult.success) {
      console.warn('Initial user profile sync failed:', syncResult.error);
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  try {
    const normalizedEmail = normalizeEmail(data.email);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: data.password,
    });

    if (error) {
      // Provide more helpful error messages
      let errorMessage = error.message;

      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Please verify your email address before logging in. Check your inbox for a confirmation link.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Logout the current user
 */
export async function logoutUser(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      // Stale/invalid token — wipe it so autoRefreshToken stops retrying
      await supabase.auth.signOut();
      return null;
    }
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get user profile from users table
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Get profile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

/**
 * Update user profile in users table
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const normalizedEmail = normalizeEmail(email);

    const primary = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: DEEP_LINKS.authCallback,
    });

    if (primary.error) {
      // Fallback for projects where only reset-password deep link is allow-listed.
      const fallback = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: DEEP_LINKS.resetPassword,
      });

      if (fallback.error) {
        return {
          success: false,
          error: fallback.error.message || primary.error.message,
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
