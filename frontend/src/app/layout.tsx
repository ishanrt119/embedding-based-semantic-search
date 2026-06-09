import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aether | Semantic Search & RAG",
  description: "Production-grade AI Semantic Search Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased flex flex-col`}>
        <AuthProvider>
          <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                  A
                </div>
                <span className="font-semibold text-lg tracking-tight">Aether<span className="text-muted-foreground font-normal">Search</span></span>
              </div>
              <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <a href="/dashboard" className="hover:text-white transition-colors">Datasets</a>
                <a href="/search" className="hover:text-white transition-colors">Search</a>
                <a href="/chat" className="hover:text-white transition-colors">RAG Chat</a>
                <a href="/analytics" className="hover:text-white transition-colors">Analytics</a>
              </nav>
              <div className="flex items-center gap-4">
                <a href="/login" className="text-sm font-medium hover:text-white transition-colors">Sign in</a>
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
