import DashboardContent from '@/components/DashboardContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drafts',
};

export default function DraftsPage() {
  return (
    <DashboardContent title="Drafts">
      {/* TODO: fetch drafts via /api/posts?status=draft */}
      <p className="text-gray-400">Drafts will be listed here.</p>
    </DashboardContent>
  );
}
