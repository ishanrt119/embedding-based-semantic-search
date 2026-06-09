"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { BarChart3, TrendingUp, Activity, Search, Loader2, ArrowUpRight, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch("http://localhost:8000/api/auth/me/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false))
    }
  }, [token])

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-6rem)]"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform usage and performance metrics.</p>
        </div>
        <div className="flex bg-card border border-border rounded-md p-1 shadow-sm text-xs font-medium">
          <button className="px-3 py-1 bg-muted rounded text-foreground">7 Days</button>
          <button className="px-3 py-1 text-muted-foreground hover:text-foreground">30 Days</button>
          <button className="px-3 py-1 text-muted-foreground hover:text-foreground">3 Months</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm flex flex-col justify-between h-28">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Searches</CardTitle>
            <Search className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">{stats?.searches || 0}</p>
            <span className="text-xs font-medium text-green-600 flex items-center"><ArrowUpRight className="w-3 h-3" /> 12%</span>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm flex flex-col justify-between h-28">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Document Growth</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">{stats?.documents || 0}</p>
            <span className="text-xs font-medium text-green-600 flex items-center"><ArrowUpRight className="w-3 h-3" /> 4%</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col justify-between h-28">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Latency</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">142<span className="text-lg text-muted-foreground ml-1 font-normal">ms</span></p>
            <span className="text-xs font-medium text-red-600 flex items-center"><ArrowUpRight className="w-3 h-3" /> 2%</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col justify-between h-28">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">1</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Empty states for charts since we have no time-series API */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold">Search Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-foreground">No time-series data available</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">Perform more searches over several days to populate this chart.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold">Retrieval Accuracy (MRR)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center text-center">
            <Activity className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-foreground">Insufficient feedback data</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">Implement user feedback tracking to measure retrieval quality.</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Dense Data Table Example */}
      <Card className="shadow-sm mt-4">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold">Top Search Queries</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No query logs available for this period.
        </CardContent>
      </Card>
    </div>
  )
}
