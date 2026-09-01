/**
 * UNK AI data model
 *
 * This file is the source of truth for what we store.
 * First version keeps data on the device (browser storage).
 * A real database (SQLite/Postgres) can use these same shapes later.
 *
 * NEVER store: UPI PINs, card CVVs, OTPs, bank passwords,
 * or any other secret payment credential.
 */

export type Relationship =
  | "son"
  | "daughter"
  | "brother"
  | "sister"
  | "spouse"
  | "grandchild"
  | "friend"
  | "caregiver"
  | "other";

export type Contact = {
  id: string;
  name: string;
  relationship: Relationship;
  /** International phone number, digits and optional leading +. */
  phoneNumber: string;
  isTrusted: boolean;
};

import type { AppLanguage } from "@/lib/languages";

export type UserProfile = {
  displayName: string;
  email: string;
  phone: string;
  preferredLanguage: AppLanguage;
};

export type TextSize = "large" | "extra-large" | "biggest";

export type AccessibilityPreferences = {
  textSize: TextSize;
  highContrast: boolean;
  accessibilityMode: boolean;
  /** Speech rate for text-to-speech. 0.7 is slow, 1 is normal. */
  voiceSpeed: number;
  language: AppLanguage;
};

export type BookingStatus =
  | "draft"
  | "awaiting_first_confirmation"
  | "awaiting_second_confirmation"
  | "submitted"
  | "confirmed"
  | "failed"
  | "cancelled";

/**
 * Booking history records. "confirmed" is only allowed when an
 * authorized external API has actually accepted the booking.
 */
export type BookingRecord = {
  id: string;
  kind: "cab" | "flight" | "bill" | "nurse" | "blood_test";
  summary: string;
  status: BookingStatus;
  totalPrice: number | null;
  currency: string;
  createdAt: string;
  providerConfirmationId: string | null;
};

export const FORBIDDEN_FIELDS = [
  "upiPin",
  "cardCvv",
  "otp",
  "bankPassword",
  "cardNumber",
] as const;
