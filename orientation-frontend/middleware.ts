// Middleware - no locale-based routing needed
// All routes are flat and multilingual UI is handled client-side

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: []
}