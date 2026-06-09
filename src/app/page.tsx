import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard-client';

export default function ExecutiveDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-lg text-slate-600 font-medium animate-pulse">Loading Dashboard Data...</div></div>}>
      <DashboardClient />
    </Suspense>
  );
}
