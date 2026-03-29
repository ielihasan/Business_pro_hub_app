import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentSession,
  getUserProfile,
  syncAuthUserToUsersTable,
  onAuthStateChange,
  RegisterData,
  LoginData,
} from '@/lib/auth';
import {
  joinBusinessQueue,
  leaveQueueEntry,
  fetchUserActiveQueues,
  fetchUserQueueHistory,
  QueueEntryRecord,
  ticketLabel,
  formatWait,
} from '@/lib/queue';
import {
  requestNotificationPermissions,
  notifyQueueJoined,
  notifyAlmostYourTurn,
  notifyYourTurnNow,
  notifyOrderReady,
  notifyLoyaltyPoints,
  notifyWelcome,
  setBadgeCount,
} from '@/lib/notificationService';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

/** True when running inside Expo Go (SDK 53+: push not available) */
const runningInExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  loyaltyPoints: number;
  totalVisits: number;
  memberSince: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  waitTime: string;
  queueLength: number;
  distance?: string;
  image?: string | null;
}

export interface QueueEntry {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  ticketNumber: string;
  position: number;
  totalInQueue: number;
  estimatedWait: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  joinedAt: string;
  /** Set when the entry is completed or cancelled (from DB completed_at / cancelled_at) */
  completedAt?: string;
}

export interface Order {
  id: string;
  businessId: string;
  businessName: string;
  orderNumber: string;
  status: 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  createdAt: string;
  paymentMethod: string;
}

export interface Notification {
  id: string;
  type: 'queue_update' | 'order_ready' | 'loyalty' | 'promo';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Store State
interface AppState {
  // Auth
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  authError: string | null;

  // Queue
  activeQueues: QueueEntry[];
  queueHistory: QueueEntry[];

  // Orders
  orders: Order[];

