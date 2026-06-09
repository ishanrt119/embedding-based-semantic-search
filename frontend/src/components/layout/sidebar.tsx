"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { LayoutDashboard, Database, Search, MessageSquare, BarChart3, Settings, UserCircle, ChevronsUpDown } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Search", href: "/search", icon: Search },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="flex flex-col w-[260px] bg-white border-r border-gray-200 min-h-screen shrink-0 text-sm">
      {/* Workspace Selector */}
      <div className="h-14 px-4 flex items-center border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
            A
          </div>
          <span className="font-semibold text-gray-900 truncate">Acme Corp</span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="px-2 mb-2 text-xs font-semibold text-gray-500 tracking-wider">Workspace</div>
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2.5 py-1.5 font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mr-2.5 h-4 w-4 shrink-0 ${
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
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
      <div className="p-3 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-slate-50 rounded-md transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <UserCircle className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email || "Loading..."}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
