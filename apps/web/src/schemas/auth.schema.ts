import { z } from "zod"

const passwordSchema = z
  .string({ error: "La contraseña es obligatoria" })
  .min(1, "La contraseña es obligatoria")
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(32, "La contraseña debe tener menos de 32 caracteres")

export const signInSchema = z.object({
  email: z.email({ error: "Introduce un email válido" }),
  password: passwordSchema,
})

export const registerSchema = z
  .object({
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

export type SignInFormInput = z.infer<typeof signInSchema>
export type RegisterFormInput = z.infer<typeof registerSchema>