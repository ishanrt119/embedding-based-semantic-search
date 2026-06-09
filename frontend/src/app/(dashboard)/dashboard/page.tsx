"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FileText, Database, Activity, Loader2, Plus, ArrowRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState<any>(null)
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("http://localhost:8000/api/auth/me/dashboard", { headers: { "Authorization": `Bearer ${token}` } }),
      fetch("http://localhost:8000/api/documents", { headers: { "Authorization": `Bearer ${token}` } })
    ])
    .then(async ([statsRes, docsRes]) => {
      if (statsRes.ok) setStats(await statsRes.json())
      if (docsRes.ok) {
        const docsData = await docsRes.json()
        setRecentDocs(docsData.data?.slice(0, 5) || [])
      }
    })
    .catch(err => console.error(err))
    .finally(() => setIsLoading(false))
  }, [token])

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/datasets/new")} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 h-9 px-3">
            <Plus className="w-4 h-4" /> New Dataset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: stats?.documents ?? 0, icon: FileText },
          { label: "Generated Chunks", value: stats?.chunks ?? 0, icon: Database },
          { label: "Vector Embeddings", value: stats?.embeddings ?? 0, icon: Database },
          { label: "Total Searches", value: stats?.searches ?? 0, icon: Activity }
        ].map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Datasets Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Datasets</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/datasets")} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <Card className="shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted border-b border-border">
                <TableRow>
                  <TableHead className="font-medium text-muted-foreground">Dataset</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="font-medium text-muted-foreground text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100">
                {recentDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No datasets found. <a href="/datasets/new" className="text-blue-600 hover:underline">Upload your first document.</a>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDocs.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted transition-colors cursor-pointer" onClick={() => router.push(`/datasets/${doc.id}`)}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {doc.filename}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            ['failed', 'error'].includes(doc.processing_status) ? 'bg-red-600' :
                            doc.processing_status === 'pending' ? 'bg-amber-600' :
                            'bg-green-600'
                          }`}></div>
                          <span className="text-secondary-foreground capitalize text-xs">{doc.processing_status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs tabular-nums">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Processing Jobs / Activity */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Activity Log</h2>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              {recentDocs.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                <div className="space-y-4">
                  {recentDocs.map((doc, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="mt-0.5 shrink-0">
                        <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground leading-tight">
                          Processed <span className="font-medium">{doc.filename}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(doc.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
