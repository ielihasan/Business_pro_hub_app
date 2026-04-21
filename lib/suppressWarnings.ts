/**
 * This file MUST be imported before any other import in _layout.tsx.
 * It patches console.error / console.warn and LogBox before native modules
 * (expo-notifications) fire their Expo Go incompatibility messages.
 */
import { LogBox } from 'react-native';

const PATTERNS = [
  'expo-notifications',
  'not fully supported in Expo Go',
  'removed from Expo Go',
  'development build',
  // Transient network failures on startup (no internet / Supabase unreachable)
  'Network request failed',
  'syncQueues active error',
  'syncQueues history error',
  'Get profile error',
  'users table sync on auth init failed',
];

const matches = (msg: unknown) =>
  typeof msg === 'string' && PATTERNS.some((p) => msg.includes(p));

// Suppress in-app LogBox overlay
LogBox.ignoreLogs(PATTERNS);

// Suppress Metro terminal output
const _error = console.error.bind(console);
console.error = (...args: any[]) => {
  if (matches(args[0])) return;
  _error(...args);
};

const _warn = console.warn.bind(console);
console.warn = (...args: any[]) => {
  if (matches(args[0])) return;
  _warn(...args);
};
