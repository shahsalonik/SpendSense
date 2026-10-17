
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Wallet } from "lucide-react";
import type { SpendingCategory } from "@/lib/types";

interface SpendingOverviewProps {
  categories: SpendingCategory[];
}

const COLORS = [
  "#6273c5",
  "#309baf",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];

export default function SpendingOverview({
  categories,
}: SpendingOverviewProps) {
  const totalSpending = categories.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const chartData = categories
    .filter((item) => item.amount > 0)
    .map((item) => ({
      name: item.category,
      value: item.amount,
    }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-3">
          <Wallet className="text-indigo-600" size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Spending Breakdown
          </h2>
          <p className="text-sm text-gray-500">
            Where your money is going
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-gray-500">
          No spending data available yet.
        </div>
      ) : (
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10">
          <div className="mx-auto h-56 w-full max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    `$${Number(value).toFixed(2)}`
                  }
                />


              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="min-w-0">
      <div className="mb-5">
        <p className="text-sm text-gray-500">
          Total spending
        </p>
        <p className="text-3xl font-bold text-gray-900">
          ${totalSpending.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

          <div className="space-y-4">
            {chartData.map((item, index) => {
              const percentage =
                totalSpending > 0
                  ? (item.value / totalSpending) * 100
                  : 0;

              return (
                <div
                  key={item.name}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />

                    <span className="text-sm text-gray-700">
                      {item.name}
                    </span>
                  </div>

                  <div className="shrink-0 text-right tabular-nums">
                    <span className="text-sm font-medium text-gray-900">
                      ${item.value.toFixed(2)}
                    </span>

                    <span className="ml-2 text-xs text-gray-500">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: COLORS[index % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
