"""Validate assistant goal requests before exposing them to the dashboard."""
import json
import math
import re
from datetime import date


def extract_goal_action(reply: str):
    if "```goal_action" not in reply:
        return reply, None
    blocks = re.findall(r"```goal_action\s*\n(.*?)\n```", reply, re.DOTALL)
    try:
        if len(blocks) != 1:
            raise ValueError("Expected one goal")
        goal = json.loads(blocks[0])
        if not isinstance(goal, dict):
            raise ValueError("Invalid goal")
        name = goal.get("name")
        if not isinstance(name, str) or not name.strip() or len(name) > 200:
            raise ValueError("Invalid name")
        for key in ("target_amount", "current_saved"):
            value = goal.get(key)
            if type(value) not in (int, float) or not math.isfinite(value):
                raise ValueError("Invalid amount")
        if goal["target_amount"] <= 0 or goal["current_saved"] < 0:
            raise ValueError("Invalid amount")
        deadline = goal.get("deadline")
        if not isinstance(deadline, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", deadline):
            raise ValueError("Invalid deadline")
        date.fromisoformat(deadline)
        # The browser checks against the user's local date before adding.
        return "", {"name": name.strip(), "target_amount": goal["target_amount"],
                    "current_saved": goal["current_saved"], "deadline": deadline}
    except (ValueError, TypeError, OverflowError):
        return ("I couldn't create that goal. Please provide a name, a positive target "
                "amount, and a deadline of today or later.", None)
