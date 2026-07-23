import { FadeIn } from "@/components/motion/fade-in";
import { RoleGate } from "@/components/auth/role-gate";
import { WebhooksManager } from "@/components/webhooks/webhooks-manager";

export default function WebhooksPage() {
  return (
    <RoleGate minRole="admin">
      <FadeIn>
        <WebhooksManager />
      </FadeIn>
    </RoleGate>
  );
}