  // Businesses
  favoriteBusinesses: string[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Settings
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  darkMode: boolean;
  theme: 'light' | 'dark' | 'black' | null;  // null = follow system
  // Granular notification settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  queueNotificationsEnabled: boolean;
  orderNotificationsEnabled: boolean;
  promoNotificationsEnabled: boolean;
  // Privacy
  analyticsEnabled: boolean;
  // Display
  compactViewEnabled: boolean;

  // Auth Actions
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  /** Activate auth state from an already-live session without touching isLoading */
  activateSession: () => Promise<void>;
  setAuthError: (error: string | null) => void;
  clearAuthError: () => void;

  // User Actions
  setUser: (user: User | null) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  updateProfile: (updates: { avatar_url?: string | null; full_name?: string }) => Promise<{ success: boolean; error?: any }>;
  updateFullProfile: (updates: { name: string; phone: string }) => Promise<{ success: boolean; error?: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: any }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;

  // Queue actions
  joinQueue: (queue: QueueEntry) => void;
  leaveQueue: (queueId: string) => void;
  updateQueuePosition: (queueId: string, position: number, estimatedWait: string) => void;
  completeQueue: (queueId: string) => void;
  joinQueueInSupabase: (
    businessId: string,
    serviceType?: string,
    pricing?: { quantity?: number; unitPrice?: number; totalAmount?: number }
  ) => Promise<{ success: boolean; queueEntryId?: string; error?: string }>;
  leaveQueueInSupabase: (entryId: string) => Promise<{ success: boolean; error?: string }>;
  syncQueuesFromSupabase: () => Promise<void>;

  // Order actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Favorites
  toggleFavorite: (businessId: string) => void;

  // Feedback
  submitFeedback: (data: { rating: number; category: string; message: string }) => Promise<{ success: boolean; error?: string }>;

  // Notifications
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Settings
  toggleNotifications: () => Promise<void>;
  toggleLocation: () => Promise<void>;
  toggleDarkMode: () => void;
  setTheme: (theme: 'light' | 'dark' | 'black' | null) => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleQueueNotifications: () => void;
  toggleOrderNotifications: () => void;
  togglePromoNotifications: () => void;
  toggleAnalytics: () => void;
  toggleCompactView: () => void;
  clearCache: () => void;
}

// Helper: map Supabase user to app User
const mapSupabaseUserToUser = (supabaseUser: SupabaseUser, profile?: any): User => {
  const metadata = (supabaseUser.user_metadata as any) || {};
  return {
    id: supabaseUser.id,
    name: profile?.full_name || metadata.full_name || 'User',
    email: supabaseUser.email || '',
    phone: profile?.phone_number || metadata.phone_number || '',
    avatar: profile?.avatar_url || metadata.avatar_url || null,
    // DB column takes priority; fall back to metadata so points survive without SQL migration
    loyaltyPoints: profile?.loyalty_points ?? metadata.loyalty_points ?? 0,
    totalVisits: profile?.total_visits ?? metadata.total_visits ?? 0,
    memberSince: new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
};

// ─── Realtime subscription for current user's queue entries ──────────────────
let _queueRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function _setupQueueSubscription(userId: string) {
  // Remove any existing channel before creating a new one
  _teardownQueueSubscription();
  _queueRealtimeChannel = supabase
    .channel(`user-queues:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'queues', filter: `customer_id=eq.${userId}` },
      () => {
        // Re-sync the full queue state whenever any of this user's rows change
        useStore.getState().syncQueuesFromSupabase();
      }
    )
    .subscribe();
}

function _teardownQueueSubscription() {
  if (_queueRealtimeChannel) {
    supabase.removeChannel(_queueRealtimeChannel);
    _queueRealtimeChannel = null;
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: true,
      user: null,
      session: null,
      authError: null,
      activeQueues: [],
      queueHistory: [],
      orders: [],
      favoriteBusinesses: [],
      notifications: [],
      unreadCount: 0,
      notificationsEnabled: true,
      locationEnabled: true,
      darkMode: false,
      theme: null,  // null = adaptive to system
      soundEnabled: true,
      vibrationEnabled: true,
      queueNotificationsEnabled: true,
      orderNotificationsEnabled: true,
      promoNotificationsEnabled: false,
      analyticsEnabled: true,
      compactViewEnabled: false,

      // Auth Actions
      login: async (data: LoginData) => {
        set({ isLoading: true, authError: null });
        const result = await loginUser(data);

        if (result.success && result.user) {
          // If email confirmation required, don't authenticate
          if (!result.user.email_confirmed_at && !result.user.confirmed_at) {
            set({
              isAuthenticated: false,
              user: null,
              session: null,
              activeQueues: [],
              queueHistory: [],
              orders: [],
              notifications: [],
              unreadCount: 0,
              isLoading: false,
              authError: null,
            });
            return { success: false, error: 'Please verify your email address before logging in. Check your inbox for a confirmation link.' };
          }

          const syncResult = await syncAuthUserToUsersTable(result.user);
          if (!syncResult.success) {
            console.warn('users table sync on login failed:', syncResult.error);
          }

          const profile = await getUserProfile(result.user.id);
          const user = mapSupabaseUserToUser(result.user, profile);

          set({ isAuthenticated: true, user, session: result.session, isLoading: false, authError: null });
          _setupQueueSubscription(result.user.id);

          // Request notification permissions and send welcome notification
          const { notificationsEnabled, addNotification } = get();
          if (notificationsEnabled) {
            if (!runningInExpoGo) {
              // Only request OS permissions in development builds
              const granted = await requestNotificationPermissions();
              if (granted) await notifyWelcome(user.name);
            }
            // Always add in-app welcome notification
            addNotification({
              id: `welcome-${Date.now()}`,
              type: 'promo',
              title: '👋 Welcome to BusinessHub Pro!',
              message: `Hi ${user.name}! Scan QR codes to join queues and track orders in real-time.`,
              read: false,
              createdAt: new Date().toISOString(),
            });
          }

          return { success: true };
        }

        set({ isAuthenticated: false, user: null, session: null, isLoading: false, authError: result.error || 'Login failed' });
        return { success: false, error: result.error };
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, authError: null });
        const result = await registerUser(data);

        if (result.success && result.user) {
          // Sign out to prevent auto-login — user must go through the login flow
          if (result.session) {
            await supabase.auth.signOut();
          }
          set({ isAuthenticated: false, user: null, session: null, isLoading: false, authError: null });
          return { success: true };
        }

        set({ isAuthenticated: false, user: null, session: null, isLoading: false, authError: result.error || 'Registration failed' });
        return { success: false, error: result.error };
      },

      logout: async () => {
        set({ isLoading: true });
        _teardownQueueSubscription();
        await logoutUser();
        set({
          isAuthenticated: false,
          user: null,
          session: null,
          activeQueues: [],
          queueHistory: [],
          orders: [],
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          authError: null,
        });
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const session = await getCurrentSession();
          if (session?.user && (session.user.email_confirmed_at || session.user.confirmed_at)) {
            const syncResult = await syncAuthUserToUsersTable(session.user);
            if (!syncResult.success) {
              console.warn('users table sync on auth init failed:', syncResult.error);
            }

            const profile = await getUserProfile(session.user.id);
            const user = mapSupabaseUserToUser(session.user, profile);
            set({ isAuthenticated: true, user, session, isLoading: false });
            _setupQueueSubscription(session.user.id);
          } else {
            set({ isAuthenticated: false, user: null, session: null, isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isAuthenticated: false, user: null, session: null, isLoading: false });
        }
      },

      activateSession: async () => {
        // Like initializeAuth but does NOT set isLoading — safe to call from
        // within a screen without triggering index.tsx navigation side-effects.
        try {
          const session = await getCurrentSession();
          if (session?.user) {
            const profile = await getUserProfile(session.user.id);
            const user = mapSupabaseUserToUser(session.user, profile);
            set({ isAuthenticated: true, user, session });
            _setupQueueSubscription(session.user.id);
          }
        } catch (error) {
          console.error('activateSession error:', error);
        }
      },

      setAuthError: (error) => set({ authError: error }),
      clearAuthError: () => set({ authError: null }),

      // User Actions
      setUser: (user) => set({ user }),
      updateUserProfile: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

      updateProfile: async (updates) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.updateUser({ data: updates });
        if (error) {
          set({ authError: error.message, isLoading: false });
          return { success: false, error };
        }
        if (data.user) {
          const profile = await getUserProfile(data.user.id);
          const updatedUser = mapSupabaseUserToUser(data.user, profile);
          set({ user: updatedUser, isLoading: false });
        }
        return { success: true };
      },

      updateFullProfile: async (updates) => {
        set({ isLoading: true });
        const { data: authData, error: authError } = await supabase.auth.updateUser({ data: { full_name: updates.name, phone_number: updates.phone } });
        if (authError) {
          set({ isLoading: false });
          return { success: false, error: authError.message };
        }
        const { error: dbError } = await supabase.from('users').update({ full_name: updates.name, phone_number: updates.phone, updated_at: new Date().toISOString() }).eq('id', get().user?.id);
        if (dbError) {
          console.error('Error updating users table:', dbError);
          set({ isLoading: false });
          return { success: false, error: dbError.message };
        }
        if (authData.user) {
          const profile = await getUserProfile(authData.user.id);
          const updatedUser = mapSupabaseUserToUser(authData.user, profile);
          set({ user: updatedUser, isLoading: false });
        }
        return { success: true };
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          const sessionUser = get().user;
          if (!sessionUser?.email) {
            set({ isLoading: false });
            return { success: false, error: 'User email not found' };
          }
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: sessionUser.email, password: currentPassword });
          if (signInError) {
            set({ isLoading: false });
            return { success: false, error: 'Current password is incorrect' };
          }
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) {
            set({ isLoading: false });
            return { success: false, error: updateError.message };
          }
          set({ isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Failed to change password' };
        }
      },

      deleteAccount: async () => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
        set({ isLoading: true });
        try {
          // Strict path: delete full account (auth + public data) in one RPC.
          // This guarantees the same email can be used again only after true delete.
          const { error: fullDeleteRpcError } = await supabase.rpc('delete_my_account');
          if (fullDeleteRpcError) {
            throw new Error(fullDeleteRpcError.message || 'Failed to delete account');
          }

          // Sign out and clear local state.
          await supabase.auth.signOut();

          set({
            isAuthenticated: false, user: null, session: null,
            activeQueues: [], queueHistory: [], orders: [],
            notifications: [], unreadCount: 0, isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Failed to delete account' };
        }
      },

      // Queue actions
      joinQueue: (queue) => set((state) => ({ activeQueues: [...state.activeQueues, queue] })),
      leaveQueue: (queueId) => set((state) => ({
        activeQueues: state.activeQueues.filter(q => q.id !== queueId),
        queueHistory: [...state.queueHistory, { ...state.activeQueues.find(q => q.id === queueId)!, status: 'cancelled' as const }].filter(Boolean) as QueueEntry[],
      })),
      updateQueuePosition: (queueId, position, estimatedWait) => {
        set((state) => ({ activeQueues: state.activeQueues.map(q => q.id === queueId ? { ...q, position, estimatedWait } : q) }));
        // Trigger position-based notifications
        const { notificationsEnabled, queueNotificationsEnabled, soundEnabled, vibrationEnabled, addNotification, activeQueues, unreadCount } = get();
        const notifOpts = { sound: soundEnabled, vibrate: vibrationEnabled };
        if (notificationsEnabled && queueNotificationsEnabled) {
          const queue = activeQueues.find(q => q.id === queueId);
          if (queue) {
            if (position === 1) {
              const notif = {
                id: `your-turn-${queueId}-${Date.now()}`,
                type: 'queue_update' as const,
                title: "🔔 It's Your Turn!",
                message: `Please proceed to ${queue.businessName} now.`,
                read: false,
                createdAt: new Date().toISOString(),
              };
              addNotification(notif);
              if (!runningInExpoGo) {
                notifyYourTurnNow(queue.businessName, notifOpts);
                setBadgeCount(unreadCount + 1);
              }
            } else if (position <= 3) {
              const notif = {
                id: `almost-turn-${queueId}-${Date.now()}`,
                type: 'queue_update' as const,
                title: '⏰ Almost Your Turn!',
                message: `You're #${position} at ${queue.businessName}. Get ready!`,
                read: false,
                createdAt: new Date().toISOString(),
              };
              addNotification(notif);
              if (!runningInExpoGo) {
                notifyAlmostYourTurn(queue.businessName, position, notifOpts);
                setBadgeCount(unreadCount + 1);
              }
            }
          }
        }
      },
      completeQueue: (queueId) => set((state) => {
        const queue = state.activeQueues.find(q => q.id === queueId);
        if (!queue) return state;
        return { activeQueues: state.activeQueues.filter(q => q.id !== queueId), queueHistory: [...state.queueHistory, { ...queue, status: 'completed' as const }] };
      }),

      // Supabase-backed queue actions
      joinQueueInSupabase: async (
        businessId: string,
        serviceType?: string,
        pricing?: { quantity?: number; unitPrice?: number; totalAmount?: number }
      ) => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
        const { data, error } = await joinBusinessQueue(businessId, user.id, {
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone,
          serviceType,
          quantity: pricing?.quantity,
          unitPrice: pricing?.unitPrice,
          totalAmount: pricing?.totalAmount,
        });
        if (error || !data) return { success: false, error: error ?? 'Failed to join queue' };
        const entry: QueueEntry = {
          id: data.id,
          businessId: data.business_id,
          businessName: data.business?.name ?? '',
          businessCategory: data.business?.category ?? '',
          ticketNumber: ticketLabel(data.position),
          position: data.position,
          totalInQueue: data.business?.queue_length ?? data.position,
          estimatedWait: formatWait(data.estimated_wait_time),
          status: data.status,
          joinedAt: new Date(data.joined_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        // Remove duplicate if re-joining same business
        set((state) => ({
          activeQueues: [
            ...state.activeQueues.filter(q => q.businessId !== businessId),
            entry,
          ],
        }));

        // Trigger in-app + push notification
        const { notificationsEnabled, queueNotificationsEnabled, soundEnabled, vibrationEnabled, addNotification, unreadCount } = get();
        const notifOpts = { sound: soundEnabled, vibrate: vibrationEnabled };
        if (notificationsEnabled && queueNotificationsEnabled) {
          const notif = {
            id: `queue-joined-${entry.id}`,
            type: 'queue_update' as const,
            title: '🎫 Queue Joined!',
            message: `You're #${entry.position} in line at ${entry.businessName}. Est. wait: ${entry.estimatedWait}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          addNotification(notif);
          if (!runningInExpoGo) {
            await notifyQueueJoined(entry.businessName, entry.position, entry.estimatedWait, notifOpts);
            await setBadgeCount(unreadCount + 1);
          }
        }

        // Auto-create an order entry so it shows in the Orders tab
        const quantity = pricing?.quantity ?? 1;
        const unitPrice = pricing?.unitPrice ?? 0;
        const totalAmount = pricing?.totalAmount ?? unitPrice * quantity;

        const orderEntry: Order = {
          id: `order-${data.id}`,
          businessId: businessId,
          businessName: entry.businessName,
          orderNumber: `TKT-${entry.ticketNumber}`,
          status: 'pending',
          items: serviceType ? [{ name: serviceType, quantity, price: unitPrice }] : [],
          total: totalAmount,
          createdAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          paymentMethod: 'Queue',
        };
        get().addOrder(orderEntry);

        // Increment total_visits in auth metadata + User table
        const currentVisits = (get().user?.totalVisits ?? 0) + 1;
        supabase.auth.updateUser({ data: { total_visits: currentVisits } });
        supabase.from('users').update({ total_visits: currentVisits }).eq('id', user.id)
          .then(({ error }) => { if (error) console.warn('total_visits update:', error.message); });
        set((state) => ({
          user: state.user ? { ...state.user, totalVisits: currentVisits } : null,
        }));

        return { success: true, queueEntryId: data.id };
      },

      leaveQueueInSupabase: async (entryId: string) => {
        const { error } = await leaveQueueEntry(entryId);
        if (error) return { success: false, error };
        set((state) => ({
          activeQueues: state.activeQueues.filter(q => q.id !== entryId),
          queueHistory: [
            ...state.queueHistory,
            ...state.activeQueues
              .filter(q => q.id === entryId)
              .map(q => ({ ...q, status: 'cancelled' as const })),
          ],
        }));
        return { success: true };
      },

      syncQueuesFromSupabase: async () => {
        const user = get().user;
        if (!user) return;
        const [activeRes, historyRes] = await Promise.all([
          fetchUserActiveQueues(user.id),
          fetchUserQueueHistory(user.id),
        ]);
        if (activeRes.error) console.warn('syncQueues active error:', activeRes.error);
        if (historyRes.error) console.warn('syncQueues history error:', historyRes.error);
        const toTime = (iso: string) =>
          new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const mapEntry = (r: QueueEntryRecord): QueueEntry => ({
          id: r.id,
          businessId: r.business_id,
          businessName: r.business?.name ?? '',
          businessCategory: r.business?.category ?? '',
          ticketNumber: ticketLabel(r.position),
          position: r.position,
          totalInQueue: r.business?.queue_length ?? r.position,
          estimatedWait: formatWait(r.estimated_wait_time),
          status: r.status,
          joinedAt: toTime(r.joined_at),
          completedAt: r.completed_at
            ? toTime(r.completed_at)
            : r.cancelled_at
            ? toTime(r.cancelled_at)
            : undefined,
        });
        set({
          activeQueues: (activeRes.data ?? []).map(mapEntry),
          queueHistory: (historyRes.data ?? []).map(mapEntry),
        });
      },

      // Orders
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (orderId, status) => {
        set((state) => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o) }));
        if (status === 'ready') {
          const { notificationsEnabled, orderNotificationsEnabled, soundEnabled, vibrationEnabled, addNotification, orders, unreadCount } = get();
          const notifOpts = { sound: soundEnabled, vibrate: vibrationEnabled };
          if (notificationsEnabled && orderNotificationsEnabled) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
              const notif = {
                id: `order-ready-${orderId}-${Date.now()}`,
                type: 'order_ready' as const,
                title: '✅ Order Ready!',
                message: `Order #${order.orderNumber} from ${order.businessName} is ready for pickup!`,
                read: false,
                createdAt: new Date().toISOString(),
              };
              addNotification(notif);
              if (!runningInExpoGo) {
                notifyOrderReady(order.businessName, order.orderNumber, notifOpts);
                setBadgeCount(unreadCount + 1);
              }
            }
          }
        }
      },

      // Favorites
      toggleFavorite: (businessId) => set((state) => ({ favoriteBusinesses: state.favoriteBusinesses.includes(businessId) ? state.favoriteBusinesses.filter(id => id !== businessId) : [...state.favoriteBusinesses, businessId] })),

      // Feedback
      submitFeedback: async ({ rating, category, message }) => {
        const user = get().user;
        if (!user) return { success: false, error: 'You must be logged in to submit feedback.' };

        const POINTS_PER_FEEDBACK = 50;

        try {
          // ── 1. Atomically increment points on the server via RPC ─────────────
          // The RPC does: UPDATE users SET loyalty_points = loyalty_points + p_points
          //               WHERE id = auth.uid() RETURNING loyalty_points
          // SECURITY DEFINER ensures it runs as superuser but enforces auth.uid() match,
          // preventing any client from manipulating another user's balance.
          //
          // Required SQL (run once in Supabase SQL editor):
          // CREATE OR REPLACE FUNCTION award_loyalty_points(p_user_id uuid, p_points int)
          // RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
          // DECLARE new_pts int;
          // BEGIN
          //   IF auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
          //   UPDATE users SET loyalty_points = coalesce(loyalty_points,0) + p_points,
          //                    updated_at = now()
          //   WHERE id = p_user_id RETURNING loyalty_points INTO new_pts;
          //   RETURN new_pts;
          // END; $$;
          const { data: newPoints, error: rpcError } = await supabase.rpc('award_loyalty_points', {
            p_user_id: user.id,
            p_points: POINTS_PER_FEEDBACK,
          });

          // Fall back to local calculation only if the RPC is not yet deployed
          const resolvedPoints = (rpcError || newPoints == null)
            ? (user.loyaltyPoints ?? 0) + POINTS_PER_FEEDBACK
            : (newPoints as number);

          if (rpcError) {
            console.warn('award_loyalty_points RPC not available (deploy the SQL migration):', rpcError.message);
            // Fallback: update auth metadata and users table directly
            await supabase.auth.updateUser({ data: { loyalty_points: resolvedPoints } });
            await supabase
              .from('users')
              .update({ loyalty_points: resolvedPoints, updated_at: new Date().toISOString() })
              .eq('id', user.id);
          } else {
            // Keep auth metadata in sync with the server-computed value
            await supabase.auth.updateUser({ data: { loyalty_points: resolvedPoints } });
          }

          // ── 2. Try to insert Feedback record ──────────────────────────────────
          await supabase.from('Feedback').insert({
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            rating,
            category,
            message,
            points_awarded: POINTS_PER_FEEDBACK,
            created_at: new Date().toISOString(),
          }).then(({ error }) => {
            if (error) console.warn('Feedback insert (run migration SQL to fix):', error.message);
          });

          // ── 3. Update local store ──────────────────────────────────────────────
          set((state) => ({
            user: state.user ? { ...state.user, loyaltyPoints: resolvedPoints } : null,
          }));

          // ── 4. In-app notification ──────────────────────────────────────────────
          const { addNotification, notificationsEnabled, promoNotificationsEnabled, soundEnabled, vibrationEnabled, unreadCount } = get();
          const notifOpts = { sound: soundEnabled, vibrate: vibrationEnabled };
          if (notificationsEnabled && promoNotificationsEnabled) {
            addNotification({
              id: `feedback-points-${Date.now()}`,
              type: 'loyalty',
              title: '⭐ Loyalty Points Earned!',
              message: `Thanks for your feedback! You earned +${POINTS_PER_FEEDBACK} points. Total: ${resolvedPoints} pts.`,
              read: false,
              createdAt: new Date().toISOString(),
            });
            if (!runningInExpoGo) {
              await notifyLoyaltyPoints(POINTS_PER_FEEDBACK, resolvedPoints, notifOpts);
              await setBadgeCount(unreadCount + 1);
            }
          }

          return { success: true };
        } catch (error: any) {
          console.error('submitFeedback error:', error);
          return { success: false, error: error?.message ?? 'Failed to submit feedback.' };
        }
      },

      // Notifications
      addNotification: (notification) => set((state) => {
        // Deduplicate: skip if a notification with the same id already exists
        if (state.notifications.some((n) => n.id === notification.id)) return state;
        return {
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),
      markNotificationRead: (notificationId) => set((state) => {
        const updated = { notifications: state.notifications.map(n => n.id === notificationId ? { ...n, read: true } : n), unreadCount: Math.max(0, state.unreadCount - 1) };
        setBadgeCount(updated.unreadCount);
        return updated;
      }),
      markAllNotificationsRead: () => {
        set((state) => ({ notifications: state.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 }));
        setBadgeCount(0);
      },
      deleteNotification: (notificationId) => set((state) => {
        const notif = state.notifications.find(n => n.id === notificationId);
        const newUnread = notif && !notif.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
        setBadgeCount(newUnread);
        return { notifications: state.notifications.filter(n => n.id !== notificationId), unreadCount: newUnread };
      }),
      clearAllNotifications: () => {
        setBadgeCount(0);
        set({ notifications: [], unreadCount: 0 });
      },

      // Settings
      toggleNotifications: async () => {
        const current = get().notificationsEnabled;
        if (!current) {
          if (!runningInExpoGo) {
            // Development build: request OS permission first
            const granted = await requestNotificationPermissions();
            if (!granted) return; // OS denied – leave toggle off
          }
          // Expo Go: allow in-app toggle without OS permission
        } else {
          // Disabling: clear badge
          await setBadgeCount(0);
        }
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled }));
      },
      toggleLocation: async () => {
        const current = get().locationEnabled;
        if (!current) {
          // Enabling — request OS permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            // Permission denied — prompt user to open Settings
            const { Alert } = await import('react-native');
            Alert.alert(
              'Location Permission Required',
              'Please enable location access for BusinessHub Pro in your device Settings to use this feature.',
              [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ]
            );
            return; // leave toggle OFF
          }
        }
        // If disabling, we can't revoke the OS grant — just disable in-app usage
        set({ locationEnabled: !current });
      },
      setTheme: (theme) => set({ theme, darkMode: theme === 'dark' || theme === 'black' }),
      toggleDarkMode: () => set((state) => { const newTheme = (state.theme === 'dark' || state.theme === 'black') ? 'light' : 'dark'; return { theme: newTheme, darkMode: newTheme !== 'light' }; }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleVibration: () => set((s) => ({ vibrationEnabled: !s.vibrationEnabled })),
      toggleQueueNotifications: () => set((s) => ({ queueNotificationsEnabled: !s.queueNotificationsEnabled })),
      toggleOrderNotifications: () => set((s) => ({ orderNotificationsEnabled: !s.orderNotificationsEnabled })),
      togglePromoNotifications: () => set((s) => ({ promoNotificationsEnabled: !s.promoNotificationsEnabled })),
      toggleAnalytics: () => set((s) => ({ analyticsEnabled: !s.analyticsEnabled })),
      toggleCompactView: () => set((s) => ({ compactViewEnabled: !s.compactViewEnabled })),
      clearCache: () => {
        set({ orders: [], queueHistory: [] });
      },
    }),

    {
      name: 'business-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        session: state.session,
        notificationsEnabled: state.notificationsEnabled,
        locationEnabled: state.locationEnabled,
        darkMode: state.darkMode,
        theme: state.theme,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        queueNotificationsEnabled: state.queueNotificationsEnabled,
        orderNotificationsEnabled: state.orderNotificationsEnabled,
        promoNotificationsEnabled: state.promoNotificationsEnabled,
        analyticsEnabled: state.analyticsEnabled,
        compactViewEnabled: state.compactViewEnabled,
      }),
    }
  )
);

export const setupAuthListener = () => {
  return onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      if (session.user.email_confirmed_at || session.user.confirmed_at) {
        const syncResult = await syncAuthUserToUsersTable(session.user);
        if (!syncResult.success) {
          console.warn('users table sync on auth listener failed:', syncResult.error);
        }

        const profile = await getUserProfile(session.user.id);

        // Only mark as fully authenticated when registration is complete (phone saved).
        // If phone is missing, let auth/callback.tsx handle routing to the register screen.
        if (!profile?.phone_number) return;

        const user = mapSupabaseUserToUser(session.user, profile);
        useStore.setState({ isAuthenticated: true, user, session });
        _setupQueueSubscription(session.user.id);
      }
    } else if (event === 'SIGNED_OUT') {
      _teardownQueueSubscription();
      useStore.setState({ isAuthenticated: false, user: null, session: null, activeQueues: [], queueHistory: [], orders: [], notifications: [], unreadCount: 0 });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      useStore.setState({ session });
    }
  });
};
