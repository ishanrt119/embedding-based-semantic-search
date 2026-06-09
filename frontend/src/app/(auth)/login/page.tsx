"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Loader2, Database, Shield, Zap } from "lucide-react"
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
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Login failed")
      }

      // Fetch user data
      const meRes = await fetch("http://localhost:8000/api/auth/me", {
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
      
      {/* Left: Product Branding */}
      <div className="hidden lg:flex flex-col flex-1 bg-slate-50 border-r border-gray-200 p-12 justify-between">
        <Link href="/" className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">A</div>
          <span className="font-semibold text-lg tracking-tight text-gray-900">Aether</span>
        </Link>

        <div className="max-w-md space-y-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            Enterprise document intelligence, simplified.
          </h1>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Automated Indexing</h3>
                <p className="text-sm text-gray-500 mt-1">Upload files and we handle the chunking, embedding, and vector storage.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Hybrid Retrieval</h3>
                <p className="text-sm text-gray-500 mt-1">Combine semantic similarity with keyword matching for highest accuracy.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Isolation</h3>
                <p className="text-sm text-gray-500 mt-1">Enterprise-grade multi-tenant architecture keeps your data strictly isolated.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          © 2026 Aether Search Inc.
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-sm mx-auto space-y-8">
          
          {/* Mobile Header */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">A</div>
            <span className="font-semibold text-lg tracking-tight text-gray-900">Aether</span>
          </Link>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
            <p className="text-sm text-gray-500 mt-2">Welcome back to Aether workspace.</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email"
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
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
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
              Sign up
            </Link>
          </p>

        </div>
      </div>

    </div>
  )
}
