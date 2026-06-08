import { authFieldErrorClass } from "./auth-input-class"

type Props = {
  message?: string
}

export function AuthFieldError({ message }: Props) {
  if (!message) return null

  return <p className={authFieldErrorClass}>{message}</p>
}
