"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Trash2, RefreshCw, ArrowLeft, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Document {
  id: string
  filename: string
  processing_status: string
}

interface ChunkStats {
  total_chunks: number
  avg_tokens: number
  avg_characters: number
  largest_chunk: number
  smallest_chunk: number
}

interface Chunk {
  _id: string
  chunk_index: number
  content: string
  page_number: number
  token_count: number
  chunk_strategy: string
  chunk_size: number
  chunk_overlap: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function ChunksDashboard() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [stats, setStats] = useState<ChunkStats | null>(null)
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Rechunk state
  const [isRechunking, setIsRechunking] = useState(false)
  const [rechunkStrategy, setRechunkStrategy] = useState("recursive")
  const [rechunkSize, setRechunkSize] = useState(1000)
  const [rechunkOverlap, setRechunkOverlap] = useState(200)

  const fetchData = async (pageNum: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const docRes = await fetch(`http://localhost:8000/api/documents/${id}`)
      if (!docRes.ok) throw new Error("Failed to fetch document details")
      setDocument(await docRes.json())

      const statsRes = await fetch(`http://localhost:8000/api/documents/${id}/chunk-stats`)
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }

      const chunksRes = await fetch(`http://localhost:8000/api/documents/${id}/chunks?page=${pageNum}&limit=10`)
      if (!chunksRes.ok) throw new Error("Failed to fetch chunks")
      const chunksData = await chunksRes.json()
      setChunks(chunksData.data)
      setPagination(chunksData.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData(page)
  }, [id, page])

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all chunks? This will reset document status.")) return
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}/chunks`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete chunks")
      fetchData(1)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleRechunk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm("Are you sure you want to rechunk? All existing chunks will be deleted.")) return
    
    setIsRechunking(true)
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}/rechunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: rechunkStrategy,
          chunk_size: rechunkSize,
          chunk_overlap: rechunkOverlap
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to rechunk")
      }
      alert("Rechunking successful!")
      fetchData(1)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsRechunking(false)
    }
  }

  const filteredChunks = chunks.filter(c => 
    c.content && c.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/documents")} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold flex-1 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-indigo-600" />
          Chunk Management
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            {document ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Filename</dt><dd className="font-medium truncate pl-4" title={document.filename}>{document.filename}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-medium capitalize text-indigo-600">{document.processing_status}</dd></div>
              </dl>
            ) : <p className="text-sm text-gray-500">Loading...</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chunk Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Total Chunks</dt><dd className="font-medium">{stats.total_chunks}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Avg Tokens/Chunk</dt><dd className="font-medium">{stats.avg_tokens}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Avg Chars/Chunk</dt><dd className="font-medium">{stats.avg_characters}</dd></div>
              </dl>
            ) : <p className="text-sm text-gray-500">Loading...</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rechunk Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRechunk} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Strategy</label>
                  <select 
                    value={rechunkStrategy} 
                    onChange={e => setRechunkStrategy(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="recursive">Recursive</option>
                    <option value="semantic">Semantic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <input 
                    type="number" 
                    value={rechunkSize} 
                    onChange={e => setRechunkSize(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Overlap</label>
                  <input 
                    type="number" 
                    value={rechunkOverlap} 
                    onChange={e => setRechunkOverlap(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm" 
                  />
                </div>
                <div className="col-span-2 mt-2">
                  <Button type="submit" disabled={isRechunking} className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                    {isRechunking ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Rechunk Now
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Chunk Viewer</CardTitle>
            <CardDescription>View, search, and manage individual chunks.</CardDescription>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search chunks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-md text-sm w-64 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="destructive" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete All Chunks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg mt-4">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 w-16 text-center">#</th>
                  <th scope="col" className="px-4 py-3">Chunk Content</th>
                  <th scope="col" className="px-4 py-3 w-20 text-center">Tokens</th>
                  <th scope="col" className="px-4 py-3 w-20 text-center">Length</th>
                  <th scope="col" className="px-4 py-3 w-20 text-center">Page</th>
                  <th scope="col" className="px-4 py-3 w-24">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading chunks...</td></tr>
                ) : filteredChunks.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No chunks found.</td></tr>
                ) : (
                  filteredChunks.map((chunk) => (
                    <tr key={chunk._id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-center font-medium text-gray-900">{chunk.chunk_index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="line-clamp-3 text-xs text-gray-600 leading-relaxed font-serif max-w-2xl">
                          {chunk.content}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {chunk.token_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">{chunk.content ? chunk.content.length : 0}</td>
                      <td className="px-4 py-3 text-center font-medium">{chunk.page_number}</td>
                      <td className="px-4 py-3 capitalize text-indigo-600 font-medium">{chunk.chunk_strategy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && !searchQuery && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-gray-700">
                Showing <span className="font-semibold text-gray-900">{(page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900">{pagination.total}</span> chunks
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
          {searchQuery && (
             <div className="text-center mt-4 text-sm text-gray-500">
               Pagination is disabled while searching. Showing matches from the current page.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
