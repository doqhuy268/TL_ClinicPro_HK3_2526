import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-slate-50">
      <SidebarProvider>
        <AppSidebar />
        
        <div className="flex flex-col flex-1 bg-slate-50 transition-all duration-300 overflow-hidden">
          <AppHeader />
          <div className="flex-1 p-2 md:p-4 lg:p-6 pb-0 h-full overflow-hidden">
            <main className="h-full overflow-y-auto bg-white rounded-t-2xl border border-slate-200 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)]">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
