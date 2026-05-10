import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { oauthState } from '@/lib/oauthState';
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
  COMMITMENT_RATE,
  calculateCommitmentFee,
  SavedPaymentMethod,
  WalletInfo,
  initializeWallet,
  getWalletBalance,
  getWalletInfo,
  deductWalletBalance,
  topUpWalletBalance,
  recordWalletTransaction,
  getSavedPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  WalletPaymentType,
} from '@/lib/wallet';

export { WalletInfo };
import { awardPoints, calcQueueJoinPoints, POINTS_QUEUE_COMPLETE, getTier } from '@/lib/loyalty';
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
  loyaltyTier: string;
  totalVisits: number;
  memberSince: string;
  walletBalance: number | null;
}

export { SavedPaymentMethod, WalletPaymentType };

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
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
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

  // Wallet & Payments
  paymentMethods: SavedPaymentMethod[];
  walletInfo: WalletInfo | null;

  // Settings
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  darkMode: boolean;
  theme: 'light' | 'dark' | null;  // null = follow system
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
  addPassword: (newPassword: string) => Promise<{ success: boolean; error?: any }>;
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
  loadFavorites: () => Promise<void>;
  toggleFavorite: (businessId: string) => void;

  // Wallet & Payment Methods
  loadWallet: () => Promise<void>;
  topUpWallet: (amount: number, paymentMethodId?: string) => Promise<{ success: boolean; newBalance?: number; walletInfo?: WalletInfo; error?: string }>;
  addWalletPaymentMethod: (params: {
    type: WalletPaymentType;
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
    makeDefault?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  removeWalletPaymentMethod: (id: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultWalletPaymentMethod: (id: string) => Promise<{ success: boolean; error?: string }>;

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
  setTheme: (theme: 'light' | 'dark' | null) => void;
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
    loyaltyTier:   profile?.loyalty_tier  ?? metadata.loyalty_tier  ?? 'bronze',
    totalVisits: profile?.total_visits ?? metadata.total_visits ?? 0,
    memberSince: new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    walletBalance: profile?.wallet_balance != null ? Number(profile.wallet_balance) : null,
  };
};

// ─── In-flight guards (module-level, not persisted) ──────────────────────────
/** Prevents duplicate leaveQueueInSupabase calls for the same entry ID. */
const _leavingQueueIds = new Set<string>();
/** Prevents concurrent topUpWallet calls. */
let _toppingUp = false;

// ─── Realtime subscription for current user's queue entries ──────────────────
let _queueRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _queueRealtimeUserId: string | null = null;
let _queueRealtimeNonce = 0;
let _syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

let _paymentRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _paymentRealtimeUserId: string | null = null;
let _paymentRealtimeNonce = 0;
let _paymentSyncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

let _queueRetryCount = 0;
let _paymentRetryCount = 0;
const _MAX_REALTIME_RETRIES = 5;

// ─── Realtime subscription for business-level queue changes ──────────────────
// Fires when ANY user joins/leaves/updates in the same business queue,
// so the current user sees totalInQueue update in real time.
const _bizQueueChannels: Map<string, ReturnType<typeof supabase.channel>> = new Map();
let _bizQueueNonce = 0;

function _setupBusinessQueueSubscriptions(businessIds: string[]) {
  // Tear down channels for businesses no longer in user's active queues
  for (const [bizId, ch] of _bizQueueChannels.entries()) {
    if (!businessIds.includes(bizId)) {
      try { supabase.removeChannel(ch); } catch {}
      _bizQueueChannels.delete(bizId);
    }
  }
  // Set up new channels for each active business
  for (const bizId of businessIds) {
    if (_bizQueueChannels.has(bizId)) continue; // already subscribed
    const rnd = Math.random().toString(36).slice(2, 8);
    const topic = `biz-queue:${bizId}:${Date.now()}:${++_bizQueueNonce}:${rnd}`;
    const ch = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queues', filter: `business_id=eq.${bizId}` },
        () => _debouncedSync(600),
      )
      .subscribe();
    _bizQueueChannels.set(bizId, ch);
  }
}

function _teardownBusinessQueueSubscriptions() {
  for (const ch of _bizQueueChannels.values()) {
    try { supabase.removeChannel(ch); } catch {}
  }
  _bizQueueChannels.clear();
}

