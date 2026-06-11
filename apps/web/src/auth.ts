import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authConfig } from "@/auth.config"
import { signInSchema } from "@/schemas/auth.schema"
import { authenticateUser } from "@/services/auth.service"
import { userGetById } from "@/services/users.service"
import type { AuthUser } from "@/types/auth-user"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      const userId = (token.data as AuthUser | undefined)?.id
      if (userId) {
        const freshUser = await userGetById(userId)
        if (freshUser) {
          session.user = freshUser as AuthUser
          return session
        }
      }

      if (token.data) {
        session.user = token.data as AuthUser
      }

      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const parsedCredentials = signInSchema.safeParse(credentials)

          if (!parsedCredentials.success) return null

          const result = await authenticateUser(parsedCredentials.data)
          if (!result.ok) return null

          const { passwordHash, ...userWithoutPassword } = result.data

          return userWithoutPassword
        } catch (error) {
          console.error(error)
          return null
        }
      },
    }),
  ],
})
