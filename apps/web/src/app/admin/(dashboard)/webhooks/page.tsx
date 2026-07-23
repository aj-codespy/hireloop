import { FadeIn } from "@/components/motion/fade-in";
import { WebhooksManager } from "@/components/webhooks/webhooks-manager";

export default function WebhooksPage() {
  return (
    <FadeIn>
      <WebhooksManager />
    </FadeIn>
  );
}