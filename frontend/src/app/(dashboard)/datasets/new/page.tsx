"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { UploadCloud, File, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewDatasetPage() {
  const { token } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError("")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
      setError("")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setIsUploading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:8000/api/documents/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed")
      }
      
      router.push(`/datasets/${data.document_id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6 pt-4">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Upload Dataset</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new document to your knowledge base for indexing.</p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="p-6">
          <div 
            className="border border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-muted transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.docx,.txt,.csv"
            />
            
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-5 h-5 text-muted-foreground" />
            </div>
            
            {file ? (
              <div className="space-y-1">
                <p className="text-foreground font-medium text-sm flex items-center justify-center gap-1.5">
                  <File className="w-3.5 h-3.5 text-blue-600" /> {file.name}
                </p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-foreground font-medium text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">Supported files: PDF, DOCX, TXT, CSV up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button 
            variant="ghost"
            onClick={() => router.back()} 
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isUploading ? "Uploading..." : "Upload & Process"}
          </Button>
        </div>
      </div>
    </div>
  )
}
