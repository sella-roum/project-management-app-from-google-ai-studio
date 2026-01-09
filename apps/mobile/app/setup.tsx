import { useRouter } from "expo-router";
import { SetupWizard } from "@/components/setup-wizard";

export default function SetupScreen() {
  const router = useRouter();

  return (
    <SetupWizard onComplete={() => router.replace("/(tabs)/home")} />
  );
}
