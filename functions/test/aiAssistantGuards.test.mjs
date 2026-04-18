import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_AI_ASSISTANT_CONFIG,
  assertQuotaAvailable,
  hashUid,
  validateAnalyzeSeedData,
} from "../lib/lib/aiAssistantGuards.js";

function pngBase64(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer.toString("base64");
}

function assertHttpsCode(fn, code) {
  assert.throws(fn, (error) => error?.code === code);
}

test("validateAnalyzeSeedData trims messages and sanitizes context", () => {
  const context = {
    messages: [
      { role: "assistant", content: "ignored" },
      { role: "user", content: "one" },
      { role: "assistant", content: "two", seedData: { should: "drop" } },
      { role: "user", content: "x".repeat(600) },
      { role: "assistant", content: "four" },
    ],
  };

  const result = validateAnalyzeSeedData({
    message: "  Rainbow Belts F2 from Archive  ",
    previousContext: JSON.stringify(context),
  });

  assert.equal(result.message, "Rainbow Belts F2 from Archive");
  assert.equal(result.hasImage, false);
  assert.equal(result.contextMessageCount, 4);

  const sanitized = JSON.parse(result.previousContext);
  assert.equal(sanitized.messages.length, 4);
  assert.equal(sanitized.messages[0].content, "one");
  assert.equal(sanitized.messages[1].seedData, undefined);
  assert.equal(sanitized.messages[2].content.length, 500);
});

test("validateAnalyzeSeedData rejects malformed text and context", () => {
  assertHttpsCode(() => validateAnalyzeSeedData({ message: "" }), "invalid-argument");
  assertHttpsCode(
    () => validateAnalyzeSeedData({ message: "x".repeat(2001) }),
    "invalid-argument"
  );
  assertHttpsCode(
    () => validateAnalyzeSeedData({ message: "ok", previousContext: "not-json" }),
    "invalid-argument"
  );
});

test("validateAnalyzeSeedData validates MIME, base64, signatures, and dimensions", () => {
  const validPng = pngBase64(320, 200);
  const result = validateAnalyzeSeedData({
    message: "Analyze this image",
    imageData: validPng,
    imageMimeType: "image/png",
  });

  assert.equal(result.hasImage, true);
  assert.equal(result.imageMimeType, "image/png");
  assert.equal(result.imageWidth, 320);
  assert.equal(result.imageHeight, 200);

  assertHttpsCode(
    () =>
      validateAnalyzeSeedData({
        message: "bad mime",
        imageData: validPng,
        imageMimeType: "image/gif",
      }),
    "invalid-argument"
  );
  assertHttpsCode(
    () =>
      validateAnalyzeSeedData({
        message: "bad url mime",
        imageData: `data:image/jpeg;base64,${validPng}`,
        imageMimeType: "image/png",
      }),
    "invalid-argument"
  );
  assertHttpsCode(
    () =>
      validateAnalyzeSeedData({
        message: "bad signature",
        imageData: Buffer.from("not-png").toString("base64"),
        imageMimeType: "image/png",
      }),
    "invalid-argument"
  );
  assertHttpsCode(
    () =>
      validateAnalyzeSeedData({
        message: "too large",
        imageData: pngBase64(1601, 20),
        imageMimeType: "image/png",
      }),
    "invalid-argument"
  );
});

test("assertQuotaAvailable enforces global, daily, image, and burst limits", () => {
  assert.doesNotThrow(() =>
    assertQuotaAvailable(
      {
        totalRequests: 24,
        imageRequests: 4,
        burstRequests: 2,
        globalTotalRequests: 499,
        globalImageRequests: 99,
      },
      DEFAULT_AI_ASSISTANT_CONFIG,
      true
    )
  );

  assertHttpsCode(
    () =>
      assertQuotaAvailable(
        {
          totalRequests: 25,
          imageRequests: 0,
          burstRequests: 0,
          globalTotalRequests: 0,
          globalImageRequests: 0,
        },
        DEFAULT_AI_ASSISTANT_CONFIG,
        false
      ),
    "resource-exhausted"
  );
  assertHttpsCode(
    () =>
      assertQuotaAvailable(
        {
          totalRequests: 0,
          imageRequests: 5,
          burstRequests: 0,
          globalTotalRequests: 0,
          globalImageRequests: 0,
        },
        DEFAULT_AI_ASSISTANT_CONFIG,
        true
      ),
    "resource-exhausted"
  );
  assertHttpsCode(
    () =>
      assertQuotaAvailable(
        {
          totalRequests: 0,
          imageRequests: 0,
          burstRequests: 3,
          globalTotalRequests: 0,
          globalImageRequests: 0,
        },
        DEFAULT_AI_ASSISTANT_CONFIG,
        false
      ),
    "resource-exhausted"
  );
  assertHttpsCode(
    () =>
      assertQuotaAvailable(
        {
          totalRequests: 0,
          imageRequests: 0,
          burstRequests: 0,
          globalTotalRequests: 500,
          globalImageRequests: 0,
        },
        DEFAULT_AI_ASSISTANT_CONFIG,
        false
      ),
    "resource-exhausted"
  );
});

test("hashUid returns deterministic non-raw path ids", () => {
  const uid = "user/with unsafe#chars";
  const hash = hashUid(uid);

  assert.equal(hash, hashUid(uid));
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash.includes(uid), false);
});