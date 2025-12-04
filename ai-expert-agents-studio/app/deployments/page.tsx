"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, Trash2, Copy, Check } from "lucide-react"

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchDeployments()
  }, [])

  const fetchDeployments = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch("http://localhost:8000/api/deployments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Erreur lors de la récupération")
      const data = await res.json()
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-8 h-8 text-cyan-600" />
          <h1 className="text-4xl font-bold text-cyan-600">Déploiements d'agents</h1>
        </div>

        <div className="grid gap-6">
          {deployments.length === 0 ? (
            <p className="text-gray-500 text-center py-20">Aucun agent déployé pour le moment</p>
          ) : (
            deployments.map((dep) => (
              <div key={dep.deployment_id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-600">Agent ID: {dep.agent_id.substring(0, 8)}...</h3>
                    <p className="text-sm text-gray-400 mt-1">{dep.created_at ? new Date(dep.created_at).toLocaleString("fr-FR") : "-"}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${dep.is_active ? "bg-green-900 text-green-300" : "bg-gray-900 text-gray-300"}`}>
                    {dep.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div className="bg-slate-900 p-4 rounded mb-4 border border-slate-700">
                  <p className="text-xs text-gray-400 mb-2">Clé API (empreinte) :</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-cyan-400 text-sm break-all">{dep.api_key_fingerprint ?? dep.api_key ?? '—'}</code>
                    <button
                      onClick={() => copyToClipboard(dep.api_key_fingerprint ?? dep.api_key ?? '', dep.deployment_id)}
                      className="p-2 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
                    >
                      {copied === dep.deployment_id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Remarque : la clé complète est affichée une seule fois au moment de la création. Si vous l'avez perdue, régénérez-la.</p>
                </div>

                <div className="bg-slate-900 p-4 rounded mb-4 border border-slate-700">
                  <p className="text-xs text-gray-400 mb-2">Exemple d'appel API (header Authorization - RECOMMANDÉE):</p>
                  <code className="text-cyan-400 text-xs break-all">
                    {`curl -X POST http://localhost:8000/api/agents/cbbc939d-5f46-490e-9816-da15808bd80c/ask \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <VOTRE_CLE_API_ICI>" \\
  -d '{"question": "Ton question ici"}'`}
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    • Remplacez <code className="text-cyan-300">&lt;VOTRE_CLE_API_ICI&gt;</code> par votre clé API (affichée une seule fois à la création)
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
