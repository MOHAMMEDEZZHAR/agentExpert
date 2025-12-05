"use client"

import React, { useState, useEffect } from "react"
import { Zap, Trash2, Copy, Bot, Target, BookOpen, Loader2 } from "lucide-react"
import type { Agent } from "@/lib/api"

interface AgentCardProps {
  agent: Agent
  onDelete?: () => void
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Vérifier si l'agent est déjà déployé au chargement
  useEffect(() => {
    const checkDeployment = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const res = await fetch(`http://localhost:8000/api/agents/${agent.id}/deployment`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          setDeployed(true)
        }
      } catch (err) {
        // L'agent n'est pas déployé, c'est normal
      }
    }
    checkDeployment()
  }, [agent.id])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet agent pour toujours ?")) return
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(`http://localhost:8000/api/agents/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        window.location.reload()
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur réseau lors de la suppression")
    }
  }

  const handleDeploy = async () => {
    // Si l'agent est déjà déployé, afficher une alerte
    if (deployed) {
      alert("Cet agent est déjà déployé !")
      return
    }
    
    setDeploying(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await fetch(`http://localhost:8000/api/agents/${agent.id}/deploy`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (res.ok) {
        setDeployed(true)
        setApiKey(data.api_key)
        alert(
          "Agent déployé avec succès !\n\nLa clé API est maintenant affichée sous la carte de l'agent.\n\nCopiez d'abord votre clé API maintenant, puis allez sur la page Déploiements pour copier l'ID complet de votre agent."
        )
      } else {
        alert(`Erreur: ${data.detail || "Impossible de déployer l'agent"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Erreur réseau lors du déploiement")
    } finally {
      setDeploying(false)
    }
  }

  const handleCopyApiKey = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setApiKey(null)
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

      <div className="mt-6 flex gap-2">
        <button
          onClick={handleDeploy}
          disabled={deploying}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {deploying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Déploiement...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Déployer
            </>
          )}
        </button>
        <button
          onClick={() => handleDelete(agent.id)}
          className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm font-medium"
        >
          Supprimer
        </button>
      </div>
      {apiKey && (
        <div className="mt-4 p-3 bg-slate-900 text-xs rounded border border-slate-700 flex items-center gap-2">
          <span className="text-gray-300">
            Clé API : <span className="text-cyan-400 break-all">{apiKey}</span>
          </span>
          <button
            onClick={handleCopyApiKey}
            className="ml-auto px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-gray-100"
          >
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}
    </div>
  )
}
