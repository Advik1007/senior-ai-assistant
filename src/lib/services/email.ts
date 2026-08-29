import { sendBookingEmail } from "@/lib/email/service";

/**
 * Confirmation emails should be sent only after a real booking
 * confirmation id exists. Do not email "booked" for drafts.
 */
export async function sendBookingConfirmationEmail(input: {
  to: string;
  subject: string;
  body: string;
  confirmationId: string;
}): Promise<void> {
  if (!input.confirmationId) {
    throw new Error("Refusing to send email without a real confirmation id.");
  }
  await sendBookingEmail(input);
}
