import DashboardContent from '@/components/DashboardContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preferences',
};

export default function PreferencesPage() {
  return (
    <DashboardContent title="Preferences">
      {/* TODO: implement preferences form and connect to /api/preferences */}
      <p className="text-gray-400">Preferences UI will be built here.</p>
    </DashboardContent>
  );
}
