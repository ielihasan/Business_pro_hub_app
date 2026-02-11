# BusinessHub Pro - Project Analysis

## Overview
BusinessHub Pro is a cross-platform mobile application designed for virtual queue management and business interaction. It allows users to discover businesses, join virtual queues, track orders, and manage their profiles.

## Tech Stack
-   **Framework:** React Native 0.81.5
-   **Build System:** Expo SDK 54
-   **Language:** TypeScript 5.9
-   **Navigation:** Expo Router (File-based routing)
-   **State Management:** Zustand 4.5
-   **Backend:** Supabase (PostgreSQL + Auth)
-   **Styling:** Custom styles with React Native StyleSheet, theming support.
-   **UI Components:** Custom components in `components/ui`
-   **Animations:** React Native Reanimated

## Key Features

### 1. Virtual Queue Management
-   **Remote Joining:** Users can join queues without being physically present.
-   **Real-time Status:** Track current position, number of people ahead, and estimated wait time.
-   **Queue History:** View past queue sessions (completed or cancelled).
-   **Management:** Ability to leave a queue or mark it as completed.

### 2. Order Tracking
-   **Lifecycle Monitoring:** Track orders through states: `pending` -> `in_progress` -> `ready` -> `completed`.
-   **Order Details:** View items, quantities, prices, and total cost.
-   **Payment Info:** Displays payment method used.

### 3. Business Discovery & Interaction
-   **Discovery:** List businesses with key info like category, address, and live wait times.
-   **Smart Sorting:** Likely uses location data to show `distance` (indicated by `distance` field in Business model).
-   **Engagement:**
    -   Rating and review count system.
    -   "Favorites" list for quick access.
    -   Operational status (Open/Closed).

### 4. User Authentication & Profile
-   **Supabase Auth:** Email/Password registration and login.
-   **Verification:** Email verification flow enforced before login.
-   **Profile Management:**
    -   Update Name, Phone, and Avatar.
    -   System-assigned storage for `avatar_url`.

### 5. Loyalty & Rewards System
-   **Points Tracking:** Users earn `loyaltyPoints` and track `totalVisits`.
-   **Membership:** Displays "Member Since" date.

### 6. Notifications System
-   **Types:**
    -   `queue_update`: Updates on position or wait time.
    -   `order_ready`: Alerts when an order is ready for pickup.
    -   `loyalty`: Updates on points earned.
    -   `promo`: Promotional messages.
-   **Management:** Ability to mark notifications as read.

### 7. Core App Features
-   **QR Code Scanner:** Integrated camera functionality for quick interactions (likely scanning business codes).
-   **Theming:** Full support for Dark and Light modes (Auto-detected).
-   **Location Services:** Hooks for location permissions to support business discovery.

## Project Structure
-   **`app/`**: Expo Router screens.
    -   `(auth)/`: Login, Register, Forgot Password, Welcome.
    -   `(tabs)/`: Home, Queue, Orders, Profile, Scanner.
    -   `business/[id].tsx`: Business details.
    -   `queue/[id].tsx`: Live queue status.
-   **`store/`**: centralized state via Zustand (`useStore.ts`).
    -   Manages client-side state for all features causing a reactive UI.
-   **`lib/`**:
    -   `supabase.ts`: Database connection.
    -   `auth.ts`: Auth wrappers.
-   **`constants/`**:
    -   `theme.ts`: Centralized color and spacing tokens.
-   **`hooks/`**:
    -   `useTheme.ts`: Helper for accessing theme colors.

## Data Models (Inferred from Store)
-   **User:** `id`, `name`, `email`, `phone`, `loyaltyPoints`, `totalVisits`.
-   **Business:** `id`, `name`, `rating`, `waitTime`, `queueLength`, `isOpen`.
-   **QueueEntry:** `ticketNumber`, `position`, `estimatedWait`, `status`.
-   **Order:** `orderNumber`, `status`, `items`, `total`.

## Technical Observations
-   **Auth Flow:** The app strictly handles email verification states (`email_confirmed_at`), preventing unverified logins.
-   **State Sync:** Zustand is used for global state, but specialized hooks or React Query might be beneficial for server-state synchronization as the app scales.
-   **Styling:** manual `StyleSheet` usage with constants (`constants/theme.ts`) allows for fine-grained control but requires discipline to maintain consistency compared to utility frameworks.
