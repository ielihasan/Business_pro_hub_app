# Google & Apple OAuth Setup Guide

This guide explains how to set up Google and Apple OAuth authentication for the BusinessHub Pro app.

## 📋 Prerequisites

You'll need:
1. A Google Cloud Platform (GCP) project with OAuth 2.0 credentials
2. An Apple Developer account (for Apple Sign-In)
3. Supabase configured with OAuth providers

## 🔑 Step 1: Google OAuth Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "BusinessHub Pro"
3. Enable the "Google+ API"

### 1.2 Create OAuth 2.0 Credentials
1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Choose **Android** and add your Android app details
3. Choose **iOS** and add your iOS app details
4. Choose **Web** for testing purposes

For **Android**:
- Package Name: `com.businesshubpro.app` (from app.json)
- SHA-1 Certificate: Get from your Android keystore

For **iOS**:
- Bundle ID: `com.businesshubpro.app` (from app.json)
- Redirect URI: `com.googleusercontent.apps.[CLIENT_ID]:/oauth2redirect`

### 1.3 Add to Environment Variables

Create or update `.env.local` file:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

## 🍎 Step 2: Apple OAuth Setup

### 2.1 Configure App.json

The app is already configured with:
- `scheme: "businesshubpro"`
- iOS bundleIdentifier: `com.businesshubpro.app`

### 2.2 Apple Developer Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with identifier: `com.businesshubpro.app`
3. Enable "Sign in with Apple" capability
4. Create a Services ID for web authentication (if needed)

### 2.3 Supabase Configuration
1. Go to Supabase project settings → **Authentication**
2. Enable **Apple** provider
3. Configure your Services ID and certificate

## 🌐 Step 3: Supabase Configuration

### 3.1 Enable OAuth Providers in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable these providers:
   - **Google**: Add your Google Client ID from Step 1
   - **Apple**: Configure with your Apple credentials from Step 2

### 3.2 Configure OAuth Redirect URLs

Add these to your Supabase project's allowed redirect URLs:
- `businesshubpro://oauth/google/callback`
- `businesshubpro://oauth/apple/callback`

## 🧪 Testing

### Test Google Sign-In:
1. Run the app on Android/iOS simulator or device
2. On Login/Register screen, tap **Google** button
3. Complete Google authentication
4. User should be automatically logged in

### Test Apple Sign-In:
1. Run the app on iOS simulator or device (iOS 13+)
2. On Login/Register screen, tap **Apple** button
3. Complete Apple authentication
4. User should be automatically logged in

## 📝 Environment Variables Summary

Create `.env.local` with:

```env
# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# Supabase (already configured)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🔧 Implementation Details

### Files Modified:

1. **lib/oauth.ts** - OAuth sign-in functions
   - `signInWithGoogle(idToken)` - Google authentication
   - `signInWithApple()` - Apple authentication
   - Both create/update user profiles automatically

2. **app/(auth)/login.tsx** - Login screen
   - Added Google and Apple sign-in buttons
   - Automatic login on successful authentication

3. **app/(auth)/register.tsx** - Registration screen
   - Added Google and Apple sign-up buttons
   - Same automatic account creation

### Features:

✅ **Automatic Account Creation**
- Users don't need to manually fill forms
- Profile created from OAuth provider data

✅ **Manual Registration Still Works**
- Users can still register with email/password

✅ **Smart Loading States**
- Visual feedback during authentication
- Button disable state while processing

✅ **Error Handling**
- User-friendly error messages
- Specific handling for cancelled auth

✅ **Multi-Platform**
- Google Sign-In: Android + iOS + Web
- Apple Sign-In: iOS only (automatically hidden on Android)

## 🚀 Deployment

### For Testing:
1. Get your Google Client ID from GCP console
2. Add to `.env.local`
3. Run `npm start`

### For Production:
1. Configure signing certificates properly
2. Update app store configurations
3. Deploy with proper environment variables
4. Test on real devices

## 📞 Troubleshooting

### Google Sign-In not working:
- Check Google Client ID is correct
- Verify redirect URI matches in GCP
- Check app scheme in app.json

### Apple Sign-In not working:
- Only works on iOS 13+
- Check Apple Developer account setup
- Verify bundleIdentifier in app.json

### Profile creation fails:
- Check Supabase User table permissions
- Verify OAuth provider is enabled in Supabase
- Check database connection

## ✨ Next Steps

1. Get Google OAuth credentials
2. Set up Apple Developer account
3. Configure Supabase with OAuth providers
4. Add environment variables
5. Test on simulator/device
6. Deploy to production

Happy coding! 🎉
