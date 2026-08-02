import { render, screen } from "@testing-library/react";
import { WebhooksManager } from "@/components/webhooks/webhooks-manager";

jest.mock("@/hooks/useWebhooks", () => ({
  useWebhooks: jest.fn(),
  ALL_WEBHOOK_EVENTS: ["candidate.qualified"],
  WEBHOOK_EVENT_LABELS: { "candidate.qualified": "Candidate qualified for final interview" },
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

import { useWebhooks } from "@/hooks/useWebhooks";

const mockUseWebhooks = useWebhooks as jest.Mock;

function baseHook(webhooks: unknown[]) {
  return {
    webhooks,
    loading: false,
    createWebhook: jest.fn(),
    updateWebhook: jest.fn(),
    toggleWebhook: jest.fn(),
    deleteWebhook: jest.fn(),
    testWebhook: jest.fn(),
  };
}

function endpoint(overrides: Partial<{ id: string; status: string; lastDeliveryStatus: string | null }>) {
  return {
    id: "wh-1",
    url: "https://api.example.com/hooks",
    description: "HRIS sync",
    events: ["candidate.qualified"],
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    lastDeliveryAt: "2026-01-02T00:00:00Z",
    lastDeliveryStatus: "success",
    ...overrides,
  };
}

describe("WebhooksManager — failed delivery visibility (M4)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a failed-delivery alert with count when endpoints have failing deliveries", () => {
    mockUseWebhooks.mockReturnValue(
      baseHook([
        endpoint({ id: "wh-1", lastDeliveryStatus: "failed" }),
        endpoint({ id: "wh-2", lastDeliveryStatus: "failed" }),
        endpoint({ id: "wh-3", lastDeliveryStatus: "success" }),
      ])
    );

    render(<WebhooksManager />);

    expect(
      screen.getByText(/2 webhook endpoints? (are|is) failing/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/retry automatically with exponential backoff/i)
    ).toBeInTheDocument();
  });

  it("shows no alert when all deliveries succeed", () => {
    mockUseWebhooks.mockReturnValue(
      baseHook([endpoint({ id: "wh-1", lastDeliveryStatus: "success" })])
    );

    render(<WebhooksManager />);

    expect(screen.queryByText(/failing deliveries/i)).not.toBeInTheDocument();
  });

  it("shows no alert when there are no webhooks", () => {
    mockUseWebhooks.mockReturnValue(baseHook([]));

    render(<WebhooksManager />);

    expect(screen.queryByText(/failing deliveries/i)).not.toBeInTheDocument();
  });
});
