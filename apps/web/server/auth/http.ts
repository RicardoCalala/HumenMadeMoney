import { AgreementApplicationError } from "../agreements/application/errors.ts";
import { cookieValue, requireExactOrigin, SESSION_COOKIE } from "../agreements/transport/http.ts";
export const PREAUTH_COOKIE = "hmm_development_login_csrf";
export const CSRF_COOKIE = "hmm_development_csrf";
export const cookie = (name: string, value: string, maxAge: number) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
export const clearCookie = (name: string) => `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
export const readableCsrfCookie = (value: string) => `${CSRF_COOKIE}=${encodeURIComponent(value)}; Path=/; SameSite=Strict; Max-Age=${8 * 60 * 60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
export function preauthDigest(request: Request) { return cookieValue(request, PREAUTH_COOKIE); }
export function sessionToken(request: Request) { return cookieValue(request, SESSION_COOKIE); }
export function requireLoginOrigin(request: Request) { try { requireExactOrigin(request); } catch { throw new AgreementApplicationError("CSRF_REJECTED", "The sign-in request could not be verified."); } }
