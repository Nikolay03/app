import type { NextRequest } from "next/server";
import { proxy, config } from "./src/proxy";

export { config };

// Next.js middleware entrypoint. The implementation lives in `src/proxy.ts`
// to keep app-specific logic under `src/`.
export default async function middleware(request: NextRequest) {
  return proxy(request);
}

