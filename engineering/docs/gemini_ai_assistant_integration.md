# Gemini AI Assistant Integration

This document describes the Gemini-backed Seed Assistant implementation, the security and cost controls around it, and the operational switches that should be checked before deploying changes.

## Overview

The AI Assistant extracts structured cannabis seed catalog data from user text and optional seed-pack photos. The browser never calls Gemini directly. It sends a Firebase Callable Function request to `analyzeSeed`, and the Cloud Function runs the Genkit flow with the `GOOGLE_AI_API_KEY` Firebase secret.

Primary files:

- `src/components/ConversationalSeedAssistant.tsx`: main chat/photo assistant UI.
- `src/components/SeedAssistantDialog.tsx`: legacy text-only assistant entry point.
- `src/lib/firebase.ts`: typed callable wrapper and shared frontend request limits.
- `functions/src/index.ts`: callable boundary, auth/App Check, quota reservation, event status updates.
- `functions/src/lib/aiAssistantGuards.ts`: validation, image inspection, quota logic, usage/event metadata helpers.
- `functions/src/flows/seedAssistant.ts`: Genkit flow execution and structured output enforcement.
- `functions/src/lib/genkit.ts`: Gemini model reference and Genkit plugin setup.
- `functions/prompts/seed-analysis.prompt`: extraction instructions and multimodal prompt input.

## Model and Cost Choices

The assistant uses `gemini-2.5-flash-lite` with a 768 output-token cap.

Why this model:

- It is stable, not a preview model.
- It supports multimodal text and image inputs.
- It supports structured outputs.
- It is the lowest-cost 2.5 family option suited to lightweight extraction and classification.

The implementation deliberately does not fall back automatically to a more expensive model. If extraction quality becomes insufficient, choose a new model explicitly and document the cost/quality tradeoff before changing the default.

`thinkingBudget` is not configured in this pass because the installed Genkit Google AI config schema does not expose that Gemini API field. Revisit only if migrating this flow from Genkit to the current `@google/genai` SDK is worth the added implementation churn.

Reference docs:

- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/structured-output

## Request Flow

1. The user enters text and may attach an image.
2. The client compresses selected images to JPEG, max 1600 px on the long edge, with a 2 MB compressed-size cap.
3. The client sends `analyzeSeed({ message, previousContext?, imageData?, imageMimeType? })` through Firebase Functions.
4. The callable requires Firebase Auth and App Check.
5. The server validates and normalizes the payload before reserving quota.
6. The server creates a metadata-only event row with status `started`.
7. The server loads `appConfig/aiAssistant`, applies kill-switch and quota checks, and reserves quota in Firestore.
8. The Genkit flow calls Gemini using the server-side secret.
9. The event status is updated to `success`, `model_error`, `quota_denied`, `disabled`, or `validation_error`.
10. The structured seed data returns to the client for review before catalog insertion.

## Validation and Abuse Controls

The server treats all client inputs as untrusted, even when the UI already compressed or limited them.

Text controls:

- `message` is required, trimmed, and capped at 2,000 characters.
- `previousContext` must be valid JSON with a `messages` array.
- Context is reduced to the last 4 messages.
- Each context message keeps only `role` and `content`.
- Each context message content is capped at 500 characters.
- Any seed data, image data, or arbitrary client fields in context are dropped.

Image controls:

- `imageData` and `imageMimeType` must be provided together.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Data URL MIME type must match the declared MIME type when a data URL is sent.
- Base64 is normalized and validated.
- Decoded image size must be 2 MB or smaller.
- Server reads image signatures and dimensions for JPEG, PNG, and WebP.
- Width and height must each be 1600 px or smaller.
- The server reconstructs the trusted data URL passed to Genkit from validated base64 and MIME data.

Boundary controls:

- `analyzeSeed` uses `enforceAppCheck: true`.
- `analyzeSeed` requires `request.auth`.
- Gemini API key access stays inside Cloud Functions through Firebase Secret Manager.
- Stale browser-side Genkit and direct browser API-key files were removed.

## Kill Switch and Quotas

The optional config document is:

`appConfig/aiAssistant`

Defaults apply when the document or individual fields are missing:

