"use client";

import type { SavingsGoal } from "@/lib/types";

export default function GoalSavingsSummary({
  goals,
}: {
  goals: SavingsGoal[];
}) {
  if (goals.length === 0) return null;

  let total = 0;
  let activeCount = 0;
  let overdueCount = 0;

  // Use the same server-calculated pace the goal cards show.
  for (const goal of goals) {
    const pace = goal.pace;
    if (!pace || pace.status === "complete") continue;
    if (pace.status === "overdue") {
      overdueCount += 1;
      continue;
    }

    activeCount += 1;
    // Goals due within 30 days need their full remaining balance this month.
    total +=
      pace.status === "monthly" && pace.monthly_needed !== null
        ? pace.monthly_needed
        : pace.remaining;
  }

  if (activeCount === 0 && overdueCount === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-900">
            Savings needed over the next 30 days
          </p>
          <p className="mt-1 text-xs text-indigo-700">
            Across {activeCount} active {activeCount === 1 ? "goal" : "goals"} ·
            Based on your deadlines
          </p>
        </div>
        <p className="text-2xl font-semibold text-indigo-900 tabular-nums">
          {total.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </p>
      </div>
      {overdueCount > 0 && (
        <p className="mt-2 text-xs text-indigo-700">
          {overdueCount} overdue {overdueCount === 1 ? "goal is" : "goals are"}{" "}
          excluded. Update their deadlines to include them.
        </p>
      )}
    </div>
  );
}
