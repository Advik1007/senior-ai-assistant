import { Suspense } from "react";
import CheckEmailPage from "./CheckEmailClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckEmailPage />
    </Suspense>
  );
}
