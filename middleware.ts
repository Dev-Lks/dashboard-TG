import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect deeper admin paths if needed (the /admin page itself handles login UI)
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
