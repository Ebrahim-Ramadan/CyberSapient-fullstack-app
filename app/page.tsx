"use client"

import { useState } from "react"
import { FileText, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FileUpload from "@/components/file-upload"
import LogStats from "@/components/log-stats"

export default function Home() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold mb-8">Log File Processing System</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Log Files</CardTitle>
            <CardDescription>
              Upload log files for processing. Supported format: text files with timestamp, level, and message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUploadStart={() => {
                setIsUploading(true)
                setError(null)
              }}
              onUploadProgress={(progress) => setUploadProgress(progress)}
              onUploadComplete={(fileName) => {
                setIsUploading(false)
                setUploadProgress(0)
                setUploadedFiles((prev) => [...prev, fileName])
              }}
              onUploadError={(errorMsg) => {
                setIsUploading(false)
                setError(errorMsg)
              }}
            />

            {isUploading && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">Uploading... {uploadProgress}%</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Files are processed asynchronously. Results will appear in real-time.
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Analytics</CardTitle>
            <CardDescription>Real-time analytics of processed log files</CardDescription>
          </CardHeader>
          <CardContent>
            <LogStats uploadedFiles={uploadedFiles} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Recently uploaded files and their processing status</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 rounded bg-muted">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>{file}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No files uploaded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

