
"use client";

import { Target, CalendarDays, TrendingUp, Trash2 } from "lucide-react";
import type { SavingsGoal } from "@/lib/types";

interface GoalCardProps {
  goal: SavingsGoal;
  onDelete?: (id: string) => void;
}

export default function GoalCard({
  goal,
  onDelete,
}: GoalCardProps) {
  const progress =
    goal.target_amount > 0
      ? Math.min(
          (goal.current_saved / goal.target_amount) * 100,
          100
        )
      : 0;

  const remaining = Math.max(
    goal.target_amount - goal.current_saved,
    0
  );

  const deadline = new Date(`${goal.deadline}T00:00:00`);
  const today = new Date();

  const monthsRemaining = Math.max(
    0,
    (deadline.getFullYear() - today.getFullYear()) * 12 +
      (deadline.getMonth() - today.getMonth())
  );

  const monthlySavingsNeeded =
    remaining > 0 && monthsRemaining > 0
      ? remaining / monthsRemaining
      : 0;

  const deadlinePassed = deadline.getTime() < today.getTime();
  const isComplete = remaining === 0;

  function handleDelete() {
    if (!onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.name}"?`
    );

    if (confirmed) {
      onDelete(goal.id);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3">
            <Target className="text-indigo-600" size={22} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {goal.name}
            </h3>

            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <CalendarDays size={14} />
              <span>
                {deadline.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            {progress.toFixed(0)}%
          </span>

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              title="Delete goal"
              aria-label={`Delete ${goal.name}`}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">Saved so far</p>
          <p className="text-2xl font-bold text-gray-900">
            ${goal.current_saved.toLocaleString()}
          </p>
        </div>

        <p className="text-sm text-gray-500">
          of ${goal.target_amount.toLocaleString()}
        </p>
      </div>

      <div className="mb-5 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={17} className="text-indigo-600" />

          <p className="text-sm font-medium text-gray-800">
            {isComplete
              ? "Goal achieved!"
              : deadlinePassed
                ? "Deadline has passed"
                : monthsRemaining === 0
                  ? "Deadline is this month"
                  : "Recommended monthly savings"}
          </p>
        </div>

        {isComplete ? (
          <p className="mt-2 text-sm text-green-700">
            You've reached your savings target!
          </p>
        ) : deadlinePassed ? (
          <p className="mt-2 text-sm text-gray-600">
            You still need ${remaining.toLocaleString()}.
          </p>
        ) : monthsRemaining === 0 ? (
          <p className="mt-2 text-sm text-gray-600">
            You need ${remaining.toLocaleString()} more
            before your deadline.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xl font-bold text-indigo-700">
              $
              {monthlySavingsNeeded.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
              /month
            </p>

            <p className="mt-1 text-xs text-gray-500">
              To save the remaining ${remaining.toLocaleString()}
              {" "}over approximately {monthsRemaining} months.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
