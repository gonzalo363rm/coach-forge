// middleware.ts has been renamed to proxy.ts in Next.js 16+

import NextAuth from "next-auth"

import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export const proxy = auth

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
