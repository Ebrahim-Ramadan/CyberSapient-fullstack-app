import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Fetch file status from Supabase
    const { data, error } = await supabase
      .from("log_files")
      .select("file_id, status, processed_lines, error_message, updated_at")
      .eq("file_id", fileId)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch file status" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Status error:", error)
    return NextResponse.json({ error: "Failed to retrieve file status" }, { status: 500 })
  }
}

