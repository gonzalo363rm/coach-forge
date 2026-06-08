import type { AuthUser } from "@/types/auth-user"

declare module "next-auth" {
  interface Session {
    user: AuthUser
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    data?: AuthUser
  }
}
