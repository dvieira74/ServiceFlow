import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // Essential to return null or an empty fragment when redirecting in Server Components
  return null;
}
