"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { User, Shield, Key, CreditCard, LogOut, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: CreditCard },
  ]

  return (
    <div className="max-w-[900px] mx-auto space-y-6 pt-2">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and workspace configuration.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar (Vertical Nav) */}
        <div className="w-full md:w-48 shrink-0 space-y-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-secondary-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          
          {activeTab === 'profile' && (
            <Card className="shadow-sm">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold">User Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="max-w-md space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Avatar</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-lg font-bold text-blue-600 border border-blue-100">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <Button variant="outline" size="sm">Upload new</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Name</Label>
                    <Input type="text" placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Email Address</Label>
                    <Input type="email" defaultValue={user?.email || ""} disabled />
                  </div>
                </div>
              </CardContent>
              <div className="bg-muted px-5 py-3 border-t border-border flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Current Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">New Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                </CardContent>
                <div className="bg-muted px-5 py-3 border-t border-border flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Update Password</Button>
                </div>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="text-sm font-semibold">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Mac OS • Chrome</p>
                      <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active Now</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="text-red-600 hover:bg-red-50 hover:text-red-700 border-border shadow-sm flex items-center transition-colors">
                      <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-red-200 bg-red-50">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-red-800 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Delete Account
                  </h4>
                  <p className="text-xs text-red-600 mt-1 mb-4">
                    Permanently delete your account, datasets, and API keys. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">Delete Account</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'appearance' && (
            <Card className="shadow-sm">
              <CardHeader className="border-b border-border pb-3 flex flex-row justify-between items-center space-y-0">
                <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Theme Preference</h4>
                    <p className="text-xs text-muted-foreground mt-1">Light theme is currently enforced for best reading experience.</p>
                  </div>
                  <Button disabled variant="outline" className="text-xs">Light Mode Active</Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
