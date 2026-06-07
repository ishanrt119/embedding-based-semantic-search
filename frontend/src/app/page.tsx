import { ArrowRight, Search, FileText, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-24 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-violet-300 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
          Production-Grade AI Retrieval
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Semantic Search</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Index hundreds of thousands of documents, generate vector embeddings, and search with human-like understanding using our hybrid BM25 + Vector architecture.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-8">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-base bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/search">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white/5 border-white/10 hover:bg-white/10">
              Try the Demo
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Hybrid Retrieval</h3>
            <p className="text-muted-foreground text-sm">Combines BM25 keyword matching with dense vector similarity for 32% improved relevance.</p>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Sub-150ms Latency</h3>
            <p className="text-muted-foreground text-sm">Powered by optimized FAISS/ChromaDB indexing for lightning-fast queries at scale.</p>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4 text-pink-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Citation-Aware RAG</h3>
            <p className="text-muted-foreground text-sm">Chat with your datasets. Get exact sources and highlights for every LLM-generated answer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
