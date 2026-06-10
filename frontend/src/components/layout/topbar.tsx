"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Slash, UserCircle, LogOut, User, Palette } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"

export function Topbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Create simple breadcrumbs from pathname
  const paths = pathname?.split('/').filter(Boolean) || []
  const currentPath = paths[paths.length - 1] || 'Overview'

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch items-center">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm font-medium text-muted-foreground capitalize">
          <span>Acme Corp</span>
          <Slash className="w-4 h-4 mx-1 text-border" />
          <span className="text-foreground">{currentPath.replace(/-/g, ' ')}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <a href="/support" className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors border border-amber-200 shadow-sm">
            ☕ Support
          </a>
          <ThemeToggle />
          
          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:ring-2 hover:ring-primary/50 transition-all">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-popover border border-border divide-y divide-border z-50">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-popover-foreground">User</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "Loading..."}</p>
                </div>
                <div className="py-1">
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" /> Profile
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors">
                    <Palette className="w-4 h-4 text-muted-foreground" /> Theme Preferences
                  </button>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
