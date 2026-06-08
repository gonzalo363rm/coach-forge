import type { Role } from "@prisma/client"

export type AuthUser = {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  email: string
  emailVerified: Date | null
  role: Role
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}
