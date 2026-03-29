/**
 * Runs BEFORE the test framework is installed (setupFiles).
 * Patches globals that Expo's winter runtime installs as lazy getters.
 * Without this, accessing structuredClone or __ExpoImportMetaRegistry
 * causes "import outside test scope" errors in Jest.
 */

// Provide stub Supabase env vars so lib/supabase.ts doesn't throw on import
process.env.EXPO_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';


// Patch structuredClone if not available (Node < 17) or if expo overrides it
if (typeof (globalThis as any).structuredClone !== 'function') {
  (globalThis as any).structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Prevent expo/src/winter/installGlobal from installing its lazy getter for structuredClone
// by pre-defining it as a plain value (non-configurable-from-lazy to plain)
try {
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'structuredClone');
  if (desc && typeof desc.get === 'function') {
    // It's a lazy getter — resolve it to a plain function
    const value = desc.get.call(globalThis);
    Object.defineProperty(globalThis, 'structuredClone', {
      value: typeof value === 'function' ? value : (obj: any) => JSON.parse(JSON.stringify(obj)),
      writable: true,
      configurable: true,
    });
  }
} catch {}

// Patch __ExpoImportMetaRegistry to prevent runtime.native.ts from loading
try {
  const desc = Object.getOwnPropertyDescriptor(globalThis, '__ExpoImportMetaRegistry');
  if (!desc || typeof desc.get === 'function') {
    Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
      value: { resolve: () => '', require: () => ({}) },
      writable: true,
      configurable: true,
    });
  }
} catch {}
