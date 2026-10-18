import type {
  Subscription,
  SpendingSummary,
  SavingsGoal,
  FinancialInsight,
  ChatResponse,
} from "./types";

const BASE_URL = "/api/backend";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Reusable function for making API requests
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint.replace(/^\/api/, "")}`, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: { ...options?.headers, "X-SpendSense-Client": "web" },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !endpoint.startsWith("/api/auth/")) {
      window.dispatchEvent(new Event("spendsense-session-expired"));
    }
    throw new ApiError(response.status, typeof data.detail === "string" ? data.detail : "Request failed. Please try again.");
  }

  return response.json();
}

export interface AuthUser { id: string; email: string }
const authPost = <T>(path: string, body = {}) => request<T>(`/api/auth/${path}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
export const authApi = {
  me: () => request<{ user: AuthUser }>("/api/auth/me"),
  login: (email: string, password: string) => authPost<{user: AuthUser}>("login", {email, password}),
  signup: (email: string, password: string) => authPost<{user: AuthUser}>("signup", {email, password}),
  logout: () => authPost("logout"),
  bootstrap: () => authPost("bootstrap"),
};

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const api = {
  // Get spending totals grouped by category
  getSummary: () => request<SpendingSummary>("/api/summary"),

  // Get recurring subscriptions and price changes
  getSubscriptions: () =>
    request<{ subscriptions: Subscription[] }>("/api/subscriptions"),

  // Get financial alerts
  getInsights: () => request<{ insights: FinancialInsight[] }>("/api/insights"),

  // Get the user's saved goals
  getGoals: () => request<{ goals: SavingsGoal[] }>(`/api/goals?as_of=${localToday()}`),

  saveGoal: (goal: Omit<SavingsGoal, "id">, asOf = localToday()) =>
    request<{ success: boolean; id: string; goal: SavingsGoal }>("/api/goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...goal, as_of: asOf }),
    }),

  deleteGoal: (id: string) =>
    request<{ success: boolean }>(`/api/goals/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Send a message to the Backboard AI assistant

  sendChat: (
    message: string,
    assistantId: string | null,
    threadId: string | null,
    goals: SavingsGoal[],
    subscriptions: Subscription[],
    spending: SpendingSummary,
  ) =>
    request<ChatResponse>("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        as_of: goals[0]?.pace?.as_of ?? localToday(),
        assistant_id: assistantId,
        thread_id: threadId,
        context: {
          goals,
          subscriptions,
          spending,
        },
      }),
    }),
};
