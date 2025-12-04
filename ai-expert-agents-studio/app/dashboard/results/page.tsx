"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { getCrewResult, getToken } from "@/lib/api"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { exportToPDF } from "@/components/pdf-export"
import { useRouter } from "next/navigation"

export default function ResultsPage() {
  const [result, setResult] = useState<string | null>(null)
  const [topic, setTopic] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string>("pending")
  const [runId, setRunId] = useState<string | null>(null)
  const router = useRouter()
 

  // Redirect to login if no token present
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    const storedRunId = localStorage.getItem("lastRunId")
    const storedTopic = localStorage.getItem("lastTopic")

    if (storedRunId) {
      setRunId(storedRunId)
      setTopic(storedTopic || "")
    } else {
      setLoading(false)
    }
  }, [router])

  // Polling effect: immediate check, then interval; clears when completed
  useEffect(() => {
    if (!runId) return

    let polling: ReturnType<typeof setInterval>

    const checkResult = async () => {
      try {
        const data = await getCrewResult(runId)
        setStatus(data.status)
        if (data.status === "completed" && (data.result_long || data.result)) {
          setResult(data.result_long ?? data.result ?? null)
          if (polling) clearInterval(polling)
        }
      } catch (err) {
        console.error(err)
        setStatus("error")
      } finally {
        setLoading(false)
      }
    }

    polling = setInterval(checkResult, 3000)
    checkResult()

    return () => {
      if (polling) clearInterval(polling)
    }
  }, [runId])

  const handleExportPDF = async () => {
    if (!result || !topic) return
    setExporting(true)
    try {
      await exportToPDF(topic, result)
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
    } finally {
      setExporting(false)
    }
  }

  const handleRefresh = async () => {
    if (!runId) return
    setLoading(true)
    try {
      const data = await getCrewResult(runId)
      setStatus(data.status)
      if (data.status === "completed" && (data.result_long || data.result)) {
        setResult(data.result_long ?? data.result ?? null)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du résultat:", err)
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Résultats</h1>
            <p className="text-muted-foreground">Consultez et exportez vos résultats</p>
          </div>
        </div>

        {result && (
          <div className="flex gap-3 items-center">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter PDF
                </>
              )}
            </button>
            {/* lastUpdated removed per request */}
          </div>
        )}
      </div>

      {!runId ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun résultat</h3>
          <p className="text-muted-foreground">
            Lancez une mission depuis la page &quot;Lancer un Topic&quot; pour voir les résultats ici.
          </p>
        </div>
      ) : loading && !result ? (
        <div className="bg-card border border-border rounded-xl p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Traitement en cours...</h3>
            <p className="text-muted-foreground text-center">
              Les agents travaillent sur votre demande. Cela peut prendre quelques instants.
            </p>
          </div>
        </div>
      ) : status === "error" ? (
        <div className="bg-card border border-destructive/50 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Erreur</h3>
          <p className="text-muted-foreground mb-4">Une erreur est survenue lors de la récupération du résultat.</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2.5 rounded-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {topic && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Topic</div>
              <p className="text-foreground">{topic}</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-xs font-medium text-primary uppercase tracking-wider mb-4">Résultat</div>
            <MarkdownRenderer content={result} />
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">En attente des résultats...</h3>
            <p className="text-muted-foreground text-center">Statut: {status}</p>
          </div>
        </div>
      )}
    </div>
  )
}
