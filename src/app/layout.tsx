import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { InstallPrompt } from "@/components/install-prompt";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "صرافیکس",
  description: "مدیریت هوشمند صرافی",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "صرافیکس",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>

      <body className="min-h-dvh bg-white font-sans text-gray-900 antialiased">
        <AuthProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
