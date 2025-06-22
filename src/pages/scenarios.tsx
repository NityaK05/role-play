import React, { useState } from 'react';
import ScenarioSetupForm from '../components/ScenarioSetupForm';

export default function ScenariosPage() {
  const [session, setSession] = useState<any>(null);

  if (!session) {
    return <ScenarioSetupForm onStart={setSession} />;
  }

  // After form is submitted, redirect to the main app (e.g., home page or simulation)
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
  return null;
}
