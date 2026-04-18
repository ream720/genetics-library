import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { HttpsError } from "firebase-functions/v2/https";
import {
  FieldValue,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";

const MAX_MESSAGE_CHARS = 2000;
const MAX_PREVIOUS_CONTEXT_RAW_CHARS = 8000;
const MAX_CONTEXT_MESSAGES = 4;
const MAX_CONTEXT_MESSAGE_CHARS = 500;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_LONG_EDGE = 1600;
const AI_ASSISTANT_CONFIG_DOC = "appConfig/aiAssistant";
const AI_ASSISTANT_USAGE_COLLECTION = "aiAssistantUsage";
const AI_ASSISTANT_EVENTS_COLLECTION = "aiAssistantEvents";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const DEFAULT_AI_ASSISTANT_CONFIG = {
  enabled: true,
  dailyTotalRequestLimit: 25,
  dailyImageRequestLimit: 5,
  burstWindowSeconds: 60,
  burstRequestLimit: 3,
  globalDailyTotalRequestLimit: 500,
  globalDailyImageRequestLimit: 100,
};

type AnalyzeSeedData = {
  message?: unknown;
  previousContext?: unknown;
  imageData?: unknown;
  imageMimeType?: unknown;
};

type ContextMessage = {
  role: "user" | "assistant";
  content: string;
};

type ImageDimensions = {
  width: number;
  height: number;
};

export type ValidatedAnalyzeSeedData = {
  message: string;
  previousContext?: string;
  imageData?: string;
  imageMimeType?: string;
  hasImage: boolean;
  messageChars: number;
  previousContextChars: number;
  contextMessageCount: number;
  imageByteLength?: number;
  imageWidth?: number;
  imageHeight?: number;
};

export type AiAssistantConfig = typeof DEFAULT_AI_ASSISTANT_CONFIG;

export type AiAssistantEventStatus =
  | "started"
  | "success"
  | "validation_error"
  | "disabled"
  | "quota_denied"
  | "model_error";

export type AiAssistantEventHandle = {
  ref: DocumentReference;
  startTimeMs: number;
};

export type AiAssistantRequestMetrics = {
  hasImage: boolean;
  messageChars?: number;
  previousContextChars?: number;
  contextMessageCount?: number;
  imageByteLength?: number;
  imageWidth?: number;
  imageHeight?: number;
};

export type QuotaCounts = {
  totalRequests: number;
  imageRequests: number;
  burstRequests: number;
  globalTotalRequests: number;
  globalImageRequests: number;
};

function ensureObjectPayload(data: unknown): AnalyzeSeedData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpsError("invalid-argument", "Request data is required.");
  }

  return data as AnalyzeSeedData;
}

function readPositiveInteger(value: unknown, defaultValue: number): number {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 1) {
    return defaultValue;
  }

  return value;
}

function truncate(value: string, maxChars: number): string {
  return value.length > maxChars ? value.slice(0, maxChars) : value;
}

