import { Bot, Target, BookOpen } from "lucide-react"
import type { Agent } from "@/lib/api"

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet agent pour toujours ?")) return
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(`http://localhost:8000/api/agents/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        // refresh list - simple approach
        window.location.reload()
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur réseau lors de la suppression")
    }
  }
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">{agent.name}</h3>
          <p className="text-primary text-sm font-medium">{agent.role}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">{agent.goal}</p>
        </div>
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">{agent.backstory}</p>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={() => handleDelete(agent.id)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Supprimer l’agent
        </button>
      </div>
    </div>
  )
}
