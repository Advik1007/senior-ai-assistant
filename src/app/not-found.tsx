import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";

export default function NotFound() {
  return (
    <AppShell title="Page not found">
      <p className="text-2xl">That screen does not exist.</p>
      <BigButton href="/" tone="primary">
        Home
      </BigButton>
    </AppShell>
  );
}
