const API_BASE_URL = "http://localhost:8000"

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export function setToken(token: string): void {
  localStorage.setItem("token", token)
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("lastRunId")
    localStorage.removeItem("lastTopic")
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    removeToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Non autorisé")
  }

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`)
  }

  return response.json()
}

export async function login(username: string, password: string): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error("Identifiants invalides")
  }

  const data = await response.json()
  // Le backend retourne access_token, on le mappe à token
  return { token: data.access_token }
}

export interface Agent {
  id: string
  name: string
  role: string
  goal: string
  backstory: string
}

export async function getAgents(): Promise<Agent[]> {
  return apiRequest<Agent[]>("/api/agents")
}

export async function createAgent(agent: Omit<Agent, "id">): Promise<Agent> {
  return apiRequest<Agent>("/api/agents", {
    method: "POST",
    body: JSON.stringify(agent),
  })
}

export interface CrewRunResponse {
  run_id: string
  status: string
}

export async function runCrew(topic: string, agentIds: string[]): Promise<CrewRunResponse> {
  return apiRequest<CrewRunResponse>("/api/crew/run", {
    method: "POST",
    body: JSON.stringify({ topic, agent_ids: agentIds }),
  })
}

export interface CrewResult {
  status: string
  // backend returns `result_long`; keep `result` as optional alias
  result?: string
  result_long?: string
}

export async function getCrewResult(runId: string): Promise<CrewResult> {
  return apiRequest<CrewResult>(`/api/crew/result/${runId}`)
}
