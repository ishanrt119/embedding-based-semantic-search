"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Search, SlidersHorizontal, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchResult {
  chunk_id: string
  chunk_preview: string
  content: string
  document_id: string
  dataset_id: string
  page_number?: number
  similarity_score?: number
  raw_distance?: number
  bm25_score?: number
  hybrid_score?: number
  created_at: string
  document_name: string
}

export default function SearchPage() {
  const { token } = useAuth()
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState("semantic")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("all")

  useEffect(() => {
    if (!token) return
    const fetchDatasets = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/documents?limit=100", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setDatasets(data.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch datasets", err)
      }
    }
    fetchDatasets()
  }, [token])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    setSelectedResult(null)

    try {
      const res = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query, 
          top_k: 10,
          search_type: searchMode,
          dataset_id: selectedDatasetId === "all" ? null : selectedDatasetId
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        setResults(data.results || [])
      }
    } catch (err) {
      console.error("Search failed", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleClear = () => {
    setQuery("")
    setHasSearched(false)
    setResults([])
    setSelectedResult(null)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 sm:-m-8 bg-card overflow-hidden">
      
      {/* 1. Filters Sidebar (240px) */}
      <div className="w-[240px] border-r border-border bg-card p-5 hidden md:flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 text-foreground font-semibold text-sm">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Search Mode</Label>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="searchMode" 
                  value="semantic"
                  checked={searchMode === "semantic"}
                  onChange={(e) => setSearchMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                />
                <span className="text-secondary-foreground font-medium group-hover:text-foreground transition-colors">Semantic</span>
              </label>
              
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="searchMode" 
                  value="hybrid"
                  checked={searchMode === "hybrid"}
                  onChange={(e) => setSearchMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                />
                <span className="text-secondary-foreground font-medium group-hover:text-foreground transition-colors">Hybrid</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="searchMode" 
                  value="keyword"
                  checked={searchMode === "keyword"}
                  onChange={(e) => setSearchMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                />
                <span className="text-secondary-foreground font-medium group-hover:text-foreground transition-colors">Keyword</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Dataset</Label>
            <Select value={selectedDatasetId} onValueChange={(val) => setSelectedDatasetId(val || "all")}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="All Datasets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Datasets</SelectItem>
                {datasets.map((ds) => (
                  <SelectItem key={ds.id || ds._id} value={ds.id || ds._id}>
                    {ds.original_filename || ds.filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Main Search & Results Area */}
      <div className="flex-1 flex flex-col relative border-r border-border bg-card">
        {/* Sticky Search Bar */}
        <div className="p-4 border-b border-border bg-card z-10">
          <form onSubmit={handleSearch} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground z-10" />
              <Input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across your knowledge base..." 
                className="w-full pl-9 pr-10 py-2 bg-card h-10 shadow-sm"
              />
              {query && (
                <button type="button" onClick={handleClear} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                  <span className="sr-only">Clear</span>
                  <div className="w-4 h-4 flex items-center justify-center font-bold text-xs bg-muted rounded-full">×</div>
                </button>
              )}
            </div>
            <Button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shrink-0"
            >
              {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card">
          {!hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Search className="w-10 h-10 mb-4 opacity-20" />
              <p className="text-base font-medium text-foreground mb-1">Search Engine</p>
              <p className="text-sm max-w-sm text-center leading-relaxed">
                Enter a question or concept. Aether will find the most relevant information using semantic search, keyword search, or hybrid search.
              </p>
            </div>
          ) : isSearching ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                    <div className="h-4 bg-blue-50 rounded w-16"></div>
                  </div>
                  <div className="h-12 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-base font-medium text-foreground mb-1">No results found</p>
              <p className="text-sm">We couldn't find any documents matching that meaning.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-20 max-w-4xl mx-auto">
              <p className="text-sm text-muted-foreground font-medium mb-5 px-1">{results.length} results found for {searchMode} search</p>
              {results.map((result, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedResult(result)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer text-sm ${
                    selectedResult?.chunk_id === result.chunk_id 
                      ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500' 
                      : 'border-border bg-card hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 font-semibold text-secondary-foreground text-base">
                      <FileText className="w-4 h-4 text-blue-600" />
                      {result.document_name}
                    </div>
                    {searchMode === "semantic" && result.similarity_score !== undefined && (
                      <span className="text-[11px] font-mono font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200 shadow-sm" title={`Raw Distance: ${result.raw_distance}`}>
                        {(result.similarity_score * 100).toFixed(1)}% Match
                      </span>
                    )}
                    {searchMode === "keyword" && result.bm25_score !== undefined && (
                      <span className="text-[11px] font-mono font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200 shadow-sm">
                        Score: {result.bm25_score.toFixed(2)}
                      </span>
                    )}
                    {searchMode === "hybrid" && result.hybrid_score !== undefined && (
                      <span className="text-[11px] font-mono font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-md border border-purple-200 shadow-sm" title={`Semantic: ${(result.similarity_score! * 100).toFixed(1)}%, Keyword: ${result.bm25_score!.toFixed(2)}`}>
                        Hybrid: {result.hybrid_score.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {result.chunk_preview}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground font-medium bg-background px-3 py-1.5 rounded-md border border-border w-fit">
                    {result.page_number && <span className="flex items-center gap-1.5">📄 Page {result.page_number}</span>}
                    <span className="flex items-center gap-1.5">🕒 {new Date(result.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Metadata Panel (320px) */}
      <div className={`w-[320px] bg-card flex flex-col shrink-0 overflow-y-auto transition-transform border-l border-border ${selectedResult ? 'block' : 'hidden xl:block opacity-30 pointer-events-none bg-muted/50'}`}>
        <div className="p-4 border-b border-border bg-card">
          <h3 className="font-semibold text-foreground text-sm">Result Details</h3>
        </div>
        
        {selectedResult ? (
          <div className="p-5 space-y-6">
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 block">Full Source Content</Label>
              <div className="bg-white p-4 rounded-lg border border-border shadow-sm text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto font-serif">
                {selectedResult.content}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 block">Metadata Details</Label>
              <div className="bg-white p-4 rounded-lg border border-border text-sm space-y-3 shadow-sm">
                <div className="flex flex-col gap-1 pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Document Name</span>
                  <span className="font-semibold text-foreground truncate" title={selectedResult.document_name}>{selectedResult.document_name}</span>
                </div>
                <div className="flex flex-col gap-1 pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Document ID</span>
                  <span className="font-mono text-foreground text-xs bg-muted px-2 py-1 rounded w-fit">{selectedResult.document_id}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Page Number</span>
                  <span className="text-foreground font-bold">{selectedResult.page_number ?? "Unknown"}</span>
                </div>
                {selectedResult.similarity_score !== undefined && selectedResult.similarity_score > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Semantic Match</span>
                    <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {(selectedResult.similarity_score * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
                {selectedResult.bm25_score !== undefined && selectedResult.bm25_score > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Keyword Score</span>
                    <span className="text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {selectedResult.bm25_score.toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedResult.hybrid_score !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hybrid RRF Score</span>
                    <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {selectedResult.hybrid_score.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Open Document
            </Button>
          </div>
        ) : (
          <div className="p-5 flex flex-col items-center justify-center text-center text-sm text-muted-foreground mt-20 h-full">
            <FileText className="w-8 h-8 mb-3 opacity-20" />
            <p>Select a search result</p>
            <p className="text-xs mt-1">Full content and metadata will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
