import { authNetworkErrorMessage } from "@/lib/auth/errors";

describe("authNetworkErrorMessage — friendly copy mapping (H3)", () => {
  it("maps invalid OTP messages to friendly copy", () => {
    expect(authNetworkErrorMessage(new Error("invalid_otp"))).toMatch(/code|valid/i);
    expect(authNetworkErrorMessage(new Error("Token has expired or is invalid"))).toMatch(
      /code|valid|expired/i
    );
  });

  it("maps expired OTP messages to friendly copy", () => {
    expect(authNetworkErrorMessage(new Error("otp_expired"))).toMatch(/expired/i);
    expect(authNetworkErrorMessage(new Error("Email OTP expired"))).toMatch(/expired/i);
  });

  it("maps rate-limit messages to a retry-later hint", () => {
    const rate = authNetworkErrorMessage(new Error("Email rate limit exceeded"));
    expect(rate).toMatch(/later|again|few minutes/i);
    expect(authNetworkErrorMessage(new Error("Request rate limit reached"))).toMatch(
      /later|again|few minutes/i
    );
  });

  it("maps email-not-confirmed messages to friendly copy", () => {
    expect(authNetworkErrorMessage(new Error("Email not confirmed"))).toMatch(
      /confirm|verify/i
    );
  });

  it("keeps the network fallback for fetch errors", () => {
    const msg = authNetworkErrorMessage(
      new TypeError("fetch failed: load failed")
    );
    expect(msg).toMatch(/internet connection/i);
  });

  it("falls back to generic copy for unknown errors", () => {
    const msg = authNetworkErrorMessage(new Error("mystery internal detail"));
    expect(msg).toMatch(/something went wrong|try again/i);
  });
});
