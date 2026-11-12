import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Denzo",
  description: "Hello world",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider>
            <Header />
            {children}
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
