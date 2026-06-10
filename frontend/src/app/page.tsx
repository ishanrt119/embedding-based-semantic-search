import Link from "next/link"
import { ArrowRight, Database, Search, Zap, Shield, FileText, BarChart3, Code, Cpu, Layers, MessageSquare, GitCompare, Box } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans selection:bg-blue-100">
      
      {/* Navbar */}
      <nav className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">D</div>
            <span className="font-semibold text-sm tracking-tight text-gray-900">DocIntel</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#use-cases" className="hover:text-gray-900 transition-colors">Use Cases</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-800 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-32 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1] max-w-4xl mx-auto">
          Search, Chat, Compare, and Generate Insights from Your Documents.
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
          DocIntel provides a complete AI-powered document intelligence platform. Automatically parse, chunk, and embed your documents to build a powerful Retrieval-Augmented Generation (RAG) knowledge base.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
            Start Building for Free <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <a href="https://github.com/ishanrt119/embedding-based-semantic-search" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-md font-medium text-sm flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <Code className="mr-2 w-4 h-4" /> View on GitHub
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-gray-200 bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Process Flow</h2>
            <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">How It Works</h3>
            <p className="text-gray-600">A seamless pipeline from unstructured documents to actionable AI insights.</p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
            {[
              { step: "1", title: "Upload Documents", icon: FileText, desc: "PDFs, TXT, MD" },
              { step: "2", title: "Process Documents", icon: Cpu, desc: "Chunking & Embedding" },
              { step: "3", title: "Search Knowledge", icon: Search, desc: "Hybrid & Semantic" },
              { step: "4", title: "Chat with Documents", icon: MessageSquare, desc: "Citation-backed RAG" },
              { step: "5", title: "Generate Reports", icon: BarChart3, desc: "Multi-Document Synthesis" }
            ].map((flow, i, arr) => (
              <div key={i} className="flex flex-col items-center flex-1 text-center group">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm relative z-10 group-hover:border-blue-300 group-hover:shadow-md transition-all">
                    <flow.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-[1px] bg-gray-200 -z-0"></div>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{flow.title}</h4>
                <p className="text-xs text-gray-500">{flow.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl mx-auto text-center">
            <h2 className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Platform Features</h2>
            <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Everything you need for production RAG</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[
              {
                title: "Semantic Search",
                description: "Find information based on meaning, not just keywords, using dense vector embeddings powered by HuggingFace.",
                icon: Search
              },
              {
                title: "Multi-Document Intelligence",
                description: "Compare contracts, find contradictions in reports, and synthesize knowledge across your entire dataset.",
                icon: GitCompare
              },
              {
                title: "Citation-Aware Chat",
                description: "Generative answers are strictly grounded in your data. Click citations to view the exact highlighted source text.",
                icon: FileText
              },
              {
                title: "Hybrid Retrieval",
                description: "Combine vector search with traditional keyword search (BM25) to maximize recall and precision.",
                icon: Zap
              },
              {
                title: "Secure Isolation",
                description: "Enterprise-grade multi-tenant architecture ensures your workspaces and datasets are strictly siloed.",
                icon: Shield
              },
              {
                title: "Automated Reporting",
                description: "Generate structured markdown and PDF reports, executive summaries, and action items instantly.",
                icon: BarChart3
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col p-6 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 border border-gray-200 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                  <feature.icon className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="border-t border-gray-200 bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Under The Hood</h2>
            <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Modern Architecture</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center shadow-sm">
              <Box className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">Frontend</h4>
              <p className="text-xs text-gray-500">Next.js 14, React, Tailwind CSS, Lucide Icons</p>
            </div>
            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center shadow-sm">
              <Layers className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">Backend</h4>
              <p className="text-xs text-gray-500">Python, FastAPI, LangChain Text Splitters</p>
            </div>
            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center shadow-sm">
              <Database className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">Data Layer</h4>
              <p className="text-xs text-gray-500">MongoDB Atlas (Metadata), FAISS (Vector Index)</p>
            </div>
            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center shadow-sm">
              <Cpu className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">AI Models</h4>
              <p className="text-xs text-gray-500">Groq (Llama-3), HuggingFace (MiniLM)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">D</div>
            <span className="font-medium text-gray-900">DocIntel</span>
          </div>
          <div className="flex gap-6 items-center">
            <a href="https://github.com/ishanrt119/embedding-based-semantic-search" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-gray-900">
              <Code className="w-4 h-4" /> GitHub
            </a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p>© 2026 DocIntel. All rights reserved.</p>
            <p className="text-[11px] opacity-80">Built with ❤️ by Ishan Toraskar</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
