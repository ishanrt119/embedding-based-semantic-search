import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-16 px-6 sm:px-8">
        <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-2 mb-10">Last updated: June 2026</p>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">1. Introduction</h2>
            <p>Welcome to Aether. By accessing our platform, you agree to these Terms of Service. Please read them carefully. Aether provides an AI-powered semantic search and RAG (Retrieval-Augmented Generation) platform for enterprise document intelligence.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">2. Acceptable Use</h2>
            <p>You agree not to use the Aether platform to upload, store, or process any illegal, harmful, or sensitive data without proper authorization. You maintain full ownership of the documents you upload.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">3. Data Security & Isolation</h2>
            <p>We employ enterprise-grade security measures to ensure your uploaded datasets remain strictly isolated. Your documents and generated vector embeddings are accessible only to your authenticated workspace.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">4. Limitation of Liability</h2>
            <p>Aether is provided "as is". While our semantic search algorithms strive for high accuracy, we do not guarantee the completeness or absolute correctness of AI-generated answers or retrievals.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
