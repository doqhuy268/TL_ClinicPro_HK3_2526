
import { MainFooter } from "@/components/layout/main-footer";
import { MainHeader } from "@/components/layout/main-header";
import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <MainHeader />
      <main className="flex-1">
        {children}
      </main>
      <MainFooter />
      <ChatbotFAB />
    </div>
  );
}
