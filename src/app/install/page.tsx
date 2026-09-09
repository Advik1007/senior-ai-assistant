import { redirect } from "next/navigation";

/** Old install URL → main website landing. */
export default function InstallRedirectPage() {
  redirect("/");
}
