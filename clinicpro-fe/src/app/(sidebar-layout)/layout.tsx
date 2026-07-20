"use client";

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
          <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-y-auto">
            <main className="min-h-full bg-white rounded-2xl border border-slate-200 shadow-sm">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
