"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Send, Plus, MessageSquare, BookOpen, Loader2, FileText, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
  transparency?: any
}

interface ChatSession {
  id: string
  created_at: string
  updated_at: string
  title?: string
}

export default function ChatPage() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeSources, setActiveSources] = useState<any[]>([])
  
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("all")
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  
  const [explorerContexts, setExplorerContexts] = useState<any[] | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    if (token) {
      fetchSessions()
      fetchDatasets()
    }
  }, [token])
  
  useEffect(() => {
    if (selectedDatasetId && selectedDatasetId !== "all") {
      fetchSuggestions(selectedDatasetId)
    } else {
      setSuggestedQuestions([])
    }
  }, [selectedDatasetId])

  const fetchDatasets = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/documents?limit=100", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const d = await res.json()
        setDatasets(d.data || [])
      }
    } catch (err) { console.error(err) }
  }
  
  const fetchSuggestions = async (datasetId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chat/suggestions?dataset_id=${datasetId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestedQuestions(data.suggestions || [])
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (activeSession && token) {
      fetchSessionHistory(activeSession)
    } else {
      setMessages([])
      setActiveSources([])
    }
  }, [activeSession, token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/chat/history", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setSessions(await res.json())
      }
    } catch (err) {
      console.error(err)
    }
  }

  const renameSession = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null)
      return
    }
    try {
      const res = await fetch(`http://localhost:8000/api/chat/sessions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle })
      })
      if (res.ok) {
        setEditingSessionId(null)
        fetchSessions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSessionHistory = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chat/history/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        const lastAsst = [...(data.messages || [])].reverse().find(m => m.role === 'assistant')
        if (lastAsst?.sources) setActiveSources(lastAsst.sources)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleNewChat = () => {
    setActiveSession(null)
    setMessages([])
    setActiveSources([])
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: userMessage,
          dataset_id: selectedDatasetId === "all" ? null : selectedDatasetId,
          conversation_id: activeSession 
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.answer,
          sources: data.citations,
          transparency: data.transparency
        }])
        setActiveSources(data.citations || [])
        
        if (!activeSession && data.conversation_id) {
          setActiveSession(data.conversation_id)
          fetchSessions()
        }
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 sm:-m-8 bg-card overflow-hidden">
      
      {/* 1. Left Sidebar: Sessions (240px) */}
      <div className="w-[240px] border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
        <div className="p-3 border-b border-border">
          <Button 
            variant="outline"
            onClick={handleNewChat}
            className="w-full text-xs font-medium h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> New Research Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-[11px] text-center text-muted-foreground mt-4">No recent chats</p>
          ) : (
            sessions.map((s) => (
              editingSessionId === s.id ? (
                <div key={s.id} className="w-full flex items-center gap-1 px-2.5 py-2 rounded text-xs bg-muted border border-border">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") renameSession(s.id); if (e.key === "Escape") setEditingSessionId(null) }}
                    className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:border-blue-400"
                  />
                  <button onClick={() => renameSession(s.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingSessionId(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  className={`group w-full text-left px-2.5 py-2 rounded text-xs transition-colors flex items-center gap-2.5 ${
                    activeSession === s.id 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">
                    {s.title || `Chat ${new Date(s.created_at).toLocaleDateString()}`}
                  </span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSessionId(s.id)
                      setEditTitle(s.title || `Chat ${new Date(s.created_at).toLocaleDateString()}`)
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-black/10 p-1 rounded transition-opacity"
                  >
                    <Pencil className="w-3 h-3" />
                  </div>
                </button>
              )
            ))
          )}
        </div>
        <div className="p-3 border-t border-border bg-muted/30">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Dataset Scope</label>
          <select 
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="w-full bg-card border border-border rounded text-xs p-1.5 text-foreground focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Datasets</option>
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.filename}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Center: Main Chat */}
      <div className="flex-1 flex flex-col bg-card relative">
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-card">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto text-center">
              <BookOpen className="w-8 h-8 mb-3 opacity-20" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Research Assistant</h2>
              <p className="text-xs leading-relaxed mb-6">Ask questions based on your embedded datasets. Responses will cite specific retrieved chunks.</p>
              
              {suggestedQuestions.length > 0 && (
                <div className="w-full max-w-sm mt-4 text-left">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">Suggested Questions</p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((sq, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setInput(sq)}
                        className="w-full text-left p-2.5 rounded border border-border bg-card hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-xs text-secondary-foreground transition-all flex items-center justify-between group"
                      >
                        <span className="truncate pr-2">{sq}</span>
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto w-full pb-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-card text-foreground rounded-tl-none border border-border'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Sources Grouped By Document</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {Object.entries(
                            m.sources.reduce((acc, src, i) => {
                              const doc = src.document_name || "Unknown Document";
                              if (!acc[doc]) acc[doc] = [];
                              acc[doc].push({...src, oIdx: i});
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([docName, docSources], dIdx) => (
                            <div key={dIdx} className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-foreground/80">{docName}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {(docSources as any[]).map((src: any) => (
                                  <button
                                    key={src.oIdx}
                                    onClick={() => setActiveSources(m.sources || [])}
                                    className="text-[10px] flex items-center gap-1.5 bg-background/50 hover:bg-background border border-border px-2 py-1 rounded transition-colors text-secondary-foreground"
                                  >
                                    <span className="font-medium">[{src.oIdx + 1}] Pg {src.page_number || "?"}</span>
                                    {src.confidence && (
                                      <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded-sm font-semibold border border-green-200">
                                        {src.confidence}%
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.transparency && (
                      <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between text-[9px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span>Generated in {m.transparency.generation_time_ms}ms</span>
                          <span>Retrieved in {m.transparency.retrieval_time_ms}ms</span>
                          <span>Context: {m.transparency.context_tokens} tokens</span>
                        </div>
                        {m.transparency.all_contexts && (
                          <button 
                            onClick={() => setExplorerContexts(m.transparency.all_contexts)}
                            className="hover:text-blue-600 transition-colors font-medium underline underline-offset-2"
                          >
                            Explore {m.transparency.retrieved_chunks_count} retrieved chunks
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-3 bg-card border border-border rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Synthesizing answer...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto relative flex flex-col border border-border rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-card">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your datasets..."
              className="w-full bg-transparent p-3 min-h-[60px] max-h-[200px] text-sm resize-none focus:outline-none text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <div className="flex justify-between items-center px-2 pb-2">
              <span className="text-[10px] text-muted-foreground px-1">Shift + Enter for new line</span>
              <Button 
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-7 w-7 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Right Sidebar: Context Panel (320px) */}
      <div className="w-[320px] border-l border-border bg-card hidden xl:flex flex-col shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between bg-card">
          <span className="text-foreground font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Active Context
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-card">
          {activeSources.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground mt-8">
              Ask a question to see retrieved chunks here.
            </div>
          ) : (
            activeSources.map((source, idx) => (
              <div key={idx} className="bg-card rounded border border-border shadow-sm text-xs overflow-hidden">
                <div className="bg-muted border-b border-border px-2.5 py-1.5 flex items-center justify-between">
                  <span className="font-medium text-secondary-foreground truncate w-3/4">
                    {source.document_name || "Unknown Document"}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    Pg:{source.page_number ?? "?"}
                  </span>
                </div>
                <div className="p-2.5 text-secondary-foreground leading-relaxed max-h-40 overflow-y-auto">
                  {source.evidence_highlight ? (
                    (() => {
                      const text = source.content || "";
                      const h = source.evidence_highlight;
                      const idx = text.toLowerCase().indexOf(h.toLowerCase());
                      if (idx === -1) return text;
                      return (
                        <>
                          {text.substring(0, idx)}
                          <mark className="bg-yellow-200 text-black px-0.5 rounded shadow-sm">{text.substring(idx, idx + h.length)}</mark>
                          {text.substring(idx + h.length)}
                        </>
                      )
                    })()
                  ) : source.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Source Explorer Modal */}
      {explorerContexts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
          <div className="bg-card w-full max-w-4xl max-h-[85vh] rounded-xl border border-border shadow-lg flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Source Explorer <span className="text-muted-foreground font-normal">({explorerContexts.length} total chunks retrieved)</span>
              </h2>
              <button onClick={() => setExplorerContexts(null)} className="text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded border border-border bg-background">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {explorerContexts.map((ctx: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border border-border bg-background">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-foreground text-sm">{ctx.document_name || "Unknown Document"}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">Page {ctx.page_number}</span>
                    </div>
                    {ctx.similarity_score !== undefined && (
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        Match: {(ctx.similarity_score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary-foreground leading-relaxed">{ctx.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
