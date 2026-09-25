import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cirkle Authentication — One identity for every Cirkle app",
  description:
    "Cirkle Authentication is the single sign-on layer for the Cirkle ecosystem. One account unlocks Cirkle-Search and every connected product.",
  keywords: [
    "Cirkle",
    "Authentication",
    "SSO",
    "Single Sign-On",
    "OAuth",
    "Cirkle-Search",
    "Identity",
  ],
  authors: [{ name: "Cirkle" }],
  openGraph: {
    title: "Cirkle Authentication",
    description: "One identity for every Cirkle app.",
    siteName: "Cirkle",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
