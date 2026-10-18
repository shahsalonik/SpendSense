import json
import os
import unittest
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from goal_pacing import goal_with_pace

TODAY = date(2026, 10, 18)

class GoalPacingTests(unittest.TestCase):
    def goal(self, remaining=1900, days=164):
        return {'id':'vacation','name':'Vacation','target_amount':remaining+100,
                'current_saved':100,'deadline':(TODAY+timedelta(days=days)).isoformat()}

    def test_screenshot_values(self):
        vacation = goal_with_pace(self.goal(), TODAY)['pace']
        laptop = goal_with_pace(self.goal(800,75), TODAY)['pace']
        self.assertEqual(vacation['monthly_needed'],352.66)
        self.assertEqual(laptop['monthly_needed'],324.69)
        self.assertEqual(vacation['days_remaining'],164)

    def test_weekly_monthly_boundary(self):
        weekly = goal_with_pace(self.goal(290,29), TODAY)['pace']
        monthly = goal_with_pace(self.goal(300,30), TODAY)['pace']
        self.assertEqual(weekly['status'],'weekly')
        self.assertEqual(weekly['weekly_needed'],70)
        self.assertEqual(weekly['daily_needed'],10)
        self.assertEqual(monthly['status'],'monthly')
        self.assertEqual(monthly['monthly_needed'],304.4)

    def test_due_overdue_and_complete(self):
        for days, remaining, status in [(0,100,'due_today'),(-1,100,'overdue'),(-1,0,'complete'),(5,-10,'complete')]:
            with self.subTest(status=status):
                pace = goal_with_pace(self.goal(remaining,days),TODAY)['pace']
                self.assertEqual(pace['status'],status)
                self.assertGreaterEqual(pace['remaining'],0)
                if days <= 0: self.assertIsNone(pace['monthly_needed'])

    def test_calendar_days_across_leap_day(self):
        goal = self.goal()
        goal['deadline']='2028-03-01'
        self.assertEqual(goal_with_pace(goal,date(2028,2,28))['pace']['days_remaining'],2)

    def test_goal_api_returns_same_pace_for_load_and_create(self):
        from goal_routes import api_goals, api_create_goal, SavingsGoal
        user = {'id': 'account-a'}
        goal = self.goal()
        with patch('goal_routes.get_goals', return_value=[goal]):
            loaded = api_goals(as_of=TODAY, user=user)['goals'][0]
        with patch('goal_routes.create_goal', return_value={'success': True, 'id': goal['id']}):
            created = api_create_goal(SavingsGoal(**goal, as_of=TODAY), user=user)['goal']
        self.assertEqual(loaded['pace'], created['pace'])
        self.assertEqual(loaded['pace']['monthly_needed'], 352.66)

    def test_prompt_uses_exact_values_and_selected_day(self):
        os.environ.setdefault('BACKBOARD_API_KEY','test')
        os.environ.setdefault('BACKBOARD_ASSISTANT_ID','test')
        from agent import send_chat_message
        response = MagicMock()
        response.json.return_value = {'content':'Advice'}
        with patch('agent.requests.post',return_value=response) as post:
            send_chat_message('Review goals',thread_id='test',context={'as_of':TODAY.isoformat(),'goals':[self.goal()]})
        content = post.call_args.kwargs['data']['content']
        payload = content.split('CURRENT FINANCIAL DASHBOARD DATA:\n')[1].split('\n\nINSTRUCTIONS:')[0]
        pace = json.loads(payload)['active_goals'][0]['pace']
        self.assertEqual(pace,goal_with_pace(self.goal(),TODAY)['pace'])
        self.assertIn('Do NOT recalculate',content)
        self.assertNotIn('EXAMPLE RESPONSE STYLE',content)

if __name__ == '__main__': unittest.main()
