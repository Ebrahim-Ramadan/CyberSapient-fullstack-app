import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@supabase/supabase-js"
import { Queue } from "bullmq"
import { mkdir } from "fs/promises"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize BullMQ queue
const logProcessingQueue = new Queue("log-processing-queue", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".log") && !file.name.endsWith(".txt")) {
      return NextResponse.json({ error: "Invalid file type. Only .log and .txt files are supported" }, { status: 400 })
    }

    // Generate unique file ID and path
    const fileId = uuidv4()
    const fileName = `${fileId}-${file.name}`
    const uploadsDir = join(process.cwd(), "uploads")

    // Ensure uploads directory exists
    await mkdir(uploadsDir, { recursive: true })

    const filePath = join(uploadsDir, fileName)

    // Convert file to buffer and save to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Store file metadata in Supabase
    const { error } = await supabase.from("log_files").insert({
      file_id: fileId,
      original_name: file.name,
      file_path: filePath,
      file_size: file.size,
      status: "uploaded",
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to store file metadata" }, { status: 500 })
    }

    // Add job to BullMQ queue
    await logProcessingQueue.add(
      "process-log-file",
      {
        fileId,
        filePath,
        fileName: file.name,
        fileSize: file.size,
      },
      {
        priority: file.size < 1024 * 1024 ? 1 : 2, // Prioritize smaller files
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    )

    return NextResponse.json({ fileId, message: "File uploaded successfully" })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}

