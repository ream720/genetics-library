import { onCall } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "geneticslibrary@gmail.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendSupportEmail = onCall(async (request) => {
  const { message } = request.data;
  const userEmail = request.auth?.token.email;

  if (!request.auth) {
    throw new Error("Unauthorized");
  }

  try {
    await transporter.sendMail({
      from: "geneticslibrary@gmail.com",
      to: "geneticslibrary@gmail.com",
      subject: "Support Request",
      text: `Message from ${userEmail}:\n\n${message}`,
    });
    return { success: true };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
});
