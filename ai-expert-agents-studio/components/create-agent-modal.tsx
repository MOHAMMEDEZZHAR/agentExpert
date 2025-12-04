"use client"

import type React from "react"

import { useState } from "react"
import { X, Loader2, Bot } from "lucide-react"
import { createAgent, type Agent } from "@/lib/api"

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (agent: Agent) => void
}

export function CreateAgentModal({ isOpen, onClose, onCreated }: CreateAgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    goal: "",
    backstory: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const agent = await createAgent(formData)
      onCreated(agent)
      setFormData({ name: "", role: "", goal: "", backstory: "" })
      onClose()
    } catch (error) {
      console.error("Erreur lors de la création de l'agent:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Nouvel Agent</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
              placeholder="Agent Analyste"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rôle</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
              placeholder="Expert en analyse de données"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Objectif</label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground resize-none"
              rows={2}
              placeholder="Analyser les données et fournir des insights pertinents"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Backstory</label>
            <textarea
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground resize-none"
              rows={3}
              placeholder="Expert avec 10 ans d'expérience dans l'analyse de données..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'agent"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