function _uniqueRealtimeTopic(prefix: string, userId: string, nonce: number) {
  // Include time + random so hot-reload/module-reload cannot recreate the same topic.
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}:${userId}:${Date.now()}:${nonce}:${rnd}`;
}

function _removeStaleRealtimeChannels(prefix: string, userId: string) {
  // Defensive cleanup for channels left by a previous module instance (Fast Refresh)
  // which can trigger "cannot add postgres_changes callbacks ... after subscribe".
  const client: any = supabase as any;
  const channels: any[] = typeof client.getChannels === 'function' ? client.getChannels() : [];
  const expectedPrefix = `realtime:${prefix}:${userId}:`;

  for (const ch of channels) {
    const topic = String(ch?.topic ?? '');
    if (topic.startsWith(expectedPrefix)) {
      try { supabase.removeChannel(ch); } catch {}
    }
  }
}

function _debouncedSync(ms = 400) {
  if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(() => {
    _syncDebounceTimer = null;
    useStore.getState().syncQueuesFromSupabase();
  }, ms);
}

function _debouncedPaymentSync(ms = 250) {
  if (_paymentSyncDebounceTimer) clearTimeout(_paymentSyncDebounceTimer);
  _paymentSyncDebounceTimer = setTimeout(() => {
    _paymentSyncDebounceTimer = null;
    void useStore.getState().loadWallet();
  }, ms);
}

function _handleTransactionRealtime(payload: any) {
  const current = payload?.new ?? {};
  const previous = payload?.old ?? {};
  const status = String(current.status ?? '').toLowerCase();
  const oldStatus = String(previous.status ?? '').toLowerCase();
  if (!status || status === oldStatus) return;

  const state = useStore.getState();

  const queueEntryId = current.queue_entry_id ?? current.queue_id ?? null;
  if (queueEntryId) {
    const orderId = `order-${queueEntryId}`;
    if (status === 'verified') {
      state.updateOrderStatus(orderId, 'completed');
    } else if (status === 'rejected') {
      state.updateOrderStatus(orderId, 'cancelled');
    } else if (status === 'pending_verification') {
      state.updateOrderStatus(orderId, 'in_progress');
    }
  }

  if (!state.notificationsEnabled || !state.orderNotificationsEnabled) return;

  // Use queue entry to get business name for a meaningful message
  const relatedQueue = queueEntryId
    ? state.activeQueues.find(q => q.id === queueEntryId) ?? state.queueHistory.find(q => q.id === queueEntryId)
    : null;
  const bizName = relatedQueue?.businessName ?? 'your queue';
  const stableId = `txn-${queueEntryId ?? current.id}-${status}`;

  const title = status === 'verified'
    ? '💰 Payment Confirmed'
    : status === 'rejected'
    ? '⚠️ Payment Rejected'
    : status === 'pending_verification'
    ? '⏳ Payment Under Review'
    : 'Payment Update';

  const message = status === 'verified'
    ? `Your advance payment for ${bizName} has been verified. You're all set!`
    : status === 'rejected'
    ? `Your payment for ${bizName} was rejected. Please check your wallet and try again.`
    : status === 'pending_verification'
    ? `Your payment for ${bizName} is being reviewed by the admin.`
    : `Payment status updated to ${status} for ${bizName}.`;

  state.addNotification({
    id: stableId,
    type: 'order_ready',
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

function _setupQueueSubscription(userId: string, forceReconnect = false) {
  // Reuse existing subscription for the same user to avoid duplicate
  // subscribe cycles from login/init/auth-listener calling this repeatedly.
  if (!forceReconnect && _queueRealtimeChannel && _queueRealtimeUserId === userId) {
    return;
  }

  _teardownQueueSubscription();
  _removeStaleRealtimeChannels('user-queues', userId);

  _queueRealtimeUserId = userId;
  _queueRealtimeChannel = supabase
    // Unique topic name avoids internal "already subscribed" collisions.
    .channel(_uniqueRealtimeTopic('user-queues', userId, ++_queueRealtimeNonce))
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'queues', filter: `customer_id=eq.${userId}` },
      () => {
        // Debounce: coalesce rapid cascading updates into a single re-sync
        _debouncedSync();
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        _queueRetryCount = 0;
      } else if (status === 'CHANNEL_ERROR') {
        if (_queueRetryCount < _MAX_REALTIME_RETRIES) {
          const delay = Math.min(1000 * 2 ** _queueRetryCount, 30000);
          _queueRetryCount++;
          setTimeout(() => _setupQueueSubscription(userId, true), delay);
        } else {
          console.warn('[Queue realtime] Channel error after max retries:', (err as any)?.message ?? err);
        }
      } else if (status === 'TIMED_OUT') {
        setTimeout(() => _setupQueueSubscription(userId, true), 3000);
      } else if (status === 'CLOSED') {
        _debouncedSync(1000);
      }
    });
}

