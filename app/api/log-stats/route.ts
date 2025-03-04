import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Fetch log level counts from Supabase
    const { data: levelData, error: levelError } = await supabase
      .from("log_stats")
      .select("level, count")
      .order("count", { ascending: false })

    if (levelError) {
      console.error("Error fetching level stats:", levelError)
      return NextResponse.json({ error: "Failed to fetch log statistics" }, { status: 500 })
    }

    // Fetch time distribution from Supabase
    const { data: timeData, error: timeError } = await supabase
      .from("log_time_distribution")
      .select("hour, count")
      .order("hour", { ascending: true })

    if (timeError) {
      console.error("Error fetching time stats:", timeError)
      return NextResponse.json({ error: "Failed to fetch time distribution" }, { status: 500 })
    }

    // Format data for frontend charts
    const levelCounts = levelData.map((item) => ({
      name: item.level,
      value: item.count,
    }))

    const timeDistribution = timeData.map((item) => ({
      name: `${item.hour}:00`,
      count: item.count,
    }))

    return NextResponse.json({
      levelCounts,
      timeDistribution,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to retrieve log statistics" }, { status: 500 })
  }
}

