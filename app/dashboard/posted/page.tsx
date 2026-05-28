import DashboardContent from '@/components/DashboardContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Posted',
};

export default function PostedPage() {
  return (
    <DashboardContent title="Posted">
      {/* TODO: fetch posted items via /api/posts?status=posted */}
      <p className="text-gray-400">Posted items will be listed here.</p>
    </DashboardContent>
  );
}
