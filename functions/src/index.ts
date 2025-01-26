// functions/index.ts
import { onCall } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

// Define email password as a secret parameter
const emailPassword = defineSecret("EMAIL_PASSWORD");

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

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      throw new Error("Failed to send email: An unknown error occurred");
    }
  }
);
