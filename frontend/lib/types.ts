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

export interface GoalPace {
  as_of: string;
  days_remaining: number;
  remaining: number;
  status: "monthly" | "weekly" | "due_today" | "overdue" | "complete";
  monthly_needed: number | null;
  weekly_needed: number | null;
  daily_needed: number | null;
}

// A user's savings goal
export interface SavingsGoal {
  pace?: GoalPace;
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
  goal_to_create?: Omit<SavingsGoal, "id"> | null;
  reply: string;
  assistant_id: string;
  thread_id: string;
}