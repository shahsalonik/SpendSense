const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { NextRequest } = require('next/server');
const file = path.resolve('app/api/backend/[...path]/route.ts');
const compiled = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded = new Module(file);
loaded.filename = file;
loaded.paths = module.paths;
loaded._compile(compiled, file);
const { GET, POST } = loaded.exports;
const context = endpoint => ({params:Promise.resolve({path:endpoint.split('/')})});
process.env.BACKEND_API_URL = 'https://backend.example.test';
process.env.AUTH_PROXY_SECRET = 'test-secret-' + 'a'.repeat(32);

test('proxy enforces origin, routes, and HTTP-only session forwarding', async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://backend.example.test/api/auth/login');
    assert.equal(options.headers.get('x-auth-proxy-secret'),process.env.AUTH_PROXY_SECRET);
    assert.equal(options.headers.get('cookie'),'spendsense_session=abcdefghijklmnopqrstuvwxyz');
    assert.equal(options.headers.get('authorization'),null);
    return new Response('{"user":{"id":"alice"}}', {headers:{'set-cookie':'spendsense_session=new-session; HttpOnly; Secure; SameSite=Lax; Path=/'}});
  };
  try {
    const bad = new NextRequest('https://frontend.example.test/api/backend/auth/login', {method:'POST',headers:{origin:'https://evil.example.test','x-spendsense-client':'web'},body:'{}'});
    assert.equal((await POST(bad,context('auth/login'))).status,403);
    assert.equal(calls,0);
    const unknown = new NextRequest('https://frontend.example.test/api/backend/anything');
    assert.equal((await GET(unknown,context('anything'))).status,404);
    const good = new NextRequest('https://frontend.example.test/api/backend/auth/login', {method:'POST',headers:{origin:'https://frontend.example.test','x-spendsense-client':'web',cookie:'other=private; spendsense_session=abcdefghijklmnopqrstuvwxyz',authorization:'untrusted'},body:'{}'});
    const result = await POST(good,context('auth/login'));
    assert.equal(result.status,200);
    assert.match(result.headers.get('set-cookie'),/HttpOnly/);
    assert.equal(result.headers.get('cache-control'),'no-store');
    assert.equal(result.headers.get('x-auth-proxy-secret'),null);
    assert.equal(calls,1);
  } finally { global.fetch = original; }
});

test('API failures keep upstream status and missing config fails closed', async () => {
  const original = global.fetch;
  const secret = process.env.AUTH_PROXY_SECRET;
  try {
    global.fetch = async () => new Response('{"detail":"Please sign in"}',{status:401});
    const request = new NextRequest('https://frontend.example.test/api/backend/auth/me');
    assert.equal((await GET(request,context('auth/me'))).status,401);
    delete process.env.AUTH_PROXY_SECRET;
    assert.equal((await GET(request,context('auth/me'))).status,503);
  } finally { global.fetch = original; process.env.AUTH_PROXY_SECRET = secret; }
});


test('goal date is forwarded without forwarding a user identity override', async () => {
  const original = global.fetch;
  let target;
  global.fetch = async url => { target = url; return new Response('{"goals":[]}'); };
  try {
    const request = new NextRequest('https://frontend.example.test/api/backend/goals?as_of=2026-10-18&user_id=someone-else');
    assert.equal((await GET(request,context('goals'))).status,200);
    assert.equal(target,'https://backend.example.test/api/goals?as_of=2026-10-18');
  } finally { global.fetch = original; }
});
