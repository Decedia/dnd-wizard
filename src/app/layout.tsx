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

// Cinzel (variable, Latin) for titles, shipped with the app like Inter.
const cinzel = localFont({
  src: "./fonts/cinzel-latin.woff2",
  variable: "--font-cinzel",
  weight: "400 900",
  display: "swap",
});

// Sets the theme before the first paint: the saved pick, else the device setting.
const THEME_SCRIPT = `try{var t=localStorage.getItem("dnd-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export const metadata: Metadata = {
  title: "DND Wizard",
  description: "A mobile-first D&D 5e character creator",
  manifest: "/manifest.json",
  themeColor: "#12111a",
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
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className="antialiased bg-paper text-ink"
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
