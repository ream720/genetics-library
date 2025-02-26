// functions/index.ts
import { onCall } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";
import { createSeedAssistantFlows } from "./flows/seedAssistant.js";

// Define email password as a secret parameter
const emailPassword = defineSecret("EMAIL_PASSWORD");
const googleAiKey = defineSecret("GOOGLE_AI_API_KEY");

export const analyzeSeed = onCall(
  {
    enforceAppCheck: false,
    secrets: [googleAiKey],
  },
  async (request) => {
    const { message, previousContext } = request.data;

    try {
      // Initialize flows with the runtime API key
      const { analyzeSeedFlow } = createSeedAssistantFlows(googleAiKey.value());

      const result = await analyzeSeedFlow({
        message,
        previousContext,
      });
      return result;
    } catch (error) {
      console.error("Seed analysis error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to analyze seed"
      );
    }
  }
);

export const sendSupportEmail = onCall(
  {
    enforceAppCheck: false,
    secrets: [emailPassword], // Explicitly declare secrets used by this function
  },
  async (request) => {
    const { message } = request.data;
    const userEmail = request.auth?.token.email;

    if (!request.auth) {
      throw new Error("Unauthorized");
    }

    // Create transporter inside function to ensure secret is available
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "geneticslibrary@gmail.com",
        pass: emailPassword.value(),
      },
    });

    try {
      const result = await transporter.sendMail({
        from: "geneticslibrary@gmail.com",
        to: "geneticslibrary@gmail.com",
        subject: "Support Request",
        text: `Message from ${userEmail}:\n\n${message}`,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("Email sent successfully:", result);
      }
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      throw new Error("Failed to send email: An unknown error occurred");
    }
  }
);