function _teardownQueueSubscription() {
  if (_syncDebounceTimer) { clearTimeout(_syncDebounceTimer); _syncDebounceTimer = null; }
  if (_queueRealtimeChannel) {
    supabase.removeChannel(_queueRealtimeChannel);
    _queueRealtimeChannel = null;
  }
  _queueRealtimeUserId = null;
  _queueRetryCount = 0;
}

function _setupPaymentSubscription(userId: string, forceReconnect = false) {
  // Reuse existing subscription for the same user to avoid duplicate subscribe calls.
  if (!forceReconnect && _paymentRealtimeChannel && _paymentRealtimeUserId === userId) {
    return;
  }

  _teardownPaymentSubscription();
  _removeStaleRealtimeChannels('user-payments', userId);

  _paymentRealtimeUserId = userId;
  _paymentRealtimeChannel = supabase
    .channel(_uniqueRealtimeTopic('user-payments', userId, ++_paymentRealtimeNonce))
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
      () => _debouncedPaymentSync()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payment_methods', filter: `user_id=eq.${userId}` },
      () => _debouncedPaymentSync()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${userId}` },
      () => _debouncedPaymentSync()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Transactions', filter: `user_id=eq.${userId}` },
      (payload) => {
        _debouncedPaymentSync();
        _handleTransactionRealtime(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      (payload) => {
        _debouncedPaymentSync();
        _handleTransactionRealtime(payload);
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        _paymentRetryCount = 0;
      } else if (status === 'CHANNEL_ERROR') {
        if (_paymentRetryCount < _MAX_REALTIME_RETRIES) {
          const delay = Math.min(1000 * 2 ** _paymentRetryCount, 30000);
          _paymentRetryCount++;
          setTimeout(() => _setupPaymentSubscription(userId, true), delay);
        } else {
          console.warn('[Payment realtime] Channel error after max retries:', (err as any)?.message ?? err);
        }
      } else if (status === 'TIMED_OUT') {
        setTimeout(() => _setupPaymentSubscription(userId, true), 3000);
      } else if (status === 'CLOSED') {
        _debouncedPaymentSync(1000);
      }
    });
}

function _teardownPaymentSubscription() {
  if (_paymentSyncDebounceTimer) {
    clearTimeout(_paymentSyncDebounceTimer);
    _paymentSyncDebounceTimer = null;
  }
  if (_paymentRealtimeChannel) {
    supabase.removeChannel(_paymentRealtimeChannel);
    _paymentRealtimeChannel = null;
  }
  _paymentRealtimeUserId = null;
  _paymentRetryCount = 0;
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
      paymentMethods: [],
      walletInfo: null,
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
          _setupPaymentSubscription(result.user.id);

          // Load full wallet info + methods + favorites + queues in parallel.
          // Using getWalletInfo (1 query) avoids the slow multi-step initializeWallet
          // path for returning users. If no wallet exists yet, fall back to init.
          const [walletInfo, methods] = await Promise.all([
            getWalletInfo(result.user.id).then(async (info) => {
              if (info) return info;
              await initializeWallet(result.user.id);
              return getWalletInfo(result.user.id);
            }),
            getSavedPaymentMethods(result.user.id),
            get().loadFavorites(),
            get().syncQueuesFromSupabase(),
          ]);
          set((state) => ({
            paymentMethods: methods,
            walletInfo,
            user: state.user
              ? { ...state.user, walletBalance: walletInfo?.balance ?? state.user.walletBalance }
              : null,
          }));

          // Welcome + payment-setup notifications — stable IDs prevent spam on every login
          const { notificationsEnabled, addNotification } = get();
          if (notificationsEnabled) {
            if (!runningInExpoGo) {
              const granted = await requestNotificationPermissions();
              if (granted) await notifyWelcome(user.name);
            }
            // Stable ID: dedup ensures this shows only once per account
            addNotification({
              id: `welcome-${result.user.id}`,
              type: 'promo',
              title: '👋 Welcome to BusinessHub Pro!',
              message: `Hi ${user.name}! Scan QR codes to join queues and track orders in real-time.`,
              read: false,
              createdAt: new Date().toISOString(),
            });
            if (methods.length === 0) {
              addNotification({
                id: `setup-payment-${result.user.id}`,
                type: 'promo',
                title: '💳 Set Up Your Payment Method',
                message: 'Add EasyPaisa, JazzCash, or a bank account. A commitment fee is required to join any queue.',
                read: false,
                createdAt: new Date().toISOString(),
              });
            }
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
        _teardownPaymentSubscription();
        _teardownBusinessQueueSubscriptions();
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
            _setupPaymentSubscription(session.user.id);
            // Load full wallet info + methods + favorites + queues in parallel.
            const [walletInfo, methods] = await Promise.all([
              getWalletInfo(session.user.id).then(async (info) => {
                if (info) return info;
                await initializeWallet(session.user.id);
                return getWalletInfo(session.user.id);
              }),
              getSavedPaymentMethods(session.user.id),
              get().loadFavorites(),
              get().syncQueuesFromSupabase(),
            ]);
            set((state) => ({
              paymentMethods: methods,
              walletInfo,
              user: state.user
                ? { ...state.user, walletBalance: walletInfo?.balance ?? state.user.walletBalance }
                : null,
            }));
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
            _setupPaymentSubscription(session.user.id);
            get().loadFavorites();
            get().syncQueuesFromSupabase();
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
          // Keep the public users table in sync so profile screens refresh from
          // the same source of truth the app reads during auth initialization.
          const publicProfileUpdate: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url')) {
            publicProfileUpdate.avatar_url = updates.avatar_url ?? null;
          }
          if (Object.prototype.hasOwnProperty.call(updates, 'full_name')) {
            publicProfileUpdate.full_name = updates.full_name ?? null;
          }

          await supabase
            .from('users')
            .update(publicProfileUpdate)
            .eq('id', data.user.id);

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

      addPassword: async (newPassword: string) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          set({ isLoading: false });
          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Failed to set password' };
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
        // Only update local state — notifications are fired by syncQueuesFromSupabase
        // which has access to both old and new positions, preventing duplicates.
        set((state) => ({ activeQueues: state.activeQueues.map(q => q.id === queueId ? { ...q, position, estimatedWait } : q) }));
      },
      completeQueue: (queueId) => {
        set((state) => {
          const queue = state.activeQueues.find(q => q.id === queueId);
          if (!queue) return state;
          return { activeQueues: state.activeQueues.filter(q => q.id !== queueId), queueHistory: [...state.queueHistory, { ...queue, status: 'completed' as const }] };
        });
        // Award completion bonus points + notify
        const user = get().user;
        const completedQueue = get().queueHistory.find(q => q.id === queueId);
        if (user) {
          awardPoints(user.id, POINTS_QUEUE_COMPLETE, 'queue_complete', 'Queue completed — bonus points', queueId)
            .then(({ newPoints }) => {
              if (newPoints != null) {
                const tier = getTier(newPoints);
                set((state) => ({
                  user: state.user
                    ? { ...state.user, loyaltyPoints: newPoints, loyaltyTier: tier.key }
                    : null,
                }));
                supabase.auth.updateUser({ data: { loyalty_points: newPoints, loyalty_tier: tier.key } });
                if (POINTS_QUEUE_COMPLETE > 0) {
                  const { addNotification, notificationsEnabled, promoNotificationsEnabled } = get();
                  if (notificationsEnabled && promoNotificationsEnabled) {
                    addNotification({
                      id: `loyalty-complete-${queueId}`,
                      type: 'loyalty',
                      title: '⭐ Bonus Points Earned!',
                      message: `+${POINTS_QUEUE_COMPLETE} points for completing your visit${completedQueue ? ` at ${completedQueue.businessName}` : ''}. Total: ${newPoints} pts.`,
                      read: false,
                      createdAt: new Date().toISOString(),
                    });
                  }
                }
              }
            });
        }
      },

      // Supabase-backed queue actions
      joinQueueInSupabase: async (
        businessId: string,
        serviceType?: string,
        pricing?: { quantity?: number; unitPrice?: number; totalAmount?: number }
      ) => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };

        // ── Payment gate: 20% advance on service total ───────────────────────
        const feeAmount    = calculateCommitmentFee(pricing?.totalAmount);
        const balanceBefore = user.walletBalance ?? 0;

        if (feeAmount > 0) {
          if (user.walletBalance === null || user.walletBalance < feeAmount) {
            return {
              success: false,
              error: `INSUFFICIENT_BALANCE:${user.walletBalance ?? 0}:${feeAmount}`,
            };
          }
          // Must have at least one payment method
          if (get().paymentMethods.length === 0) {
            return { success: false, error: 'NO_PAYMENT_METHOD' };
          }
        }

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

        // ── Deduct 20% advance from wallet & record transaction ───────────────
        if (feeAmount > 0) {
          const { newBalance } = await deductWalletBalance(user.id, feeAmount);
          if (newBalance !== null) {
            set((state) => ({
              user: state.user ? { ...state.user, walletBalance: newBalance } : null,
            }));
            // Record ledger entry
            const defaultMethod = get().paymentMethods.find(m => m.isDefault)
              ?? get().paymentMethods[0];
            await recordWalletTransaction({
              userId:           user.id,
              queueEntryId:     data.id,
              businessId:       businessId,
              paymentMethodId:  defaultMethod?.id,
              amount:           feeAmount,
              type:             'debit',
              reason:           `${Math.round(COMMITMENT_RATE * 100)}% advance — ${data.business?.name ?? 'Queue'}`,
              balanceBefore,
              balanceAfter:     newBalance,
            });
          }
        }

        // data.position is computed by joinBusinessQueue (count+1), so it's correct.
        const entry: QueueEntry = {
          id: data.id,
          businessId: data.business_id,
          businessName: data.business?.name ?? '',
          businessCategory: data.business?.category ?? '',
          ticketNumber: ticketLabel(data.position, data.joined_at),
          position: data.position,
          totalInQueue: data.business?.queue_length ?? data.position,
          estimatedWait: formatWait(data.estimated_wait_time),
          status: data.status,
          joinedAt: new Date(data.joined_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };

        // Update UI immediately so the queue appears on screen without waiting for notifications/wallet
        set((state) => ({
          activeQueues: [
            ...state.activeQueues.filter(q => q.businessId !== businessId),
            entry,
          ],
        }));

        // Trigger in-app + push notification (fire-and-forget — don't block UI)
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
            notifyQueueJoined(entry.businessName, entry.position, entry.estimatedWait, notifOpts);
            setBadgeCount(unreadCount + 1);
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

        // Award loyalty points for joining (base + spend multiplier)
        const joinPoints = calcQueueJoinPoints(pricing?.totalAmount ?? 0);
        const joinDesc   = pricing?.totalAmount
          ? `Queue joined · Rs ${pricing.totalAmount.toLocaleString('en-PK')} spent`
          : 'Queue joined';
        awardPoints(user.id, joinPoints, 'queue_join', joinDesc, data.id, businessId, pricing?.totalAmount ?? 0)
          .then(({ newPoints }) => {
            if (newPoints != null) {
              const tier = getTier(newPoints);
              set((state) => ({
                user: state.user
                  ? { ...state.user, loyaltyPoints: newPoints, loyaltyTier: tier.key }
                  : null,
              }));
              supabase.auth.updateUser({ data: { loyalty_points: newPoints, loyalty_tier: tier.key } });
              // Loyalty notification for joining
              if (joinPoints > 0) {
                const { addNotification, notificationsEnabled, promoNotificationsEnabled } = get();
                if (notificationsEnabled && promoNotificationsEnabled) {
                  addNotification({
                    id: `loyalty-join-${data.id}`,
                    type: 'loyalty',
                    title: '⭐ Points Earned!',
                    message: `+${joinPoints} loyalty points for joining the queue at ${entry.businessName}. Total: ${newPoints} pts.`,
                    read: false,
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
          });

        return { success: true, queueEntryId: data.id };
      },

      leaveQueueInSupabase: async (entryId: string) => {
        if (_leavingQueueIds.has(entryId)) return { success: false, error: 'Already leaving this queue' };
        _leavingQueueIds.add(entryId);
        try {
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
        } finally {
          _leavingQueueIds.delete(entryId);
        }
      },

      syncQueuesFromSupabase: async () => {
        const user = get().user;
        if (!user) return;

        const prevActive = get().activeQueues;

        const [activeRes, historyRes] = await Promise.all([
          fetchUserActiveQueues(user.id),
          fetchUserQueueHistory(user.id),
        ]);
        if (activeRes.error) console.warn('syncQueues active error:', activeRes.error);
        if (historyRes.error) console.warn('syncQueues history error:', historyRes.error);
        const toTime = (iso: string) =>
          new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const mapEntry = (r: QueueEntryRecord, liveTotal?: number): QueueEntry => ({
          id: r.id,
          businessId: r.business_id,
          businessName: r.business?.name ?? '',
          businessCategory: r.business?.category ?? '',
          ticketNumber: ticketLabel(r.position, r.joined_at),
          position: r.position,
          totalInQueue: liveTotal ?? r.business?.queue_length ?? r.position,
          // estimated_wait_time is already live-computed in fetchUserActiveQueues
          // (livePosition × perPersonMinutes), so use it directly.
          estimatedWait: formatWait(r.estimated_wait_time ?? 0),
          status: r.status,
          joinedAt: toTime(r.joined_at),
          completedAt: r.completed_at
            ? toTime(r.completed_at)
            : r.cancelled_at
            ? toTime(r.cancelled_at)
            : undefined,
        });

        // Build live total count per business from the fetched active data
        const liveTotalMap: Record<string, number> = {};
        for (const r of activeRes.data ?? []) {
          if (r.business?.queue_length) {
            liveTotalMap[r.business_id] = r.business.queue_length;
          }
        }

        const newActive = (activeRes.data ?? []).map((r) => mapEntry(r, liveTotalMap[r.business_id]));

        set({
          activeQueues: newActive,
          queueHistory: (historyRes.data ?? []).map((r) => mapEntry(r)),
        });

        // Subscribe to all businesses the user is currently queued at,
        // so any other user joining/leaving fires a re-sync immediately.
        const activeBizIds = [...new Set(newActive.map((q) => q.businessId).filter(Boolean))];
        _setupBusinessQueueSubscriptions(activeBizIds);

        // Sync queue status -> orders so order statuses update in realtime
        for (const newQ of newActive) {
          try {
            const orderId = `order-${newQ.id}`;
            const existingOrder = get().orders.find(o => o.id === orderId);
            if (!existingOrder) continue;
            // Map queue.status -> order.status
            const mapStatus = (qs: QueueEntry['status']): Order['status'] => {
              switch (qs) {
                case 'waiting': return 'pending';
                case 'called': return 'in_progress';
                case 'in_progress': return 'in_progress';
                case 'completed': return 'completed';
                case 'cancelled': return 'cancelled';
                default: return 'pending';
              }
            };
            const desired = mapStatus(newQ.status);
            if (existingOrder.status !== desired) {
              get().updateOrderStatus(orderId, desired);
            }
          } catch (e) {
            // non-fatal — continue syncing other entries
            console.warn('Order sync error:', e);
          }
        }

        // Fire notifications for position changes and status changes
        const { notificationsEnabled, queueNotificationsEnabled, orderNotificationsEnabled, soundEnabled, vibrationEnabled, addNotification, unreadCount } = get();
        const notifOpts = { sound: soundEnabled, vibrate: vibrationEnabled };

        if (notificationsEnabled) {
          for (const newQ of newActive) {
            const oldQ = prevActive.find(q => q.id === newQ.id);

            // ── Status-change notifications (business changed your status) ────────
            if (oldQ && newQ.status !== oldQ.status && queueNotificationsEnabled) {
              if (newQ.status === 'called') {
                addNotification({
                  id: `called-${newQ.id}`,
                  type: 'queue_update',
                  title: "📣 You've Been Called!",
                  message: `It's your turn at ${newQ.businessName}. Please proceed to the counter now.`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
                if (!runningInExpoGo) {
                  notifyYourTurnNow(newQ.businessName, notifOpts);
                  setBadgeCount(unreadCount + 1);
                }
              } else if (newQ.status === 'in_progress') {
                addNotification({
                  id: `serving-${newQ.id}`,
                  type: 'queue_update',
                  title: '🛎 Now Being Served',
                  message: `You're now being served at ${newQ.businessName}.`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
              }
            }

            // ── Position-change notifications ─────────────────────────────────────
            if (queueNotificationsEnabled && oldQ && newQ.position !== oldQ.position) {
              if (newQ.position === 1) {
                addNotification({
                  id: `your-turn-${newQ.id}`,
                  type: 'queue_update',
                  title: "🔔 It's Your Turn!",
                  message: `You're next at ${newQ.businessName}. Please get ready!`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
                if (!runningInExpoGo) {
                  notifyYourTurnNow(newQ.businessName, notifOpts);
                  setBadgeCount(unreadCount + 1);
                }
              } else if (newQ.position <= 3 && oldQ.position > newQ.position) {
                addNotification({
                  id: `almost-turn-${newQ.id}-pos${newQ.position}`,
                  type: 'queue_update',
                  title: '⏰ Almost Your Turn!',
                  message: `You're #${newQ.position} in line at ${newQ.businessName}. Get ready!`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
                if (!runningInExpoGo) {
                  notifyAlmostYourTurn(newQ.businessName, newQ.position, notifOpts);
                  setBadgeCount(unreadCount + 1);
                }
              }
            }
          }

          // ── Completed-queue notifications (entry moved from active to history) ──
          if (queueNotificationsEnabled) {
            for (const oldQ of prevActive) {
              const stillActive = newActive.find(q => q.id === oldQ.id);
              if (stillActive) continue;
              // Entry left active list — check history for completion
              const historyEntry = (historyRes.data ?? []).find(r => r.id === oldQ.id);
              if (historyEntry?.status === 'completed') {
                addNotification({
                  id: `completed-${oldQ.id}`,
                  type: 'queue_update',
                  title: '✅ Service Completed!',
                  message: `Your visit at ${oldQ.businessName} is complete. Thank you for using BusinessHub Pro!`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
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
                id: `order-ready-${orderId}`,
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

      // Wallet & Payment Methods
      loadWallet: async () => {
        const user = get().user;
        if (!user) return;
        const [info, methods] = await Promise.all([
          getWalletInfo(user.id),
          getSavedPaymentMethods(user.id),
        ]);
        set((state) => ({
          paymentMethods: methods,
          walletInfo:     info,
          user: state.user
            ? { ...state.user, walletBalance: info?.balance ?? state.user.walletBalance }
            : null,
        }));
      },

      topUpWallet: async (amount: number, paymentMethodId?: string) => {
        if (_toppingUp) return { success: false, error: 'Top-up already in progress' };
        _toppingUp = true;
        const user = get().user;
        if (!user) { _toppingUp = false; return { success: false, error: 'Not authenticated' }; }
        if (amount <= 0) { _toppingUp = false; return { success: false, error: 'Invalid amount' }; }

        try {
          const { newBalance, balanceBefore, error } = await topUpWalletBalance(user.id, amount);
          if (error || newBalance === null) return { success: false, error: error ?? 'Top-up failed' };

          // Record credit transaction (fire-and-forget — don't block balance update)
          recordWalletTransaction({
            userId:          user.id,
            paymentMethodId,
            amount,
            type:            'credit',
            reason:          'Wallet top-up via card',
            balanceBefore:   balanceBefore ?? 0,
            balanceAfter:    newBalance,
          });

          // Update state optimistically — no extra DB round-trip needed
          set((state) => ({
            walletInfo: state.walletInfo
              ? {
                  ...state.walletInfo,
                  balance:       newBalance,
                  totalCredited: state.walletInfo.totalCredited + amount,
                  updatedAt:     new Date().toISOString(),
                }
              : null,
            user: state.user ? { ...state.user, walletBalance: newBalance } : null,
          }));

          return { success: true, newBalance };
        } finally {
          _toppingUp = false;
        }
      },

      addWalletPaymentMethod: async (params) => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
        const { id, error } = await addPaymentMethod({ userId: user.id, ...params });
        if (error) return { success: false, error };
        // Optimistically update state — no extra DB round-trips
        const existingMethods = get().paymentMethods;
        const isDefault = params.makeDefault || existingMethods.length === 0;
        const newMethod: SavedPaymentMethod = {
          id: id!,
          userId: user.id,
          type: params.type,
          accountTitle: params.accountTitle,
          accountNumber: params.accountNumber,
          bankName: params.bankName,
          isDefault,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          paymentMethods: isDefault
            ? [newMethod, ...state.paymentMethods.map((m) => ({ ...m, isDefault: false }))]
            : [newMethod, ...state.paymentMethods],
          // Wallet becomes active now that a method exists
          walletInfo: state.walletInfo ? { ...state.walletInfo, isActive: true } : null,
        }));
        return { success: true };
      },

      removeWalletPaymentMethod: async (id) => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
        const { error } = await deletePaymentMethod(id, user.id);
        if (error) return { success: false, error };
        // Optimistically remove from state — no extra DB round-trips
        const remaining = get().paymentMethods.filter((m) => m.id !== id);
        const removedWasDefault = get().paymentMethods.find((m) => m.id === id)?.isDefault ?? false;
        const withDefault = removedWasDefault && remaining.length > 0
          ? remaining.map((m, i) => ({ ...m, isDefault: i === 0 }))
          : remaining;
        set((state) => ({
          paymentMethods: withDefault,
          walletInfo: state.walletInfo
            ? { ...state.walletInfo, isActive: remaining.length > 0 }
            : null,
        }));
        return { success: true };
      },

      setDefaultWalletPaymentMethod: async (id) => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
        const { error } = await setDefaultPaymentMethod(id, user.id);
        if (error) return { success: false, error };
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) => ({
            ...m,
            isDefault: m.id === id,
          })),
        }));
        return { success: true };
      },

      // Favorites
      loadFavorites: async () => {
        const user = get().user;
        if (!user) return;
        const { data } = await supabase
          .from('user_favorites')
          .select('business_id')
          .eq('user_id', user.id);
        if (data) set({ favoriteBusinesses: data.map((r: any) => r.business_id) });
      },

      toggleFavorite: (businessId) => {
        const state = get();
        const user = state.user;
        const isFav = state.favoriteBusinesses.includes(businessId);
        // Optimistic update
        set({ favoriteBusinesses: isFav
          ? state.favoriteBusinesses.filter(id => id !== businessId)
          : [...state.favoriteBusinesses, businessId],
        });
        if (!user) return;
        if (isFav) {
          supabase.from('user_favorites').delete()
            .eq('user_id', user.id).eq('business_id', businessId);
        } else {
          supabase.from('user_favorites').insert({ user_id: user.id, business_id: businessId });
        }
      },

      // Feedback
      submitFeedback: async ({ rating, category, message }) => {
        const user = get().user;
        if (!user) return { success: false, error: 'You must be logged in to submit feedback.' };

        const POINTS_PER_FEEDBACK = 50;

        try {
          // ── 1. Award points via RPC ───────────────────────────────────────────
          const { newPoints: resolvedPoints } = await awardPoints(
            user.id, POINTS_PER_FEEDBACK, 'feedback',
            'Feedback submitted', undefined, undefined, 0,
          );

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
          if (resolvedPoints != null) {
            const tier = getTier(resolvedPoints);
            set((state) => ({
              user: state.user ? { ...state.user, loyaltyPoints: resolvedPoints, loyaltyTier: tier.key } : null,
            }));
            supabase.auth.updateUser({ data: { loyalty_points: resolvedPoints, loyalty_tier: tier.key } });
          }

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
      setTheme: (theme) => set({ theme, darkMode: theme === 'dark' }),
      toggleDarkMode: () => set((state) => { const newTheme = state.theme === 'dark' ? 'light' : 'dark'; return { theme: newTheme, darkMode: newTheme !== 'light' }; }),
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
      // Email verification deep link — _layout.tsx set this flag before setSession().
      // Sign out immediately so the user must authenticate manually.
      if (oauthState.isSignupVerification) {
        oauthState.isSignupVerification = false; // consume
        await supabase.auth.signOut();
        return;
      }

      // OTP modal verification from register.tsx — that handler calls signOut
      // and navigates to login itself; skip auto-authentication here.
      if (oauthState.isSignupOtpVerification) {
        oauthState.isSignupOtpVerification = false; // consume
        return;
      }

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
        _setupPaymentSubscription(session.user.id);
        useStore.getState().loadFavorites();
      }
    } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
      _teardownQueueSubscription();
      _teardownPaymentSubscription();
      _teardownBusinessQueueSubscriptions();
      useStore.setState({ isAuthenticated: false, user: null, session: null, activeQueues: [], queueHistory: [], orders: [], notifications: [], unreadCount: 0, favoriteBusinesses: [] });
      if (event === 'TOKEN_REFRESH_FAILED') {
        supabase.auth.signOut();
      }
    } else if (event === 'TOKEN_REFRESHED' && session) {
      useStore.setState({ session });
    }
  });
};
