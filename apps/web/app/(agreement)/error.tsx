"use client";
import { Button } from "@/components/ui/button";
export default function AgreementError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-10 text-center"><h1 className="text-2xl font-semibold">Agreement data is unavailable</h1><p className="mt-3 text-slate-600">Nothing changed. Try loading the fixed demonstration data again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div>}
