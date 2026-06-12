import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { verifyVolunteerSchema } from '@/lib/schemas';
import { birthDatesMatch } from '@/lib/birth-date';
import { signVerificationToken } from '@/lib/volunteer-verification';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptRecord = { count: number; firstAttempt: number };

const attemptStore = new Map<string, AttemptRecord>();

function getAttemptKey(volunteerId: string, ip: string): string {
  return `${volunteerId}:${ip}`;
}

function isRateLimited(key: string): boolean {
  const record = attemptStore.get(key);
  if (!record) return false;

  if (Date.now() - record.firstAttempt > WINDOW_MS) {
    attemptStore.delete(key);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attemptStore.set(key, { count: 1, firstAttempt: now });
    return;
  }

  record.count += 1;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = verifyVolunteerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { volunteerId, birthDate } = parsed.data;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const attemptKey = getAttemptKey(volunteerId, ip);

  if (isRateLimited(attemptKey)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 },
    );
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('volunteers')
    .select('birth_date')
    .eq('id', volunteerId)
    .maybeSingle();

  if (error) {
    console.error('Verify volunteer error', error);
    return NextResponse.json({ error: 'Erro ao verificar identidade' }, { status: 500 });
  }

  if (!data || !birthDatesMatch(data.birth_date, birthDate)) {
    recordFailedAttempt(attemptKey);
    return NextResponse.json({ error: 'Data de nascimento incorreta' }, { status: 403 });
  }

  attemptStore.delete(attemptKey);

  try {
    const verificationToken = signVerificationToken(volunteerId);
    return NextResponse.json({ success: true, verificationToken });
  } catch {
    console.error('VERIFICATION_SECRET not configured');
    return NextResponse.json({ error: 'Erro ao verificar identidade' }, { status: 500 });
  }
}
