"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FileText, Database, Settings, Activity, Trash2, Loader2, Calendar, HardDrive, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Document {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  processing_status: string
  created_at: string
}

export default function DatasetDetailsPage() {
  const { id } = useParams() as { id: string }
  const { token } = useAuth()
  const router = useRouter()
  
  const [dataset, setDataset] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDataset = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setDataset(await res.json())
      } else {
        router.push("/datasets")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchDataset()
  }, [token, id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) return
    try {
      await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      router.push("/datasets")
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  if (!dataset) return null

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pt-2">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 w-8 h-8 bg-slate-50 rounded border border-gray-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{dataset.original_filename}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                ['failed', 'error'].includes(dataset.processing_status) ? 'bg-red-50 text-red-700 border border-red-200' :
                dataset.processing_status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {dataset.processing_status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {dataset.id.slice(0, 8)}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(dataset.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {(dataset.file_size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={handleDelete}
          className="text-gray-500 hover:text-red-600 border-gray-200 shadow-sm h-8"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-transparent p-0">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 pb-3 pt-2 text-sm font-medium text-gray-500">
            <FileText className="w-3.5 h-3.5 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="chunks" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 pb-3 pt-2 text-sm font-medium text-gray-500">
            <Database className="w-3.5 h-3.5 mr-2" /> Chunks
          </TabsTrigger>
          <TabsTrigger value="embeddings" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 pb-3 pt-2 text-sm font-medium text-gray-500">
            <Activity className="w-3.5 h-3.5 mr-2" /> Embeddings
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 pb-3 pt-2 text-sm font-medium text-gray-500">
            <Settings className="w-3.5 h-3.5 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 min-h-[400px]">
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-3">
                  <CardTitle className="text-sm font-semibold">Properties</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">File Type</span>
                    <span className="font-medium text-gray-900 uppercase">{dataset.file_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">File Size</span>
                    <span className="font-medium text-gray-900 tabular-nums">{(dataset.file_size / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created At</span>
                    <span className="font-medium text-gray-900 tabular-nums">{new Date(dataset.created_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="chunks">
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <Database className="w-6 h-6 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">Chunk Management</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Inspect how this document was partitioned for semantic search.</p>
                <Button variant="link" className="text-blue-600 font-medium">Load Chunks</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embeddings">
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <Activity className="w-6 h-6 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">Vector Embeddings</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">View the vectorized representations stored in FAISS.</p>
                <Button variant="link" className="text-blue-600 font-medium">Load Embeddings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="shadow-sm max-w-lg">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-sm font-semibold">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Dataset Name</Label>
                  <Input 
                    type="text" 
                    defaultValue={dataset.original_filename}
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
