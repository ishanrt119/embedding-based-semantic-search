"use client"

import { Coffee, Rocket, Server, Lightbulb, CheckCircle2, UserCircle, ExternalLink, Code, Layout, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  const openBuyMeAChai = () => {
    window.open("https://buymeachai.ezee.li/ishanrt", "_blank", "noopener,noreferrer")
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-12 pb-16 pt-4">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm mb-6">
          <Coffee className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Support the Development of DocIntel</h1>
        <p className="text-muted-foreground leading-relaxed">
          If this platform helped you search, understand, compare, or generate insights from your documents, consider supporting its development. Every contribution helps improve features, infrastructure, and future releases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Why Support Section */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Why Support?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2">
                  <Rocket className="w-5 h-5 text-blue-600 mb-2" />
                  <CardTitle className="text-sm">Faster Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Support helps build new AI-powered features and improvements.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2">
                  <Server className="w-5 h-5 text-blue-600 mb-2" />
                  <CardTitle className="text-sm">Infrastructure Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Helps cover hosting, databases, APIs, and deployment expenses.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 mb-2" />
                  <CardTitle className="text-sm">Future Innovation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enables research, experimentation, and new document intelligence capabilities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Progress Section */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Current Focus Areas</h2>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  {[
                    "Better PDF Understanding",
                    "Faster Search",
                    "Advanced Reports",
                    "Team Collaboration",
                    "Knowledge Workspaces"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-secondary-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Portfolio Section */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Other Projects by Ishan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm hover:border-gray-300 transition-colors cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <Code className="w-6 h-6 text-muted-foreground mx-auto mb-3 group-hover:text-blue-600 transition-colors" />
                  <h3 className="font-semibold text-sm mb-1">AI Projects</h3>
                  <p className="text-xs text-muted-foreground">Machine learning & AI tools</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:border-gray-300 transition-colors cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <Layout className="w-6 h-6 text-muted-foreground mx-auto mb-3 group-hover:text-blue-600 transition-colors" />
                  <h3 className="font-semibold text-sm mb-1">SaaS Products</h3>
                  <p className="text-xs text-muted-foreground">Full-stack web applications</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:border-gray-300 transition-colors cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <Database className="w-6 h-6 text-muted-foreground mx-auto mb-3 group-hover:text-blue-600 transition-colors" />
                  <h3 className="font-semibold text-sm mb-1">Open Source</h3>
                  <p className="text-xs text-muted-foreground">Contributions & libraries</p>
                </CardContent>
              </Card>
            </div>
          </section>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Creator Profile */}
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <UserCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Ishan Toraskar</h3>
                  <p className="text-xs text-blue-600 font-medium">Founder & Developer</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                DocIntel was built to transform static documents into intelligent, searchable knowledge. Your support helps maintain infrastructure costs, improve AI capabilities, and accelerate new feature development.
              </p>
            </CardContent>
          </Card>

          {/* Support CTA Card */}
          <Card className="shadow-md border-amber-200 bg-amber-50/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Coffee className="w-24 h-24 text-amber-600 transform rotate-12" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-900 font-bold">Enjoying DocIntel?</CardTitle>
              <CardDescription className="text-amber-700/80">Support the project with a chai ☕</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Button 
                onClick={openBuyMeAChai}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm transition-colors"
              >
                Support with Chai <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-8 border-t border-border flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-muted-foreground font-medium">
          Thank you for supporting independent builders and open innovation.
        </p>
        <Button 
          variant="outline" 
          onClick={openBuyMeAChai}
          className="border-border hover:bg-muted text-foreground transition-colors"
        >
          <Coffee className="w-4 h-4 mr-2 text-amber-600" /> Buy Me a Chai
        </Button>
      </div>

    </div>
  )
}
