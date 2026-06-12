import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authConfig } from "@/auth.config"
import { signInSchema } from "@/schemas/auth.schema"
import { authenticateUser } from "@/services/auth.service"

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
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
