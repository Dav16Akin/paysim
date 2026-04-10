import SidebarComponent from "@/components/shared/SidebarComponent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#f4f5f4] overflow-hidden">
      <SidebarComponent />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
