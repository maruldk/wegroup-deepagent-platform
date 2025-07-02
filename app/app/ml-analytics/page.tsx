
/**
 * ML Analytics Dashboard Page - Main entry point for ML features
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MLDashboard } from '@/components/ai/ml-dashboard';

export const metadata = {
  title: 'ML Analytics - weGROUP DeepAgent Plattform',
  description: 'Machine Learning Pipeline & Predictive Analytics Dashboard',
};

export default async function MLAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.tenantId) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <MLDashboard 
        tenantId={session.user.tenantId} 
        userId={session.user.id}
      />
    </div>
  );
}
