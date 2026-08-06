import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.18),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.15),transparent_25%)]" />
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-8 sm:pb-32 lg:px-8">
        <nav className="flex items-center justify-between">
          <a className="flex items-center gap-2 font-semibold tracking-tight" href="#top">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-300 text-slate-950">H</span>
            Human Made Money
          </a>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" render={<a href="#pricing" />}>
            View pricing
          </Button>
        </nav>

        <div className="mx-auto max-w-4xl pt-24 text-center sm:pt-32">
          <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
            <Sparkles className="size-3.5" /> AI-powered escrow infrastructure
          </p>
          <h1 className="mt-7 text-balance text-5xl font-semibold tracking-[-0.05em] text-white sm:text-7xl">
            Agreements that hold up in the real world.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl">
            Human Made Money turns a shared promise into a clear, protected agreement—with AI guidance and escrow rules everyone can trust.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 bg-teal-300 px-5 text-slate-950 hover:bg-teal-200" render={<a href="#pricing" />}>
              Create an agreement <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 border-white/20 bg-white/5 px-5 text-white hover:bg-white/10" render={<a href="#how-it-works" />}>
              See how it works
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-teal-300" /> Funds protected by clear rules</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-teal-300" /> Built for two-sided trust</span>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-teal-950/30 backdrop-blur sm:p-6">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-5 sm:p-7">
            <div className="flex items-center justify-between text-xs text-slate-400"><span>Agreement overview</span><span className="rounded-full bg-teal-300/10 px-2 py-1 text-teal-200">Protected</span></div>
            <p className="mt-5 text-xl font-medium text-white">Website delivery — phase one</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[['Funding', 'Confirmed'], ['Milestone', 'Review on delivery'], ['Release', 'Both sides approve']].map(([label, value]) => <div key={label} className="rounded-lg bg-white/5 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-100">{value}</p></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
