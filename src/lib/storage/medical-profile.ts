import { readJson, writeJson } from "@/lib/storage/local-store";

const KEY = "unk.medical-profile";

export type MedicineReminder = {
  id: string;
  name: string;
  dose: string;
  time: string;
  days: string;
  notes?: string;
};

export type MedicalProfile = {
  conditions: string;
  allergies: string;
  bloodGroup: string;
  emergencyNotes: string;
  medicines: MedicineReminder[];
};

const DEFAULT: MedicalProfile = {
  conditions: "",
  allergies: "",
  bloodGroup: "",
  emergencyNotes: "",
  medicines: [],
};

export function loadMedicalProfile(): MedicalProfile {
  return { ...DEFAULT, ...readJson<Partial<MedicalProfile>>(KEY, {}) };
}

export function saveMedicalProfile(profile: MedicalProfile): void {
  writeJson(KEY, profile);
}

export function addMedicine(
  medicine: Omit<MedicineReminder, "id">,
): MedicalProfile {
  const profile = loadMedicalProfile();
  const next: MedicalProfile = {
    ...profile,
    medicines: [
      ...profile.medicines,
      { ...medicine, id: crypto.randomUUID() },
    ],
  };
  saveMedicalProfile(next);
  return next;
}
