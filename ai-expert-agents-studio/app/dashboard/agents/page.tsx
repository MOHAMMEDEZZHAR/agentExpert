"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Users } from "lucide-react"
import { getAgents, type Agent } from "@/lib/api"
import { AgentCard } from "@/components/agent-card"
import { CreateAgentModal } from "@/components/create-agent-modal"

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const data = await getAgents()
      setAgents(data)
    } catch (error) {
      console.error("Erreur lors du chargement des agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentCreated = (agent: Agent) => {
    setAgents([...agents, agent])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes Agents</h1>
            <p className="text-muted-foreground">Gérez vos agents IA experts</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel Agent</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun agent</h3>
          <p className="text-muted-foreground mb-6">Créez votre premier agent IA pour commencer</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Créer un agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      <CreateAgentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleAgentCreated} />
    </div>
  )
}
