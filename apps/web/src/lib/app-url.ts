export function getAppUrl(): string {
  const url =
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL

  if (url) return url.replace(/\/$/, "")

  return "http://localhost:3000"
}
