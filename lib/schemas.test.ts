import { describe, expect, it } from 'vitest';
import {
  adminLoginSchema,
  createAppointmentSchema,
  donationDateSchema,
  verifyVolunteerSchema,
  volunteerSearchSchema,
} from './schemas';

describe('volunteerSearchSchema', () => {
  it('requires at least 2 characters', () => {
    expect(volunteerSearchSchema.safeParse({ query: 'a' }).success).toBe(false);
    expect(volunteerSearchSchema.safeParse({ query: 'ab' }).success).toBe(true);
  });
});

describe('createAppointmentSchema', () => {
  it('requires valid UUIDs and verification token', () => {
    const valid = createAppointmentSchema.safeParse({
      volunteerId: '550e8400-e29b-41d4-a716-446655440000',
      donationDateId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      verificationToken: 'signed-token',
    });
    expect(valid.success).toBe(true);

    const missingToken = createAppointmentSchema.safeParse({
      volunteerId: '550e8400-e29b-41d4-a716-446655440000',
      donationDateId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    });
    expect(missingToken.success).toBe(false);

    const invalid = createAppointmentSchema.safeParse({
      volunteerId: 'not-a-uuid',
      donationDateId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      verificationToken: 'signed-token',
    });
    expect(invalid.success).toBe(false);
  });
});

describe('donationDateSchema', () => {
  it('accepts valid mission dates with default capacity', () => {
    const result = donationDateSchema.safeParse({ date: '2025-06-02' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacity).toBe(15);
      expect(result.data.is_active).toBe(true);
    }
  });

  it('rejects invalid date format', () => {
    expect(donationDateSchema.safeParse({ date: '02/06/2025' }).success).toBe(false);
  });

  it('rejects capacity outside 1-50', () => {
    expect(donationDateSchema.safeParse({ date: '2025-06-02', capacity: 0 }).success).toBe(false);
    expect(donationDateSchema.safeParse({ date: '2025-06-02', capacity: 51 }).success).toBe(false);
  });
});

describe('verifyVolunteerSchema', () => {
  it('requires volunteerId UUID and YYYY-MM-DD birthDate', () => {
    const valid = verifyVolunteerSchema.safeParse({
      volunteerId: '550e8400-e29b-41d4-a716-446655440000',
      birthDate: '2005-08-29',
    });
    expect(valid.success).toBe(true);

    expect(
      verifyVolunteerSchema.safeParse({
        volunteerId: '550e8400-e29b-41d4-a716-446655440000',
        birthDate: '29/08/2005',
      }).success,
    ).toBe(false);
  });
});

describe('adminLoginSchema', () => {
  it('requires non-empty password', () => {
    expect(adminLoginSchema.safeParse({ password: '' }).success).toBe(false);
    expect(adminLoginSchema.safeParse({ password: 'secret' }).success).toBe(true);
  });
});
