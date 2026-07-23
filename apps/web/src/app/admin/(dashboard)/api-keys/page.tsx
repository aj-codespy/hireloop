import { FadeIn } from "@/components/motion/fade-in";
import { ApiKeysManager } from "@/components/api-keys/api-keys-manager";

export default function ApiKeysPage() {
  return (
    <FadeIn>
      <ApiKeysManager />
    </FadeIn>
  );
}