import { Worker, type Job } from "bullmq"
import { createReadStream } from "fs"
import { createInterface } from "readline"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Log entry regex pattern
const LOG_PATTERN = /^\[([^\]]+)\]\s+(\w+)\s+(.+?)(?:\s+(\{.*\}))?$/

interface LogEntry {
  timestamp: string
  level: string
  message: string
  payload?: any
}

interface JobData {
  fileId: string
  filePath: string
  fileName: string
  fileSize: number
}

// Create BullMQ worker
const worker = new Worker(
  "log-processing-queue",
  async (job: Job<JobData>) => {
    const { fileId, filePath } = job.data
    let processedLines = 0
    let errorCount = 0

    try {
      // Update file status to 'processing'
      await supabase
        .from("log_files")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("file_id", fileId)

      // Create read stream and readline interface
      const fileStream = createReadStream(filePath)
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Number.POSITIVE_INFINITY,
      })

      // Process file line by line
      for await (const line of rl) {
        // Skip empty lines
        if (!line.trim()) continue

        try {
          const logEntry = parseLine(line)

          if (logEntry) {
            // Store log entry in Supabase
            await supabase.from("log_entries").insert({
              file_id: fileId,
              timestamp: new Date(logEntry.timestamp),
              level: logEntry.level,
              message: logEntry.message,
              payload: logEntry.payload,
            })

            // Update job progress
            processedLines++
            if (processedLines % 100 === 0) {
              await job.updateProgress(processedLines)

              // Update file processing status
              await supabase
                .from("log_files")
                .update({
                  processed_lines: processedLines,
                  updated_at: new Date().toISOString(),
                })
                .eq("file_id", fileId)
            }
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Error processing line: ${line}`, error)
          errorCount++
        }
      }

      // Update file status to 'completed'
      await supabase
        .from("log_files")
        .update({
          status: "completed",
          processed_lines: processedLines,
          error_count: errorCount,
          updated_at: new Date().toISOString(),
        })
        .eq("file_id", fileId)

      // Update log statistics
      await updateLogStats()

      return {
        fileId,
        processedLines,
        errorCount,
        status: "completed",
      }
    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error)

      // Update file status to 'failed'
      await supabase
        .from("log_files")
        .update({
          status: "failed",
          processed_lines: processedLines,
          error_message: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("file_id", fileId)

      throw error
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: 2, // Process 2 files at a time
  },
)

// Parse log line into structured data
function parseLine(line: string): LogEntry | null {
  const match = line.match(LOG_PATTERN)

  if (!match) return null

  const [, timestamp, level, message, payloadStr] = match

  let payload
  if (payloadStr) {
    try {
      payload = JSON.parse(payloadStr)
    } catch (error) {
      console.error(`Error parsing JSON payload: ${payloadStr}`, error)
    }
  }

  return {
    timestamp,
    level,
    message,
    payload,
  }
}

// Update log statistics in Supabase
async function updateLogStats() {
  // Get log level counts
  const { data: levelCounts } = await supabase.from("log_entries").select("level, count(*)").group("level")

  // Update log_stats table
  if (levelCounts) {
    for (const { level, count } of levelCounts) {
      await supabase.from("log_stats").upsert({ level, count }, { onConflict: "level" })
    }
  }

  // Get time distribution
  const { data: timeDistribution } = await supabase.rpc("get_hourly_log_distribution")

  // Update log_time_distribution table
  if (timeDistribution) {
    for (const { hour, count } of timeDistribution) {
      await supabase.from("log_time_distribution").upsert({ hour, count }, { onConflict: "hour" })
    }
  }
}

// Handle worker events
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error)
})

console.log("Log processing worker started")

