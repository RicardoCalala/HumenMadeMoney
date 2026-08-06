import { toSprint51Agreement, type Sprint51OperationalView } from "../agreement-language/compatibility.ts";
import type { AgreementResourceV1 } from "../../server/agreements/transport/api-contracts.ts";
export function agreementResourceToSprint51(resource: AgreementResourceV1, operational: Sprint51OperationalView) { return toSprint51Agreement(resource.document, operational); }
