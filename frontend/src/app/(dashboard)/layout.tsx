import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 relative overflow-y-auto focus:outline-none flex flex-col">
          <div className="flex-1 py-6 px-4 sm:px-6 md:px-8">
            {children}
          </div>
          <div className="py-3 text-center border-t border-border mt-auto shrink-0 bg-background">
            <p className="text-[11px] text-muted-foreground">Built with ❤️ by Ishan Toraskar</p>
          </div>
        </main>
      </div>
    </div>
  )
}
