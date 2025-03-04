"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchLogStats } from "@/lib/api"

interface LogStatsProps {
  uploadedFiles: string[]
}

interface LogStats {
  levelCounts: { name: string; value: number }[]
  timeDistribution: { name: string; count: number }[]
  isLoading: boolean
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function LogStats({ uploadedFiles }: LogStatsProps) {
  const [stats, setStats] = useState<LogStats>({
    levelCounts: [],
    timeDistribution: [],
    isLoading: false,
  })

  useEffect(() => {
    const getStats = async () => {
      if (uploadedFiles.length === 0) return

      setStats((prev) => ({ ...prev, isLoading: true }))
      try {
        const data = await fetchLogStats()
        setStats({
          levelCounts: data.levelCounts,
          timeDistribution: data.timeDistribution,
          isLoading: false,
        })
      } catch (error) {
        console.error("Failed to fetch log stats:", error)
        setStats((prev) => ({ ...prev, isLoading: false }))
      }
    }

    getStats()

    // Set up polling for real-time updates
    const interval = setInterval(getStats, 5000)
    return () => clearInterval(interval)
  }, [uploadedFiles])

  if (uploadedFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-muted/50 rounded-md">
        <p className="text-muted-foreground">Upload files to see analytics</p>
      </div>
    )
  }

  if (stats.isLoading && stats.levelCounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-muted/50 rounded-md">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="levels">
      <TabsList className="mb-4">
        <TabsTrigger value="levels">Log Levels</TabsTrigger>
        <TabsTrigger value="time">Time Distribution</TabsTrigger>
      </TabsList>

      <TabsContent value="levels" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.levelCounts}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {stats.levelCounts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="time" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.timeDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  )
}

