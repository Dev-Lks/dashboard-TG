import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'tg_admin_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function loginAdmin(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('ADMIN_PASSWORD not configured');
  }
  if (password !== expected) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value === '1';
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    redirect('/admin');
  }
}