```json
{
  "enabled": true,
  "dailyTotalRequestLimit": 25,
  "dailyImageRequestLimit": 5,
  "burstWindowSeconds": 60,
  "burstRequestLimit": 3,
  "globalDailyTotalRequestLimit": 500,
  "globalDailyImageRequestLimit": 100
}
```

Operational behavior:

- Set `enabled` to `false` to disable the assistant without redeploying.
- Daily limits are based on UTC date keys.
- Per-user usage documents use SHA-256 hashed UID path segments.
- Every validated attempt counts against quota before the Gemini call, including attempts that later fail, because failed generations can still incur API cost.
- Burst limits block rapid repeated use in the configured time window.
- Global limits cap project-wide daily exposure if individual accounts or App Check are abused.

## Usage and Event Storage

The assistant writes aggregate usage and event metadata, but it must not store raw prompt text, raw prior context text, base64 images, or generated image content.

Usage counters live under `aiAssistantUsage/{dateKey}` with subcollections for per-user and burst counters.

Metadata events live under `aiAssistantEvents/{dateKey}/events/{eventId}` and include:

- `uid` and `uidHash`
- `date` and `dateKey`
- `model`
- `status`
- `errorCategory`
- `latencyMs`
- `hasImage`
- `messageChars`
- `previousContextChars`
- `contextMessageCount`
- `imageByteLength`
- `imageWidth`
- `imageHeight`
- timestamps

These fields are intended for cost monitoring, abuse triage, and debugging request shape without retaining user prompt or image contents.

## App Check Details

`firebaseConfig.ts` initializes App Check only when `VITE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY` is configured. This value is public client configuration for the Firebase Web App, but it must still be available at build time because Vite inlines `VITE_*` variables into the browser bundle.

Required setup before deploying `analyzeSeed` with App Check enforcement:

- Create or locate the Web reCAPTCHA Enterprise App Check provider for the Firebase app.
- Add the site key to local `.env` as `VITE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY=...`.
- Add the same value to GitHub Actions secrets as `VITE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY`.
- Ensure both Firebase hosting workflows pass that secret into `npm run build:firebase`.
- Confirm production hosting domains are allowed for the App Check provider.

Debug token behavior:

- `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` is honored only in Vite development mode.
- Do not set a debug token in production hosting builds or GitHub Actions production deploys.
- For local testing against deployed functions, register a Firebase App Check debug token and set `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` locally.

## Local and Deployed Testing

There are two useful test paths.

Local frontend only:

- Run `npm run dev` to test UI behavior such as image compression, text limits, and basic rendering.
- Because `src/lib/firebase.ts` does not currently call `connectFunctionsEmulator`, this local app talks to deployed Cloud Functions by default.
- That means local testing of the new backend requires the new function code to be deployed, or a separate emulator wiring change.
- App Check must have a valid site key/debug token setup for localhost if the local app calls deployed `analyzeSeed`.

Deployed path:

- The GitHub `main` merge workflow deploys both hosting and functions with `firebase deploy --only hosting,functions`.
- The PR preview workflow deploys hosting preview only, not functions.
- A PR preview may therefore run against the currently deployed production function, not the function changes in the PR.

Recommended rollout for assistant changes:

1. Run local checks: `npm --prefix functions exec tsc -- --noEmit`, `npx tsc -p tsconfig.app.json --noEmit`, and `npm --prefix functions run test:guards`.
2. Optionally run `npm run dev` to test frontend-only behavior.
3. Deploy functions and hosting together, either through the `main` workflow or `firebase deploy --only hosting,functions`.
4. Test text-only extraction on the deployed site.
5. Test image extraction on the deployed site.
6. Trigger burst quota with repeated requests to verify the user-facing quota error.
7. Set `appConfig/aiAssistant.enabled` to `false`, verify the kill switch message, then restore it.
8. Confirm `aiAssistantUsage` and `aiAssistantEvents` contain metadata but no prompt or image contents.

## Maintenance Notes

- Keep prompt output schemas strict and server-validated. The assistant should never trust model output without Zod validation.
- Keep all Gemini model changes centralized in `functions/src/lib/genkit.ts` and `functions/prompts/seed-analysis.prompt`.
- Keep frontend and server limits aligned, but treat server limits as authoritative.
- If adding a Functions emulator path later, gate it behind development-only config and do not weaken production App Check behavior.
- If model quality problems appear, review failed metadata rates and sample behavior manually without logging raw prompts/images by default.