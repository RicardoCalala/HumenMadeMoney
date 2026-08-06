import { notFound } from "next/navigation";
import { AgreementDetail } from "@/components/agreement/AgreementDetail";
import { getAgreementById, listAgreements } from "@/mocks/agreements";
export async function generateStaticParams(){return (await listAgreements()).map(a=>({id:a.id}))}
export default async function AgreementPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const agreement=await getAgreementById(id);if(!agreement)notFound();return <div className="grid gap-8"><AgreementDetail agreement={agreement}/></div>}
