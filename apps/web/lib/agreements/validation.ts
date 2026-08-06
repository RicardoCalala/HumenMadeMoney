import type { CreateAgreementInput } from "@/types/agreement";
export type FormErrors = Partial<Record<keyof CreateAgreementInput, string>>;
export function validateAgreement(input: CreateAgreementInput): FormErrors {
  const errors: FormErrors = {};
  const required: (keyof CreateAgreementInput)[] = ["title", "purpose", "participantName", "participantResponsibility", "obligation", "successCondition", "evidenceSource", "deadline", "resolutionApproach"];
  required.forEach(key => { if (!input[key].trim()) errors[key] = "This field is required."; });
  if (input.title.length > 100) errors.title = "Use 100 characters or fewer.";
  if (input.deadline && Number.isNaN(Date.parse(input.deadline))) errors.deadline = "Enter a valid deadline.";
  return errors;
}
