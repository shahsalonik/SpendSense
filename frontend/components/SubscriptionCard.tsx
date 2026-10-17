
"use client";

import { useState } from "react";
import {
  Repeat,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";

import type { Subscription, SavingsGoal } from "@/lib/types";

interface SubscriptionCardProps {
  subscription: Subscription;
  goals: SavingsGoal[];
}

export default function SubscriptionCard({
  subscription,
  goals,
}: SubscriptionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    merchant,
    previous_amount,
    current_amount,
    monthly_increase,
    price_increased,
  } = subscription;

  const hasIncrease = price_increased && monthly_increase > 0;
  const annualIncrease = monthly_increase * 12;

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3">
            <Repeat className="text-indigo-600" size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {merchant}
            </h3>
            <p className="text-sm text-gray-500">
              Recurring subscription
            </p>
          </div>
        </div>

        {hasIncrease && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle size={13} />
            Price increased
          </span>
        )}
      </div>

      <div>
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
            ${current_amount.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">/month</span>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {current_amount === previous_amount
            ? "Price unchanged"
            : `Previously $${previous_amount.toFixed(2)}/month`}
        </p>
      </div>

      {hasIncrease && (
        <>
          <div className="mt-4 rounded-xl bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              +${monthly_increase.toFixed(2)}/month
            </p>
            <p className="mt-1 text-xs text-amber-700">
              That&apos;s an additional ${annualIncrease.toFixed(2)}
              {" "}per year if the new price continues.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="mt-4 flex w-full items-center justify-between border-t border-gray-100 pt-4 text-left text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            <span>How does this affect my goals?</span>
            {expanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>

          {expanded && (
            <div className="mt-4 space-y-3">
              {goals.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Add a savings goal to see how this
                  subscription affects your plans.
                </p>
              ) : (
                goals.map((goal) => {
                  const remaining = Math.max(
                    goal.target_amount - goal.current_saved,
                    0
                  );

                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl bg-indigo-50 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Target
                          size={16}
                          className="text-indigo-600"
                        />
                        <h4 className="font-semibold text-gray-900">
                          {goal.name}
                        </h4>
                      </div>

                      {remaining === 0 ? (
                        <p className="text-sm text-green-700">
                          You&apos;ve already reached this goal!
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700">
                            The additional{" "}
                            <strong>
                              ${annualIncrease.toFixed(2)}/year
                            </strong>{" "}
                            spent on {merchant} could otherwise
                            contribute toward this goal.
                          </p>

                          <p className="mt-2 text-xs text-gray-500">
                            ${remaining.toLocaleString()} remaining
                            to reach your target.
                          </p>
                        </>
                      )}
                    </div>
                  );
                })
              )}

              {goals.length > 1 && (
                <p className="text-xs text-gray-500">
                  These are alternative uses of the same
                  money, not additional savings for every goal.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
