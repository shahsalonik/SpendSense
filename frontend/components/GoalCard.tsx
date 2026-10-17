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

  // Calculate remaining months, including partial months.
  const monthsRemaining = today
    ? Math.max(
        0,
        (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      )
    : null;

  const monthlyNeeded =
    monthsRemaining === null
      ? null
      : monthsRemaining > 0
        ? remaining / monthsRemaining
        : remaining > 0
          ? null
          : 0;

  const isOverdue =
    today !== null && deadline.getTime() < today.getTime() && remaining > 0;

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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

      {/* Monthly savings recommendation */}
      <div className="rounded-lg bg-indigo-50 p-3">
        <p className="mb-1 text-xs font-medium text-indigo-700">
          Recommended Monthly Savings
        </p>

        {monthsRemaining === null ? (
          <p className="text-sm text-indigo-600">Calculating...</p>
        ) : remaining === 0 ? (
          <p className="font-semibold text-green-700">Goal reached!</p>
        ) : isOverdue ? (
          <p className="text-sm font-medium text-red-600">
            Deadline passed — update your goal deadline.
          </p>
        ) : monthlyNeeded !== null ? (
          <p className="text-xl font-bold text-indigo-900">
            {formatCurrency(monthlyNeeded)}/month
          </p>
        ) : (
          <p className="text-sm text-red-600">
            Deadline is too close to calculate monthly savings.
          </p>
        )}
      </div>
    </div>
  );
}
