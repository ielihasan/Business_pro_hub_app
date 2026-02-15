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
  onAuthStateChange,
  RegisterData,
  LoginData,
} from '@/lib/auth';

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
  theme?: 'light' | 'dark';

  // Auth Actions
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setAuthError: (error: string | null) => void;
  clearAuthError: () => void;

  // User Actions
  setUser: (user: User | null) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  updateProfile: (updates: { avatar_url?: string | null; full_name?: string }) => Promise<{ success: boolean; error?: any }>;
  updateFullProfile: (updates: { name: string; phone: string }) => Promise<{ success: boolean; error?: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: any }>;

  // Queue actions
  joinQueue: (queue: QueueEntry) => void;
  leaveQueue: (queueId: string) => void;
  updateQueuePosition: (queueId: string, position: number, estimatedWait: string) => void;
  completeQueue: (queueId: string) => void;

  // Order actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Favorites
  toggleFavorite: (businessId: string) => void;

  // Notifications
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;

  // Settings
  toggleNotifications: () => void;
  toggleLocation: () => void;
  toggleDarkMode: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
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
    loyaltyPoints: profile?.loyalty_points || 0,
    totalVisits: profile?.total_visits || 0,
    memberSince: new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
};

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
      theme: 'light',

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

          const profile = await getUserProfile(result.user.id);
          const user = mapSupabaseUserToUser(result.user, profile);

          set({ isAuthenticated: true, user, session: result.session, isLoading: false, authError: null });
          return { success: true };
        }

        set({ isAuthenticated: false, user: null, session: null, isLoading: false, authError: result.error || 'Login failed' });
        return { success: false, error: result.error };
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, authError: null });
        const result = await registerUser(data);

        if (result.success && result.user) {
          if (result.session) {
            const user = mapSupabaseUserToUser(result.user, { full_name: data.fullName, phone_number: data.phone });
            set({ isAuthenticated: true, user, session: result.session, isLoading: false, authError: null });
          } else {
            set({ isAuthenticated: false, user: null, session: null, isLoading: false, authError: null });
          }
          return { success: true };
        }

        set({ isAuthenticated: false, user: null, session: null, isLoading: false, authError: result.error || 'Registration failed' });
        return { success: false, error: result.error };
      },

      logout: async () => {
        set({ isLoading: true });
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
            const profile = await getUserProfile(session.user.id);
            const user = mapSupabaseUserToUser(session.user, profile);
            set({ isAuthenticated: true, user, session, isLoading: false });
          } else {
            set({ isAuthenticated: false, user: null, session: null, isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isAuthenticated: false, user: null, session: null, isLoading: false });
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
        const { error: dbError } = await supabase.from('User').update({ full_name: updates.name, phone_number: updates.phone, updated_at: new Date().toISOString() }).eq('id', get().user?.id);
        if (dbError) console.error('Error updating User table:', dbError);
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
          if (!sessionUser?.email) return { success: false, error: 'User email not found' };
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: sessionUser.email, password: currentPassword });
          if (signInError) return { success: false, error: 'Current password is incorrect' };
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) return { success: false, error: updateError.message };
          set({ isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Failed to change password' };
        }
      },

      // Queue actions
      joinQueue: (queue) => set((state) => ({ activeQueues: [...state.activeQueues, queue] })),
      leaveQueue: (queueId) => set((state) => ({
        activeQueues: state.activeQueues.filter(q => q.id !== queueId),
        queueHistory: [...state.queueHistory, { ...state.activeQueues.find(q => q.id === queueId)!, status: 'cancelled' as const }].filter(Boolean) as QueueEntry[],
      })),
      updateQueuePosition: (queueId, position, estimatedWait) => set((state) => ({ activeQueues: state.activeQueues.map(q => q.id === queueId ? { ...q, position, estimatedWait } : q) })),
      completeQueue: (queueId) => set((state) => {
        const queue = state.activeQueues.find(q => q.id === queueId);
        if (!queue) return state;
        return { activeQueues: state.activeQueues.filter(q => q.id !== queueId), queueHistory: [...state.queueHistory, { ...queue, status: 'completed' as const }] };
      }),

      // Orders
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (orderId, status) => set((state) => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o) })),

      // Favorites
      toggleFavorite: (businessId) => set((state) => ({ favoriteBusinesses: state.favoriteBusinesses.includes(businessId) ? state.favoriteBusinesses.filter(id => id !== businessId) : [...state.favoriteBusinesses, businessId] })),

      // Notifications
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications], unreadCount: state.unreadCount + 1 })),
      markNotificationRead: (notificationId) => set((state) => ({ notifications: state.notifications.map(n => n.id === notificationId ? { ...n, read: true } : n), unreadCount: Math.max(0, state.unreadCount - 1) })),
      markAllNotificationsRead: () => set((state) => ({ notifications: state.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 })),

      // Settings
      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleLocation: () => set((state) => ({ locationEnabled: !state.locationEnabled })),
      setTheme: (theme) => set({ theme, darkMode: theme === 'dark' }),
      toggleDarkMode: () => set((state) => { const newTheme = state.theme === 'dark' ? 'light' : 'dark'; return { theme: newTheme, darkMode: !state.darkMode }; }),
    }),
    {
      name: 'business-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user, session: state.session, notificationsEnabled: state.notificationsEnabled, locationEnabled: state.locationEnabled, darkMode: state.darkMode, theme: state.theme }),
    }
  )
);

export const setupAuthListener = () => {
  return onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      if (session.user.email_confirmed_at || session.user.confirmed_at) {
        const profile = await getUserProfile(session.user.id);
        const user = mapSupabaseUserToUser(session.user, profile);
        useStore.setState({ isAuthenticated: true, user, session });
      }
    } else if (event === 'SIGNED_OUT') {
      useStore.setState({ isAuthenticated: false, user: null, session: null, activeQueues: [], queueHistory: [], orders: [], notifications: [], unreadCount: 0 });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      useStore.setState({ session });
    }
  });
};