function getUtcDateInfo(now = new Date()) {
  const date = now.toISOString().slice(0, 10);

  return {
    date,
    dateKey: date.replace(/-/g, ""),
  };
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readUint24LE(buffer: Buffer, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function normalizeBase64(base64Payload: string): string {
  const normalizedBase64 = base64Payload.replace(/\s/g, "");

  if (!normalizedBase64) {
    throw new HttpsError("invalid-argument", "Image data is required.");
  }

  if (
    normalizedBase64.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)
  ) {
    throw new HttpsError("invalid-argument", "Invalid base64 image data.");
  }

  return normalizedBase64;
}

function getBase64Payload(imageData: string, expectedMimeType: string): string {
  const normalizedImageData = imageData.trim();

  if (!normalizedImageData.startsWith("data:")) {
    return normalizeBase64(normalizedImageData);
  }

  const commaIndex = normalizedImageData.indexOf(",");
  if (commaIndex === -1) {
    throw new HttpsError("invalid-argument", "Invalid image data URL.");
  }

  const metadata = normalizedImageData.slice(0, commaIndex).toLowerCase();
  if (!metadata.includes(";base64")) {
    throw new HttpsError("invalid-argument", "Image data must be base64 encoded.");
  }

  const dataUrlMimeType = metadata.match(/^data:([^;,]+)/)?.[1];
  if (dataUrlMimeType !== expectedMimeType) {
    throw new HttpsError(
      "invalid-argument",
      "Image data URL MIME type does not match image MIME type."
    );
  }

  return normalizeBase64(normalizedImageData.slice(commaIndex + 1));
}

function getDecodedBase64ByteLength(base64Payload: string): number {
  const padding = base64Payload.endsWith("==")
    ? 2
    : base64Payload.endsWith("=")
      ? 1
      : 0;

  return Math.floor((base64Payload.length * 3) / 4) - padding;
}

function getPngDimensions(buffer: Buffer): ImageDimensions {
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a &&
    buffer.toString("ascii", 12, 16) === "IHDR";

  if (!isPng) {
    throw new HttpsError("invalid-argument", "Image content is not a valid PNG.");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function getJpegDimensions(buffer: Buffer): ImageDimensions {
  if (
    buffer.length < 4 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer[2] !== 0xff
  ) {
    throw new HttpsError("invalid-argument", "Image content is not a valid JPEG.");
  }

  let offset = 2;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) {
      continue;
    }

    if (offset + 2 > buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      break;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      if (segmentLength < 7) {
        break;
      }

      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  throw new HttpsError(
    "invalid-argument",
    "Unable to read JPEG image dimensions."
  );
}

function getWebpDimensions(buffer: Buffer): ImageDimensions {
  const isWebp =
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isWebp) {
    throw new HttpsError("invalid-argument", "Image content is not a valid WebP.");
  }

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8X") {
    return {
      width: readUint24LE(buffer, 24) + 1,
      height: readUint24LE(buffer, 27) + 1,
    };
  }

  if (chunkType === "VP8L") {
    if (buffer[20] !== 0x2f) {
      throw new HttpsError("invalid-argument", "Invalid WebP lossless header.");
    }

    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunkType === "VP8 ") {
    const hasStartCode =
      buffer.length >= 30 &&
      buffer[23] === 0x9d &&
      buffer[24] === 0x01 &&
      buffer[25] === 0x2a;

    if (!hasStartCode) {
      throw new HttpsError("invalid-argument", "Invalid WebP lossy header.");
    }

    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  throw new HttpsError("invalid-argument", "Unsupported WebP image format.");
}

function getImageDimensions(buffer: Buffer, mimeType: string): ImageDimensions {
  if (mimeType === "image/jpeg") {
    return getJpegDimensions(buffer);
  }

  if (mimeType === "image/png") {
    return getPngDimensions(buffer);
  }

  return getWebpDimensions(buffer);
}

function sanitizePreviousContext(value: unknown): {
  previousContext?: string;
  previousContextChars: number;
  contextMessageCount: number;
} {
  if (value === undefined || value === null || value === "") {
    return {
      previousContextChars: 0,
      contextMessageCount: 0,
    };
  }

  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Previous context must be a string.");
  }

  if (value.length > MAX_PREVIOUS_CONTEXT_RAW_CHARS) {
    throw new HttpsError(
      "invalid-argument",
      `Previous context must be ${MAX_PREVIOUS_CONTEXT_RAW_CHARS} characters or less.`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new HttpsError(
      "invalid-argument",
      "Previous context must be valid JSON."
    );
  }

  const messages = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && "messages" in parsed
      ? (parsed as { messages?: unknown }).messages
      : undefined;

  if (!Array.isArray(messages)) {
    throw new HttpsError(
      "invalid-argument",
      "Previous context must include a messages array."
    );
  }

  const sanitizedMessages: ContextMessage[] = messages
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message): ContextMessage => {
      if (!message || typeof message !== "object" || Array.isArray(message)) {
        throw new HttpsError(
          "invalid-argument",
          "Previous context messages must be objects."
        );
      }

      const role = (message as { role?: unknown }).role;
      const content = (message as { content?: unknown }).content;

      if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
        throw new HttpsError(
          "invalid-argument",
          "Previous context messages must include valid role and content fields."
        );
      }

      return {
        role,
        content: truncate(content.trim(), MAX_CONTEXT_MESSAGE_CHARS),
      };
    })
    .filter((message) => message.content);

  if (sanitizedMessages.length === 0) {
    return {
      previousContextChars: 0,
      contextMessageCount: 0,
    };
  }

  const previousContext = JSON.stringify({ messages: sanitizedMessages });

  return {
    previousContext,
    previousContextChars: sanitizedMessages.reduce(
      (sum, message) => sum + message.content.length,
      0
    ),
    contextMessageCount: sanitizedMessages.length,
  };
}

