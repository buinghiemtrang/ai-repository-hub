import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveBackendPath(parts: string[]): string | null {
  if (parts.length === 0) return "";
  if (parts.length === 1 && /^(categories|stats|[0-9]+)$/.test(parts[0])) {
    return "/" + parts[0];
  }
  if (parts.length === 2 && parts[0] === "sync" && parts[1] === "status") {
    return "/sync/status";
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ parts?: string[] }> }
) {
  const { parts = [] } = await params;
  const suffix = resolveBackendPath(parts);
  if (suffix === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const base = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${base}/repositories${suffix}${req.nextUrl.search}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
