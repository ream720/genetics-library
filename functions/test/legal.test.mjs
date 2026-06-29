import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  hasCurrentLegalAcceptance,
  validateLegalAcceptedFrom,
} from "../lib/legal.js";

function assertHttpsCode(fn, code) {
  assert.throws(fn, (error) => error?.code === code);
}

test("validateLegalAcceptedFrom accepts known legal acceptance sources", () => {
  assert.equal(
    validateLegalAcceptedFrom({ acceptedFrom: "signup" }),
    "signup"
  );
  assert.equal(
    validateLegalAcceptedFrom({ acceptedFrom: "blocking_prompt" }),
    "blocking_prompt"
  );
  assert.equal(
    validateLegalAcceptedFrom({ acceptedFrom: "settings" }),
    "settings"
  );
});

test("validateLegalAcceptedFrom rejects missing and unknown sources", () => {
  assertHttpsCode(() => validateLegalAcceptedFrom({}), "invalid-argument");
  assertHttpsCode(
    () => validateLegalAcceptedFrom({ acceptedFrom: "modal" }),
    "invalid-argument"
  );
});

test("hasCurrentLegalAcceptance checks current terms and privacy versions", () => {
  assert.equal(
    hasCurrentLegalAcceptance({
      termsAcceptance: {
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      },
    }),
    true
  );
  assert.equal(
    hasCurrentLegalAcceptance({
      termsAcceptance: {
        termsVersion: "2024-01-01",
        privacyVersion: CURRENT_PRIVACY_VERSION,
      },
    }),
    false
  );
  assert.equal(hasCurrentLegalAcceptance({}), false);
});
