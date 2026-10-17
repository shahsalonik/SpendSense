"use client";

import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";

import AddGoalForm from "@/components/AddGoalForm";
import Chat from "@/components/Chat";
import SubscriptionCard from "@/components/SubscriptionCard";
import GoalCard from "@/components/GoalCard";
import GoalSavingsSummary from "@/components/GoalSavingsSummary";
import SpendingOverview from "@/components/SpendingOverview";

import { api } from "@/lib/api";

import type { Subscription, SavingsGoal, SpendingCategory } from "@/lib/types";

// Temporary goals until Person A's goals API is ready
const sampleGoals: SavingsGoal[] = [
  {
    id: "goal-1",
    name: "New Car",
    target_amount: 15000,
    current_saved: 4500,
    deadline: "2027-06-30",
  },
  {
    id: "goal-2",
    name: "Emergency Fund",
    target_amount: 5000,
    current_saved: 2100,
    deadline: "2027-03-31",
  },
  {
    id: "goal-3",
    name: "Vacation",
    target_amount: 2000,
    current_saved: 650,
    deadline: "2026-12-31",
  },
];

export default function Home() {
  // Savings goals
  const [goals, setGoals] = useState<SavingsGoal[]>(sampleGoals);
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  // Live Tiger Data financial information
  const [spending, setSpending] = useState<SpendingCategory[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // Fetch live spending and subscriptions
  useEffect(() => {
    async function loadFinancialData() {
      try {
        setLoading(true);
        setFinancialError(null);

        const [summaryData, subscriptionData] = await Promise.all([
          api.getSummary(),
          api.getSubscriptions(),
        ]);

        setSpending(summaryData.categories);
        setSubscriptions(subscriptionData.subscriptions);
      } catch (error) {
        console.error("Failed to load financial data:", error);
        setFinancialError(
          "Unable to load financial data. Please make sure the backend is running.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadFinancialData();
  }, []);

  // Load saved goals from localStorage
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem("spendsense-goals");

      if (savedGoals !== null) {
        const parsed = JSON.parse(savedGoals);

        if (Array.isArray(parsed)) {
          setGoals(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load saved goals:", error);
    } finally {
      setGoalsLoaded(true);
    }
  }, []);

  // Persist goals whenever they change
  useEffect(() => {
    if (goalsLoaded) {
      localStorage.setItem("spendsense-goals", JSON.stringify(goals));
    }
  }, [goals, goalsLoaded]);

  function handleAddGoal(goal: SavingsGoal) {
    setGoals((prev) => [...prev, goal]);
  }

  function handleDeleteGoal(id: string) {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
              <Landmark size={21} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h1 className="font-brand text-5xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-6xl">
              SpendSense
            </h1>
          </div>
          <p className="text-sm text-gray-600 sm:text-base">
            Spend smarter. Reach your goals.
          </p>
        </header>

        {/* Financial data error */}
        {financialError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {financialError}
          </div>
        )}

        {/* Spending Overview */}
        <section className="mb-8">
          {loading ? (
            <div className="rounded-xl bg-surface p-6 text-gray-500">
              Loading spending data...
            </div>
          ) : financialError ? (
            <div className="rounded-xl bg-surface p-6 text-gray-500">
              Spending data unavailable.
            </div>
          ) : (
            <SpendingOverview categories={spending} />
          )}
        </section>

        {/* Subscriptions */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Your Subscriptions
          </h2>

          {loading ? (
            <div className="rounded-xl bg-surface p-6 text-gray-500">
              Detecting subscriptions...
            </div>
          ) : financialError ? (
            <div className="rounded-xl bg-surface p-6 text-gray-500">
              Subscription data unavailable.
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="rounded-xl bg-surface p-6 text-gray-500">
              No recurring subscriptions detected.
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.merchant}
                  subscription={subscription}
                  goals={goals}
                />
              ))}
            </div>
          )}
        </section>

        {/* Savings Goals */}
        <section className="mb-8">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              My Savings Goals
            </h2>

            <AddGoalForm onAddGoal={handleAddGoal} />
          </div>

          {goalsLoaded && <GoalSavingsSummary goals={goals} />}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
          </div>
        </section>

        {/* Backboard AI Assistant */}
        {!loading && !financialError && (
          <Chat
            goals={goals}
            subscriptions={subscriptions}
            spending={{ categories: spending }}
            onAddGoal={handleAddGoal}
          />
        )}
      </div>
    </main>
  );
}
