"use client";
import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppNavigation } from "./AppNavigation";
export function AppHeader() { return <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-8"><Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"><span className="grid size-9 place-items-center rounded-xl bg-teal-800 text-white"><ShieldCheck aria-hidden="true" className="size-5" /></span><span>Human Made Money</span></Link><AppNavigation /></div><div className="flex items-center gap-2"><span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 sm:inline">Local development profile</span><SignOutButton/><Sheet><SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation"><Menu /></Button>} /><SheetContent><SheetHeader><SheetTitle>Agreement application</SheetTitle></SheetHeader><div className="p-4"><AppNavigation mobile /></div></SheetContent></Sheet></div></div></header>; }
