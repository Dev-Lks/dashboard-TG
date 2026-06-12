import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getSecret(): string {
  return process.env.VERIFICATION_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function signVerificationToken(volunteerId: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error('VERIFICATION_SECRET not configured');
  }

  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${volunteerId}:${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  const payloadB64 = Buffer.from(payload).toString('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyVerificationToken(token: string, volunteerId: string): boolean {
  const secret = getSecret();
  if (!secret) return false;

  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const payloadB64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!payloadB64 || !sig) return false;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const colonIndex = payload.indexOf(':');
  if (colonIndex === -1) return false;

  const tokenVolunteerId = payload.slice(0, colonIndex);
  const expStr = payload.slice(colonIndex + 1);

  if (tokenVolunteerId !== volunteerId) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url');

  try {
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
