// Re-export types from store for convenience
export type {
  User,
  Business,
  QueueEntry,
  Order,
  Notification,
} from '@/store/useStore';

// Additional types

export interface Service {
  id: string;
  name: string;
  icon: string;
  avgTime: string;
  price?: number;
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image?: string;
  expiresAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'jazzcash' | 'easypaisa' | 'cash';
  label: string;
  last4?: string;
  isDefault: boolean;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  isDefault: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Navigation types
export type RootStackParamList = {
  index: undefined;
  '(auth)/welcome': undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(auth)/forgot-password': undefined;
  '(tabs)': undefined;
  'business/[id]': { id: string };
  'queue/[id]': { id: string };
  scanner: undefined;
};

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface FeedbackFormData {
  rating: number;
  comment: string;
}