function validateImageInput(
  imageData: string,
  imageMimeType: string
): {
  imageData: string;
  imageMimeType: string;
  imageByteLength: number;
  imageWidth: number;
  imageHeight: number;
} {
  const normalizedMimeType = imageMimeType.trim().toLowerCase();

  if (!ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    throw new HttpsError(
      "invalid-argument",
      "Image must be a JPEG, PNG, or WebP file."
    );
  }

  const normalizedImageData = getBase64Payload(imageData, normalizedMimeType);
  const imageByteLength = getDecodedBase64ByteLength(normalizedImageData);

  if (imageByteLength > MAX_IMAGE_BYTES) {
    throw new HttpsError(
      "invalid-argument",
      "Image must be 2 MB or smaller after compression."
    );
  }

  const buffer = Buffer.from(normalizedImageData, "base64");
  const dimensions = getImageDimensions(buffer, normalizedMimeType);

  if (
    dimensions.width < 1 ||
    dimensions.height < 1 ||
    dimensions.width > MAX_IMAGE_LONG_EDGE ||
    dimensions.height > MAX_IMAGE_LONG_EDGE
  ) {
    throw new HttpsError(
      "invalid-argument",
      `Image dimensions must be ${MAX_IMAGE_LONG_EDGE}px or smaller on each edge.`
    );
  }

  return {
    imageData: normalizedImageData,
    imageMimeType: normalizedMimeType,
    imageByteLength,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  };
}

export function validateAnalyzeSeedData(data: unknown): ValidatedAnalyzeSeedData {
  const payload = ensureObjectPayload(data);

  if (typeof payload.message !== "string" || !payload.message.trim()) {
    throw new HttpsError("invalid-argument", "Message is required.");
  }

  const message = payload.message.trim();
  if (message.length > MAX_MESSAGE_CHARS) {
    throw new HttpsError(
      "invalid-argument",
      `Message must be ${MAX_MESSAGE_CHARS} characters or less.`
    );
  }

  const context = sanitizePreviousContext(payload.previousContext);

  const hasImageData =
    payload.imageData !== undefined &&
    payload.imageData !== null &&
    payload.imageData !== "";
  const hasImageMimeType =
    payload.imageMimeType !== undefined &&
    payload.imageMimeType !== null &&
    payload.imageMimeType !== "";

  if (hasImageData !== hasImageMimeType) {
    throw new HttpsError(
      "invalid-argument",
      "Image data and image MIME type must be provided together."
    );
  }

  if (!hasImageData) {
    return {
      message,
      previousContext: context.previousContext,
      hasImage: false,
      messageChars: message.length,
      previousContextChars: context.previousContextChars,
      contextMessageCount: context.contextMessageCount,
    };
  }

  if (
    typeof payload.imageData !== "string" ||
    typeof payload.imageMimeType !== "string"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Image data and image MIME type must be strings."
    );
  }

  const image = validateImageInput(payload.imageData, payload.imageMimeType);

  return {
    message,
    previousContext: context.previousContext,
    imageData: image.imageData,
    imageMimeType: image.imageMimeType,
    hasImage: true,
    messageChars: message.length,
    previousContextChars: context.previousContextChars,
    contextMessageCount: context.contextMessageCount,
    imageByteLength: image.imageByteLength,
    imageWidth: image.imageWidth,
    imageHeight: image.imageHeight,
  };
}

export function getRejectedRequestMetrics(data: unknown): AiAssistantRequestMetrics {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { hasImage: false };
  }

  const payload = data as AnalyzeSeedData;
  return {
    hasImage: Boolean(payload.imageData || payload.imageMimeType),
    messageChars:
      typeof payload.message === "string" ? payload.message.trim().length : undefined,
    previousContextChars:
      typeof payload.previousContext === "string"
        ? payload.previousContext.length
        : undefined,
  };
}

