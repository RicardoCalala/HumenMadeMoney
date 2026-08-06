"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
function csrfToken() { return document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("hmm_development_csrf="))?.split("=").slice(1).join("=") ?? ""; }
export function SignOutButton() { const router = useRouter(); return <Button variant="outline" onClick={async () => { await fetch("/api/v1/auth/sign-out", { method: "POST", headers: { "x-csrf-token": decodeURIComponent(csrfToken()) } }); router.replace("/sign-in"); router.refresh(); }}>Sign out</Button>; }
