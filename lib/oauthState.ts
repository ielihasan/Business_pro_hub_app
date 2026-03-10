/**
 * Module-level storage for Google OAuth prefill data.
 * Used to pass name + email from auth/callback.tsx → register.tsx
 * on Android (where Expo Router handles the deep link, not the calling screen).
 *
 * pendingGoogleTokens stores the short-lived session from the initial Google
 * sign-in so register.tsx can restore it when the form is submitted — avoiding
 * a second round-trip to Google OAuth.
 */
export const oauthState = {
  pendingGooglePrefill: null as { name: string; email: string } | null,
  pendingGoogleTokens: null as { access_token: string; refresh_token: string } | null,
  /** 'register' when OAuth was triggered from the register page; 'login' otherwise */
  oauthSource: null as 'register' | 'login' | null,
  /** Set by callback.tsx when a Google account is already registered; register.tsx shows an error */
  pendingAlreadyRegistered: null as string | null,
  /** Set by _layout.tsx when the deep link contains type=recovery (password reset email) */
  isPasswordRecovery: false,
};
