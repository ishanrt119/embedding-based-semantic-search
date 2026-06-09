"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Search, SlidersHorizontal, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SearchResult {
  id: string
  score: number
  content: string
  hybrid_score?: number
  metadata?: {
    document_id: string
    page_number?: number
    chunk_index?: number
  }
}

export default function SearchPage() {
  const { token } = useAuth()
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState("hybrid")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

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
        body: JSON.stringify({ query, top_k: 10, search_type: searchMode })
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
            <div className="space-y-2 text-sm">
              {['hybrid', 'semantic', 'keyword'].map((mode) => (
                <label key={mode} className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="searchMode" 
                    value={mode}
                    checked={searchMode === mode}
                    onChange={(e) => setSearchMode(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                  />
                  <span className="text-secondary-foreground capitalize group-hover:text-foreground transition-colors">{mode}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Search & Results Area */}
      <div className="flex-1 flex flex-col relative border-r border-border bg-card">
        {/* Sticky Search Bar */}
        <div className="p-4 border-b border-border bg-card z-10">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground z-10" />
            <Input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across datasets..." 
              className="w-full pl-9 pr-24 py-2 bg-card h-10 shadow-sm"
            />
            <Button 
              type="submit"
              size="sm"
              disabled={isSearching || !query.trim()}
              className="absolute right-1.5 h-7 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </Button>
          </form>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 bg-card">
          {!hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Search className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm font-medium text-foreground mb-1">Search your knowledge base</p>
              <p className="text-xs text-center">Type a query above to find relevant information.</p>
            </div>
          ) : isSearching ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm font-medium text-foreground mb-1">No results found</p>
              <p className="text-xs">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              <p className="text-xs text-muted-foreground font-medium mb-4 px-1">{results.length} results found</p>
              {results.map((result, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedResult(result)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer text-sm ${
                    selectedResult?.id === result.id 
                      ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500' 
                      : 'border-border bg-card hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-medium text-secondary-foreground">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      {result.metadata?.document_id?.slice(0,8) || "Unknown Dataset"}
                    </div>
                    <span className="text-[10px] font-mono bg-card text-secondary-foreground px-1.5 py-0.5 rounded border border-border">
                      {(result.hybrid_score || result.score || 0).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed line-clamp-2">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Metadata Panel (320px) */}
      <div className={`w-[320px] bg-card flex flex-col shrink-0 overflow-y-auto transition-transform ${selectedResult ? 'block' : 'hidden xl:block opacity-30 pointer-events-none'}`}>
        <div className="p-4 border-b border-border bg-card">
          <h3 className="font-semibold text-foreground text-sm">Result Details</h3>
        </div>
        
        {selectedResult ? (
          <div className="p-5 space-y-6">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Source Text</Label>
              <div className="bg-muted p-3 rounded border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {selectedResult.content}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Metadata</Label>
              <div className="bg-card p-3 rounded border border-border text-xs space-y-2 shadow-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Document ID</span>
                  <span className="font-mono text-foreground">{selectedResult.metadata?.document_id?.slice(0,8) || "N/A"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Chunk Index</span>
                  <span className="text-foreground font-medium">{selectedResult.metadata?.chunk_index ?? "N/A"}</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Open Document
            </Button>
          </div>
        ) : (
          <div className="p-5 text-center text-sm text-muted-foreground mt-10">
            Select a result to view details
          </div>
        )}
      </div>
    </div>
  )
}
