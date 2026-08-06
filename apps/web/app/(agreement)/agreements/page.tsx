import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgreementCollection } from "@/components/agreement/AgreementCollection";
import { listAgreements } from "@/mocks/agreements";
export default async function AgreementsPage(){const agreements=await listAgreements();return <div className="grid gap-8"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-teal-800">My agreements</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Shared commitments, clearly organized</h1><p className="mt-3 max-w-2xl text-slate-600">Search by purpose or participant, then filter by lifecycle state or optional funding mode.</p></div><Button render={<Link href="/agreements/create"/>}>Create agreement</Button></header><AgreementCollection agreements={agreements}/></div>}
