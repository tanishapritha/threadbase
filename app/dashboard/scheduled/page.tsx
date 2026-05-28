import DashboardContent from '@/components/DashboardContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scheduled',
};

export default function ScheduledPage() {
  return (
    <DashboardContent title="Scheduled">
      {/* TODO: fetch scheduled posts via /api/posts?status=scheduled */}
      <p className="text-gray-400">Scheduled posts will be listed here.</p>
    </DashboardContent>
  );
}
