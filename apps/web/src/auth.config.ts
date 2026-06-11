import type { NextAuthConfig } from "next-auth"

import type { AuthUser } from "@/types/auth-user"

export const publicRoutes = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]

export const adminRoutes = ["/users"]

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

// Configuración ligera compartida (proxy + auth). Sin Prisma ni bcrypt.
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.data = user as AuthUser
      }

      return token
    },

    session({ session, token }) {
      if (token.data) {
        session.user = token.data as AuthUser
      }

      return session
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname)

      if (isPublicRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl)

        if (nextUrl.pathname !== "/") {
          loginUrl.searchParams.set(
            "callbackUrl",
            `${nextUrl.pathname}${nextUrl.search}`,
          )
        }

        return Response.redirect(loginUrl)
      }

      if (isAdminRoute(nextUrl.pathname) && auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig
