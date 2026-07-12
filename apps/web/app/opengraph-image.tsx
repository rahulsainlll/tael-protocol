import { ImageResponse } from "next/og";

export const alt = "Tael — The payment layer for autonomous AI agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social preview card — matches the marketing hero. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(180deg, #000000 0%, #0a0a0a 55%, #26262b 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* Wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 44, color: "#156DFC", lineHeight: 1 }}>t</span>
        <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: "0.01em" }}>tael</span>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 88, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
          The payment layer.
        </div>
        <div style={{ fontSize: 88, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
          For AI agents.
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.62)" }}>
        Pay for any API, tool, or dataset — per call, in USDC on Stellar.
      </div>
    </div>,
    { ...size },
  );
}
