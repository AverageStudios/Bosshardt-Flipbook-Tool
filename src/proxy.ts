import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional protection for the internal pages. When DASHBOARD_PASSWORD is set,
 * the dashboard, upload page and management API require HTTP Basic Auth
 * (any username). Public flipbook links (/f/...) are never protected.
 */
export function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (supplied === password) return NextResponse.next();
    } catch {
      // malformed header — fall through to the challenge
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Bosshardt Flipbook Tool", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/new", "/api/flipbooks/:path*"],
};
