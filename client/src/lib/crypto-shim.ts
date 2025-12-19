// Browser-side crypto shim
// This file is used when shared/schema.ts is imported by client code
// The actual generateId() function should never be called on the client side

export function randomBytes(size: number): Buffer {
  throw new Error('crypto.randomBytes should only be called on the server');
}

// Export a minimal Buffer-like object to satisfy TypeScript
export const Buffer = {
  from: () => { throw new Error('Buffer should only be used on the server'); },
};
