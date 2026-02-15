# OAuth Implementation Code Examples

## 📝 Code Structure Overview

### 1. OAuth Functions (lib/oauth.ts)

```typescript
// Google Sign-In
async function signInWithGoogle(idToken: string) {
  // Verifies token with Supabase
  // Creates/updates user profile
  // Returns user data and session
}

// Apple Sign-In
async function signInWithApple() {
  // Checks if available (iOS 13+)
  // Opens Apple authentication
  // Gets identity token
  // Creates/updates user profile
  // Returns user data and session
}
```

### 2. Login Screen Integration

```typescript
// Setup Google OAuth
const [googleRequest, googleResponse, googlePromptAsync] = 
  Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: 'businesshubpro://oauth/google/callback',
  });

// Listen for Google response
useEffect(() => {
  if (googleResponse?.type === 'success') {
    const { id_token } = googleResponse.params;
    if (id_token) {
      handleGoogleSignIn(id_token);
    }
  }
}, [googleResponse]);

// Handle sign-in
const handleGoogleSignIn = async (idToken: string) => {
  const result = await signInWithGoogle(idToken);
  if (result.success) {
    router.replace('/(tabs)'); // Navigate to home
  }
};

// Button UI
<TouchableOpacity onPress={handleGooglePress}>
  <Ionicons name="logo-google" size={20} />
  <Text>Google</Text>
</TouchableOpacity>
```

### 3. Apple Sign-In (iOS Only)

```typescript
// Check platform and only show on iOS
{Platform.OS === 'ios' && (
  <TouchableOpacity onPress={handleAppleSignUp}>
    {socialLoading === 'apple' ? (
      <ActivityIndicator />
    ) : (
      <>
        <Ionicons name="logo-apple" size={20} />
        <Text>Apple</Text>
      </>
    )}
  </TouchableOpacity>
)}

// Handle Apple sign-in
const handleAppleSignUp = async () => {
  setSocialLoading('apple');
  try {
    const result = await signInWithApple();
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', result.error);
    }
  } finally {
    setSocialLoading(null);
  }
};
```

## 🔄 User Data Flow

### When User Signs In With Google:

```
1. User taps "Google" button
   ↓
2. Google OAuth dialog opens
   ↓
3. User authorizes access
   ↓
4. Google returns identity token
   ↓
5. Token sent to Supabase
   ↓
6. Email: user@gmail.com ← from Google
   Full Name: John Doe ← from Google metadata
   Avatar: google avatar URL ← optional
   ↓
7. User profile created:
   {
     id: "supabase-user-id",
     email: "user@gmail.com",
     full_name: "John Doe",
     avatar_url: "https://...", // from Google
     created_via: "google"
   }
   ↓
8. User automatically logged in
   ↓
9. Redirected to home screen
```

### When User Signs In With Apple:

```
1. User taps "Apple" button
   ↓
2. Apple authentication dialog opens
   ↓
3. User authorizes access
   ↓
4. Apple returns credentials including:
   - identityToken
   - fullName.givenName
   - fullName.familyName
   - email
   ↓
5. Token sent to Supabase
   ↓
6. User profile created:
   {
     id: "supabase-user-id",
     email: "user@privaterelay.appleid.com",
     full_name: "John Doe", // Combined from given + family name
     created_via: "apple"
   }
   ↓
7. User automatically logged in
   ↓
8. Redirected to home screen
```

## ⚙️ Configuration Example

### .env.local file:
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com

# App configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### app.json OAuth configuration:
```json
{
  "expo": {
    "scheme": "businesshubpro",
    "slugs": "businesshub-pro",
    "ios": {
      "bundleIdentifier": "com.businesshubpro.app"
    },
    "android": {
      "package": "com.businesshubpro.app"
    }
  }
}
```

## 🎨 UI/UX Examples

### Loading State:
```typescript
{socialLoading === 'google' ? (
  <ActivityIndicator color={colors.foreground} size="small" />
) : (
  <>
    <Ionicons name="logo-google" size={20} color={colors.foreground} />
    <Text>Google</Text>
  </>
)}
```

### Disabled State:
```typescript
<TouchableOpacity
  disabled={isLoading || socialLoading !== null}
  style={{ opacity: (isLoading || socialLoading !== null) ? 0.5 : 1 }}
>
  {/* Button content */}
</TouchableOpacity>
```

### Error Handling:
```typescript
const handleGooglePress = async () => {
  try {
    const result = await googlePromptAsync();
    if (result?.type !== 'success') {
      console.log('Google sign-in cancelled');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to initiate Google sign-in.');
  }
};
```

## 🔍 Debugging

### Useful console logs to add:

```typescript
// In oauth.ts
console.log('Google ID Token received:', idToken);
console.log('Creating user profile...', userData);
console.log('Profile created successfully:', result);

// In login.tsx
console.log('Google response:', googleResponse);
console.log('Login result:', result);
console.log('User:', result.user);
```

### Check these in Supabase:

1. **Auth Users** - Verify OAuth user created
2. **User Table** - Check profile data populated
3. **Activity Log** - View OAuth events
4. **SQL Editor** - Query directly:

```sql
SELECT id, email, full_name, created_at 
FROM User 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📊 Database Schema

The User table automatically gets populated:

```sql
CREATE TABLE "User" (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  theme TEXT,
  language TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

OAuth users get:
- ✅ id (from Supabase auth)
- ✅ email (from OAuth provider)
- ✅ full_name (from OAuth provider metadata)
- ✅ avatar_url (from Google if available)
- ⏳ phone_number (filled later by user if needed)
- ⏳ theme, language (default values set by app)

## 🧪 Manual Testing Commands

### Test Google OAuth locally:
```bash
# Start development server
npm start

# When prompted, choose:
# ? How would you like to run the app?
# > Expo Go - Use Expo Go to view your app
# or
# > iOS Simulator / Android Emulator
```

### Verify in Supabase:
```bash
# Check if user created
supabase seed restore

# Query users
supabase db query "SELECT * FROM User WHERE email LIKE '%google%'"
```

## 🚨 Common Issues & Solutions

### Issue: "Google Client ID is invalid"
```
Solution:
1. Copy exact Client ID from GCP console
2. Remove any whitespace
3. Add to .env.local
4. Restart npm
```

### Issue: "Apple Sign-In not available on Android"
```
Solution:
1. This is expected - Apple only works on iOS
2. Code already has Platform.OS check
3. Button automatically hidden on Android
```

### Issue: "User profile not created"
```
Solution:
1. Check Supabase RLS policies
2. Verify User table exists
3. Check error logs in Supabase
4. Test inline with SQL:
   INSERT INTO "User" (id, email, full_name)
   VALUES ('uuid', 'email@test.com', 'Test User');
```

### Issue: "Redirect URI mismatch"
```
Solution:
1. Check app.json scheme: "businesshubpro"
2. In GCP/Supabase: businesshubpro://oauth/google/callback
3. For Apple: businesshubpro://oauth/apple/callback
4. Must match exactly (case-sensitive)
```

---

**Ready to implement? Follow the OAUTH_SETUP.md guide!** 🚀
