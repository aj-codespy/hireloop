import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HireLoop — Structured hiring from application to decision";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #fff4eb 0%, #ffffff 50%, #f9fafb 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#FF6B00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <path
                d="M22 10.5C22 14.09 19.09 17 15.5 17C11.91 17 9 14.09 9 10.5C9 6.91 11.91 4 15.5 4"
                stroke="white"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
              <path
                d="M10 21.5C10 17.91 12.91 15 16.5 15C20.09 15 23 17.91 23 21.5C23 25.09 20.09 28 16.5 28"
                stroke="white"
                strokeWidth="2.25"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#111827" }}>
            Hire<span style={{ color: "#FF6B00" }}>Loop</span>
          </span>
        </div>
        <p style={{ marginTop: 32, fontSize: 32, color: "#6b7280", maxWidth: 800, lineHeight: 1.4 }}>
          Structured hiring from application to decision
        </p>
      </div>
    ),
    { ...size }
  );
}
