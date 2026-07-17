import type { User } from "@prisma/client"

import type { AuthUser } from "@/types/auth-user"

type AuthUserSource = Pick<
  User,
  | "id"
  | "firstName"
  | "lastName"
  | "phoneNumber"
  | "email"
  | "emailVerified"
  | "role"
  | "avatarUrl"
  | "createdAt"
  | "updatedAt"
>

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null
  return value instanceof Date ? value : new Date(value)
}

export function toAuthUser(user: AuthUserSource | AuthUser): AuthUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    emailVerified: toDate(user.emailVerified),
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: toDate(user.createdAt) ?? new Date(),
    updatedAt: toDate(user.updatedAt) ?? new Date(),
  }
}
