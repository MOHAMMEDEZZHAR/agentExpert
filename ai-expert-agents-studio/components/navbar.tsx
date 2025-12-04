"use client"

import { useRouter, usePathname } from "next/navigation"
import { Bot, LogOut, Rocket, Users, Play, FileText, Clock } from "lucide-react"
import { removeToken } from "@/lib/api"
import Link from "next/link"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    removeToken()
    router.push("/login")
  }

  const navItems = [
    { href: "/dashboard/agents", label: "Mes Agents", icon: Users },
    { href: "/dashboard/run", label: "Lancer un Topic", icon: Play },
    { href: "/dashboard/results", label: "Résultats", icon: FileText },
    { href: "/history", label: "Historique", icon: Clock },
  ]

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard/agents" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:block">AI Expert Agents Studio</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Floating one-click deploy button (opens Railway with prefilled env) */}
            <button
              onClick={() => {
                const frontendUrl = typeof window !== "undefined" ? window.location.origin : ""
                const deployUrl = `https://railway.app/new?ref=ai-expert-agents-studio&env[OPENAI_API_KEY]=${localStorage.getItem("openai_key") || "sk-..."}&env[BACKEND_URL]=${frontendUrl}`
                window.open(deployUrl, "_blank")
              }}
              className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-6 rounded-full shadow-2xl flex items-center gap-3 transform hover:scale-110 transition-all z-50"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15H9v-4H5l5-6 5 6h-4v4z"/></svg>
              <span className="hidden sm:inline">DEPLOY EN 1 CLIC</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary px-3 py-2 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
