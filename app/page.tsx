import { redirect } from 'next/navigation';
import { auth } from './api/auth/[...nextauth]/route';
import Dashboard from './components/Dashboard';

export default async function Home() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return <Dashboard />;
}
