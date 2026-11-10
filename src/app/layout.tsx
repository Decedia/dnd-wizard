import type { Metadata } from "next";
import localFont from "next/font/local";
import { BottomNav } from "@/components/BottomNav";
import { SRDProvider } from "@/contexts/SRDContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DebugProvider } from "@/lib/debug/DebugContext";
import { DebugButton } from "@/components/debug/DebugButton";
import "./globals.css";

// Inter (variable, Latin) ships with the app, so the build never downloads it.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
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
        <ThemeProvider>
          <LanguageProvider>
            <SRDProvider>
              <DebugProvider>
                <div className="mx-auto max-w-lg">
                  {children}
                </div>
                <DebugButton />
                <BottomNav />
              </DebugProvider>
            </SRDProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
