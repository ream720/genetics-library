import { HttpsError } from "firebase-functions/v2/https";
import type { Firestore } from "firebase-admin/firestore";

export const CURRENT_TERMS_VERSION = "2024-12-01";
export const CURRENT_PRIVACY_VERSION = "2024-12-01";

export const LEGAL_ACCEPTED_FROM_VALUES = [
  "signup",
  "blocking_prompt",
  "settings",
] as const;

export type LegalAcceptedFrom = (typeof LEGAL_ACCEPTED_FROM_VALUES)[number];

export interface UserTermsState {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string;
  acceptedFrom: LegalAcceptedFrom;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isLegalAcceptedFrom = (value: unknown): value is LegalAcceptedFrom =>
  typeof value === "string" &&
  LEGAL_ACCEPTED_FROM_VALUES.includes(value as LegalAcceptedFrom);

export function validateLegalAcceptedFrom(data: unknown): LegalAcceptedFrom {
  const acceptedFrom =
    isRecord(data) && typeof data.acceptedFrom === "string"
      ? data.acceptedFrom
      : "";

  if (!isLegalAcceptedFrom(acceptedFrom)) {
    throw new HttpsError(
      "invalid-argument",
      "A valid legal acceptance source is required."
    );
  }

  return acceptedFrom;
}

export function hasCurrentLegalAcceptance(data: unknown): boolean {
  const state =
    isRecord(data) && isRecord(data.termsAcceptance)
      ? data.termsAcceptance
      : data;

  return (
    isRecord(state) &&
    state.termsVersion === CURRENT_TERMS_VERSION &&
    state.privacyVersion === CURRENT_PRIVACY_VERSION
  );
}

export async function assertCurrentLegalAcceptance(
  db: Firestore,
  uid: string
) {
  const userSnapshot = await db.collection("users").doc(uid).get();

  if (!hasCurrentLegalAcceptance(userSnapshot.data())) {
    throw new HttpsError(
      "permission-denied",
      "Accept the current Terms of Service and Privacy Policy before using this feature."
    );
  }
}

export async function writeCurrentLegalAcceptance({
  db,
  uid,
  acceptedFrom,
  email,
}: {
  db: Firestore;
  uid: string;
  acceptedFrom: LegalAcceptedFrom;
  email?: string;
}): Promise<UserTermsState> {
  const acceptedAt = new Date().toISOString();
  const termsAcceptance: UserTermsState = {
    termsVersion: CURRENT_TERMS_VERSION,
    privacyVersion: CURRENT_PRIVACY_VERSION,
    acceptedAt,
    acceptedFrom,
  };
  const acceptanceId = `${uid}_${CURRENT_TERMS_VERSION}_${CURRENT_PRIVACY_VERSION}`;
  const userRef = db.collection("users").doc(uid);
  const acceptanceRef = db.collection("termsAcceptances").doc(acceptanceId);

  await db.runTransaction(async (transaction) => {
    const acceptanceSnapshot = await transaction.get(acceptanceRef);

    if (!acceptanceSnapshot.exists) {
      transaction.create(acceptanceRef, {
        uid,
        email: email ?? null,
        ...termsAcceptance,
      });
    }

    transaction.set(userRef, { termsAcceptance }, { merge: true });
  });

  return termsAcceptance;
}
