"use client";

import { useEffect, useState } from "react";
import { Trash2, CalendarDays, Target } from "lucide-react";
import type { SavingsGoal } from "@/lib/types";

interface GoalCardProps {
  goal: SavingsGoal;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const [today, setToday] = useState<Date | null>(null);

  // Get current date only after mounting in the browser.
  // This prevents Next.js prerendering errors.
  useEffect(() => {
    setToday(new Date());
  }, []);

  const progress =
    goal.target_amount > 0
      ? Math.min(
          100,
          Math.max(0, (goal.current_saved / goal.target_amount) * 100),
        )
      : 0;

  const remaining = Math.max(0, goal.target_amount - goal.current_saved);

  const deadline = new Date(`${goal.deadline}T00:00:00`);

  // Compare calendar dates so time of day and daylight saving do not affect the rate.
  const daysRemaining = today
    ? Math.round(
        (Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) -
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const monthsRemaining = daysRemaining === null ? null : Math.max(0, daysRemaining / 30.44);
  const isDueSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining < 30;

  const monthlyNeeded =
    monthsRemaining === null
      ? null
      : monthsRemaining > 0
        ? remaining / monthsRemaining
        : remaining > 0
          ? null
          : 0;

  const isOverdue =
    daysRemaining !== null && daysRemaining < 0 && remaining > 0;

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
          onClick={() => onDelete(goal.id)}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${goal.name}`}
          title="Delete goal"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

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

        {monthsRemaining === null ? (
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
              {formatCurrency(isDueSoon && daysRemaining !== null ? remaining / (daysRemaining / 7) : monthlyNeeded)}/{isDueSoon ? "week" : "month"}
            </p>
            {isDueSoon && daysRemaining !== null && daysRemaining > 0 && (
              <p className={`mt-1 text-xs ${savingsColors.label}`}>
                About {formatCurrency(remaining / daysRemaining)}/day
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
