"""Deterministic goal figures shared by the dashboard API and AI context."""
from datetime import date
from decimal import Decimal, ROUND_HALF_UP


def goal_with_pace(goal, as_of=None):
    as_of = as_of or date.today()
    remaining = max(Decimal('0'), Decimal(str(goal['target_amount'])) - Decimal(str(goal['current_saved'])))
    days = (date.fromisoformat(str(goal['deadline'])) - as_of).days
    def money(value):
        return float(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    status = 'complete' if remaining == 0 else 'overdue' if days < 0 else 'due_today' if days == 0 else 'weekly' if days < 30 else 'monthly'
    pace = {
        'as_of': as_of.isoformat(), 'days_remaining': days,
        'remaining': money(remaining), 'status': status,
        'monthly_needed': money(remaining * Decimal('30.44') / days) if days > 0 else None,
        'weekly_needed': money(remaining * 7 / days) if days > 0 else None,
        'daily_needed': money(remaining / days) if days > 0 else None,
    }
    return {**goal, 'pace': pace}
