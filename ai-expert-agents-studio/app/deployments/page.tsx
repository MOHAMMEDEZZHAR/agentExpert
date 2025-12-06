"use client"

import React, { useEffect, useState } from "react"
import { Zap, Trash2, Copy } from "lucide-react"
import { getAgents, type Agent } from "@/lib/api"

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchDeployments()
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

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.name : agentId.substring(0, 4) + "..."
  }


  const fetchDeployments = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch("http://localhost:8000/api/deployments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Erreur lors de la récupération")
      const data = await res.json()
      console.log('Déploiements chargés:', data)
      setDeployments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const deleteDeployment = async (id: string) => {
    if (!confirm("Supprimer ce déploiement ?")) return
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(`http://localhost:8000/api/deployments/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        setDeployments((prev) => prev.filter((d) => d.deployment_id !== id))
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur réseau")
    }
  }

  if (loading) return <div className="text-center py-20">Chargement...</div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-600" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-600">Déploiements d'agents</h1>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {deployments.length === 0 ? (
            <p className="text-gray-500 text-center py-20">Aucun agent déployé pour le moment</p>
          ) : (
            deployments.map((dep) => (
              <div key={dep.deployment_id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cyan-600">
                      {getAgentName(dep.agent_id)}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{dep.created_at ? new Date(dep.created_at).toLocaleString("fr-FR") : "-"}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${dep.is_active ? "bg-green-900 text-green-300" : "bg-gray-900 text-gray-300"}`}>
                    {dep.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded mb-4 border border-slate-700 flex items-center gap-2 text-xs">
                  <span className="text-gray-300 flex-1 break-all">ID complet de l'agent : <span className="text-cyan-400">{dep.agent_id}</span></span>
                  <button
                    onClick={() => {
                      copyToClipboard(dep.agent_id, `${dep.deployment_id}-agent-id`)
                    }}
                    className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-gray-100"
                  >
                    {copied === `${dep.deployment_id}-agent-id` ? "Copié" : "Copier"}
                  </button>
                </div>

                <div className="bg-slate-900 p-4 rounded mb-4 border border-slate-700">
                  <p className="text-xs text-gray-400 mb-2">Exemple d'appel API (testé et fonctionnel) :</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">1. Agent ID (copiez l'ID complet ci-dessus) :</p>
                      <code className="text-cyan-400 text-xs break-all">
                        http://localhost:8000/api/agents/[AGENT_ID_ICI]/ask
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">2. API Key (remplacez VOTRE_CLÉ_API_ICI) :</p>
                      <code className="text-cyan-400 text-xs break-all">
                        {'{"api_key": "VOTRE_CLÉ_API_ICI"}'}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">3. Question (remplacez par votre question) :</p>
                      <code className="text-cyan-400 text-xs break-all">
                        {'{"question": "Votre question ici"}'}
                      </code>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-gray-500 mb-1">Commande complète :</p>
                    <code className="text-cyan-400 text-xs break-all">
                      {`curl -X POST http://localhost:8000/api/agents/[AGENT_ID_ICI]/ask \\`}
                    </code>
                    <br />
                    <code className="text-cyan-400 text-xs break-all ml-4">
                      {`-H "Content-Type: application/json" \\`}
                    </code>
                    <br />
                    <code className="text-cyan-400 text-xs break-all ml-4">
                      {`-d '{"api_key": "VOTRE_CLÉ_API_ICI", "question": "Votre question ici"}'`}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    • Copiez l'ID complet de l'agent depuis la section ci-dessus
                    <br />
                    • Remplacez <code className="text-cyan-300">VOTRE_CLÉ_API_ICI</code> par votre clé API
                    <br />
                    • Remplacez <code className="text-cyan-300">Votre question ici</code> par votre question
                  </p>
                </div>

                <button
                  onClick={() => deleteDeployment(dep.deployment_id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
