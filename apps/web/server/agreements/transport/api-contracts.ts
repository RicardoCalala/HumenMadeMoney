import type { AgreementResource } from "../application/contracts.ts";
export type AgreementResourceV1 = AgreementResource;
export interface ApiErrorResponseV1 { error: { code: string; message: string; requestId: string; retryable: boolean; fieldErrors?: Array<{ code: string; path: string; message: string; category?: string }>; conflict?: { expectedVersionId?: string; currentVersionId?: string } } }
