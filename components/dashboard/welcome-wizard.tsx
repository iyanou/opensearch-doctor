"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export function WelcomeWizard() {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  return (
    <OnboardingWizard
      onDismiss={() => {
        setDismissed(true);
        router.replace("/dashboard");
      }}
    />
  );
}
