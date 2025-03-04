"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadLogFile } from "@/lib/api"

interface FileUploadProps {
  onUploadStart: () => void
  onUploadProgress: (progress: number) => void
  onUploadComplete: (fileName: string) => void
  onUploadError: (error: string) => void
}

export default function FileUpload({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      onUploadStart()
      await uploadLogFile(selectedFile, (progress) => {
        onUploadProgress(progress)
      })
      onUploadComplete(selectedFile.name)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : "Upload failed")
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".log,.txt"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          id="file-upload"
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Select Log File
        </Button>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
          <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpload}>
              Upload
            </Button>
            <Button size="icon" variant="ghost" onClick={clearSelectedFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

