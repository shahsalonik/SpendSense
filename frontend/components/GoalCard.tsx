"use client";

import { useState } from "react";
import { Trash2, CalendarDays, Target } from "lucide-react";
import type { SavingsGoal } from "@/lib/types";

interface GoalCardProps {
  goal: SavingsGoal;
  onDelete: (id: string) => Promise<void>;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(goal.id);
    } catch {
      setDeleteError("Unable to delete this goal. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const progress =
    goal.target_amount > 0
      ? Math.min(
          100,
          Math.max(0, (goal.current_saved / goal.target_amount) * 100),
        )
      : 0;

  const remaining = goal.pace?.remaining ?? Math.max(0, goal.target_amount - goal.current_saved);

  const deadline = new Date(`${goal.deadline}T00:00:00`);

  const pace = goal.pace;
  const daysRemaining = pace?.days_remaining ?? null;
  const isDueSoon = pace?.status === "weekly";
  const monthlyNeeded = pace?.monthly_needed ?? null;
  const isOverdue = pace?.status === "overdue";

  const savingsColors = remaining === 0
    ? { panel: "bg-[#edf3e9]", label: "text-[#486044]", amount: "text-[#30472e]" }
    : isOverdue
      ? { panel: "bg-red-50", label: "text-red-800", amount: "text-red-900" }
      : daysRemaining === 0
      ? { panel: "bg-amber-50", label: "text-amber-800", amount: "text-amber-900" }
      : isDueSoon
        ? { panel: "bg-[#edf3e9]", label: "text-[#486044]", amount: "text-[#30472e]" }
        : { panel: "bg-indigo-50", label: "text-indigo-700", amount: "text-indigo-900" };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">{goal.name}</h3>
        </div>

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${goal.name}`}
          title="Delete goal"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {deleteError && <p role="alert" className="mb-3 text-sm text-red-700">{deleteError}</p>}
      {deleting && <p role="status" className="mb-3 text-sm text-gray-500">Deleting...</p>}

      {/* Current savings */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(goal.current_saved)}
          </span>
          <span className="text-sm text-gray-500">
            of {formatCurrency(goal.target_amount)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-4 flex justify-between text-xs text-gray-500">
        <span>{progress.toFixed(0)}% saved</span>
        <span>{formatCurrency(remaining)} remaining</span>
      </div>

      {/* Deadline */}
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
        <CalendarDays className="h-4 w-4" />
        <span>
          Deadline:{" "}
          {deadline.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Savings recommendation */}
      <div className={`rounded-lg p-3 ${savingsColors.panel}`}>
        <p className={`mb-1 text-xs font-medium ${savingsColors.label}`}>
          {remaining === 0
            ? "Savings Goal Complete"
            : isOverdue
              ? "Goal Needs Attention"
              : daysRemaining === 0
                ? "Needed Today"
                : isDueSoon
                  ? "Estimated Weekly Savings Needed"
                  : "Estimated Monthly Savings Needed"}
        </p>

        {!pace ? (
          <p className="text-sm text-indigo-600">Calculating...</p>
        ) : remaining === 0 ? (
          <p className={`font-semibold ${savingsColors.amount}`}>Goal reached!</p>
        ) : isOverdue ? (
          <p className={`text-sm font-medium ${savingsColors.amount}`}>
            Deadline passed — update your goal deadline.
          </p>
        ) : daysRemaining === 0 ? (
          <p className={`text-xl font-bold ${savingsColors.amount}`}>
            {formatCurrency(remaining)}
          </p>
        ) : monthlyNeeded !== null ? (
          <div>
            <p className={`text-xl font-bold ${savingsColors.amount}`}>
              {formatCurrency(isDueSoon ? pace.weekly_needed! : monthlyNeeded)}/{isDueSoon ? "week" : "month"}
            </p>
            {isDueSoon && daysRemaining !== null && daysRemaining > 0 && (
              <p className={`mt-1 text-xs ${savingsColors.label}`}>
                About {formatCurrency(pace.daily_needed!)}/day
                {" "}for the next {daysRemaining} {daysRemaining === 1 ? "day" : "days"}.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-red-600">
            Deadline is too close to calculate monthly savings.
          </p>
        )}
      </div>
    </div>
  );
}
