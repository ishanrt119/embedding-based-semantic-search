"use client";

import { UploadCloud, File, Activity, Users, Database, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 py-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your datasets and view analytics.</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          <UploadCloud className="h-4 w-4 mr-2" /> Upload Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,231</div>
            <p className="text-xs text-muted-foreground mt-1">+201 since last week</p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vector Embeddings</CardTitle>
            <Database className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">542,890</div>
            <p className="text-xs text-muted-foreground mt-1">all-MiniLM-L6-v2</p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
            <Activity className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89,432</div>
            <p className="text-xs text-muted-foreground mt-1">112ms avg latency</p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <Users className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-emerald-500 mt-1">+14% engagement</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Datasets</h2>
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-white/5 text-muted-foreground border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Chunks</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-2">
                  <File className="h-4 w-4 text-violet-400" />
                  Q1_Financial_Report.pdf
                </td>
                <td className="px-6 py-4">PDF</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-medium">COMPLETED</span></td>
                <td className="px-6 py-4">245</td>
                <td className="px-6 py-4">Oct 24, 2024</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-2">
                  <File className="h-4 w-4 text-blue-400" />
                  User_Interviews_Transcript.docx
                </td>
                <td className="px-6 py-4">DOCX</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs font-medium">PROCESSING</span></td>
                <td className="px-6 py-4">-</td>
                <td className="px-6 py-4">Oct 25, 2024</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-2">
                  <File className="h-4 w-4 text-green-400" />
                  Product_Catalog.csv
                </td>
                <td className="px-6 py-4">CSV</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-medium">COMPLETED</span></td>
                <td className="px-6 py-4">1,402</td>
                <td className="px-6 py-4">Oct 20, 2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
