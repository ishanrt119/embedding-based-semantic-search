"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Loader2, Database, Shield, Zap, Lock, HardDrive, FileText, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Login failed")
      }

      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      })
      
      if (!meRes.ok) throw new Error("Failed to fetch profile")
      
      const userData = await meRes.json()
      login(data.access_token, userData)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* Left: Product Branding & Features */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#F8FAFC] border-r border-gray-200 p-12 justify-between relative overflow-hidden">
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <Link href="/" className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">A</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">DocIntel</span>
          </Link>

          <div className="max-w-lg space-y-8 my-auto py-12">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                Find answers across thousands of documents in seconds.
              </h1>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Transform static files into searchable knowledge with semantic search, intelligent retrieval, and citation-aware conversations.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <Zap className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 text-sm">Semantic Search</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Find information based on meaning, not exact keywords.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <Database className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 text-sm">Knowledge Retrieval</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Access insights across massive document collections instantly.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <FileText className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 text-sm">Source Citations</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Trace every answer securely back to its original document.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <Activity className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 text-sm">Rich Analytics</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Understand platform usage and strict search performance metrics.</p>
              </div>
            </div>

            {/* Metrics Highlights */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                <HardDrive className="w-3 h-3" /> FAISS Vector Indexing
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                Hybrid Search Architecture
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-500 flex items-center justify-between mt-auto">
            <span>© 2026 DocIntel Search Inc.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative bg-white">
        
        <div className="w-full max-w-[450px] mx-auto">
          
          {/* Mobile Header */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-10 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">A</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">DocIntel</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-2">Sign in to your DocIntel enterprise workspace.</p>
          </div>

          {error && (
            <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 flex items-start gap-2">
              <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">!</div>
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-10"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 w-4 h-4" />
                <Label htmlFor="remember" className="font-normal text-gray-600">Remember me for 30 days</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-2 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>

          <p className="text-sm text-center text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
              Create an account
            </Link>
          </p>

          {/* Trust Indicators */}
          <div className="mt-12 flex items-center justify-center gap-6 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Auth</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Encrypted Storage</span>
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Enterprise Search</span>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400">Built with ❤️ by Ishan Toraskar</p>
          </div>

        </div>
      </div>

    </div>
  )
}
