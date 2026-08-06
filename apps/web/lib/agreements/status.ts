import type { AgreementStatus } from "@/types/agreement";

export const STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: "Draft", in_review: "Awaiting acceptance", accepted: "Ready",
  active: "Active", in_progress: "Monitoring", verification: "Verification",
  awaiting_decision: "Authorization needed", resolved: "Resolved", closed: "Completed",
  cancelled: "Cancelled", expired: "Expired", disputed: "Disputed",
};

export const STATUS_GROUPS = {
  drafts: ["draft"], attention: ["in_review", "verification", "awaiting_decision", "disputed"],
  active: ["accepted", "active", "in_progress"], completed: ["resolved", "closed", "cancelled", "expired"],
} satisfies Record<string, AgreementStatus[]>;

export const ALLOWED_DEMO_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  draft: ["in_review", "cancelled"], in_review: ["accepted", "draft", "cancelled", "expired"],
  accepted: ["active", "cancelled"], active: ["in_progress", "cancelled", "disputed"],
  in_progress: ["verification", "disputed", "expired"], verification: ["awaiting_decision", "in_progress", "disputed"],
  awaiting_decision: ["resolved", "in_progress", "disputed"], resolved: ["closed", "disputed"],
  closed: [], cancelled: [], expired: [], disputed: ["in_progress", "cancelled", "resolved"],
};

export function statusLabel(status: AgreementStatus) { return STATUS_LABELS[status]; }
