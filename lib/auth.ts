import { supabase } from './supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

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

/**
 * Register a new user with email and password
 * Creates both auth user and User table entry
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  try {
    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone_number: data.phone,
        },
        emailRedirectTo: 'businesshubpro://auth/callback',
      },
    });

    if (authError) {
      // Check for user already exists error
      let errorMessage = authError.message;
      if (authError.message.includes('User already registered') ||
          authError.message.includes('already been registered')) {
        errorMessage = 'This email is already registered. Please sign in or use a different email.';
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

    // Step 2: Insert into users table (customers table)
    // Use upsert to handle cases where the user profile already exists
    const { error: insertError } = await supabase.from('users').upsert({
      id: authData.user.id,
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phone,
    }, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      // Don't fail registration if profile creation fails
      // The user can update their profile later
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
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Provide more helpful error messages
      let errorMessage = error.message;

      if (error.message === 'Invalid login credentials') {
        errorMessage = 'GOOGLE_ONLY_ACCOUNT';
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
    const { data: { session } } = await supabase.auth.getSession();
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'businesshubpro://reset-password',
    });

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
