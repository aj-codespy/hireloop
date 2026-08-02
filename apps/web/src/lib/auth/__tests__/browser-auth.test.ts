import { browserSendOtp, browserVerifyOtp } from "@/lib/auth/browser-auth";

jest.mock("@/utils/supabase/client", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@/utils/supabase/client";

const mockCreateClient = createClient as jest.Mock;

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    ...overrides,
  };
}

describe("browser-auth friendly copy (H3 residual)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps invalid_otp to friendly copy on browserVerifyOtp", async () => {
    mockCreateClient.mockReturnValue(
      makeClient({
        auth: {
          signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
          verifyOtp: jest.fn().mockResolvedValue({ error: { message: "invalid_otp" } }),
        },
      })
    );

    const res = await browserVerifyOtp("a@b.com", "123456", "candidate");
    expect(res.error).toMatch(/code isn't valid|latest code/i);
    expect(res.error).not.toContain("invalid_otp");
  });

  it("maps expired otp to friendly copy on browserVerifyOtp", async () => {
    mockCreateClient.mockReturnValue(
      makeClient({
        auth: {
          signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
          verifyOtp: jest.fn().mockResolvedValue({ error: { message: "Email OTP expired" } }),
        },
      })
    );

    const res = await browserVerifyOtp("a@b.com", "123456", "candidate");
    expect(res.error).toMatch(/expired/i);
    expect(res.error).not.toContain("Email OTP expired");
  });

  it("maps rate-limit message to retry-later hint on browserSendOtp", async () => {
    mockCreateClient.mockReturnValue(
      makeClient({
        auth: {
          signInWithOtp: jest.fn().mockResolvedValue({ error: { message: "Email rate limit exceeded" } }),
        },
      })
    );

    const res = await browserSendOtp("a@b.com", "signin");
    expect(res.error).toMatch(/few minutes/i);
    expect(res.error).not.toContain("rate limit exceeded");
  });

  it("does not leak raw messages on profile lookup failure", async () => {
    mockCreateClient.mockReturnValue(
      makeClient({
        auth: {
          signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
          verifyOtp: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            error: { message: "PGRST116: internal schema detail" },
          }),
        }),
      })
    );

    const res = await browserVerifyOtp("a@b.com", "123456", "candidate");
    expect(res.error).toBeDefined();
    expect(res.error).not.toContain("PGRST116");
  });
});
