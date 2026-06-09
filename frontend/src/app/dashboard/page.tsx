"use client"

import { useEffect, useState } from "react"
import { UploadCloud, File, Activity, Database, FileText, Loader2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

interface DashboardStats {
  documents: number
  chunks: number
  embeddings: number
  searches: number
}

interface RecentDocument {
  id: string
  filename: string
  file_type: string
  processing_status: string
  created_at: string
}

export default function Dashboard() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || !token) {
      router.push("/login")
      return
    }

    const fetchDashboardData = async () => {
      try {
        const statsRes = await fetch("http://localhost:8000/api/auth/me/dashboard", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (statsRes.ok) {
          setStats(await statsRes.json())
        }

        const docsRes = await fetch("http://localhost:8000/api/documents?limit=5", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          setRecentDocs(docsData.data)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, token, authLoading, router])

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 py-10 text-white">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.email}. Manage your private datasets and view analytics.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/documents")} className="bg-violet-600 hover:bg-violet-700 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          Manage Documents <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documents ?? "No Data"}</div>
            <p className="text-xs text-gray-500 mt-1">Uploaded securely</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Generated Chunks</CardTitle>
            <Database className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chunks ?? "No Data"}</div>
            <p className="text-xs text-gray-500 mt-1">Ready for embedding</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Vector Embeddings</CardTitle>
            <Database className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.embeddings ?? "No Data"}</div>
            <p className="text-xs text-gray-500 mt-1">Indexed safely</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Searches</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.searches ?? "No Data"}</div>
            <p className="text-xs text-emerald-500 mt-1">Historical queries</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Recent Datasets</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-900 text-gray-400 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No Data Available. Upload a document to get started.
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <File className="h-4 w-4 text-violet-400" />
                      {doc.filename}
                    </td>
                    <td className="px-6 py-4">{doc.file_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        ['failed', 'error'].includes(doc.processing_status) ? 'bg-red-500/20 text-red-300' :
                        doc.processing_status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {doc.processing_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
