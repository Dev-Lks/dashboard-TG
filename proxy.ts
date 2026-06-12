import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/admin/') && pathname !== '/admin';

  if (isProtected) {
    const session = request.cookies.get('tg_admin_session');
    if (!session || session.value !== '1') {
      const url = new URL('/admin', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
