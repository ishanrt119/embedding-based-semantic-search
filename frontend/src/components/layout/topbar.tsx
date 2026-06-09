"use client"

import { usePathname } from "next/navigation"
import { Bell, Slash } from "lucide-react"

export function Topbar() {
  const pathname = usePathname()
  
  // Create simple breadcrumbs from pathname
  const paths = pathname?.split('/').filter(Boolean) || []
  const currentPath = paths[paths.length - 1] || 'Overview'

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch items-center">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm font-medium text-gray-500 capitalize">
          <span>Acme Corp</span>
          <Slash className="w-4 h-4 mx-1 text-gray-300" />
          <span className="text-gray-900">{currentPath.replace(/-/g, ' ')}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="text-gray-400 hover:text-gray-500 transition-colors">
            <span className="sr-only">View notifications</span>
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
