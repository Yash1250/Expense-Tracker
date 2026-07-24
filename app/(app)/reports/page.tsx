import { getReportData, getSettings } from '@/lib/actions';
import ReportsClient from '@/components/ReportsClient';

export default async function Reports() {
  const [data, { settings }] = await Promise.all([getReportData('monthly'), getSettings()]);
  return <ReportsClient initialData={data} currency={settings?.currencySymbol || '₹'} />;
}
