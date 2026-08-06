"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText } from "lucide-react";
const links = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/agreements", label: "Agreements", icon: ScrollText }];
export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label="Agreement application" className={mobile ? "grid gap-2" : "hidden items-center gap-1 md:flex"}>{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} aria-current={pathname === href || (href === "/agreements" && pathname.startsWith("/agreements")) ? "page" : undefined} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-teal-50 aria-[current=page]:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><Icon aria-hidden="true" className="size-4" />{label}</Link>)}</nav>;
}
