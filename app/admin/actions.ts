'use server';

import { loginAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export async function loginAdminAction(formData: FormData) {
  const password = formData.get('password') as string;
  const ok = await loginAdmin(password);
  if (!ok) {
    return { error: 'Senha incorreta' };
  }
  revalidatePath('/admin');
  return { success: true };
}
