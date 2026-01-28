import { create } from 'zustand';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
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
  avatar?: string;
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
  image?: string;
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
}

// Helper function to convert Supabase user to app User
const mapSupabaseUserToUser = (
  supabaseUser: SupabaseUser,
  profile?: any
): User => {
  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    name: profile?.full_name || metadata.full_name || 'User',
    email: supabaseUser.email || '',
    phone: profile?.phone_number || metadata.phone_number || '',
    avatar: profile?.avatar_url || metadata.avatar_url,
    loyaltyPoints: 0, // Will be fetched from database later
    totalVisits: 0,
    memberSince: new Date(supabaseUser.created_at).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  };
};

export const useStore = create<AppState>((set, get) => ({
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

  // Auth Actions
  login: async (data: LoginData) => {
    set({ isLoading: true, authError: null });

    const result = await loginUser(data);

    if (result.success && result.user) {
      // Fetch user profile from database
      const profile = await getUserProfile(result.user.id);
      const user = mapSupabaseUserToUser(result.user, profile);

      set({
        isAuthenticated: true,
        user,
        session: result.session,
        isLoading: false,
        authError: null,
      });

      return { success: true };
    } else {
      set({
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
        authError: result.error || 'Login failed',
      });

      return { success: false, error: result.error };
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, authError: null });

    const result = await registerUser(data);

    if (result.success && result.user) {
      const user = mapSupabaseUserToUser(result.user, {
        full_name: data.fullName,
        phone_number: data.phone,
      });

      set({
        isAuthenticated: true,
        user,
        session: result.session,
        isLoading: false,
        authError: null,
      });

      return { success: true };
    } else {
      set({
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
        authError: result.error || 'Registration failed',
      });

      return { success: false, error: result.error };
    }
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

      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        const user = mapSupabaseUserToUser(session.user, profile);

        set({
          isAuthenticated: true,
          user,
          session,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          session: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false,
      });
    }
  },

  setAuthError: (error) => set({ authError: error }),
  clearAuthError: () => set({ authError: null }),

  // User Actions
  setUser: (user) => set({ user }),

  updateUserProfile: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),

  // Queue actions
  joinQueue: (queue) => set((state) => ({
    activeQueues: [...state.activeQueues, queue],
  })),

  leaveQueue: (queueId) => set((state) => ({
    activeQueues: state.activeQueues.filter(q => q.id !== queueId),
    queueHistory: [
      ...state.queueHistory,
      {
        ...state.activeQueues.find(q => q.id === queueId)!,
        status: 'cancelled' as const,
      },
    ].filter(Boolean),
  })),

  updateQueuePosition: (queueId, position, estimatedWait) => set((state) => ({
    activeQueues: state.activeQueues.map(q =>
      q.id === queueId ? { ...q, position, estimatedWait } : q
    ),
  })),

  completeQueue: (queueId) => set((state) => {
    const queue = state.activeQueues.find(q => q.id === queueId);
    if (!queue) return state;

    return {
      activeQueues: state.activeQueues.filter(q => q.id !== queueId),
      queueHistory: [
        ...state.queueHistory,
        { ...queue, status: 'completed' as const },
      ],
    };
  }),

  // Order actions
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
  })),

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o =>
      o.id === orderId ? { ...o, status } : o
    ),
  })),

  // Favorites
  toggleFavorite: (businessId) => set((state) => ({
    favoriteBusinesses: state.favoriteBusinesses.includes(businessId)
      ? state.favoriteBusinesses.filter(id => id !== businessId)
      : [...state.favoriteBusinesses, businessId],
  })),

  // Notifications
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  markNotificationRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  // Settings
  toggleNotifications: () => set((state) => ({
    notificationsEnabled: !state.notificationsEnabled,
  })),

  toggleLocation: () => set((state) => ({
    locationEnabled: !state.locationEnabled,
  })),

  toggleDarkMode: () => set((state) => ({
    darkMode: !state.darkMode,
  })),
}));

// Setup auth state listener
// Call this in your app's root component
export const setupAuthListener = () => {
  return onAuthStateChange(async (event, session) => {
    const store = useStore.getState();

    if (event === 'SIGNED_IN' && session?.user) {
      const profile = await getUserProfile(session.user.id);
      const user = mapSupabaseUserToUser(session.user, profile);

      useStore.setState({
        isAuthenticated: true,
        user,
        session,
      });
    } else if (event === 'SIGNED_OUT') {
      useStore.setState({
        isAuthenticated: false,
        user: null,
        session: null,
        activeQueues: [],
        queueHistory: [],
        orders: [],
        notifications: [],
        unreadCount: 0,
      });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      useStore.setState({ session });
    }
  });
};
