"use client"

import { useEffect, useState } from "react"
import { Eye, Trash2, FileText, ChevronLeft, ChevronRight, Blocks, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface Document {
  id: string
  filename: string
  file_type: string
  file_size: number
  upload_status: string
  processing_status: string
  created_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function DocumentsDashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchDocuments = async (pageNum: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/documents?page=${pageNum}&limit=10`)
      if (!res.ok) {
        throw new Error("Failed to fetch documents")
      }
      const data = await res.json()
      setDocuments(data.data)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments(page)
  }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        throw new Error("Failed to delete document")
      }
      // Refresh list
      fetchDocuments(page)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const getStatusBadge = (status: string) => {
    let color = "bg-gray-100 text-gray-800"
    if (status === "completed" || status === "indexed" || status === "extracted") {
      color = "bg-green-100 text-green-800"
    } else if (status === "failed") {
      color = "bg-red-100 text-red-800"
    } else if (status === "processing" || status === "extracting" || status === "pending") {
      color = "bg-blue-100 text-blue-800 animate-pulse"
    }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{status}</span>
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Document Management</h1>
        <Button onClick={() => router.push("/dashboard/upload")}>
          Upload New Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Manage and view status of all your ingested documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 text-red-800 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Filename</th>
                  <th scope="col" className="px-6 py-3">Type</th>
                  <th scope="col" className="px-6 py-3">Size</th>
                  <th scope="col" className="px-6 py-3">Upload Date</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">Loading documents...</td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">No documents found. Upload one to get started!</td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-[200px]" title={doc.filename}>{doc.filename}</span>
                      </td>
                      <td className="px-6 py-4">{doc.file_type}</td>
                      <td className="px-6 py-4">{formatSize(doc.file_size)}</td>
                      <td className="px-6 py-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(doc.processing_status)}
                      </td>
                      <td className="px-6 py-4 flex space-x-3">
                        <button
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          onClick={() => alert(`View document details:\n${JSON.stringify(doc, null, 2)}`)}
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => router.push(`/dashboard/documents/${doc.id}/chunks`)}
                          title="View Chunks"
                        >
                          <Blocks className="w-5 h-5" />
                        </button>
                        <button
                          className="text-emerald-600 hover:text-emerald-900"
                          onClick={() => router.push(`/dashboard/documents/${doc.id}/embeddings`)}
                          title="Manage Embeddings"
                        >
                          <Database className="w-5 h-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(doc.id)}
                          title="Delete Document"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-gray-700">
                Showing <span className="font-semibold text-gray-900">{(page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900">{pagination.total}</span> Entries
              </span>
              <div className="inline-flex mt-2 xs:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages || isLoading}
                  className="flex items-center ml-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
