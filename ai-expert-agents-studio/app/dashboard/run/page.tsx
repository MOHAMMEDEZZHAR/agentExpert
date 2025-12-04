"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Loader2, CheckSquare, Square, Sparkles } from "lucide-react"
import { getAgents, runCrew, type Agent } from "@/lib/api"

export default function RunTopicPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingAgents, setLoadingAgents] = useState(true)

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
      setLoadingAgents(false)
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAgents.length === 0 || !topic.trim()) return

    setLoading(true)
    try {
      const result = await runCrew(topic, selectedAgents)
      localStorage.setItem("lastRunId", result.run_id)
      localStorage.setItem("lastTopic", topic)
      router.push("/dashboard/results")
    } catch (error) {
      console.error("Erreur lors du lancement de la mission:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lancer un Topic</h1>
          <p className="text-muted-foreground">Décrivez votre sujet et sélectionnez les agents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <label className="block text-lg font-medium text-foreground mb-4">Décrivez votre topic</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-4 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground resize-none text-lg"
            rows={6}
            placeholder="Exemple: Analysez les tendances du marché de l'IA en 2024 et proposez des recommandations stratégiques pour une startup tech..."
            required
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <label className="block text-lg font-medium text-foreground mb-4">
            Sélectionnez les agents ({selectedAgents.length} sélectionné{selectedAgents.length > 1 ? "s" : ""})
          </label>

          {loadingAgents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun agent disponible. Créez d&apos;abord des agents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id)
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-secondary/50"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">{agent.name}</h3>
                      <p className="text-sm text-primary">{agent.role}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || selectedAgents.length === 0 || !topic.trim()}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-400/90 text-primary-foreground font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Lancement en cours...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Lancer la mission
            </>
          )}
        </button>
      </form>
    </div>
  )
}
