import { authenticationService, localAuthenticationEnabled } from "../../../../../server/auth/composition.ts";
import { cookie, PREAUTH_COOKIE } from "../../../../../server/auth/http.ts";
import { json } from "../../../../../server/agreements/transport/http.ts";
export const dynamic = "force-dynamic";
export async function GET() { if (!localAuthenticationEnabled) return json({ error: { code: "AUTHENTICATION_UNAVAILABLE", message: "Local authentication is unavailable." } }, 404); const value = authenticationService.issuePreAuthenticationCsrf(); return json({ csrfToken: value.raw }, 200, { "Set-Cookie": cookie(PREAUTH_COOKIE, value.digest, 300) }); }
