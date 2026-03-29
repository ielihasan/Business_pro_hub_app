/**
 * Tests for the synchronous, pure Zustand store actions.
 * We test these by creating a real store instance in isolation.
 */
import { createStore } from 'zustand/vanilla';

// ── Minimal store slice for toggle tests ─────────────────────────────────────

interface ToggleState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  queueNotificationsEnabled: boolean;
  orderNotificationsEnabled: boolean;
  promoNotificationsEnabled: boolean;
  analyticsEnabled: boolean;
  theme: 'light' | 'dark' | null;
  darkMode: boolean;
  orders: any[];
  queueHistory: any[];

  toggleSound: () => void;
  toggleVibration: () => void;
  toggleQueueNotifications: () => void;
  toggleOrderNotifications: () => void;
  togglePromoNotifications: () => void;
  toggleAnalytics: () => void;
  setTheme: (t: 'light' | 'dark' | null) => void;
  toggleDarkMode: () => void;
  clearCache: () => void;
}

function makeStore() {
  return createStore<ToggleState>((set, get) => ({
    soundEnabled:               true,
    vibrationEnabled:           true,
    queueNotificationsEnabled:  true,
    orderNotificationsEnabled:  true,
    promoNotificationsEnabled:  false,
    analyticsEnabled:           true,
    theme:    null,
    darkMode: false,
    orders:   [{ id: 'o1' }, { id: 'o2' }],
    queueHistory: [{ id: 'q1' }],

    toggleSound:    () => set((s) => ({ soundEnabled:    !s.soundEnabled })),
    toggleVibration:() => set((s) => ({ vibrationEnabled:!s.vibrationEnabled })),
    toggleQueueNotifications: () => set((s) => ({ queueNotificationsEnabled: !s.queueNotificationsEnabled })),
    toggleOrderNotifications: () => set((s) => ({ orderNotificationsEnabled: !s.orderNotificationsEnabled })),
    togglePromoNotifications: () => set((s) => ({ promoNotificationsEnabled: !s.promoNotificationsEnabled })),
    toggleAnalytics:() => set((s) => ({ analyticsEnabled: !s.analyticsEnabled })),
    setTheme: (theme) => set({ theme, darkMode: theme === 'dark' }),
    toggleDarkMode: () => set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      return { theme: newTheme, darkMode: newTheme === 'dark' };
    }),
    clearCache: () => set({ orders: [], queueHistory: [] }),
  }));
}

// ── Toggle tests ─────────────────────────────────────────────────────────────

describe('toggleSound', () => {
  it('flips soundEnabled from true to false', () => {
    const store = makeStore();
    expect(store.getState().soundEnabled).toBe(true);
    store.getState().toggleSound();
    expect(store.getState().soundEnabled).toBe(false);
  });

  it('flips soundEnabled back to true on second call', () => {
    const store = makeStore();
    store.getState().toggleSound();
    store.getState().toggleSound();
    expect(store.getState().soundEnabled).toBe(true);
  });
});

describe('toggleVibration', () => {
  it('flips vibrationEnabled', () => {
    const store = makeStore();
    expect(store.getState().vibrationEnabled).toBe(true);
    store.getState().toggleVibration();
    expect(store.getState().vibrationEnabled).toBe(false);
  });

  it('is independent of soundEnabled', () => {
    const store = makeStore();
    store.getState().toggleVibration();
    expect(store.getState().soundEnabled).toBe(true);
  });
});

describe('toggleQueueNotifications', () => {
  it('starts true, toggles to false', () => {
    const store = makeStore();
    store.getState().toggleQueueNotifications();
    expect(store.getState().queueNotificationsEnabled).toBe(false);
  });
});

describe('toggleOrderNotifications', () => {
  it('starts true, toggles to false', () => {
    const store = makeStore();
    store.getState().toggleOrderNotifications();
    expect(store.getState().orderNotificationsEnabled).toBe(false);
  });
});

describe('togglePromoNotifications', () => {
  it('starts false, toggles to true', () => {
    const store = makeStore();
    expect(store.getState().promoNotificationsEnabled).toBe(false);
    store.getState().togglePromoNotifications();
    expect(store.getState().promoNotificationsEnabled).toBe(true);
  });
});

describe('toggleAnalytics', () => {
  it('flips analyticsEnabled', () => {
    const store = makeStore();
    store.getState().toggleAnalytics();
    expect(store.getState().analyticsEnabled).toBe(false);
  });
});

// ── Theme tests ───────────────────────────────────────────────────────────────

describe('setTheme', () => {
  it('sets theme to dark and darkMode to true', () => {
    const store = makeStore();
    store.getState().setTheme('dark');
    expect(store.getState().theme).toBe('dark');
    expect(store.getState().darkMode).toBe(true);
  });

  it('sets theme to light and darkMode to false', () => {
    const store = makeStore();
    store.getState().setTheme('light');
    expect(store.getState().theme).toBe('light');
    expect(store.getState().darkMode).toBe(false);
  });

  it('sets theme to null (system) and darkMode to false', () => {
    const store = makeStore();
    store.getState().setTheme(null);
    expect(store.getState().theme).toBeNull();
    expect(store.getState().darkMode).toBe(false);
  });
});

describe('toggleDarkMode', () => {
  it('switches from null/light to dark', () => {
    const store = makeStore();
    store.getState().toggleDarkMode();
    expect(store.getState().theme).toBe('dark');
    expect(store.getState().darkMode).toBe(true);
  });

  it('switches from dark back to light', () => {
    const store = makeStore();
    store.getState().setTheme('dark');
    store.getState().toggleDarkMode();
    expect(store.getState().theme).toBe('light');
    expect(store.getState().darkMode).toBe(false);
  });

  it('darkMode is always in sync with theme', () => {
    const store = makeStore();
    store.getState().toggleDarkMode();
    const { theme, darkMode } = store.getState();
    expect(darkMode).toBe(theme === 'dark');
  });
});

// ── clearCache ────────────────────────────────────────────────────────────────

describe('clearCache', () => {
  it('empties orders array', () => {
    const store = makeStore();
    expect(store.getState().orders.length).toBeGreaterThan(0);
    store.getState().clearCache();
    expect(store.getState().orders).toHaveLength(0);
  });

  it('empties queueHistory array', () => {
    const store = makeStore();
    expect(store.getState().queueHistory.length).toBeGreaterThan(0);
    store.getState().clearCache();
    expect(store.getState().queueHistory).toHaveLength(0);
  });

  it('does not affect notification or theme settings', () => {
    const store = makeStore();
    store.getState().setTheme('dark');
    store.getState().clearCache();
    expect(store.getState().theme).toBe('dark');
    expect(store.getState().soundEnabled).toBe(true);
  });
});
