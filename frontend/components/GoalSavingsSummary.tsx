"use client";

import { useEffect, useState } from "react";
import type { SavingsGoal } from "@/lib/types";

export default function GoalSavingsSummary({ goals }: { goals: SavingsGoal[] }) {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    // Read the browser's local date after hydration, not during prerendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
  }, []);

  if (!today || goals.length === 0) return null;

  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  let total = 0;
  let activeCount = 0;
  let overdueCount = 0;

  for (const goal of goals) {
    const remaining = Math.max(0, goal.target_amount - goal.current_saved);
    if (remaining === 0) continue;

    const deadline = new Date(`${goal.deadline}T00:00:00`);
    const days = Math.round(
      (Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) - currentDay) /
        86_400_000,
    );
    if (!Number.isFinite(days)) continue;
    if (days < 0) {
      overdueCount += 1;
      continue;
    }

    activeCount += 1;
    total += days <= 30 ? remaining : remaining * 30 / days;
  }

  if (activeCount === 0 && overdueCount === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-900">Savings needed over the next 30 days</p>
          <p className="mt-1 text-xs text-indigo-700">
            Across {activeCount} active {activeCount === 1 ? "goal" : "goals"} · Based on your deadlines
          </p>
        </div>
        <p className="text-2xl font-semibold text-indigo-900 tabular-nums">
          {total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </p>
      </div>
      {overdueCount > 0 && (
        <p className="mt-2 text-xs text-indigo-700">
          {overdueCount} overdue {overdueCount === 1 ? "goal is" : "goals are"} excluded. Update their deadlines to include them.
        </p>
      )}
    </div>
  );
}
