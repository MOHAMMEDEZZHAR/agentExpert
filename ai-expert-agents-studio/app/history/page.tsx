"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HistoryPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
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

    fetchRuns()
  }, [])

  const viewRun = (id: string, topic: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastRunId", id)
      localStorage.setItem("lastTopic", topic)
      router.push("/dashboard/results")
    }
  }

  if (loading) return <div className="text-center py-20 text-xl">Chargement de l'historique...</div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-600">Historique des missions</h1>

        <div className="grid gap-6">
          {runs.length === 0 ? (
            <p className="text-gray-500 text-center py-20">Aucune mission lancée pour le moment</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-cyan-600">{(run.topic || "").substring(0, 80)}{(run.topic || "").length > 80 ? "..." : ""}</h3>
                    <p className="text-sm text-gray-400 mt-1">{run.created_at ? new Date(run.created_at).toLocaleString("fr-FR") : "-"}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${run.status === "completed" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {run.status}
                  </span>
                </div>

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => viewRun(run.id, run.topic)} className="inline-block px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium text-white">
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
                      className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white"
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
