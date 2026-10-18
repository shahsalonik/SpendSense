import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;
const routes: Record<string, string[]> = {
  "auth/signup": ["POST"], "auth/login": ["POST"], "auth/logout": ["POST"],
  "auth/me": ["GET"], "auth/bootstrap": ["POST"],
  summary: ["GET"], subscriptions: ["GET"], insights: ["GET"],
  goals: ["GET", "POST"], chat: ["POST"],
};

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join("/");
  const methods = routes[endpoint] ?? (/^goals\/[\w-]+$/.test(endpoint) ? ["DELETE"] : []);
  if (!methods.includes(request.method)) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  // Browser mutations must originate at this frontend, with our custom header.
  if (request.method !== "GET" && (
    request.headers.get("origin") !== request.nextUrl.origin ||
    request.headers.get("x-spendsense-client") !== "web"
  )) return NextResponse.json({ detail: "Invalid request origin" }, { status: 403 });

  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  const secret = process.env.AUTH_PROXY_SECRET;
  if (!base || !secret || secret.length < 32) {
    return NextResponse.json({ detail: "Sign-in is not configured yet. Please contact the app team." }, { status: 503 });
  }
  const headers = new Headers({ "Content-Type": "application/json", "x-auth-proxy-secret": secret });
  const session = request.cookies.get("spendsense_session");
  if (session && /^[A-Za-z0-9_-]{20,256}$/.test(session.value)) {
    headers.set("Cookie", `spendsense_session=${session.value}`);
  }
  // Vercel sets x-vercel-forwarded-for; never trust a caller-supplied x-client-ip.
  headers.set("x-client-ip", process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local");
  try {
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && body.length > 100_000) return NextResponse.json({ detail: "Request too large" }, { status: 413 });
    const upstream = await fetch(`${base.replace(/\/$/, "")}/api/${endpoint}`, {
      method: request.method, headers, body, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(110_000),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    const cookie = upstream.headers.get("set-cookie");
    if (cookie) response.headers.set("Set-Cookie", cookie);
    return response;
  } catch {
    return NextResponse.json({ detail: "Unable to reach SpendSense. Please try again." }, { status: 502 });
  }
}
export { proxy as GET, proxy as POST, proxy as DELETE };
