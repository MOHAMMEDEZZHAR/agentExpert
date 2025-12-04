"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (token) {
      router.push("/dashboard/agents")
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  )
}
