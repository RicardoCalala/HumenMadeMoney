import { notFound } from "next/navigation";
import { EvidenceWorkflow } from "@/components/agreement/EvidenceWorkflow";
import { agreementService } from "@/server/agreements/composition";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

async function findAgreement(id: string, context: Awaited<ReturnType<typeof getCurrentUser>>["context"]) {
  try { return await agreementService.get(context, id); } catch { notFound(); }
}

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  const agreement = await findAgreement(id, current.context);
  return <EvidenceWorkflow agreement={agreement} currentAccountId={current.user!.accountId} />;
}
