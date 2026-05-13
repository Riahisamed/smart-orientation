import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider"
import { SessionProviderWrapper } from "./components/session-provider"
import { I18nProvider } from "@/lib/i18n/context"
import RTLProvider from "./components/RTLProvider"
import PWARegister from "./components/PWARegister"
import PWAInstallPrompt from "./components/PWAInstallPrompt"

export const metadata: Metadata = {
  title: "Smart Orientation",
  description: "Plateforme intelligente d'orientation professionnelle et academique",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Smart Orientation",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 antialiased dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100"
      >
        <SessionProviderWrapper>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <I18nProvider>
              <RTLProvider>
                {children}
              </RTLProvider>
              <PWARegister />
              <PWAInstallPrompt />
            </I18nProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}