import { authenticationService } from "../../../../../server/auth/composition.ts";
import { sessionToken } from "../../../../../server/auth/http.ts";
import { json } from "../../../../../server/agreements/transport/http.ts";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const resolved = await authenticationService.resolve(sessionToken(request)); if (!resolved.user) return json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in to continue." } }, 401, { "WWW-Authenticate": "Session" }); return json({ user: resolved.user }, 200); }
