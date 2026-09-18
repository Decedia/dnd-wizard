import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { SRDProvider } from "@/contexts/SRDContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DebugProvider } from "@/lib/debug/DebugContext";
import { DebugButton } from "@/components/debug/DebugButton";
import "./globals.css";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DND Wizard",
  description: "A mobile-first D&D 5e character creator",
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DND Wizard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-paper text-ink`}
      >
        <SRDProvider>
          <ThemeProvider>
            <LanguageProvider>
              <DebugProvider>
                <div className="mx-auto max-w-lg pb-36">
                  {children}
                </div>
                <DebugButton />
              </DebugProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SRDProvider>
        <BottomNav />
      </body>
    </html>
  );
}
