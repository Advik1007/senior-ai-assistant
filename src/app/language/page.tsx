import { redirect } from "next/navigation";

/** Old language URL → app start. */
export default function LanguagePage() {
  redirect("/start");
}
