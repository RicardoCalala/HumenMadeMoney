import "server-only";
import { cookies } from "next/headers";
import { authenticationService } from "./composition.ts";
import { SESSION_COOKIE } from "../agreements/transport/http.ts";
export async function getCurrentUser() { const value = (await cookies()).get(SESSION_COOKIE)?.value; return authenticationService.resolve(value, "server_page"); }
