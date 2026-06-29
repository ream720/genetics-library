export const CURRENT_TERMS_VERSION = "2024-12-01";
export const CURRENT_PRIVACY_VERSION = "2024-12-01";

export const LEGAL_ACCEPTED_FROM_VALUES = [
  "signup",
  "blocking_prompt",
  "settings",
] as const;

export type LegalAcceptedFrom = (typeof LEGAL_ACCEPTED_FROM_VALUES)[number];

export interface UserTermsAcceptance {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt?: unknown;
  acceptedFrom?: LegalAcceptedFrom;
}

export const LEGAL_ACCEPTANCE_REQUIRED_MESSAGE =
  "Accept the current Terms of Service and Privacy Policy before making changes.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isLegalAcceptedFrom = (value: unknown): value is LegalAcceptedFrom =>
  typeof value === "string" &&
  LEGAL_ACCEPTED_FROM_VALUES.includes(value as LegalAcceptedFrom);

export const readUserTermsAcceptance = (
  value: unknown
): UserTermsAcceptance | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const acceptedFrom = isLegalAcceptedFrom(value.acceptedFrom)
    ? value.acceptedFrom
    : undefined;

  return {
    termsVersion: String(value.termsVersion ?? ""),
    privacyVersion: String(value.privacyVersion ?? ""),
    acceptedAt: value.acceptedAt,
    acceptedFrom,
  };
};

export const hasCurrentLegalAcceptance = (
  termsAcceptance?: UserTermsAcceptance | null
) =>
  termsAcceptance?.termsVersion === CURRENT_TERMS_VERSION &&
  termsAcceptance?.privacyVersion === CURRENT_PRIVACY_VERSION;

export const assertLegalAcceptanceForWrite = (hasAccepted: boolean) => {
  if (!hasAccepted) {
    throw new Error(LEGAL_ACCEPTANCE_REQUIRED_MESSAGE);
  }
};
