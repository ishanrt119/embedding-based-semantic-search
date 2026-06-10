"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { LayoutDashboard, Database, Search, MessageSquare, BarChart3, UserCircle, ChevronsUpDown, LogOut, BrainCircuit } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Search", href: "/search", icon: Search },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Intelligence", href: "/intelligence", icon: BrainCircuit },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col w-[260px] bg-sidebar border-r border-border min-h-screen shrink-0 text-sm">
      {/* Workspace Selector */}
      <div className="h-14 px-4 flex items-center border-b border-border cursor-pointer hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">
            A
          </div>
          <span className="font-semibold text-foreground truncate">Acme Corp</span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Workspace</div>
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2.5 py-1.5 font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`mr-2.5 h-4 w-4 shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 w-full rounded-md bg-muted/30 border border-border/50">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <UserCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar"></span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-start">
            <p className="text-sm font-semibold text-foreground truncate w-full">User</p>
            <p className="text-xs text-muted-foreground truncate w-full">{user?.email || "Loading..."}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full mt-2 flex items-center justify-center gap-2 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </div>
  )
}
