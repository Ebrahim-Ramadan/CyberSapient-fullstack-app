export async function uploadLogFile(file: File, onProgress?: (progress: number) => void): Promise<{ fileId: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()

    xhr.open("POST", "/api/upload-logs", true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new Error("Invalid response from server"))
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error("Network error occurred during upload"))
    }

    xhr.send(formData)
  })
}

/**
 * Fetches log statistics from the server
 */
export async function fetchLogStats() {
  const response = await fetch("/api/log-stats")

  if (!response.ok) {
    throw new Error(`Failed to fetch log stats: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Fetches processing status for a specific file
 */
export async function fetchFileStatus(fileId: string) {
  const response = await fetch(`/api/file-status?fileId=${fileId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch file status: ${response.statusText}`)
  }

  return await response.json()
}

