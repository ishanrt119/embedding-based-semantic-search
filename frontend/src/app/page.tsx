import Link from "next/link"
import { ArrowRight, Database, Search, Zap, Shield, FileText, BarChart3 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans selection:bg-blue-100">
      
      {/* Announcement Bar */}
      <div className="bg-blue-600 text-white text-xs font-medium py-2 px-4 text-center">
        Announcing Aether v2.0: Now with hybrid retrieval and advanced citations. <a href="#" className="underline ml-1">Read the changelog</a>
      </div>

      {/* Navbar */}
      <nav className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">A</div>
            <span className="font-semibold text-sm tracking-tight text-gray-900">Aether</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-gray-900 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-gray-900 transition-colors">Docs</a>
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

      {/* Hero Section (Split Layout) */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Search, Understand and Chat With Your Documents
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Aether provides production-ready document intelligence. Automatically chunk, embed, and search across your internal knowledge base with state-of-the-art accuracy.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/register" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
                Start building for free <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <button className="w-full sm:w-auto px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
                Book a demo
              </button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-gray-400" /> SOC2 Compliant</span>
              <span className="flex items-center gap-1"><Database className="w-4 h-4 text-gray-400" /> Isolated Environments</span>
            </div>
          </div>

          {/* Product UI Mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-gray-50 rounded-2xl transform rotate-2 scale-105 opacity-50"></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col h-[400px]">
              {/* Mockup Header */}
              <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex-1 max-w-sm mx-4 bg-white border border-gray-200 rounded flex items-center px-2 h-7">
                  <Search className="w-3 h-3 text-gray-400 mr-2" />
                  <span className="text-[10px] text-gray-400">Search Q3 earnings report...</span>
                </div>
              </div>
              {/* Mockup Body */}
              <div className="flex-1 flex">
                <div className="w-48 border-r border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-20 bg-blue-100 rounded"></div>
                  <div className="h-3 w-28 bg-gray-200 rounded"></div>
                </div>
                <div className="flex-1 p-6 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="h-5 w-32 bg-gray-900 rounded mb-2"></div>
                      <div className="h-3 w-48 bg-gray-400 rounded"></div>
                    </div>
                    <div className="h-8 w-24 bg-blue-600 rounded"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 border border-gray-200 rounded-lg p-3">
                      <div className="h-3 w-12 bg-gray-400 rounded mb-2"></div>
                      <div className="h-6 w-8 bg-gray-900 rounded"></div>
                    </div>
                    <div className="h-20 border border-gray-200 rounded-lg p-3">
                      <div className="h-3 w-16 bg-gray-400 rounded mb-2"></div>
                      <div className="h-6 w-12 bg-gray-900 rounded"></div>
                    </div>
                    <div className="h-20 border border-gray-200 rounded-lg p-3">
                      <div className="h-3 w-20 bg-gray-400 rounded mb-2"></div>
                      <div className="h-6 w-16 bg-gray-900 rounded"></div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg flex-1">
                    <div className="h-8 border-b border-gray-200 bg-gray-50"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-3 w-full bg-gray-100 rounded"></div>
                      <div className="h-3 w-full bg-gray-100 rounded"></div>
                      <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="border-t border-gray-200 bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Platform Features</h2>
            <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Everything you need for production RAG</h3>
            <p className="text-gray-600">Aether abstracts away the complexity of vector databases and embedding models, giving you a clean API and powerful dashboard.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[
              {
                title: "Semantic Search",
                description: "Find information based on meaning, not just keywords, using dense vector embeddings.",
                icon: Search
              },
              {
                title: "Hybrid Retrieval",
                description: "Combine vector search with traditional keyword search (BM25) to maximize recall and precision.",
                icon: Zap
              },
              {
                title: "Citation-Aware Answers",
                description: "Generative answers are strictly grounded in your data, with exact chunks referenced as citations.",
                icon: FileText
              },
              {
                title: "Dataset Management",
                description: "Organize files into isolated datasets. We automatically handle parsing, chunking, and embedding.",
                icon: Database
              },
              {
                title: "Secure Isolation",
                description: "Enterprise-grade multi-tenant architecture ensures your workspaces are strictly siloed.",
                icon: Shield
              },
              {
                title: "Usage Analytics",
                description: "Track search queries, latency, and engagement metrics directly from the dashboard.",
                icon: BarChart3
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gray-900 text-white flex items-center justify-center font-bold text-[10px]">A</div>
            <span className="font-medium text-gray-900">Aether</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Security</a>
          </div>
          <p>© 2026 Aether Search Inc.</p>
        </div>
      </footer>
    </div>
  )
}
