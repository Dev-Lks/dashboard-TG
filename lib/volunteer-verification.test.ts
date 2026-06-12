import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signVerificationToken, verifyVerificationToken } from './volunteer-verification';

const VOLUNTEER_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('volunteer verification tokens', () => {
  beforeEach(() => {
    vi.stubEnv('VERIFICATION_SECRET', 'test-secret-key');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('signs and verifies a valid token', () => {
    const token = signVerificationToken(VOLUNTEER_ID);
    expect(verifyVerificationToken(token, VOLUNTEER_ID)).toBe(true);
  });

  it('rejects token for a different volunteer', () => {
    const token = signVerificationToken(VOLUNTEER_ID);
    expect(verifyVerificationToken(token, OTHER_ID)).toBe(false);
  });

  it('rejects expired tokens', () => {
    const token = signVerificationToken(VOLUNTEER_ID);
    vi.setSystemTime(new Date('2025-06-12T12:31:00Z'));
    expect(verifyVerificationToken(token, VOLUNTEER_ID)).toBe(false);
  });

  it('rejects tampered tokens', () => {
    const token = signVerificationToken(VOLUNTEER_ID);
    expect(verifyVerificationToken(`${token}x`, VOLUNTEER_ID)).toBe(false);
  });

  it('falls back to ADMIN_PASSWORD when VERIFICATION_SECRET is unset', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('ADMIN_PASSWORD', 'admin-fallback');

    const token = signVerificationToken(VOLUNTEER_ID);
    expect(verifyVerificationToken(token, VOLUNTEER_ID)).toBe(true);
  });
});
