"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatPage() {
  type Message = { role: string; content: string; sources?: { title: string; page: number }[] };
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your AI assistant. I can answer questions based on the documents you've indexed. What would you like to know?", sources: [] }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input, sources: [] };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Mock RAG API call
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "Based on the retrieved documents, improving your Google Business Profile involves ensuring consistent NAP across directories, responding to reviews promptly, and frequently uploading high-quality photos.",
          sources: [
            { title: "Google Business Profile Optimization Guide", page: 12 },
            { title: "Local SEO Strategies 2024", page: 5 }
          ]
        }
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="border-b border-white/10 glass-panel px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-400" />
            RAG Assistant
          </h1>
          <p className="text-sm text-muted-foreground">Talk to your indexed documents</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Model:</span>
          <Select defaultValue="groq-llama3">
            <SelectTrigger className="w-[180px] h-8 text-xs bg-white/5 border-white/10">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groq-llama3">Groq (Llama 3 8B)</SelectItem>
              <SelectItem value="openai-gpt4">OpenAI (GPT-4o)</SelectItem>
              <SelectItem value="ollama-local">Local (Ollama)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-violet-600'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
              </div>
              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-tr-sm' : 'glass-panel rounded-tl-sm'}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.sources.map((source, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 cursor-pointer transition-colors">
                        <FileText className="h-3 w-3" />
                        <span>{source.title} (pg {source.page})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-violet-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="glass-panel p-4 rounded-2xl rounded-tl-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span>Searching documents & generating answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-white/10 glass-panel z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="pl-4 pr-12 py-6 rounded-xl bg-white/5 border-white/10 focus-visible:ring-violet-500 text-base"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 h-8 w-8 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
