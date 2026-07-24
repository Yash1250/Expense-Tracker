// Auth route group layout — no sidebar, no header, no navigation
// Only the page content renders here (login, forgot-password, reset-password)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
