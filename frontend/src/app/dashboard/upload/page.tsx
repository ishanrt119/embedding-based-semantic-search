"use client"

import { useState, useRef, ChangeEvent } from "react"
import { UploadCloud, File, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

const SUPPORTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"]
const SUPPORTED_EXTS = [".pdf", ".docx", ".txt", ".csv"]
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    // Check file extension / mime type
    const fileExt = "." + selectedFile.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_EXTS.includes(fileExt as string)) {
      setError(`Unsupported file type. Please upload ${SUPPORTED_EXTS.join(", ")}`)
      return
    }

    // Check size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File exceeds maximum allowed size of 25 MB")
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)
    // mock dataset name
    formData.append("dataset_name", file.name)

    try {
      // Simulate progress since fetch doesn't natively support upload progress easily without XMLHttpRequest
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/upload`, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Upload failed")
      }

      setSuccess(true)
      setFile(null)
      setTimeout(() => {
        router.push("/dashboard/documents")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred during upload")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Upload Document</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Upload your documents for processing. Supported formats: PDF, DOCX, TXT, CSV. Max size: 25MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
              file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.csv"
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <File className="h-12 w-12 text-primary mb-4" />
                <p className="font-medium text-lg">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-medium text-lg">Click or drag file to this area to upload</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Strictly prohibited from uploading company data or other band files
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-6 flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 flex items-center p-4 text-green-800 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <p className="text-sm">File uploaded successfully! Redirecting to dashboard...</p>
            </div>
          )}

          {isUploading && (
            <div className="mt-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">Uploading...</span>
                <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleUpload()
              }}
              disabled={!file || isUploading || success}
              size="lg"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
