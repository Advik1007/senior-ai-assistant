/**
 * Tool contracts for UNK Command AI.
 * The assistant may only request one of these tools.
 */

export type AssistantToolName =
  | "call_family_member"
  | "open_medical"
  | "open_doctor_nearby"
  | "open_shopping"
  | "open_routine"
  | "open_help"
  | "open_emergency"
  | "open_directions"
  | "create_reminder";

export type CallFamilyArgs = {
  relationship?: string;
  name?: string;
};

export type OpenDirectionsArgs = {
  destination?: string;
  mode?: "walking" | "driving" | "transit" | "bicycling";
};

export type CreateReminderArgs = {
  title?: string;
  time?: string;
  days?: string;
};

export type OpenDoctorArgs = Record<string, never>;

export type ToolCall =
  | { name: "call_family_member"; args: CallFamilyArgs }
  | { name: "open_medical"; args: OpenDoctorArgs }
  | { name: "open_doctor_nearby"; args: OpenDoctorArgs }
  | { name: "open_shopping"; args: Record<string, never> }
  | { name: "open_routine"; args: Record<string, never> }
  | { name: "open_help"; args: Record<string, never> }
  | { name: "open_emergency"; args: Record<string, never> }
  | { name: "open_directions"; args: OpenDirectionsArgs }
  | { name: "create_reminder"; args: CreateReminderArgs };
