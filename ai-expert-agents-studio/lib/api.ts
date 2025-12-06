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
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })

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

export async function updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
  return apiRequest<Agent>(`/api/agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(agent),
  })
}

export async function deleteAgent(id: string): Promise<void> {
  return apiRequest<void>(`/api/agents/${id}`, {
    method: "DELETE",
  })
}

export interface Deployment {
  id: string
  agent_id: string
  status: string
  created_at: string
}

export async function getDeployments(): Promise<Deployment[]> {
  return apiRequest<Deployment[]>("/api/deployments")
}

export interface Run {
  id: string
  agent_id: string
  status: string
  created_at: string
}

export async function createRun(agentId: string, topic: string): Promise<Run> {
  return apiRequest<Run>("/api/run", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, topic }),
  })
}

export async function getRuns(): Promise<Run[]> {
  return apiRequest<Run[]>("/api/runs")
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
  id: string
  run_id: string
  result?: string
  result_long?: string
}

export async function getCrewResult(runId: string): Promise<CrewResult> {
  return apiRequest<CrewResult>(`/api/crew/result/${runId}`)
}
