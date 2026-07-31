import { BottomNav } from "@/components/dashboard/bottom-nav";

export default function TenantDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-gray-50/50 overflow-hidden">
      <main data-scroll-container className="flex-1 overflow-y-auto pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
