"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { FileText, Loader2, Plus, Search, Trash2, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Dataset {
  id: string
  filename: string
  file_type: string
  processing_status: string
  created_at: string
  file_size: number
}

export default function DatasetsPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDatasets = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/documents", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDatasets(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchDatasets()
  }, [token])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Delete this dataset?")) return
    try {
      await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      fetchDatasets()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Datasets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your knowledge base documents.</p>
        </div>
        <Button onClick={() => router.push("/datasets/new")} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Dataset
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        {/* Table Controls */}
        <div className="p-2 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">Filter</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">Sort</Button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-24 px-4">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No datasets yet</h3>
            <p className="text-gray-500 text-sm mb-4">Upload your first document to begin building your knowledge base.</p>
            <Button variant="link" onClick={() => router.push("/datasets/new")} className="text-blue-600 font-medium">
              Upload Document &rarr;
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white text-gray-500">
                <TableRow>
                  <TableHead className="font-medium text-xs cursor-pointer group hover:bg-slate-50 w-full">
                    <div className="flex items-center">Name <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                  </TableHead>
                  <TableHead className="font-medium text-xs">Status</TableHead>
                  <TableHead className="font-medium text-xs">Size</TableHead>
                  <TableHead className="font-medium text-xs">Type</TableHead>
                  <TableHead className="font-medium text-xs">Created</TableHead>
                  <TableHead className="font-medium text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100">
                {datasets.map((dataset) => (
                  <TableRow 
                    key={dataset.id} 
                    onClick={() => router.push(`/datasets/${dataset.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <TableCell className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate max-w-sm">{dataset.filename}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          ['failed', 'error'].includes(dataset.processing_status) ? 'bg-red-600' :
                          dataset.processing_status === 'pending' ? 'bg-amber-600' :
                          'bg-green-600'
                        }`}></div>
                        <span className="text-gray-600 capitalize text-xs">{dataset.processing_status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs tabular-nums">{formatSize(dataset.file_size)}</TableCell>
                    <TableCell className="text-gray-500 text-xs uppercase">{dataset.file_type}</TableCell>
                    <TableCell className="text-gray-500 text-xs tabular-nums">{new Date(dataset.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => handleDelete(e, dataset.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="p-2 border-t border-gray-200 bg-white rounded-b-lg flex items-center justify-between text-xs text-gray-500">
          <span className="px-2">{datasets.length} datasets</span>
        </div>
      </div>
    </div>
  )
}
