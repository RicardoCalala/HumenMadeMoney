import { STATUS_GROUPS } from "./status";
import type { AgreementSummary, FundingMode } from "@/types/agreement";

export function filterAgreements(items: AgreementSummary[], query: string, status: string, funding: string) {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => (!needle || `${item.title} ${item.plainLanguageSummary} ${item.participants.map(p => p.displayName).join(" ")}`.toLowerCase().includes(needle))
    && (status === "all" || item.status === status)
    && (funding === "all" || item.funding.mode === funding as FundingMode));
}

export function groupCounts(items: AgreementSummary[]) {
  return Object.fromEntries(Object.entries(STATUS_GROUPS).map(([group, statuses]) => [group, items.filter(item => (statuses as readonly AgreementSummary["status"][]).includes(item.status)).length]));
}

export function formatDate(value: string) { return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)); }
export function formatMoney(minor: number, currency: string) { return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(minor / 100); }
