import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  return (
    <div className="py-8 px-8 space-y-6">
      {/* Dashboard Client Component */}
      <DashboardClient />

      <ChatbotFAB />
    </div>
  );
}
