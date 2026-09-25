import type { Metadata } from "next";
import { Fraunces, Inter, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Cirkle Authentication — One identity for every Cirkle app",
  description:
    "Cirkle Authentication is the single sign-on layer for the Cirkle ecosystem. One username unlocks Cirkle-Search and every connected product.",
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
        className={`${inter.variable} ${fraunces.variable} ${tajawal.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
