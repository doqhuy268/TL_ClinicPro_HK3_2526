import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { LayoutRedirect } from "@/components/auth/LayoutRedirect";
import { GoogleAuthListener } from "@/components/auth/GoogleAuthListener";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "ClinicPro - Hệ thống quản lý y tế",
  description: "Hệ thống quản lý y tế toàn diện cho bệnh viện và phòng khám",
  icons: {
    icon: '/logos/LogoClinicPro-v1-noneBG.png',
    apple: '/logos/LogoClinicPro-v1-noneBG.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${font.className} bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <LayoutRedirect />
          <GoogleAuthListener />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
