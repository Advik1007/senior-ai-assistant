import { DeviceLoginResult } from "@/components/DeviceLoginResult";
import { verifyDeviceLoginToken } from "@/lib/email/device-login-tokens";
import { DEFAULT_LANGUAGE } from "@/lib/languages";

export default async function DeviceDenyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <DeviceLoginResult variant="error" lang={DEFAULT_LANGUAGE} />
    );
  }

  const result = await verifyDeviceLoginToken(token);

  if (!result.ok) {
    return (
      <DeviceLoginResult
        variant={result.reason === "used" ? "used" : "error"}
        lang={DEFAULT_LANGUAGE}
      />
    );
  }

  if (result.payload.action !== "deny") {
    return (
      <DeviceLoginResult variant="error" lang={result.payload.lang} />
    );
  }

  return (
    <DeviceLoginResult variant="deny" lang={result.payload.lang} />
  );
}
