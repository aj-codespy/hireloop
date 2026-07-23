import { FadeIn } from "@/components/motion/fade-in";
import { RoleGate } from "@/components/auth/role-gate";
import { ApiKeysManager } from "@/components/api-keys/api-keys-manager";

export default function ApiKeysPage() {
  return (
    <RoleGate minRole="admin">
      <FadeIn>
        <ApiKeysManager />
      </FadeIn>
    </RoleGate>
  );
}