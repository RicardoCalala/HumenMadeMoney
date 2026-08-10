import { FileCheck2, Landmark, MessagesSquare } from "lucide-react";

const steps = [
  { icon: MessagesSquare, title: "Set the terms together", body: "Describe the work, outcome, dates, and review conditions in plain language." },
  { icon: Landmark, title: "Share the evidence", body: "Participants work from the same accepted agreement, milestones, and versioned evidence." },
  { icon: FileCheck2, title: "Review the outcome", body: "Deterministic checks and accountable human review support a simulated resolution; no real funds move." },
];

export function HowItWorks() {
  return <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-medium text-teal-300">How it works today</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Clear from the first draft to the outcome review.</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{steps.map(({ icon: Icon, title, body }, index) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><span className="text-sm text-slate-500">0{index + 1}</span><Icon className="mt-8 size-6 text-teal-300" /><h3 className="mt-5 text-lg font-medium text-white">{title}</h3><p className="mt-2 leading-7 text-slate-400">{body}</p></article>)}</div></section>;
}
