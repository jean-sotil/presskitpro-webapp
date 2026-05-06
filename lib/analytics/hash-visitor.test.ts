import { describe, expect, it } from 'vitest';

import { hashVisitor } from './hash-visitor';

const SALT_A = Buffer.from('a'.repeat(32), 'utf8');
const SALT_B = Buffer.from('b'.repeat(32), 'utf8');

describe('hashVisitor', () => {
  it('returns a stable hex string for the same inputs', () => {
    const a = hashVisitor({ ip: '1.2.3.4', userAgent: 'Chrome', salt: SALT_A });
    const b = hashVisitor({ ip: '1.2.3.4', userAgent: 'Chrome', salt: SALT_A });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}$/); // 16 bytes hex
  });

  it('differs when the salt rotates (privacy fence between days)', () => {
    const today = hashVisitor({ ip: '1.2.3.4', userAgent: 'Chrome', salt: SALT_A });
    const tomorrow = hashVisitor({ ip: '1.2.3.4', userAgent: 'Chrome', salt: SALT_B });
    expect(today).not.toBe(tomorrow);
  });

  it('differs across distinct IPs even with the same UA', () => {
    const a = hashVisitor({ ip: '1.2.3.4', userAgent: 'Chrome', salt: SALT_A });
    const b = hashVisitor({ ip: '5.6.7.8', userAgent: 'Chrome', salt: SALT_A });
    expect(a).not.toBe(b);
  });

  it('differs across distinct UAs even with the same IP', () => {
    const a = hashVisitor({ ip: '1.2.3.4', userAgent: 'Chrome', salt: SALT_A });
    const b = hashVisitor({ ip: '1.2.3.4', userAgent: 'Firefox', salt: SALT_A });
    expect(a).not.toBe(b);
  });

  it('treats empty UA the same as missing UA (browsers sometimes strip it)', () => {
    const empty = hashVisitor({ ip: '1.2.3.4', userAgent: '', salt: SALT_A });
    const undef = hashVisitor({ ip: '1.2.3.4', userAgent: undefined, salt: SALT_A });
    expect(empty).toBe(undef);
  });

  it('throws when the salt is empty (defensive — never hash without a salt)', () => {
    expect(() =>
      hashVisitor({ ip: '1.2.3.4', userAgent: 'x', salt: Buffer.alloc(0) }),
    ).toThrow(/salt/i);
  });
});
