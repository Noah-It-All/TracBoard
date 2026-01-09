import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  )

  // If mobile device and trying to access dashboard, redirect to upload
  if (isMobile && request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/upload', request.url))
  }

  // If mobile device and on root, redirect to upload
  if (isMobile && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/upload', request.url))
  }

  // If desktop and trying to access upload, allow it (they might want to test)
  // But we could redirect to dashboard if preferred

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard', '/upload'],
}
