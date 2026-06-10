"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { BrainCircuit, FileText, Scale, AlertTriangle, Loader2, Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function IntelligencePage() {
  const { token } = useAuth()
  const [datasets, setDatasets] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"compare" | "report" | "contradict">("compare")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Tab 1: Compare State
  const [compareDocA, setCompareDocA] = useState("")
  const [compareDocB, setCompareDocB] = useState("")
  const [compareData, setCompareData] = useState<any>(null)

  // Tab 2: Report State
  const [reportDocs, setReportDocs] = useState<string[]>([])
  const [reportType, setReportType] = useState("Research Report")
  const [reportTopic, setReportTopic] = useState("")
  const [reportMarkdown, setReportMarkdown] = useState("")

  // Tab 3: Contradictions State
  const [contraDocs, setContraDocs] = useState<string[]>([])
  const [contraTopic, setContraTopic] = useState("")
  const [contraData, setContraData] = useState<any>(null)

  useEffect(() => {
    if (token) fetchDatasets()
  }, [token])

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents?limit=100`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const d = await res.json()
        setDatasets(d.data || [])
      }
    } catch (err) { console.error(err) }
  }

  const handleCompare = async () => {
    if (!compareDocA || !compareDocB || compareDocA === compareDocB) {
      setError("Please select two distinct documents to compare.")
      return
    }
    setIsLoading(true)
    setError("")
    setCompareData(null)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/intelligence/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ document_ids: [compareDocA, compareDocB] })
      })
      if (res.ok) {
        setCompareData(await res.json())
      } else {
        const d = await res.json()
        setError(d.detail || "Failed to compare documents.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReport = async () => {
    if (reportDocs.length === 0) {
      setError("Please select at least one document.")
      return
    }
    setIsLoading(true)
    setError("")
    setReportMarkdown("")
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/intelligence/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          report_type: reportType, 
          document_ids: reportDocs, 
          topic: reportTopic,
          export_format: "markdown"
        })
      })
      if (res.ok) {
        const d = await res.json()
        setReportMarkdown(d.markdown)
      } else {
        const d = await res.json()
        setError(d.detail || "Failed to generate report.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleExport = async (format: string) => {
    if (reportDocs.length === 0 || !reportTopic.trim() || !reportMarkdown) return;
    setIsLoading(true)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/intelligence/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          report_type: reportType, 
          document_ids: reportDocs, 
          topic: reportTopic,
          export_format: format
        })
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContradictions = async () => {
    if (contraDocs.length < 2 || !contraTopic.trim()) {
      setError("Please select at least two documents and enter a topic.")
      return
    }
    setIsLoading(true)
    setError("")
    setContraData(null)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/intelligence/contradictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ topic: contraTopic, document_ids: contraDocs })
      })
      if (res.ok) {
        setContraData(await res.json())
      } else {
        const d = await res.json()
        setError(d.detail || "Failed to find contradictions.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const toggleSelection = (id: string, list: string[], setList: any) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id))
    } else {
      setList([...list, id])
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 sm:-m-8 bg-card overflow-hidden">
      
      {/* 1. Left Sidebar: Tabs (240px) */}
      <div className="w-[240px] border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" /> Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Multi-document reasoning</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={() => { setActiveTab("compare"); setError(""); }}
            className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2.5 ${
              activeTab === "compare" ? 'bg-blue-50 text-blue-600 font-medium' : 'text-secondary-foreground hover:bg-muted'
            }`}
          >
            <Scale className="w-4 h-4" /> Compare Documents
          </button>
          <button
            onClick={() => { setActiveTab("report"); setError(""); }}
            className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2.5 ${
              activeTab === "report" ? 'bg-blue-50 text-blue-600 font-medium' : 'text-secondary-foreground hover:bg-muted'
            }`}
          >
            <FileText className="w-4 h-4" /> Generate Report
          </button>
          <button
            onClick={() => { setActiveTab("contradict"); setError(""); }}
            className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2.5 ${
              activeTab === "contradict" ? 'bg-blue-50 text-blue-600 font-medium' : 'text-secondary-foreground hover:bg-muted'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Find Contradictions
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/10 relative">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* COMPARE TAB */}
          {activeTab === "compare" && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-foreground">Document Comparison</h1>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document A</label>
                  <select 
                    value={compareDocA}
                    onChange={(e) => setCompareDocA(e.target.value)}
                    className="w-full bg-card border border-border rounded text-sm p-2 text-foreground focus:ring-1 focus:outline-none"
                  >
                    <option value="">Select Dataset...</option>
                    {datasets.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document B</label>
                  <select 
                    value={compareDocB}
                    onChange={(e) => setCompareDocB(e.target.value)}
                    className="w-full bg-card border border-border rounded text-sm p-2 text-foreground focus:ring-1 focus:outline-none"
                  >
                    <option value="">Select Dataset...</option>
                    {datasets.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={handleCompare} disabled={isLoading} className="w-full sm:w-auto text-xs px-6">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scale className="w-4 h-4 mr-2" />}
                Run Comparison Analysis
              </Button>

              {compareData && (
                <div className="bg-card border border-border rounded-lg p-5 space-y-6 mt-6 shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Shared Topics & Similarities</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                      {compareData.similarities?.map((s: string, i: number) => <li key={i} className="text-sm text-secondary-foreground">{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Key Differences</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                      {compareData.differences?.map((d: string, i: number) => <li key={i} className="text-sm text-secondary-foreground">{d}</li>)}
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Executive Summary</h3>
                    <p className="text-sm leading-relaxed text-foreground">{compareData.summary}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REPORT TAB */}
          {activeTab === "report" && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-foreground flex items-center justify-between">
                Report Generator
                {reportMarkdown && (
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="text-xs" disabled={isLoading}>
                      <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                    </Button>
                    <Button onClick={() => handleExport('docx')} variant="outline" size="sm" className="text-xs" disabled={isLoading}>
                      <Download className="w-3.5 h-3.5 mr-1.5" /> DOCX
                    </Button>
                  </div>
                )}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-lg p-5">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">1. Select Target Documents</label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded p-2">
                    {datasets.map(d => (
                      <label key={d.id} className="flex items-center gap-2 text-sm text-secondary-foreground cursor-pointer p-1 hover:bg-muted/50 rounded">
                        <input type="checkbox" checked={reportDocs.includes(d.id)} onChange={() => toggleSelection(d.id, reportDocs, setReportDocs)} />
                        {d.filename}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">2. Report Type</label>
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full bg-muted border border-border rounded text-sm p-2 text-foreground focus:ring-1 focus:outline-none">
                      <option>Research Report</option>
                      <option>Policy Summary</option>
                      <option>Executive Brief</option>
                      <option>Meeting Summary</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">3. Focal Topic / Scope</label>
                    <input 
                      type="text" 
                      placeholder="Optional: Enter a topic to focus the report" 
                      value={reportTopic} 
                      onChange={e => setReportTopic(e.target.value)}
                      className="w-full bg-muted border border-border rounded text-sm p-2 focus:ring-1 focus:outline-none"
                    />
                  </div>
                  <Button onClick={handleReport} disabled={isLoading} className="w-full text-xs">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    Generate Comprehensive Report
                  </Button>
                </div>
              </div>
              
              {reportMarkdown && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm overflow-hidden prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {reportMarkdown}
                </div>
              )}
            </div>
          )}

          {/* CONTRADICTIONS TAB */}
          {activeTab === "contradict" && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-foreground">Contradiction Finder</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-lg p-5">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">1. Select Documents to Audit</label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded p-2">
                    {datasets.map(d => (
                      <label key={d.id} className="flex items-center gap-2 text-sm text-secondary-foreground cursor-pointer p-1 hover:bg-muted/50 rounded">
                        <input type="checkbox" checked={contraDocs.includes(d.id)} onChange={() => toggleSelection(d.id, contraDocs, setContraDocs)} />
                        {d.filename}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">2. Subject / Topic to Audit</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Remote work days, budget allocations..." 
                      value={contraTopic} 
                      onChange={e => setContraTopic(e.target.value)}
                      className="w-full bg-muted border border-border rounded text-sm p-2 focus:ring-1 focus:outline-none"
                    />
                  </div>
                  <Button onClick={handleContradictions} disabled={isLoading} className="w-full text-xs" variant="destructive">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Scan for Contradictions
                  </Button>
                </div>
              </div>

              {contraData && (
                <div className="space-y-4 mt-6">
                  {contraData.contradictions?.length === 0 ? (
                    <div className="p-6 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center font-medium">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      No contradictions found regarding "{contraData.topic}".
                    </div>
                  ) : (
                    contraData.contradictions?.map((c: any, i: number) => (
                      <div key={i} className="bg-card border-l-4 border-l-orange-500 border-border rounded-r-lg p-4 shadow-sm">
                        <p className="text-sm font-medium text-foreground mb-3">{c.description}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="font-semibold text-muted-foreground">Sources flagged:</span>
                          <span className="text-secondary-foreground">{c.sources?.join(", ")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
