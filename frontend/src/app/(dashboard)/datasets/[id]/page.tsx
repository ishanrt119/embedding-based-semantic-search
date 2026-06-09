"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FileText, Database, Settings, Activity, Trash2, Loader2, Calendar, HardDrive, Hash, Download, RefreshCw, Plus, Clock, Search, ChevronLeft, ChevronRight, Eye, X, Settings2, AlignLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Document {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  processing_status: string
  created_at: string
  updated_at?: string
}

export default function DatasetDetailsPage() {
  const { id } = useParams() as { id: string }
  const { token } = useAuth()
  const router = useRouter()
  
  const [dataset, setDataset] = useState<Document | null>(null)
  const [chunkStats, setChunkStats] = useState<any>(null)
  const [embeddingCount, setEmbeddingCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Chunking UI State
  const [showChunkConfig, setShowChunkConfig] = useState(false)
  const [isGeneratingChunks, setIsGeneratingChunks] = useState(false)
  const [chunkStrategy, setChunkStrategy] = useState("recursive")
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)

  // Chunk Data State
  const [chunks, setChunks] = useState<any[]>([])
  const [chunkPage, setChunkPage] = useState(1)
  const [chunkLimit, setChunkLimit] = useState(10)
  const [chunkTotalPages, setChunkTotalPages] = useState(1)
  const [chunkSearch, setChunkSearch] = useState("")
  const [isFetchingChunks, setIsFetchingChunks] = useState(false)

  // Chunk Viewer State
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null)

  const fetchDatasetData = async () => {
    try {
      const [docRes, chunkRes, embRes] = await Promise.all([
        fetch(`http://localhost:8000/api/documents/${id}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`http://localhost:8000/api/documents/${id}/chunk-stats`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`http://localhost:8000/api/documents/${id}/embeddings?limit=1`, { headers: { "Authorization": `Bearer ${token}` } })
      ])

      if (!docRes.ok) {
        router.push("/datasets")
        return
      }

      setDataset(await docRes.json())
      
      if (chunkRes.ok) {
        setChunkStats(await chunkRes.json())
      }
      
      if (embRes.ok) {
        const embData = await embRes.json()
        setEmbeddingCount(embData.pagination?.total || 0)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChunks = async (page: number, search: string = "") => {
    if (!token || !id) return
    setIsFetchingChunks(true)
    try {
      const url = new URL(`http://localhost:8000/api/documents/${id}/chunks`)
      url.searchParams.append("page", page.toString())
      url.searchParams.append("limit", chunkLimit.toString())
      if (search) url.searchParams.append("search", search)
      
      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChunks(data.data || [])
        setChunkTotalPages(data.pagination?.total_pages || 1)
        setChunkPage(data.pagination?.page || 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsFetchingChunks(false)
    }
  }

  useEffect(() => {
    if (token && id) {
      fetchDatasetData()
    }
  }, [token, id])

  useEffect(() => {
    if (chunkStats?.total_chunks > 0) {
      fetchChunks(chunkPage, chunkSearch)
    }
  }, [chunkStats?.total_chunks, chunkPage])

  const handleGenerateChunks = async (isRegenerating: boolean = false) => {
    if (!token || !id) return
    setIsGeneratingChunks(true)
    try {
      const endpoint = isRegenerating ? "rechunk" : "chunk"
      const res = await fetch(`http://localhost:8000/api/documents/${id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          strategy: chunkStrategy,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap
        })
      })
      
      if (res.ok) {
        setShowChunkConfig(false)
        setChunkPage(1)
        setChunkSearch("")
        await fetchDatasetData()
      } else {
        const errData = await res.json()
        alert(`Failed to generate chunks: ${errData.detail}`)
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while generating chunks.")
    } finally {
      setIsGeneratingChunks(false)
    }
  }

  const handleDeleteChunks = async () => {
    if (!confirm("Are you sure you want to delete all chunks?")) return
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}/chunks`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setChunks([])
        setChunkPage(1)
        await fetchDatasetData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) return
    try {
      await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      router.push("/datasets")
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[500px]"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  if (!dataset) return null

  return (
    <div className="max-w-[1200px] mx-auto pt-4 pb-12">
      
      {/* Header Section */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 w-10 h-10 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-none">{dataset.original_filename}</h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                ['failed', 'error'].includes(dataset.processing_status) ? 'bg-red-50 text-red-700 border border-red-200' :
                dataset.processing_status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {dataset.processing_status}
              </span>
            </div>
            
            {/* Inline Metadata Row */}
            <div className="flex items-center gap-2 mt-2.5 text-xs text-gray-500 font-medium">
              <span className="uppercase">{dataset.file_type}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{(dataset.file_size / 1024).toFixed(1)} KB</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {new Date(dataset.created_at).toLocaleDateString()}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-gray-400" /> {chunkStats?.total_chunks || 0} Chunks</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-gray-400" /> {embeddingCount} Embeddings</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 px-3 text-gray-600 hover:text-gray-900 text-xs font-medium border-gray-200 shadow-sm">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download
          </Button>
          <Button variant="outline" onClick={handleDelete} className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium border-red-200 shadow-sm">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
          </Button>
          <Button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reprocess
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* Compact Tab Navigation */}
        <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-transparent p-0 h-10 mb-6 flex gap-4">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 rounded-none px-1 h-10 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="chunks" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 rounded-none px-1 h-10 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Chunks
          </TabsTrigger>
          <TabsTrigger value="embeddings" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 rounded-none px-1 h-10 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Embeddings
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 rounded-none px-1 h-10 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="w-full">
          
          <TabsContent value="overview" className="mt-0 outline-none space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Chunks</span>
                  <Database className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{chunkStats?.total_chunks || 0}</div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Embeddings</span>
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{embeddingCount}</div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Tokens</span>
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{chunkStats?.avg_tokens || 0}</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-semibold text-gray-900 capitalize">{dataset.processing_status}</div>
              </div>
            </div>

            {/* Properties Section */}
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Properties</h3>
              </div>
              <div className="p-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">Dataset ID</dt>
                    <dd className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">{dataset.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">File Type</dt>
                    <dd className="text-sm font-medium text-gray-900 uppercase">{dataset.file_type}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">File Size</dt>
                    <dd className="text-sm font-medium text-gray-900 tabular-nums">{(dataset.file_size / 1024).toFixed(2)} KB</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">Created At</dt>
                    <dd className="text-sm font-medium text-gray-900 tabular-nums">{new Date(dataset.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">Updated At</dt>
                    <dd className="text-sm font-medium text-gray-900 tabular-nums">{new Date(dataset.updated_at || dataset.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">Processing Status</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        ['failed', 'error'].includes(dataset.processing_status) ? 'bg-red-500' :
                        dataset.processing_status === 'pending' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}></span>
                      {dataset.processing_status}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Activity Section Placeholder */}
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-4 flex flex-col items-center justify-center text-center py-16">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No recent activity</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Actions performed on this dataset, such as chunking and embedding, will appear here.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chunks" className="mt-0 outline-none">
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="border-b border-gray-200 bg-white px-5 py-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Document Chunks</h3>
                {chunkStats?.total_chunks > 0 && !showChunkConfig && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                      <Input 
                        placeholder="Search chunks..." 
                        className="h-8 pl-8 text-xs w-[200px]"
                        value={chunkSearch}
                        onChange={(e) => setChunkSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setChunkPage(1)
                            fetchChunks(1, chunkSearch)
                          }
                        }}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowChunkConfig(true)} className="h-8 text-xs font-medium">
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Re-Chunk
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeleteChunks} className="h-8 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete All
                    </Button>
                  </div>
                )}
              </div>
              
              {showChunkConfig ? (
                <div className="flex-1 p-8 bg-slate-50 flex items-center justify-center">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-lg overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                      <h4 className="text-sm font-medium text-gray-900">Chunk Generation Configuration</h4>
                      <p className="text-xs text-gray-500 mt-1">Configure how your document should be split into manageable segments.</p>
                    </div>
                    <div className="p-6 space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Chunking Strategy</Label>
                        <Select value={chunkStrategy} onValueChange={(val) => val && setChunkStrategy(val)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                            <SelectItem value="fixed">Fixed Size</SelectItem>
                            <SelectItem value="recursive">Recursive Character (Recommended)</SelectItem>
                            <SelectItem value="semantic">Semantic Similarity</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-gray-500">Recursive preserves paragraph boundaries. Semantic keeps related concepts together.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Chunk Size (Characters)</Label>
                          <Input 
                            type="number" 
                            className="h-9 text-sm" 
                            value={chunkSize}
                            onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
                            min={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Chunk Overlap</Label>
                          <Input 
                            type="number" 
                            className="h-9 text-sm" 
                            value={chunkOverlap}
                            onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 200)}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-end gap-2">
                      <Button variant="ghost" className="h-8 text-xs font-medium" onClick={() => setShowChunkConfig(false)}>Cancel</Button>
                      <Button 
                        className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm"
                        disabled={isGeneratingChunks}
                        onClick={() => handleGenerateChunks(chunkStats?.total_chunks > 0)}
                      >
                        {isGeneratingChunks && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        {chunkStats?.total_chunks > 0 ? "Regenerate Chunks" : "Generate Chunks"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : chunkStats?.total_chunks > 0 ? (
                <div className="flex-1 flex flex-col">
                  {isFetchingChunks ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-5 py-3 font-medium">Index</th>
                              <th className="px-5 py-3 font-medium">Preview</th>
                              <th className="px-5 py-3 font-medium">Tokens</th>
                              <th className="px-5 py-3 font-medium">Page</th>
                              <th className="px-5 py-3 font-medium">Strategy</th>
                              <th className="px-5 py-3 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunks.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-gray-500 text-sm">
                                  No chunks found matching your search.
                                </td>
                              </tr>
                            ) : chunks.map((chunk, idx) => (
                              <tr key={chunk._id || chunk.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 font-mono text-xs text-gray-500">{chunk.chunk_index}</td>
                                <td className="px-5 py-3 text-gray-900 max-w-[300px] truncate">
                                  {chunk.content.substring(0, 60)}...
                                </td>
                                <td className="px-5 py-3 text-gray-600 tabular-nums">{chunk.token_count}</td>
                                <td className="px-5 py-3 text-gray-600 tabular-nums">{chunk.page_number}</td>
                                <td className="px-5 py-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-100 text-slate-700">
                                    {chunk.chunk_strategy}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setSelectedChunk(chunk)}>
                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination Control */}
                      <div className="mt-auto border-t border-gray-200 px-5 py-3 flex items-center justify-between bg-white">
                        <span className="text-xs text-gray-500">
                          Showing page <span className="font-medium text-gray-900">{chunkPage}</span> of <span className="font-medium text-gray-900">{chunkTotalPages}</span>
                        </span>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs" 
                            disabled={chunkPage <= 1}
                            onClick={() => setChunkPage(p => p - 1)}
                          >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs" 
                            disabled={chunkPage >= chunkTotalPages}
                            onClick={() => setChunkPage(p => p + 1)}
                          >
                            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mb-5">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">No chunks generated yet</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">
                    Partition this document into manageable chunks to prepare it for embedding and semantic search.
                  </p>
                  <Button onClick={() => setShowChunkConfig(true)} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
                    <Plus className="w-4 h-4 mr-1.5" /> Generate Chunks
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="embeddings" className="mt-0 outline-none">
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="border-b border-gray-200 bg-white px-5 py-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Vector Embeddings</h3>
              </div>
              
              {embeddingCount > 0 ? (
                <div className="flex-1 p-5 bg-slate-50 flex items-center justify-center">
                  {/* Placeholder for Data Table */}
                  <span className="text-sm text-gray-500">Data table component will be rendered here.</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mb-5">
                    <Activity className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">No embeddings generated yet</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">
                    Generate vector embeddings to enable similarity search and AI capabilities across this document.
                  </p>
                  <Button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
                    <Plus className="w-4 h-4 mr-1.5" /> Generate Embeddings
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0 outline-none">
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden max-w-2xl">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                <h3 className="text-sm font-medium text-gray-900">General Settings</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2 text-sm">
                  <Label className="text-gray-700 font-medium">Dataset Name</Label>
                  <Input 
                    type="text" 
                    defaultValue={dataset.original_filename}
                    className="h-9 text-sm max-w-md"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">This name will be displayed in searches and dataset listings.</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 shadow-sm">Save Changes</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Chunk Viewer Drawer */}
      {selectedChunk && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end transition-opacity">
          <div className="w-[550px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Chunk Details</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100" onClick={() => setSelectedChunk(null)}>
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 font-medium mb-1">Chunk Index</div>
                  <div className="text-sm font-mono text-gray-900">{selectedChunk.chunk_index}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 font-medium mb-1">Page Number</div>
                  <div className="text-sm font-mono text-gray-900">{selectedChunk.page_number}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 font-medium mb-1">Token Count</div>
                  <div className="text-sm font-mono text-gray-900">{selectedChunk.token_count}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 font-medium mb-1">Strategy</div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{selectedChunk.chunk_strategy}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-900">Content Preview</h4>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[500px] overflow-y-auto">
                  {selectedChunk.content}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end">
              <Button onClick={() => setSelectedChunk(null)} className="h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium shadow-sm">
                Close Viewer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
