import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/agreements/status";
import type { AgreementStatus } from "@/types/agreement";
export function AgreementStatusBadge({ status }: { status: AgreementStatus }) { const danger = ["disputed","expired","cancelled"].includes(status); return <Badge variant="outline" className={danger ? "border-amber-300 bg-amber-50 text-amber-900" : "border-teal-200 bg-teal-50 text-teal-900"}>{statusLabel(status)}</Badge>; }
