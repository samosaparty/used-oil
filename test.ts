import { getDashboardData } from './src/lib/data';
getDashboardData(undefined, undefined, 'Bangalore Warehouse').then(d => {
  console.log('Final KPI Data:');
  console.log(JSON.stringify(d.kpiData, null, 2));
});
