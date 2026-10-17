
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Wallet } from "lucide-react";
import type { SpendingCategory } from "@/lib/types";

interface SpendingOverviewProps {
  categories: SpendingCategory[];
}

const COLORS = [
  "#6366f1",
  "#06b6d4",
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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

      <div className="mb-4">
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

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-500">
          No spending data available yet.
        </div>
      ) : (
        <>
          <div className="h-72 w-full">
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

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-3">
            {categories.map((item, index) => {
              const percentage =
                totalSpending > 0
                  ? (item.amount / totalSpending) * 100
                  : 0;

              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />

                    <span className="text-sm text-gray-700">
                      {item.category}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${item.amount.toFixed(2)}
                    </span>

                    <span className="ml-2 text-xs text-gray-500">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