export function getValidatedRequestMetrics(
  data: ValidatedAnalyzeSeedData
): AiAssistantRequestMetrics {
  return {
    hasImage: data.hasImage,
    messageChars: data.messageChars,
    previousContextChars: data.previousContextChars,
    contextMessageCount: data.contextMessageCount,
    imageByteLength: data.imageByteLength,
    imageWidth: data.imageWidth,
    imageHeight: data.imageHeight,
  };
}

export async function loadAiAssistantConfig(
  db: Firestore
): Promise<AiAssistantConfig> {
  const configSnapshot = await db.doc(AI_ASSISTANT_CONFIG_DOC).get();
  const config = configSnapshot.exists ? configSnapshot.data() : undefined;

  return {
    enabled:
      typeof config?.enabled === "boolean"
        ? config.enabled
        : DEFAULT_AI_ASSISTANT_CONFIG.enabled,
    dailyTotalRequestLimit: readPositiveInteger(
      config?.dailyTotalRequestLimit,
      DEFAULT_AI_ASSISTANT_CONFIG.dailyTotalRequestLimit
    ),
    dailyImageRequestLimit: readPositiveInteger(
      config?.dailyImageRequestLimit,
      DEFAULT_AI_ASSISTANT_CONFIG.dailyImageRequestLimit
    ),
    burstWindowSeconds: readPositiveInteger(
      config?.burstWindowSeconds,
      DEFAULT_AI_ASSISTANT_CONFIG.burstWindowSeconds
    ),
    burstRequestLimit: readPositiveInteger(
      config?.burstRequestLimit,
      DEFAULT_AI_ASSISTANT_CONFIG.burstRequestLimit
    ),
    globalDailyTotalRequestLimit: readPositiveInteger(
      config?.globalDailyTotalRequestLimit,
      DEFAULT_AI_ASSISTANT_CONFIG.globalDailyTotalRequestLimit
    ),
    globalDailyImageRequestLimit: readPositiveInteger(
      config?.globalDailyImageRequestLimit,
      DEFAULT_AI_ASSISTANT_CONFIG.globalDailyImageRequestLimit
    ),
  };
}

export function assertAiAssistantEnabled(config: AiAssistantConfig) {
  if (!config.enabled) {
    throw new HttpsError(
      "unavailable",
      "AI assistant is temporarily disabled. Please try again later."
    );
  }
}

export function assertQuotaAvailable(
  counts: QuotaCounts,
  config: AiAssistantConfig,
  hasImage: boolean
) {
  if (counts.globalTotalRequests >= config.globalDailyTotalRequestLimit) {
    throw new HttpsError(
      "resource-exhausted",
      "Daily AI assistant capacity reached. Please try again tomorrow."
    );
  }

  if (hasImage && counts.globalImageRequests >= config.globalDailyImageRequestLimit) {
    throw new HttpsError(
      "resource-exhausted",
      "Daily AI image capacity reached. Please try again tomorrow."
    );
  }

  if (counts.totalRequests >= config.dailyTotalRequestLimit) {
    throw new HttpsError(
      "resource-exhausted",
      "Daily AI assistant request limit reached. Please try again tomorrow."
    );
  }

  if (hasImage && counts.imageRequests >= config.dailyImageRequestLimit) {
    throw new HttpsError(
      "resource-exhausted",
      "Daily AI image upload limit reached. Please try again tomorrow."
    );
  }

  if (counts.burstRequests >= config.burstRequestLimit) {
    throw new HttpsError(
      "resource-exhausted",
      "AI assistant request limit reached. Please wait a minute and try again."
    );
  }
}

export function hashUid(uid: string): string {
  return createHash("sha256").update(uid).digest("hex");
}

export function getErrorCategory(error: unknown): string {
  if (error instanceof HttpsError) {
    return error.code;
  }

  if (error instanceof Error) {
    return error.name || "error";
  }

  return typeof error;
}

