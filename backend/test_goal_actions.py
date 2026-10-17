import json
import unittest
from goal_actions import extract_goal_action


class GoalActionTests(unittest.TestCase):
    def action(self, **changes):
        goal = dict(name="Laptop", target_amount=2000, current_saved=100, deadline="2027-06-30")
        goal.update(changes)
        return '```goal_action\n' + json.dumps(goal) + '\n```'

    def test_valid_goal(self):
        reply, goal = extract_goal_action(self.action())
        self.assertEqual(reply, "")
        self.assertEqual(goal["name"], "Laptop")
        self.assertEqual(goal["current_saved"], 100)

    def test_advice_does_not_create(self):
        self.assertEqual(extract_goal_action("Try saving $100 each month."),
                         ("Try saving $100 each month.", None))

    def test_invalid_goals(self):
        for changes in [dict(name=" "), dict(target_amount=-1), dict(target_amount=True),
                        dict(target_amount=float('inf')), dict(current_saved=-1),
                        dict(deadline="2027-02-30"), dict(deadline="tomorrow")]:
            with self.subTest(changes=changes):
                self.assertIsNone(extract_goal_action(self.action(**changes))[1])

    def test_malformed_and_multiple_actions(self):
        for reply in ['```goal_action\nno json\n```', self.action() + self.action()]:
            self.assertIsNone(extract_goal_action(reply)[1])


if __name__ == '__main__':
    unittest.main()
