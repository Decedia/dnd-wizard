import type { Metadata } from "next";
import { Cinzel, Geist } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
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
        className={`${cinzel.variable} ${geistSans.variable} antialiased`}
      >
        <div className="mx-auto max-w-lg">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
