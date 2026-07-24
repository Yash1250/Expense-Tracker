import { getSettings } from '@/lib/actions';
import SettingsClient from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { settings, budget } = await getSettings();
  return <SettingsClient initialSettings={settings} initialBudget={budget} />;
}
