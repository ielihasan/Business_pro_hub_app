import { create } from 'zustand';

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
  user: User | null;

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

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;

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

  // Auth actions
  logout: () => void;
}

// Initial mock data
const mockUser: User = {
  id: 'u1',
  name: 'Ali Hassan',
  email: 'ali.hassan@uog.edu.pk',
  phone: '+92 300 1234567',
  loyaltyPoints: 1250,
  totalVisits: 47,
  memberSince: 'January 2024',
};

const mockActiveQueues: QueueEntry[] = [
  {
    id: 'q1',
    businessId: '1',
    businessName: 'Campus Coffee Shop',
    businessCategory: 'Food & Beverage',
    ticketNumber: 'CC-042',
    position: 3,
    totalInQueue: 8,
    estimatedWait: '8 min',
    status: 'waiting',
    joinedAt: '10:30 AM',
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'queue_update',
    title: 'Queue Update',
    message: 'You are now #3 in the queue at Campus Coffee Shop',
    read: false,
    createdAt: '2 min ago',
  },
  {
    id: 'n2',
    type: 'loyalty',
    title: 'Points Earned',
    message: 'You earned 50 loyalty points from your last visit!',
    read: true,
    createdAt: '1 hour ago',
  },
];

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  activeQueues: [],
  queueHistory: [],
  orders: [],
  favoriteBusinesses: [],
  notifications: [],
  unreadCount: 0,
  notificationsEnabled: true,
  locationEnabled: true,
  darkMode: false,

  // Auth actions
  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({
    isAuthenticated: value,
    user: value ? mockUser : null,
    activeQueues: value ? mockActiveQueues : [],
    notifications: value ? mockNotifications : [],
    unreadCount: value ? mockNotifications.filter(n => !n.read).length : 0,
  }),

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

  // Logout
  logout: () => set({
    isAuthenticated: false,
    user: null,
    activeQueues: [],
    queueHistory: [],
    orders: [],
    notifications: [],
    unreadCount: 0,
  }),
}));
