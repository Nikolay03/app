import type { NextRequest } from "next/server";

import { proxy } from "./src/proxy";

// Next.js looks specifically for `middleware.ts` (or `src/middleware.ts`).
// Keep `config` declared in this module (Next requires it here).
export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

