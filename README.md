# BusinessHub Pro

A cross-platform mobile application for virtual queue management, built with React Native and Expo. Users can discover nearby businesses, join virtual queues, track orders, and receive real-time notifications.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Supabase Setup](#3-supabase-setup)
  - [4. Environment Variables](#4-environment-variables)
  - [5. Supabase Database Setup](#5-supabase-database-setup)
  - [6. Email Template Configuration](#6-email-template-configuration)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Configuration Details](#configuration-details)
- [Troubleshooting](#troubleshooting)
- [Contributor Setup (Private Repository)](#contributor-setup-private-repository)
- [License](#license)

## Features

- **Virtual Queue Management** - Join and track queues remotely
- **Real-Time Updates** - Live queue position and wait time notifications
- **Business Discovery** - Find nearby businesses with ratings and reviews
- **QR Code Scanner** - Quick queue joining via QR codes
- **Order Tracking** - Track order status from placement to completion
- **User Authentication** - Secure email/password authentication with email verification
- **Profile Management** - Manage user profile, loyalty points, and preferences
- **Dark Mode Support** - Automatic system theme detection

## Tech Stack

| Category         | Technology                          |
| ---------------- | ----------------------------------- |
| Framework        | React Native 0.81.5                 |
| Build System     | Expo SDK 54                         |
| Navigation       | Expo Router (file-based routing)    |
| State Management | Zustand 4.5                         |
| Backend          | Supabase (Auth + PostgreSQL)        |
| Language         | TypeScript 5.9                      |
| UI Components    | Custom components with React Native |
| Animations       | React Native Reanimated             |

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **yarn** (v1.22 or higher)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Expo Go App** - Install on your mobile device from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Git** - [Download](https://git-scm.com/)

For iOS development (macOS only):

- **Xcode** (latest version) - From Mac App Store
- **CocoaPods** - `sudo gem install cocoapods`

For Android development:

- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (API Level 34 or higher)
- **Java Development Kit (JDK)** 17

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Business_pro_hub_app.git
cd Business_pro_hub_app
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Supabase Setup

This app uses [Supabase](https://supabase.com/) as the backend for authentication and database. You need to create your own Supabase project.

#### Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: BusinessHub Pro (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"** and wait for it to be ready

#### Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### 4. Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file with your Supabase credentials:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Never commit your `.env` file to version control. It's already listed in `.gitignore`.

### 5. Supabase Database Setup

Run the following SQL in your Supabase SQL Editor (**SQL Editor** > **New Query**):

```sql
-- Create User profile table
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Create policies for User table
CREATE POLICY "Users can view their own profile"
    ON public."User"
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public."User"
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public."User"
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 6. Email Template Configuration

The app uses email verification. Configure the email template in Supabase:

1. Go to **Authentication** > **Email Templates** in your Supabase dashboard
2. Select **"Confirm signup"** template
3. Replace the default template with the content from `email-templates/verification-email.html`
4. Update the **Subject** to: `Verify your BusinessHub Pro account`

#### Configure Email Settings

1. Go to **Authentication** > **Settings**
2. Under **Email Auth**, ensure:
   - **Enable Email Signup** is ON
   - **Confirm email** is ON
3. Under **Site URL**, set your app's deep link URL:
   - For development: `businesshubpro://auth/callback`
   - For production: Your production URL
4. Under **Redirect URLs**, add:
   - `businesshubpro://auth/callback`
   - `exp://localhost:8081/--/auth/callback` (for Expo Go development)

## Running the App

### Development Mode

```bash
# Start the Expo development server
npm start

# Or with specific platform
npm run android    # Android
npm run ios        # iOS (macOS only)
npm run web        # Web browser
```

### Using Expo Go (Recommended for Development)

1. Start the development server: `npm start`
2. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Project Structure

```
Business_pro_hub_app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── welcome.tsx      # Welcome/landing screen
│   │   ├── login.tsx        # Login screen
│   │   ├── register.tsx     # Registration screen
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main tab navigation
│   │   ├── index.tsx        # Home screen
│   │   ├── queue.tsx        # Queue management
│   │   ├── orders.tsx       # Order tracking
│   │   ├── profile.tsx      # User profile
│   │   └── scan.tsx         # QR scanner
│   ├── auth/                # Auth callback handlers
│   ├── business/[id].tsx    # Business detail (dynamic route)
│   ├── queue/[id].tsx       # Queue status (dynamic route)
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point
├── components/              # Reusable components
│   └── ui/                  # Core UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── ...
├── lib/                     # Core libraries
│   ├── supabase.ts         # Supabase client
│   └── auth.ts             # Auth functions
├── store/                   # State management
│   └── useStore.ts         # Zustand store
├── hooks/                   # Custom React hooks
│   └── useTheme.ts
├── constants/               # App constants
│   └── theme.ts            # Theme configuration
├── types/                   # TypeScript types
│   └── index.ts
├── email-templates/         # Email templates
├── assets/                  # Images, icons, fonts
├── .env.example            # Environment template
├── app.json                # Expo configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## Available Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm start`       | Start Expo development server  |
| `npm run android` | Run on Android device/emulator |
| `npm run ios`     | Run on iOS device/simulator    |
| `npm run web`     | Run in web browser             |
| `npm run lint`    | Run ESLint                     |

## Configuration Details

### App Configuration (`app.json`)

| Setting           | Value                      |
| ----------------- | -------------------------- |
| App Name          | BusinessHub Pro            |
| Bundle ID (iOS)   | `com.businesshubpro.app`   |
| Package (Android) | `com.businesshubpro.app`   |
| Deep Link Scheme  | `businesshubpro://`        |
| Orientation       | Portrait                   |
| Theme             | Automatic (follows system) |

### Required Permissions

**iOS:**

- Camera - QR code scanning
- Location When In Use - Find nearby businesses

**Android:**

- `CAMERA` - QR code scanning
- `ACCESS_FINE_LOCATION` - Precise location
- `ACCESS_COARSE_LOCATION` - Approximate location

### Environment Variables Reference

| Variable                        | Description                   | Required |
| ------------------------------- | ----------------------------- | -------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     | Yes      |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes      |

## Troubleshooting

### Common Issues

**1. "Metro Bundler" connection issues**

```bash
# Clear Metro cache
npx expo start --clear
```

**2. iOS build fails on M1/M2 Mac**

```bash
cd ios && pod install --repo-update && cd ..
```

**3. Android Gradle sync issues**

```bash
cd android && ./gradlew clean && cd ..
```

**4. Environment variables not loading**

- Ensure `.env` file is in the project root
- Restart the Expo server after changing `.env`
- Variables must be prefixed with `EXPO_PUBLIC_`

**5. Email verification not working**

- Check Supabase email settings are configured
- Verify the redirect URL includes your app scheme
- Check spam folder for verification emails

**6. Supabase connection errors**

- Verify your API keys are correct
- Check if your Supabase project is active
- Ensure Row Level Security policies are set up

### Getting Help

If you encounter issues:

1. Check the [Expo Documentation](https://docs.expo.dev/)
2. Check the [Supabase Documentation](https://supabase.com/docs)
3. Search existing [GitHub Issues](https://github.com/your-username/Business_pro_hub_app/issues)
4. Create a new issue with detailed information

## Contributor Setup (Private Repository)

If you're a contributor joining this private repository and need to use the **shared Supabase backend**, follow these steps. The project owner will provide you with the necessary credentials.

### For Project Owner: How to Share Credentials Securely

**Never commit credentials to the repository.** Use one of these secure methods:

#### Option 1: GitHub Repository Secrets (Recommended for CI/CD)

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. These can be used in GitHub Actions workflows

#### Option 2: Private Sharing via Secure Channels

Share credentials with contributors through:

- **Password manager** (1Password, Bitwarden, LastPass) - Create a shared vault
- **Encrypted messaging** (Signal, WhatsApp) - Send credentials directly
- **GitHub Codespaces Secrets** - If using Codespaces for development
- **Notion/Confluence** (private team page with restricted access)

#### Option 3: Create a `.env.shared` File (Not Committed)

Create a file called `CREDENTIALS.md` or share via team chat:

```
# BusinessHub Pro - Shared Development Credentials
# DO NOT COMMIT THIS FILE

EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### For Contributors: Setting Up with Shared Credentials

#### Step 1: Clone the Repository

```bash
git clone https://github.com/owner-username/Business_pro_hub_app.git
cd Business_pro_hub_app
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Get Credentials from Project Owner

Contact the project owner to receive:

| Credential                      | Description                            |
| ------------------------------- | -------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase project URL                   |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (safe to share) |

**Note:** The `anon` key is designed to be used in client-side applications. It's safe to share with contributors as it only allows operations permitted by Row Level Security (RLS) policies.

#### Step 4: Create Your `.env` File

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` and paste the credentials provided by the project owner:

```env
# Supabase Configuration (provided by project owner)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Step 5: Verify Setup

```bash
# Start the development server
npm start
```

If the app connects to Supabase successfully (you can register/login), the setup is complete.

### Adding Contributors to Supabase (Optional)

If contributors need **direct access to the Supabase dashboard** (to view data, run SQL, etc.):

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Team**
4. Click **Invite** and enter the contributor's email
5. Choose role:
   - **Developer** - Can view/edit database, but can't change billing
   - **Read-only** - Can only view data

### Security Best Practices for Teams

| Do                                       | Don't                               |
| ---------------------------------------- | ----------------------------------- |
| Share credentials via encrypted channels | Commit `.env` to git                |
| Use environment variables                | Hardcode credentials in source code |
| Rotate keys if a team member leaves      | Share service_role key (admin key)  |
| Use RLS policies to protect data         | Disable Row Level Security          |
| Add `.env` to `.gitignore`               | Post credentials in public channels |

### Quick Reference: What Each Key Does

| Key                         | Access Level                      | Safe to Share with Contributors? |
| --------------------------- | --------------------------------- | -------------------------------- |
| `SUPABASE_URL`              | Project URL                       | Yes                              |
| `SUPABASE_ANON_KEY`         | Client-side access (respects RLS) | Yes                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Full admin access (bypasses RLS)  | **NO - Never share**             |

### Troubleshooting Contributor Setup

**"Invalid API key" error**

- Double-check the credentials were copied correctly (no extra spaces)
- Ensure variables are prefixed with `EXPO_PUBLIC_`

**"Permission denied" database errors**

- RLS policies may not be set up correctly
- Ask project owner to verify database policies

**Can't connect to Supabase**

- Check if the Supabase project is paused (free tier pauses after inactivity)
- Project owner needs to unpause from dashboard

## License

This project is private and proprietary.

---

Built with React Native, Expo, and Supabase
