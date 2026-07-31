import { z } from "zod"

export const passwordSchema = z
  .string({ error: "La contraseña es obligatoria" })
  .min(1, "La contraseña es obligatoria")
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(32, "La contraseña debe tener menos de 32 caracteres")

export const signInSchema = z.object({
  email: z.email({ error: "Introduce un email válido" }),
  password: passwordSchema,
})

export const registerAccountTypeSchema = z.enum(["coach", "club"])

export const registerSchema = z
  .object({
    accountType: registerAccountTypeSchema.default("coach"),
    clubName: z.string().trim().max(120).optional(),
    clubAddress: z.string().trim().max(300).optional(),
    firstName: z
      .string({ error: "El nombre es obligatorio" })
      .min(1, "El nombre es obligatorio")
      .max(80, "El nombre es demasiado largo"),
    lastName: z
      .string({ error: "El apellido es obligatorio" })
      .min(1, "El apellido es obligatorio")
      .max(80, "El apellido es demasiado largo"),
    email: z.email({ error: "Introduce un email válido" }),
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirma la contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "club" && !data.clubName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre del club es obligatorio",
        path: ["clubName"],
      })
    }
  })

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Introduce un email válido" }),
})

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirma la contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = resetPasswordFormSchema.extend({
  token: z
    .string({ error: "Token de recuperación inválido" })
    .min(1, "Token de recuperación inválido"),
})

export type SignInFormInput = z.infer<typeof signInSchema>
export type ForgotPasswordFormInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>
export type RegisterFormInput = z.infer<typeof registerSchema>