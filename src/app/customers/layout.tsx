import { Header } from "@/components/dashboard/header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { SubscriptionWarning } from "@/components/subscription-warning";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-gray-50/50 overflow-hidden">
      <Header />
      <SubscriptionWarning />
      <main data-scroll-container className="flex-1 overflow-y-auto pb-24 pt-2">{children}</main>
      <BottomNav />
    </div>
  );
}
