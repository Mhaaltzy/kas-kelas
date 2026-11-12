import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const session = getSession();
  if (!session) redirect('/');
  return <Dashboard nama={session.nama} />;
}
