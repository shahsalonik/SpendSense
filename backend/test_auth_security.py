"""Offline security tests; no database mutations or external API requests."""
import asyncio
import json
import os
import unittest
from unittest.mock import patch, MagicMock
os.environ.setdefault('AUTH_PROXY_SECRET', 'test-only-' + 'x' * 32)
os.environ.setdefault('BACKBOARD_API_KEY', 'test-only')
os.environ.setdefault('BACKBOARD_ASSISTANT_ID', 'test-only')
from main import app
from auth import hash_password, verify_password, token_hash, current_user
from chat_accounts import owned_assistant
from fastapi import HTTPException
from starlette.requests import Request

PROXY = [(b'x-auth-proxy-secret',os.environ['AUTH_PROXY_SECRET'].encode())]

def call(method, path, body=None, headers=None, query=b''):
    async def run():
        messages = []
        async def receive(): return {'type': 'http.request', 'body': json.dumps(body or {}).encode()}
        async def send(message): messages.append(message)
        await app({'type':'http','asgi':{'version':'3.0'},'http_version':'1.1','method':method,'scheme':'https','path':path,'raw_path':path.encode(),'query_string':query,'headers':[(b'content-type',b'application/json')]+(headers or []),'server':('test',443),'client':('test',123)}, receive, send)
        return messages[0]['status'], json.loads(b''.join(m.get('body',b'') for m in messages) or b'{}')
    return asyncio.run(run())

class AuthSecurityTests(unittest.TestCase):
    def tearDown(self): app.dependency_overrides.clear()

    def test_password_hashes_are_salted_and_verified(self):
        password = 'a long test passphrase'
        first, second = hash_password(password), hash_password(password)
        self.assertNotEqual(first, second)
        self.assertNotIn(password, first)
        self.assertTrue(verify_password(password, first))
        self.assertFalse(verify_password('incorrect password', first))
        self.assertFalse(verify_password(password, 'malformed'))

    def test_all_data_routes_reject_unauthenticated_requests(self):
        routes = [('GET','/api/goals',None), ('POST','/api/goals',{'name':'x','target_amount':1,'deadline':'2027-01-01'}),('DELETE','/api/goals/other-goal',None),('GET','/api/summary',None),('GET','/api/subscriptions',None),('GET','/api/insights',None),('POST','/api/chat',{'message':'hello'}),('POST','/api/sync',None)]
        for method, path, body in routes:
            with self.subTest(path=path, method=method):
                self.assertEqual(call(method,path,body)[0],403)
                self.assertEqual(call(method,path,body,PROXY)[0],401)

    def test_verified_identity_overrides_query_user(self):
        app.dependency_overrides[current_user] = lambda: {'id':'user:alice','email':'alice@example.test'}
        with patch('goal_routes.get_goals', return_value=[]) as get:
            self.assertEqual(call('GET','/api/goals',query=b'user_id=user:bob')[0],200)
            get.assert_called_once_with('user:alice')
        with patch('goal_routes.delete_goal', return_value={'success':False}) as delete:
            self.assertEqual(call('DELETE','/api/goals/bobs-goal',query=b'user_id=user:bob')[1], {'success':False})
            delete.assert_called_once_with('user:alice','bobs-goal')
        with patch('finance_routes.get_summary', return_value={'categories':[]}) as summary:
            call('GET','/api/summary',query=b'user_id=user:bob')
            summary.assert_called_once_with('user:alice')

    def test_session_lookup_uses_hash_and_expiration(self):
        conn = MagicMock()
        conn.execute.return_value.fetchone.return_value = None
        with patch('auth.get_auth_connection') as db:
            db.return_value.__enter__.return_value = conn
            request = Request({'type':'http','headers':PROXY+[(b'cookie',b'spendsense_session=invalid-token')]})
            with self.assertRaises(HTTPException) as error: current_user(request)
            self.assertEqual(error.exception.status_code,401)
            query, params = conn.execute.call_args.args
            self.assertIn('expires_at > NOW()',query)
            self.assertEqual(params,(token_hash('invalid-token'),))

    def test_foreign_chat_thread_rejected_before_backboard(self):
        conn = MagicMock()
        conn.execute.return_value.fetchone.side_effect = [('alice-assistant',), None]
        with patch('chat_accounts.get_auth_connection') as db, patch('chat_accounts.requests.post') as remote:
            db.return_value.__enter__.return_value = conn
            with self.assertRaises(HTTPException) as error: owned_assistant('user:alice','bobs-thread')
            self.assertEqual(error.exception.status_code,404)
            remote.assert_not_called()

    def test_chat_uses_server_context_and_private_assistant(self):
        app.dependency_overrides[current_user] = lambda: {'id':'user:alice'}
        with patch('agent_routes.limit_attempts'), patch('agent_routes.owned_assistant',return_value='private-assistant'), patch('agent_routes.get_goals',return_value=[]), patch('agent_routes.get_subscriptions',return_value=[]), patch('agent_routes.get_summary',return_value={'categories':[]}), patch('agent_routes.save_thread'), patch('agent_routes.send_chat_message',return_value={'reply':'ok','thread_id':'new-thread','assistant_id':'private-assistant'}) as send:
            self.assertEqual(call('POST','/api/chat',{'message':'hi','assistant_id':'someone-else'})[0],200)
            self.assertEqual(send.call_args.kwargs['assistant_id'],'private-assistant')
            self.assertEqual(send.call_args.kwargs['context']['goals'],[])

    def test_invalid_signup_never_echoes_password(self):
        status, body = call('POST','/api/auth/signup',{'email':'invalid','password':'secret'},PROXY)
        self.assertEqual(status,422)
        self.assertNotIn('secret',json.dumps(body))

    def test_logout_revokes_token(self):
        conn = MagicMock()
        with patch('auth_routes.get_auth_connection') as db:
            db.return_value.__enter__.return_value = conn
            self.assertEqual(call('POST','/api/auth/logout',headers=PROXY+[(b'cookie',b'spendsense_session=test-session')])[0],200)
            self.assertIn('DELETE FROM auth_sessions',conn.execute.call_args.args[0])
            self.assertEqual(conn.execute.call_args.args[1],(token_hash('test-session'),))

if __name__ == '__main__': unittest.main()
