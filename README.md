# BusinessHub Pro

A cross-platform virtual queue management app built with React Native, Expo SDK 54, and Supabase. Users scan QR codes to join business queues, track wait times in real time, manage orders, and earn loyalty rewards.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Running the App](#running-the-app)
- [Environment Variables](#environment-variables)
- [Supabase Database Setup](#supabase-database-setup)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Virtual Queue** — Join, track, and leave queues remotely via QR code scan
- **Real-Time Updates** — Live position and wait-time via Supabase Realtime subscriptions
- **Business Discovery** — Nearby businesses on an interactive Google Map with radius filters
- **Order Tracking** — View active and completed orders per business
- **Authentication** — Email/password, Google OAuth, Apple Sign-In (iOS), email verification, password reset
- **Profile & Loyalty** — Edit profile photo, track visit history and loyalty points, change password
- **Notifications** — Push and in-app notifications for queue and order events
- **Internationalization** — 10 languages: English, Urdu, Spanish, French, German, Chinese, Arabic, Hindi, Portuguese, Russian
- **Dark Mode** — System-aware with manual override
- **Web Support** — Runs in browser via `npm run web`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81, Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Language | TypeScript 5 (strict) |
| State | Zustand 4 with AsyncStorage persistence |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Maps | react-native-maps (Google Maps) |
| Camera | expo-camera (QR scanning) |
| Notifications | expo-notifications |
| i18n | i18next + react-i18next |
| Animations | React Native Reanimated 4 |
| Auth | expo-auth-session, expo-apple-authentication |

---

## Prerequisites

### All platforms

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18 or later | [nodejs.org](https://nodejs.org) |
| npm | 9 or later | Comes with Node |
| Git | Any | [git-scm.com](https://git-scm.com) |
| Supabase account | — | [supabase.com](https://supabase.com) |

### Android (Windows / macOS / Linux)

| Requirement | Version | Notes |
|-------------|---------|-------|
| Android Studio | Hedgehog or later | Required **once** to install SDK + NDK |
| Android SDK | API 36 | Install via Android Studio SDK Manager |
| NDK (Side by side) | **27.1.12297006** | Install via Android Studio → SDK Tools |
| JDK | 17 (bundled with Android Studio) | Uses Android Studio's JBR automatically |
| Android device or emulator | API 24+ (Android 7.0+) | Physical device recommended |

> **After the one-time Android Studio setup you never need to open it again.** All builds run from the terminal.

### iOS (macOS only)

| Requirement | Version | Notes |
|-------------|---------|-------|
| macOS | 13 Ventura or later | — |
| Xcode | 15 or later | App Store |
| CocoaPods | 1.13 or later | `sudo gem install cocoapods` |

---

## Project Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd Business_pro_hub_app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file at the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in your Supabase project under **Settings → API**.

> Never commit `.env` to version control — it is listed in `.gitignore`.

### 4. Supabase Database Setup

Run the following SQL in the **Supabase SQL Editor** (`supabase.com → your project → SQL Editor`):

```sql
-- Users profile table
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  phone_number text,
  avatar_url text,
  loyalty_points integer default 0,
  total_visits integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Businesses table
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  queue_length integer default 0,
  wait_time text default 'No wait',
  rating numeric(3,2) default 0,
  review_count integer default 0,
  is_open boolean default true,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Queues table
create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete cascade,
  customer_name text,
  customer_email text,
  customer_phone text,
  service_type text,
  quantity integer default 1,
  unit_price numeric(10,2),
  total_amount numeric(10,2),
  position integer not null,
  status text default 'waiting' check (status in ('waiting','in_progress','completed','cancelled')),
  priority text default 'normal',
  notes text,
  estimated_wait_time integer default 0,
  joined_at timestamptz default now(),
  called_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feedback table
create table if not exists public."Feedback" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_email text,
  rating integer check (rating between 1 and 5),
  category text,
  message text,
  points_awarded integer default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.queues enable row level security;
alter table public."Feedback" enable row level security;

-- RLS Policies
create policy "Users can read own profile"   on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "Anyone can read businesses"   on public.businesses for select using (true);
create policy "Anyone can insert businesses" on public.businesses for insert with check (true);

create policy "Users can read own queues"   on public.queues for select using (auth.uid() = customer_id);
create policy "Users can insert own queues" on public.queues for insert with check (auth.uid() = customer_id);
create policy "Users can update own queues" on public.queues for update using (auth.uid() = customer_id);

create policy "Users can insert feedback"   on public."Feedback" for insert with check (auth.uid() = user_id);
create policy "Users can read own feedback" on public."Feedback" for select using (auth.uid() = user_id);
```

#### Loyalty points RPC (required for feedback rewards)

```sql
create or replace function award_loyalty_points(p_user_id uuid, p_points int)
returns int language plpgsql security definer as $$
declare new_pts int;
begin
  if auth.uid() <> p_user_id then raise exception 'Unauthorized'; end if;
  update users
    set loyalty_points = coalesce(loyalty_points, 0) + p_points,
        updated_at = now()
  where id = p_user_id
  returning loyalty_points into new_pts;
  return new_pts;
end; $$;
```

#### Account deletion RPC (required for delete account feature)

```sql
create or replace function delete_my_account()
returns void language plpgsql security definer as $$
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  delete from auth.users where id = auth.uid();
end; $$;
```

### 5. Configure Supabase Auth

In the Supabase dashboard under **Authentication → URL Configuration**:

- **Site URL**: `businesshubpro://`
- **Redirect URLs**: Add `businesshubpro://auth/callback`

For **Google OAuth**: go to **Authentication → Providers → Google** and enter your Google Cloud OAuth credentials (Client ID + Secret).

### 6. Enable Supabase Realtime

In the Supabase dashboard go to **Database → Replication** and enable the `queues` and `businesses` tables for realtime.

### 7. Configure Email Templates (optional)

The `email-templates/verification-email.html` file contains a custom verification email template. Paste its contents into **Supabase → Authentication → Email Templates → Confirm signup**.

---

## Running the App

> **Important:** This project uses native modules (`react-native-maps`, `expo-camera`) and **cannot run inside the standard Expo Go app**. It requires a custom development build installed directly on your device.

### Android — Physical Device (USB) — Recommended

```bash
# 1. Enable USB Debugging on your Android phone:
#    Settings → About Phone → tap "Build number" 7 times
#    Settings → Developer Options → enable "USB Debugging"
#    Plug in via USB and accept the "Allow USB Debugging?" prompt

# 2. Verify your device is detected
adb devices          # should list your device (not "offline")

# 3. First-time build & install (~8–15 min, compiles all native code)
npx expo run:android

# 4. Every subsequent session — just start Metro (fast, no rebuild)
npx expo start
```

After the first `npx expo run:android` installs the APK, you only need `npx expo start` for day-to-day development. Any code change you save appears on the device in **under 2 seconds** via Fast Refresh.

### Android — Emulator

```bash
# Start an AVD from Android Studio's Device Manager, then:
npx expo run:android
```

### Web (browser)

```bash
npm run web
# Opens at http://localhost:8081
```

> Camera and Maps are unavailable on web (see Known Limitations).

### iOS — Simulator (macOS only)

```bash
cd ios && pod install && cd ..
npx expo run:ios
```

### Production Builds (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android   # generates signed APK / AAB
eas build --platform ios
```

---

## Windows Firewall — allow Metro on a physical device

If your Android device shows `failed to download remote update` when connecting over Wi-Fi, Windows Firewall is blocking port 8081. Run once in an **Administrator** terminal:

```cmd
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (safe to expose) |

All `EXPO_PUBLIC_` variables are bundled into the client at build time. The anon key is intentionally public — Supabase Row Level Security controls what each user can access.

---

## Android SDK — Version Requirements

The `android/build.gradle` pins these values. Do **not** lower them:

| Setting | Value | Reason |
|---------|-------|--------|
| `minSdkVersion` | 24 (Android 7.0) | Required by React Native 0.76+ Hermes |
| `compileSdkVersion` | 36 | Required by Expo SDK 54 |
| `targetSdkVersion` | 36 | Google Play requirement |
| `ndkVersion` | 27.1.12297006 | Required by react-native-screens / worklets |

---

## Project Structure

```
Business_pro_hub_app/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (auth)/                 # Unauthenticated screens
│   │   ├── welcome.tsx         # Landing / onboarding
│   │   ├── login.tsx           # Sign in
│   │   ├── register.tsx        # Sign up
│   │   ├── forgot-password.tsx # Request password reset
│   │   └── reset-password.tsx  # Confirm new password
│   ├── (tabs)/                 # Authenticated main app (floating tab bar)
│   │   ├── index.tsx           # Home / dashboard
│   │   ├── queue.tsx           # Active queues & history
│   │   ├── orders.tsx          # Order tracking
│   │   ├── map.tsx             # Business map (Google Maps)
│   │   ├── scan.tsx            # QR code scanner
│   │   └── profile.tsx         # User profile
│   ├── profile/                # Profile sub-screens
│   │   ├── edit.tsx            # Edit name, email, photo
│   │   ├── settings.tsx        # Notifications, theme, language
│   │   ├── payment.tsx         # Saved payment methods
│   │   ├── help.tsx            # FAQ & support
│   │   ├── feedback.tsx        # Submit feedback (earns loyalty points)
│   │   ├── about.tsx           # App info
│   │   ├── terms.tsx           # Terms of service
│   │   └── change-password.tsx # Change password
│   ├── business/[id].tsx       # Business detail (dynamic route)
│   ├── queue/[id].tsx          # Queue status detail (dynamic route)
│   ├── auth/callback.tsx       # OAuth / email verification deep-link handler
│   ├── _layout.tsx             # Root layout (deep linking, auth gate)
│   └── index.tsx               # Splash / auth redirect
│
├── components/                 # Reusable UI components
│   ├── ui/                     # Core design system (Button, Input, Card, …)
│   ├── home/                   # Home screen components
│   ├── profile/                # Profile screen components
│   ├── queue/                  # Queue screen components
│   ├── orders/                 # Orders screen components
│   ├── map/                    # Map screen components
│   ├── scan/                   # Scanner screen components
│   └── notifications/          # Notification panel
│
├── lib/                        # Services and utilities
│   ├── supabase.ts             # Supabase client
│   ├── auth.ts                 # Auth helpers (login, register, OAuth sync)
│   ├── queue.ts                # Queue CRUD + real-time subscription
│   ├── business.ts             # Business data fetching + map subscription
│   ├── oauth.ts                # Google / Apple OAuth flows
│   ├── oauthState.ts           # OAuth mutable state flags
│   ├── payment.ts              # Payment methods
│   ├── notificationService.ts  # Push & local notifications
│   ├── geoutils.ts             # Haversine distance utilities
│   ├── suppressWarnings.ts     # Suppress noisy dev warnings
│   ├── i18n/                   # Internationalization
│   │   ├── index.ts            # i18next setup
│   │   └── locales/            # en, ur, es, fr, de, zh, ar, hi, pt, ru
│   └── web-stubs/              # Web platform polyfills
│       ├── maps.js             # react-native-maps stub for web
│       └── pkgr-core.js        # @pkgr/core stub for web
│
├── store/
│   └── useStore.ts             # Zustand global store (auth, queue, orders, settings)
│
├── hooks/
│   ├── useTheme.ts             # Theme hook (light/dark/system)
│   ├── useNearbyBusinesses.ts  # Fetches & filters nearby businesses
│   └── useProfilePhoto.ts      # Profile photo upload helper
│
├── constants/
│   └── theme.ts                # Colors, spacing, typography, shadows
│
├── types/
│   └── index.ts                # Shared TypeScript types
│
├── assets/                     # App icons, splash screen, favicon
├── android/                    # Android native project (do not delete)
│   ├── build.gradle            # Root Gradle — SDK versions pinned here
│   ├── app/build.gradle        # App module Gradle config
│   └── gradle.properties       # NDK, parallel builds, new arch settings
├── email-templates/            # Supabase email HTML templates
├── scripts/
│   └── generate-assets.js      # Generates placeholder app icons
├── docs/
│   └── QA_BUTTON_FLOW_CHECKLIST.md  # Manual QA test checklist
│
├── app.json                    # Expo app config (scheme, permissions, plugins)
├── babel.config.js             # Babel (module-resolver, reanimated plugin)
├── metro.config.js             # Metro bundler (web stubs, Zustand CJS override)
├── tsconfig.json               # TypeScript configuration
├── eas.json                    # EAS build profiles
└── .env                        # Environment variables (never committed)
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npx expo run:android` | Build native APK and install on connected Android device |
| `npx expo start` | Start Metro (use after APK is already installed) |
| `npm run web` | Run in browser at `http://localhost:8081` |
| `npm run lint` | Run ESLint across the project |
| `node scripts/generate-assets.js` | Regenerate placeholder app icons |

---

## Known Limitations

| Feature | Platform | Reason |
|---------|----------|--------|
| QR code scanner | Web | `expo-camera` requires native camera API |
| Google Maps | Web | `react-native-maps` is native-only (grey stub shown on web) |
| Push notifications | Web / Expo Go | Requires native push infrastructure |
| Apple Sign-In | Android / Web | iOS only |
| Haptic feedback | Web | Native API unavailable |

---

## Troubleshooting

### `failed to download remote update` on Android (Wi-Fi)
Windows Firewall is blocking Metro. Run in an admin terminal:
```cmd
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
```

### App not found / `adb devices` shows nothing
- Ensure USB Debugging is ON in Developer Options
- Try a different USB cable (some are charge-only)
- Accept the "Allow USB Debugging?" prompt that appears on the phone screen

### Build fails — `minSdkVersion 22 but library was built for 24`
The `android/build.gradle` `ext` block pins all SDK versions. Do not modify those values. If you see this error, run:
```bash
rm -rf android/.gradle android/build android/app/build
npx expo run:android
```

### NDK not found / `does not contain platforms`
NDK 27.1.12297006 must be fully installed (not just the stub). Verify:
```bash
ls "C:/Users/X/AppData/Local/Android/Sdk/ndk/27.1.12297006"
# Should show: build  ndk-build  platforms  prebuilt  toolchains  ...
```
If it only shows `source.properties`, reinstall via Android Studio → SDK Manager → SDK Tools → NDK (Side by side) → 27.1.12297006.

### Blank screen on web
```bash
rm -rf node_modules/.cache
npm run web
```

### Metro bundler errors / stale cache
```bash
npx expo start --clear
```

### Android Gradle sync fails
```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

### "Email not confirmed" on login
The user must click the verification link sent to their email. Use the **Resend Verification Email** button on the login screen or check Supabase → Authentication → Users.

### Supabase connection errors
- Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- Ensure the Supabase project is not paused (free tier pauses after inactivity — click **Restore** in the Supabase dashboard)
- Confirm all RLS policies are applied correctly

### Deep links not working (OAuth / email callback)
- Add `businesshubpro://auth/callback` to **Supabase → Authentication → URL Configuration → Redirect URLs**
- On Android, confirm `scheme: "businesshubpro"` is set in `app.json`

### iOS — CocoaPods not installed
```bash
sudo gem install cocoapods
cd ios && pod install && cd ..
npx expo run:ios
```

---

## License

This project is for academic / FYP use. All rights reserved.
