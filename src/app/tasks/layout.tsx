import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

// Inter (variable, Latin) ships with the app, so the build never downloads it.
const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tasks - Task Management",
  description: "Task management dashboard",
};

export default function TasksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-paper text-ink`}>
        {children}
      </body>
    </html>
  );
}
