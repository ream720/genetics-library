import test from "node:test";
import assert from "node:assert/strict";
import { validateProjectId } from "../lib/projects.js";

function assertHttpsCode(fn, code) {
  assert.throws(fn, (error) => error?.code === code);
}

test("validateProjectId accepts and trims a Firestore document ID", () => {
  assert.equal(
    validateProjectId({ projectId: "  project-123  " }),
    "project-123"
  );
});

test("validateProjectId rejects missing, oversized, and path-like IDs", () => {
  assertHttpsCode(() => validateProjectId({}), "invalid-argument");
  assertHttpsCode(
    () => validateProjectId({ projectId: "x".repeat(201) }),
    "invalid-argument"
  );
  assertHttpsCode(
    () => validateProjectId({ projectId: "projects/project-123" }),
    "invalid-argument"
  );
});
