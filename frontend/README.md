# 💡 SpendSense

> Personal finance learning and planning that connects everyday student spending and subscriptions to long-term savings goals with an AI coach.

🚀 **Live Deployment:** [View SpendSense on Vercel](spend-sense-7a29.vercel.app)

---

## 📌 Overview

Small, recurring expenses compound quickly. SpendSense visualizes spending patterns, detects subscription price hikes, estimates required savings velocities, and offers an AI financial coach to guide realistic tradeoffs without making unrealistic assumptions.

---

## ✨ Core Features

- 📊 **Spending Dashboard:** Category totals, percentage distributions, and an interactive Recharts doughnut chart driven by backend SQL aggregations.
- 🔔 **Subscription Detection:** Identifies recurring charges using a 25–35 day interval heuristic across 3+ charges, flags price bumps (e.g., StreamFlix rising from $11.99 to $16.99), and projects 12-month annualized costs.
- 🎯 **Goal Impact Engine:** Links subscription increases directly to savings goals, calculating daily/weekly paces for immediate targets (<30 days) and monthly targets for long-term goals.
- 🤖 **AI Financial Coach (Backboard):** An assistant that pulls live database context, remembers preferences across threads, explains calculations step-by-step, and creates savings goals directly from conversational prompts.

---

## 🛠️ Architecture & Tech Stack

```text
Next.js Frontend (React, TypeScript, Tailwind, Recharts)
   │
   ▼  API Proxy (Origin checks & shared secret)
FastAPI Backend (Python)
   ├── PostgreSQL / Tiger Data (Transactions hypertable via TimescaleDB, Goals)
   ├── Capital One Nessie API (Sandbox customer, account, and purchase pipeline)
   └── Backboard (Per-user assistant threads with automatic memory)
