// Mock for @/lib/supabase — used by queue.ts, business.ts, store
const mockChain = {
  select:      jest.fn().mockReturnThis(),
  eq:          jest.fn().mockReturnThis(),
  neq:         jest.fn().mockReturnThis(),
  in:          jest.fn().mockReturnThis(),
  is:          jest.fn().mockReturnThis(),
  order:       jest.fn().mockReturnThis(),
  limit:       jest.fn().mockReturnThis(),
  single:      jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  then:        jest.fn().mockResolvedValue({ data: [], error: null }),
};
// Make await work on the chain
(mockChain as any)[Symbol.asyncIterator] = undefined;
Object.assign(mockChain, {
  then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
  catch: (reject: any) => Promise.resolve({ data: [], error: null }).catch(reject),
});

export const supabase = {
  from:   jest.fn(() => mockChain),
  auth: {
    getSession:           jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword:   jest.fn().mockResolvedValue({ data: {}, error: null }),
    signUp:               jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut:              jest.fn().mockResolvedValue({ error: null }),
    updateUser:           jest.fn().mockResolvedValue({ data: {}, error: null }),
    onAuthStateChange:    jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  },
  channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnThis() })),
  removeChannel: jest.fn(),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};
