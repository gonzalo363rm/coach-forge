import { AuthShell } from "@/components/auth/AuthShell"
import { RegisterForm } from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      description="Regístrate para empezar a usar Coach Forge."
    >
      <RegisterForm />
    </AuthShell>
  )
}
