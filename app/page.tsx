import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware handles mobile redirects, so we just redirect to dashboard
  // Mobile users will be redirected by middleware
  redirect('/dashboard')
}
