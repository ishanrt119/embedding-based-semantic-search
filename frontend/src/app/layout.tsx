import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocIntel — AI-Powered Document Intelligence Platform",
  description: "Search, chat, compare, and generate reports from your documents using semantic search, retrieval-augmented generation, and multi-document intelligence.",
  openGraph: {
    title: "DocIntel — AI-Powered Document Intelligence Platform",
    description: "Search, chat, compare, and generate reports from your documents using semantic search, retrieval-augmented generation, and multi-document intelligence.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocIntel — AI-Powered Document Intelligence Platform",
    description: "Search, chat, compare, and generate reports from your documents using semantic search, retrieval-augmented generation, and multi-document intelligence.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
