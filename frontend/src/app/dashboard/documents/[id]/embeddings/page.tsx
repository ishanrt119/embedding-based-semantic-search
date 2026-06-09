"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Trash2, RefreshCw, ArrowLeft, Database, Clock, Activity, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

interface Document {
  id: string
  filename: string
  processing_status: string
}

interface EmbeddingJob {
  id: string
  total_chunks: number
  processed_chunks: number
  percentage_complete: number
  current_status: string
  model: string
  processing_time_ms: number
  created_at: string
}

interface EmbeddingMeta {
  _id: string
  chunk_id: string
  embedding_model: string
  vector_dimension: number
  embedding_status: string
  created_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function EmbeddingsDashboard() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [job, setJob] = useState<EmbeddingJob | null>(null)
  const [embeddings, setEmbeddings] = useState<EmbeddingMeta[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [modelName, setModelName] = useState("sentence-transformers/all-MiniLM-L6-v2")
  const [batchSize, setBatchSize] = useState(64)

  const fetchData = async (pageNum: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const docRes = await fetch(`http://localhost:8000/api/documents/${id}`)
      if (!docRes.ok) throw new Error("Failed to fetch document details")
      setDocument(await docRes.json())

      const jobRes = await fetch(`http://localhost:8000/api/documents/${id}/embeddings/status`)
      if (jobRes.ok) {
        setJob(await jobRes.json())
      }

      const embRes = await fetch(`http://localhost:8000/api/documents/${id}/embeddings?page=${pageNum}&limit=10`)
      if (embRes.ok) {
        const embData = await embRes.json()
        setEmbeddings(embData.data)
        setPagination(embData.pagination)
      }
    } catch (err: any) {
      if (err.message !== "Failed to fetch chunks" && !err.message.includes("No embedding job found")) {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData(page)
    
    // Poll for status if a job is currently running
    const interval = setInterval(() => {
      if (job && ["starting", "processing"].includes(job.current_status)) {
        fetchData(page)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [id, page, job?.current_status])

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all embeddings metadata?")) return
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}/embeddings`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete embeddings")
      setJob(null)
      setEmbeddings([])
      fetchData(1)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleGenerate = async (e: React.FormEvent, regenerate: boolean = false) => {
    e.preventDefault()
    if (regenerate && !confirm("Are you sure you want to regenerate? All existing metadata will be deleted.")) return
    
    setIsGenerating(true)
    try {
      const endpoint = regenerate ? "regenerate" : "generate"
      const res = await fetch(`http://localhost:8000/api/documents/${id}/embeddings/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: modelName,
          batch_size: batchSize
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to generate embeddings")
      }
      fetchData(1)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const isRunning = !!job && ["starting", "processing"].includes(job.current_status)

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/documents")} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold flex-1 flex items-center">
          <Database className="w-8 h-8 mr-3 text-indigo-600" />
          Embedding Management
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Progress Dashboard */}
      {job && (
        <Card className="mb-8 border-indigo-100 shadow-sm">
          <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50 rounded-t-xl">
            <CardTitle className="flex items-center justify-between text-indigo-900">
              <span className="flex items-center"><Activity className="w-5 h-5 mr-2" /> Live Progress Tracker</span>
              <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-white border capitalize shadow-sm">Status: {job.current_status}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-2 flex justify-between items-center text-sm font-medium text-gray-700">
              <span>Generating Embeddings</span>
              <span>{job.processed_chunks} / {job.total_chunks} chunks ({job.percentage_complete}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ease-out ${job.current_status === 'failed' ? 'bg-red-500' : 'bg-indigo-600'}`}
                style={{ width: `${job.percentage_complete}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 text-center border">
                <p className="text-gray-500 mb-1 text-xs">Model Used</p>
                <p className="font-semibold text-gray-900 truncate" title={job.model}>{job.model}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center border">
                <p className="text-gray-500 mb-1 text-xs">Chunks Remaining</p>
                <p className="font-semibold text-gray-900">{job.total_chunks - job.processed_chunks}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center border">
                <p className="text-gray-500 mb-1 text-xs flex items-center justify-center"><Clock className="w-3 h-3 mr-1"/> Time Elapsed</p>
                <p className="font-semibold text-gray-900">{(job.processing_time_ms / 1000).toFixed(1)}s</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center border">
                <p className="text-gray-500 mb-1 text-xs flex items-center justify-center"><Cpu className="w-3 h-3 mr-1"/> Avg Speed</p>
                <p className="font-semibold text-gray-900">
                  {job.processed_chunks > 0 && job.processing_time_ms > 0 
                    ? ((job.processed_chunks / (job.processing_time_ms / 1000)).toFixed(1)) 
                    : 0} chunks/s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Generator Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={e => handleGenerate(e, !!job)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Embedding Model</label>
                <select 
                  value={modelName} 
                  onChange={e => setModelName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm"
                  disabled={isRunning}
                >
                  <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384d)</option>
                  <option value="BAAI/bge-small-en-v1.5">bge-small-en-v1.5 (384d)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Batch Size</label>
                <input 
                  type="number" 
                  value={batchSize} 
                  onChange={e => setBatchSize(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm" 
                  disabled={isRunning}
                />
              </div>
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isGenerating || isRunning || (document?.processing_status === 'pending' || document?.processing_status === 'uploaded')} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                  {job ? "Regenerate Embeddings" : "Generate Embeddings"}
                </Button>
                {document?.processing_status === 'chunking' && <p className="text-xs text-amber-600 mt-2">Document is still chunking.</p>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Embedding Metadata</CardTitle>
              <CardDescription>Vector metadata records stored in MongoDB.</CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={isRunning || embeddings.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg mt-2">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-4 py-3">Chunk ID</th>
                    <th scope="col" className="px-4 py-3 text-center">Dimensions</th>
                    <th scope="col" className="px-4 py-3">Model</th>
                    <th scope="col" className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {embeddings.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No embeddings generated yet.</td></tr>
                  ) : (
                    embeddings.map((emb) => (
                      <tr key={emb._id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{emb.chunk_id.slice(0,18)}...</td>
                        <td className="px-4 py-3 text-center font-medium">{emb.vector_dimension}</td>
                        <td className="px-4 py-3 text-indigo-600 font-medium text-xs truncate max-w-[200px]" title={emb.embedding_model}>{emb.embedding_model}</td>
                        <td className="px-4 py-3 text-center">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {emb.embedding_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-700">
                  Showing <span className="font-semibold text-gray-900">{(page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900">{pagination.total}</span> records
                </span>
                <div className="inline-flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                    disabled={page === pagination.total_pages || isLoading}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
