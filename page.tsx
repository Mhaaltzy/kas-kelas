import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default function Home() {
  if (getSession()) redirect('/dashboard');
  return <LoginForm />;
}
