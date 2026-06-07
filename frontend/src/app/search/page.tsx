"use client";

import { useState } from "react";
import { Search, Sparkles, SlidersHorizontal, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    // Mock API call delay
    setTimeout(() => {
      setResults([
        {
          id: "1",
          title: "Google Business Profile Optimization Guide",
          content: "Optimizing your Google Business Profile improves local search visibility significantly. Ensure your NAP (Name, Address, Phone) is consistent across all directories.",
          score: 0.92,
          keywordScore: 0.65,
          semanticScore: 0.98,
          page: 12
        },
        {
          id: "2",
          title: "Local SEO Strategies 2024",
          content: "To rank higher on Google Maps, businesses must actively manage reviews and upload high-quality photos weekly. Citation building remains crucial.",
          score: 0.88,
          keywordScore: 0.22,
          semanticScore: 0.95,
          page: 5
        }
      ]);
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-4 py-8">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 rounded-full mb-2">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold">Intelligent Search Engine</h1>
          <p className="text-muted-foreground max-w-2xl">
            Query your entire document repository using natural language. Our hybrid retrieval system combines the exact matching of BM25 with the semantic understanding of dense vectors.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-violet-400 transition-colors" />
            </div>
            <Input 
              type="text" 
              placeholder="e.g. How can I rank higher on Google Maps?" 
              className="pl-12 pr-24 py-6 text-lg rounded-2xl bg-white/5 border-white/10 focus-visible:ring-violet-500 glass-panel"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <Button type="submit" disabled={isSearching} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </form>

        <div className="w-full max-w-5xl mx-auto mt-8">
          <Tabs defaultValue="hybrid" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="glass-panel bg-transparent border border-white/10">
                <TabsTrigger value="hybrid" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">Hybrid (BM25 + Vector)</TabsTrigger>
                <TabsTrigger value="semantic" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">Semantic Only</TabsTrigger>
                <TabsTrigger value="keyword" className="data-[state=active]:bg-zinc-500/20">Keyword Only</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="glass-panel border-white/10">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              </Button>
            </div>
            
            <TabsContent value="hybrid" className="space-y-4 outline-none">
              {results.length > 0 ? results.map((result, idx) => (
                <Card key={idx} className="glass-panel border-white/10 hover:border-violet-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="h-4 w-4 text-violet-400" />
                          <h3 className="font-semibold text-lg">{result.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Page {result.page}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-2 py-1 rounded bg-violet-500/20 text-violet-300 text-xs font-mono font-medium">
                          Score: {(result.score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {/* Highlight the semantic match conceptually */}
                      {result.content.replace('Google Maps', '<mark class="bg-violet-500/30 text-white px-1 rounded">Google Maps</mark>')}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-white/10 flex gap-4 text-xs text-muted-foreground">
                      <span>BM25: {result.keywordScore.toFixed(2)}</span>
                      <span>Vector: {result.semanticScore.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                  Enter a query to see the hybrid search engine in action.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
