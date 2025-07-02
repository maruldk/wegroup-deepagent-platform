
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Check if user is trying to access admin routes
    if (pathname.startsWith('/admin')) {
      if (!token?.role || !['SUPER_ADMIN', 'ADMIN'].includes(token.role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Check if user is trying to access manager routes
    if (pathname.startsWith('/manager')) {
      if (!token?.role || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(token.role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/leads/:path*',
    '/admin/:path*',
    '/manager/:path*',
    '/api/customers/:path*',
    '/api/leads/:path*',
    '/api/admin/:path*',
  ],
};
