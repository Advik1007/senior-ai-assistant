/**
 * Tool contracts for UNK.
 *
 * The assistant must not take arbitrary actions. It may only request
 * one of these tools. Booking/payment tools search or start a flow —
 * they never charge money by themselves.
 */

export type AssistantToolName =
  | "call_family_member"
  | "search_cabs"
  | "search_flights"
  | "search_bill_options"
  | "search_nurse_services"
  | "search_blood_tests";

export type CallFamilyArgs = {
  relationship?: string;
  name?: string;
};

export type SearchCabsArgs = {
  destination?: string;
  when?: string;
};

export type SearchFlightsArgs = {
  origin?: string;
  destination?: string;
  date?: string;
  passengers?: number;
};

export type SearchBillsArgs = {
  billType?: "electricity" | "water";
};

export type SearchNurseArgs = {
  when?: string;
  location?: string;
};

export type SearchBloodTestsArgs = {
  test?: string;
  location?: string;
  collection?: "home" | "lab";
  when?: string;
};

export type ToolCall =
  | { name: "call_family_member"; args: CallFamilyArgs }
  | { name: "search_cabs"; args: SearchCabsArgs }
  | { name: "search_flights"; args: SearchFlightsArgs }
  | { name: "search_bill_options"; args: SearchBillsArgs }
  | { name: "search_nurse_services"; args: SearchNurseArgs }
  | { name: "search_blood_tests"; args: SearchBloodTestsArgs };
