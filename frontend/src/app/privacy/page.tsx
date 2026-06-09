import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-16 px-6 sm:px-8">
        <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-2 mb-10">Last updated: June 2026</p>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when creating an account, including your name, email address, and authentication credentials. We also securely process the documents (PDFs, text files, CSVs) you upload for semantic indexing.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">2. How We Use Your Data</h2>
            <p>Your uploaded documents are processed solely for the purpose of generating vector embeddings and enabling retrieval-augmented generation (RAG) queries within your own workspace. We do not use your private datasets to train our foundational models.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-left">3. Data Retention and Deletion</h2>
            <p>You have the right to request deletion of your data at any time. Deleting a dataset from your dashboard permanently removes the source files and all associated vector embeddings from our FAISS indexes and MongoDB databases.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
