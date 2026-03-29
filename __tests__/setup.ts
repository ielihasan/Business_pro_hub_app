// Global test setup helpers — imported by test files that need it.
// Not executed as a test suite itself.

export function suppressConsoleNoise() {
  const originalWarn  = console.warn;
  const originalError = console.error;

  beforeAll(() => {
    console.warn = (...args: any[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('Animated') || msg.includes('NativeModule') || msg.includes('act(')) return;
      originalWarn(...args);
    };
    console.error = (...args: any[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('Warning:')) return;
      originalError(...args);
    };
  });

  afterAll(() => {
    console.warn  = originalWarn;
    console.error = originalError;
  });
}