export async function reserveAiAssistantQuota(
  db: Firestore,
  uid: string,
  hasImage: boolean,
  config: AiAssistantConfig,
  now = new Date()
) {
  const uidHash = hashUid(uid);
  const { date, dateKey } = getUtcDateInfo(now);
  const usageRoot = db.collection(AI_ASSISTANT_USAGE_COLLECTION).doc(dateKey);
  const userUsageRef = usageRoot.collection("users").doc(uidHash);
  const burstWindowMs = config.burstWindowSeconds * 1000;
  const burstWindowStartMs = Math.floor(now.getTime() / burstWindowMs) * burstWindowMs;
  const burstRef = usageRoot
    .collection("bursts")
    .doc(`${uidHash}_${burstWindowStartMs}`);

  await db.runTransaction(async (transaction) => {
    const globalSnapshot = await transaction.get(usageRoot);
    const userSnapshot = await transaction.get(userUsageRef);
    const burstSnapshot = await transaction.get(burstRef);
    const globalUsage = globalSnapshot.exists ? globalSnapshot.data() : undefined;
    const userUsage = userSnapshot.exists ? userSnapshot.data() : undefined;
    const burstUsage = burstSnapshot.exists ? burstSnapshot.data() : undefined;

    assertQuotaAvailable(
      {
        totalRequests: safeCount(userUsage?.totalRequests),
        imageRequests: safeCount(userUsage?.imageRequests),
        burstRequests: safeCount(burstUsage?.requestCount),
        globalTotalRequests: safeCount(globalUsage?.totalRequests),
        globalImageRequests: safeCount(globalUsage?.imageRequests),
      },
      config,
      hasImage
    );

    transaction.set(
      usageRoot,
      {
        date,
        dateKey,
        totalRequests: safeCount(globalUsage?.totalRequests) + 1,
        imageRequests: safeCount(globalUsage?.imageRequests) + (hasImage ? 1 : 0),
        updatedAt: FieldValue.serverTimestamp(),
        ...(globalSnapshot.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    transaction.set(
      userUsageRef,
      {
        uid,
        uidHash,
        date,
        dateKey,
        totalRequests: safeCount(userUsage?.totalRequests) + 1,
        imageRequests: safeCount(userUsage?.imageRequests) + (hasImage ? 1 : 0),
        updatedAt: FieldValue.serverTimestamp(),
        ...(userSnapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    transaction.set(
      burstRef,
      {
        uid,
        uidHash,
        date,
        dateKey,
        windowStartMs: burstWindowStartMs,
        windowEndMs: burstWindowStartMs + burstWindowMs,
        requestCount: safeCount(burstUsage?.requestCount) + 1,
        updatedAt: FieldValue.serverTimestamp(),
        ...(burstSnapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );
  });
}

export async function createAiAssistantEvent(
  db: Firestore,
  input: {
    uid: string;
    model: string;
    status: AiAssistantEventStatus;
    metrics: AiAssistantRequestMetrics;
    startTimeMs: number;
    errorCategory?: string;
  }
): Promise<AiAssistantEventHandle> {
  const uidHash = hashUid(input.uid);
  const { date, dateKey } = getUtcDateInfo(new Date(input.startTimeMs));
  const ref = db
    .collection(AI_ASSISTANT_EVENTS_COLLECTION)
    .doc(dateKey)
    .collection("events")
    .doc();

  await ref.set({
    uid: input.uid,
    uidHash,
    date,
    dateKey,
    model: input.model,
    status: input.status,
    errorCategory: input.errorCategory || null,
    latencyMs: 0,
    hasImage: input.metrics.hasImage,
    messageChars: input.metrics.messageChars || 0,
    previousContextChars: input.metrics.previousContextChars || 0,
    contextMessageCount: input.metrics.contextMessageCount || 0,
    imageByteLength: input.metrics.imageByteLength || 0,
    imageWidth: input.metrics.imageWidth || 0,
    imageHeight: input.metrics.imageHeight || 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    ref,
    startTimeMs: input.startTimeMs,
  };
}

export async function updateAiAssistantEvent(
  event: AiAssistantEventHandle,
  status: AiAssistantEventStatus,
  errorCategory?: string
) {
  await event.ref.set(
    {
      status,
      errorCategory: errorCategory || null,
      latencyMs: Date.now() - event.startTimeMs,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}