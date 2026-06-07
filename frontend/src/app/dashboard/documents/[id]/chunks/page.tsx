"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, FileText, BarChart3, Settings2, Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChunkVisualizationPage() {
  const { id } = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<any>(null)
  const [chunks, setChunks] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [strategy, setStrategy] = useState("recursive")
  const [chunkSize, setChunkSize] = useState(1000)
  const [overlap, setOverlap] = useState(200)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const docRes = await fetch(`http://localhost:8000/api/documents/${id}`)
      if (!docRes.ok) throw new Error("Failed to fetch document")
      setDocument(await docRes.json())

      const statsRes = await fetch(`http://localhost:8000/api/documents/${id}/chunk-stats`)
      if (statsRes.ok) setStats(await statsRes.json())

      // For simplicity in this visualization, fetch first 100 chunks
      const chunksRes = await fetch(`http://localhost:8000/api/documents/${id}/chunks?limit=100`)
      if (chunksRes.ok) {
        const chunksData = await chunksRes.json()
        setChunks(chunksData.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const handleProcess = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}/chunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy, chunk_size: chunkSize, overlap })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Failed to process chunks")
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => router.push("/dashboard/documents")}>
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FileText className="w-8 h-8 mr-3 text-indigo-600" />
            Advanced Chunking Engine
          </h1>
          <p className="text-gray-500 mt-1">
            {document?.filename} &middot; {document?.file_type} &middot; {document?.file_size} bytes
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Configuration Panel */}
        <Card className="col-span-1 border-indigo-100 shadow-sm">
          <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50 rounded-t-xl">
            <CardTitle className="text-lg flex items-center text-indigo-900">
              <Settings2 className="w-5 h-5 mr-2" />
              Chunking Strategy
            </CardTitle>
            <CardDescription>Configure how the document is segmented.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
              <select 
                className="w-full border-gray-300 rounded-md shadow-sm p-2.5 border focus:ring-indigo-500 focus:border-indigo-500"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                <option value="fixed">Fixed Length Chunking</option>
                <option value="recursive">Recursive Chunking (LangChain)</option>
                <option value="semantic">Semantic Chunking (ML-based)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Max Chunk Size</span>
                <span className="text-indigo-600 font-semibold">{chunkSize}</span>
              </label>
              <input 
                type="range" min="300" max="3000" step="50"
                className="w-full accent-indigo-600"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>300</span><span>3000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Overlap</span>
                <span className="text-indigo-600 font-semibold">{overlap}</span>
              </label>
              <input 
                type="range" min="0" max="500" step="10"
                className="w-full accent-indigo-600"
                value={overlap}
                onChange={(e) => setOverlap(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span><span>500</span>
              </div>
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleProcess}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Engine...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Generate Chunks</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Statistics Dashboard */}
        <Card className="col-span-2 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
              Chunk Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!stats || stats.total_chunks === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No chunks generated yet. Run the chunking engine to see statistics.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Total Chunks</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_chunks}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Avg Tokens</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.avg_tokens}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Avg Characters</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.avg_characters}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Largest Chunk</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.largest_chunk} <span className="text-xs font-normal text-gray-500">chars</span></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Smallest Chunk</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.smallest_chunk} <span className="text-xs font-normal text-gray-500">chars</span></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Chunk Variance</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.chunk_variance}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chunks List */}
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
        Generated Chunks <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full">{chunks.length}</span>
      </h2>
      
      {chunks.length === 0 ? (
        <Card className="border-dashed bg-gray-50">
          <CardContent className="p-12 text-center text-gray-500">
            Click "Generate Chunks" to visualize how this document is segmented.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {chunks.map((chunk, index) => (
            <Card key={chunk.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Chunk {chunk.chunk_index + 1}</span>
                <div className="flex space-x-4 text-gray-500">
                  <span>Tokens: <strong className="text-gray-700">{chunk.token_count}</strong></span>
                  <span>Chars: <strong className="text-gray-700">{chunk.character_count}</strong></span>
                  <span className="capitalize text-indigo-600">{chunk.chunk_strategy}</span>
                </div>
              </div>
              <CardContent className="p-4 text-gray-800 leading-relaxed font-serif">
                {chunk.chunk_text}
              </CardContent>
            </Card>
          ))}
          {stats?.total_chunks > 100 && (
            <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
              Showing first 100 chunks. {stats.total_chunks - 100} more chunks are hidden in this preview.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
