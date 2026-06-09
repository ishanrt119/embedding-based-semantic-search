"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Send, Plus, MessageSquare, BookOpen, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
}

interface ChatSession {
  id: string
  created_at: string
  updated_at: string
}

export default function ChatPage() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeSources, setActiveSources] = useState<any[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (token) fetchSessions()
  }, [token])

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
      const res = await fetch("http://localhost:8000/api/rag/history", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setSessions(await res.json())
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSessionHistory = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/rag/history/${id}`, {
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
      const res = await fetch("http://localhost:8000/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: userMessage,
          session_id: activeSession 
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.answer,
          sources: data.sources
        }])
        setActiveSources(data.sources || [])
        
        if (!activeSession && data.session_id) {
          setActiveSession(data.session_id)
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
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors flex items-center gap-2.5 ${
                  activeSession === s.id 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-secondary-foreground hover:bg-muted'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1">
                  Chat {new Date(s.created_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Center: Main Chat */}
      <div className="flex-1 flex flex-col bg-card relative">
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-card">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto text-center">
              <BookOpen className="w-8 h-8 mb-3 opacity-20" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Research Assistant</h2>
              <p className="text-xs leading-relaxed">Ask questions based on your embedded datasets. Responses will cite specific retrieved chunks.</p>
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
                      <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">References {m.sources.length} sources</span>
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
                    {source.metadata?.document_id?.slice(0,8) || "Unknown Dataset"}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    ID:{source.metadata?.chunk_index ?? "?"}
                  </span>
                </div>
                <div className="p-2.5 text-secondary-foreground leading-relaxed max-h-40 overflow-y-auto">
                  {source.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
