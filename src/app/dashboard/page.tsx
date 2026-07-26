import { StatusCards } from "@/components/dashboard/status-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivities } from "@/components/dashboard/recent-activities";

export default function DashboardPage() {
  return (
    <div className="space-y-6 px-4">
      <StatusCards />
      <QuickActions />
      <RecentActivities />
    </div>
  );
}
