"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAgents, type Agent } from "@/lib/api"
import { Users } from "lucide-react"

export default function HistoryPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchRuns()
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const data = await getAgents()
      setAgents(data)
    } catch (err) {
      console.error("Erreur lors du chargement des agents:", err)
    }
  }

  const getAgentNames = (agentIds: string[]) => {
    if (!agentIds || !Array.isArray(agentIds)) return []
    
    return agentIds.map(id => {
      const agent = agents.find(a => a.id === id)
      return agent ? agent.name : `Agent ${id.substring(0, 4)}...`
    })
  }

  const fetchRuns = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch("http://localhost:8000/api/crew/runs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Erreur lors de la récupération de l'historique")
      const data = await res.json()
      setRuns(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const viewRun = (id: string, topic: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastRunId", id)
      localStorage.setItem("lastTopic", topic)
      router.push("/dashboard/results")
    }
  }

  if (loading) return <div className="text-center py-20 text-xl">Chargement de l'historique...</div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-cyan-600">Historique des missions</h1>

        <div className="grid gap-4 sm:gap-6">
          {runs.length === 0 ? (
            <p className="text-gray-500 text-center py-20">Aucune mission lancée pour le moment</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6 hover:border-cyan-500 transition-all">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-cyan-600">{(run.topic || "").substring(0, 80)}{(run.topic || "").length > 80 ? "..." : ""}</h3>
                    <p className="text-sm text-gray-400 mt-1">{run.created_at ? new Date(run.created_at).toLocaleString("fr-FR") : "-"}</p>
                    
                    {/* Affichage des agents */}
                    {run.agent_ids && run.agent_ids.length > 0 && (
                      <div className="flex items-start gap-2 mt-3">
                        <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {getAgentNames(run.agent_ids).map((agentName, index) => (
                            <span key={index} className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs rounded-full">
                              {agentName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${run.status === "completed" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {run.status}
                  </span>
                </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button onClick={() => viewRun(run.id, run.topic)} className="inline-block px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium text-white w-full sm:w-auto">
                      Voir le résultat →
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Supprimer cette exécution ?")) return
                        try {
                          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                          const res = await fetch(`http://localhost:8000/api/crew/runs/${run.id}`, {
                            method: "DELETE",
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          })
                          if (!res.ok) throw new Error("Erreur lors de la suppression")
                          // remove from list locally
                          setRuns((prev) => prev.filter((r) => r.id !== run.id))
                        } catch (err) {
                          console.error(err)
                          alert("Impossible de supprimer la run")
                        }
                      }}
                      className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white w-full sm:w-auto"
                    >
                      Supprimer
                    </button>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
