/**
 * Notification Service
 * Handles push notification permissions and local notifications
 * using expo-notifications (already installed in package.json)
 *
 * NOTE: In Expo Go (SDK 53+) remote push notifications are removed.
 * Local notifications still work. We detect the environment and skip
 * any push-specific setup when running inside Expo Go.
 */

import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Returns true when the app is running inside Expo Go (store client).
 * In that environment push-notification channels throw a warning and
 * remote notifications are unavailable, so we skip that setup.
 */
function isExpoGo(): boolean {
  return (
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo'
  );
}

// Configure how notifications appear when app is in foreground.
// Wrapped in try/catch so Expo Go never hard-crashes on this call.
try {
  ExpoNotifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowAlert: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: ExpoNotifications.AndroidNotificationPriority.HIGH,
    }),
  });
} catch {
  // Running in Expo Go – local notification handler not required
}

/**
 * Request push notification permissions from the OS
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Expo Go (SDK 53+): remote push not available – skip silently
    if (isExpoGo()) return false;

    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'BusinessHub Pro',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A1A1A',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await ExpoNotifications.setNotificationChannelAsync('queue_updates', {
        name: 'Queue Updates',
        importance: ExpoNotifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        description: 'Notifications about your queue position and turn',
      });

      await ExpoNotifications.setNotificationChannelAsync('order_updates', {
        name: 'Order Updates',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        description: 'Notifications when your order is ready',
      });

      await ExpoNotifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions & Loyalty',
        importance: ExpoNotifications.AndroidImportance.DEFAULT,
        sound: 'default',
        showBadge: false,
        description: 'Loyalty points and promotional offers',
      });
    }

    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    if (isExpoGo()) return false;
    const { status } = await ExpoNotifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export interface LocalNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  badgeCount?: number;
  /** Whether to play notification sound (default: true) */
  sound?: boolean;
  /** Whether to vibrate on Android (default: true) */
  vibrate?: boolean;
}

/**
 * Schedule an immediate local push notification.
 * Pass sound=false or vibrate=false to honour per-user setting toggles.
 */
export async function sendLocalNotification(payload: LocalNotificationPayload): Promise<string | null> {
  try {
    if (isExpoGo()) return null; // Not supported in Expo Go SDK 53+

    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) return null;

    const soundValue = payload.sound === false ? undefined : 'default';
    const vibrateValue = payload.vibrate === false ? undefined : [0, 250, 250, 250];

    const id = await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: soundValue,
        badge: payload.badgeCount,
        ...(Platform.OS === 'android' && {
          channelId: payload.channelId ?? 'default',
          priority: 'high',
          ...(vibrateValue ? { vibrate: vibrateValue } : {}),
          color: '#1A1A1A',
        }),
      },
      trigger: null, // immediate
    });

    return id;
  } catch {
    return null;
  }
}

/**
 * Cancel all pending notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    if (isExpoGo()) return;
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/**
 * Set the badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    if (isExpoGo()) return;
    await ExpoNotifications.setBadgeCountAsync(count);
  } catch {}
}

// ─── Notification generators for each event type ──────────────────────────

/** Called when user joins a queue */
export async function notifyQueueJoined(businessName: string, position: number, estimatedWait: string, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title: '🎫 Queue Joined!',
    body: `You're #${position} in line at ${businessName}. Est. wait: ${estimatedWait}`,
    data: { type: 'queue_update', businessName },
    channelId: 'queue_updates',
    ...opts,
  });
}

/** Called when queue position gets close (≤ 3) */
export async function notifyAlmostYourTurn(businessName: string, position: number, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title: '⏰ Almost Your Turn!',
    body: `You're #${position} at ${businessName}. Get ready!`,
    data: { type: 'queue_update', businessName },
    channelId: 'queue_updates',
    ...opts,
  });
}

/** Called when it's the user's turn */
export async function notifyYourTurnNow(businessName: string, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title: "🔔 It's Your Turn!",
    body: `Please proceed to ${businessName} now.`,
    data: { type: 'queue_update', businessName },
    channelId: 'queue_updates',
    ...opts,
  });
}

/** Called when an order status changes to ready */
export async function notifyOrderReady(businessName: string, orderNumber: string, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title: '✅ Order Ready!',
    body: `Order #${orderNumber} from ${businessName} is ready for pickup!`,
    data: { type: 'order_ready', businessName, orderNumber },
    channelId: 'order_updates',
    ...opts,
  });
}

/** Called when loyalty points are earned */
export async function notifyLoyaltyPoints(points: number, totalPoints: number, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title: '⭐ Loyalty Points Earned!',
    body: `You earned ${points} points! Total: ${totalPoints} pts. Keep visiting to unlock rewards.`,
    data: { type: 'loyalty', points },
    channelId: 'promotions',
    ...opts,
  });
}

/** Called on first login / welcome */
export async function notifyWelcome(name: string, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title: '👋 Welcome to BusinessHub Pro!',
    body: `Hi ${name}! Scan QR codes to join queues and track your orders in real-time.`,
    data: { type: 'promo' },
    channelId: 'promotions',
    ...opts,
  });
}

/** Promo / generic notification */
export async function notifyPromo(title: string, message: string, opts?: { sound?: boolean; vibrate?: boolean }) {
  await sendLocalNotification({
    title,
    body: message,
    data: { type: 'promo' },
    channelId: 'promotions',
    ...opts,
  });
}
