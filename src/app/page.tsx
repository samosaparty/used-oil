import { getDashboardData } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard-client';


export const revalidate = 0;

export default async function ExecutiveDashboard(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const start = typeof searchParams.start === 'string' ? searchParams.start : undefined;
  const end = typeof searchParams.end === 'string' ? searchParams.end : undefined;
  const warehouse = typeof searchParams.warehouse === 'string' ? searchParams.warehouse : undefined;
  
  const data = await getDashboardData(start, end, warehouse);
  
  return <DashboardClient data={data} />;
}
