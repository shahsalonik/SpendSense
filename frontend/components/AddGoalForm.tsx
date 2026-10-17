"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import type { SavingsGoal } from "@/lib/types";

interface AddGoalFormProps {
  onAddGoal: (goal: SavingsGoal) => void;
}

function getLocalToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AddGoalForm({ onAddGoal }: AddGoalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentSaved, setCurrentSaved] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [minDate, setMinDate] = useState("");
  const [dateError, setDateError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = Number(targetAmount);
    const saved = Number(currentSaved);
    const today = getLocalToday();
    setMinDate(today);

    if (deadline && deadline < today) {
      setDateError("Choose today or a future date.");
      return;
    }

    if (
      !name.trim() ||
      !deadline ||
      !Number.isFinite(target) ||
      target <= 0 ||
      !Number.isFinite(saved) ||
      saved < 0
    ) {
      return;
    }

    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: name.trim(),
      target_amount: target,
      current_saved: saved,
      deadline,
    };

    onAddGoal(newGoal);

    setName("");
    setTargetAmount("");
    setCurrentSaved("0");
    setDeadline("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setMinDate(getLocalToday());
          setDateError("");
          setIsOpen(true);
        }}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <Plus size={18} />
        Add Goal
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="col-span-2 min-w-0 rounded-2xl border border-indigo-200 bg-surface p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Create a Savings Goal</h3>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close form"
          className="text-gray-500 hover:text-gray-900"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-700">
            What are you saving for?
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Down payment on a house"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">
            Target amount ($)
          </label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="15000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">
            Already saved ($)
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={currentSaved}
            onChange={(e) => setCurrentSaved(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="goal-deadline" className="mb-1 block text-sm text-gray-700">
            Target date
          </label>
          <input
            required
            type="date"
            id="goal-deadline"
            min={minDate}
            aria-describedby="goal-deadline-help"
            aria-invalid={dateError ? true : undefined}
            onFocus={() => setMinDate(getLocalToday())}
            onInvalid={(e) => {
              if (e.currentTarget.validity.rangeUnderflow) {
                setDateError("Choose today or a future date.");
              }
            }}
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              setDateError("");
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
          <p id="goal-deadline-help" className={`mt-1 text-xs ${dateError ? "text-red-600" : "text-gray-500"}`} role={dateError ? "alert" : undefined}>
            {dateError || "Choose today or a future date."}
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="mt-5 rounded-xl bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
      >
        Save Goal
      </button>
    </form>
  );
}
