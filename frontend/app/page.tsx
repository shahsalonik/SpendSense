"use client";
import { useEffect, useState } from "react";
import AddGoalForm from "@/components/AddGoalForm";
import Chat from "@/components/Chat";
import SubscriptionCard from "@/components/SubscriptionCard";
import type { Subscription } from "@/lib/types";
import GoalCard from "@/components/GoalCard";
import type { SavingsGoal } from "@/lib/types";
import SpendingOverview from "@/components/SpendingOverview";
import type { SpendingCategory } from "@/lib/types";
import { api } from "@/lib/api";

const sampleSubscriptions: Subscription[] = [
  {
    merchant: "StreamFlix",
    previous_amount: 11.99,
    current_amount: 16.99,
    monthly_increase: 5,
    price_increased: true,
  },
  {
    merchant: "MusicPlus",
    previous_amount: 9.99,
    current_amount: 9.99,
    monthly_increase: 0,
    price_increased: false,
  },
];

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

// const sampleSpending: SpendingCategory[] = [
//   { category: "Housing", amount: 1200 },
//   { category: "Dining", amount: 420 },
//   { category: "Groceries", amount: 350 },
//   { category: "Entertainment", amount: 180 },
//   { category: "Transportation", amount: 150 },
//   { category: "Shopping", amount: 225 },
// ];

export default function Home() {
  const [goals, setGoals] = useState<SavingsGoal[]>(sampleGoals);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [spending, setSpending] = useState<SpendingCategory[]>([]);

  useEffect(() => {
    async function loadSpending() {
      try {
        const data = await api.getSummary();
        console.log("Spending API response:", data);
        setSpending(data.categories);
      } catch (error) {
        console.error("Failed to load spending data:", error);
      }
    }

    loadSpending();
  }, []);

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
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">SpendSense</h1>

        <p className="mb-8 text-gray-600">
          Your AI-powered financial wellness dashboard
        </p>

        <section className="mb-8">
          <SpendingOverview categories={spending} />
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Your Subscriptions
          </h2>

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            {sampleSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.merchant}
                subscription={subscription}
                goals={goals}
              />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              My Savings Goals
            </h2>

            <AddGoalForm onAddGoal={handleAddGoal} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
          </div>
        </section>

        <Chat
          goals={goals}
          subscriptions={sampleSubscriptions}
          spending={{ categories: spending }}
        />
      </div>
    </main>
  );
}
