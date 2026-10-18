import type {
  Subscription,
  SpendingSummary,
  SavingsGoal,
  FinancialInsight,
  ChatResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Reusable function for making API requests
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
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
  getGoals: () => request<{ goals: SavingsGoal[] }>("/api/goals"),

  saveGoal: (goal: Omit<SavingsGoal, "id">) =>
    request<{ success: boolean; id: string }>("/api/goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goal),
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
