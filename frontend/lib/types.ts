// A recurring subscription detected from transaction history
export interface Subscription {
  merchant: string;
  previous_amount: number;
  current_amount: number;
  monthly_increase: number;
  price_increased: boolean;
}

// Spending grouped by category
export interface SpendingCategory {
  category: string;
  amount: number;
}

// Monthly spending summary
export interface SpendingSummary {
  categories: SpendingCategory[];
}

// A user's savings goal
export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_saved: number;
  deadline: string;
}

// An alert detected by the backend
export interface FinancialInsight {
  type: string;
  merchant: string;
  monthly_increase: number;
}

// A message in the AI chat
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Response from the Backboard-powered chat endpoint
export interface ChatResponse {
  reply: string;
  assistant_id: string;
  thread_id: string;
}