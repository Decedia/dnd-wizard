import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { SRDProvider } from "@/contexts/SRDContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DND Wizard",
  description: "A mobile-first D&D 5e character creator",
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
            <div className="mx-auto max-w-lg">
              {children}
            </div>
          </ThemeProvider>
        </SRDProvider>
        <BottomNav />
      </body>
    </html>
  );
}
