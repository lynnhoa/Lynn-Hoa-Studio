import { useState, useEffect } from "react";

// ─── THEME ────────────────────────────────────────────────
export const C = {
  bg:"#faf9f7", black:"#1a1a1a", muted:"#888", light:"#b8b3ad",
  rule:"#e8e4df", white:"#fff", amber:"#c0956a", amberBg:"#fdf5ee",
  amberBorder:"#e8d8c8", red:"#c0857a", redBg:"#fdf0ee",
  redBorder:"#e8d8d5", green:"#6a9a6a", greenBg:"#f0f5f0", greenBorder:"#b8d4b8"
};
export const SERIF = "'Georgia','Times New Roman',serif";
export const SANS  = "'Helvetica Neue',Arial,sans-serif";

// ─── DATA PERSISTENCE ─────────────────────────────────────
export function useGetData() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lynnhoa_data");
      setData(stored ? JSON.parse(stored) : {});
    } catch {
      setData({});
    }
    setIsLoading(false);
  }, []);
  return { data, isLoading };
}
export function useSaveData() {
  return {
    mutate: ({ data }: { data: any }) => {
      try {
        localStorage.setItem("lynnhoa_data", JSON.stringify(data));
      } catch(e) { console.error("Save failed", e); }
    }
  };
}

// ─── APP LOGO ─────────────────────────────────────────────
export function AppLogo({ size = "nav" }: { size?: "nav" | "auth" | "web" }) {
  const big = size === "auth";
  const web = size === "web";
  return (
    <div style={{ textAlign: "center", lineHeight: 1, display: "inline-block" }}>
      <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: big ? 26 : web ? 24 : 18, letterSpacing: "0.02em", color: C.black, display: "block" }}>Lynn Hoa</span>
      <span style={{ fontFamily: SANS, fontSize: big ? 8 : web ? 7 : 6.5, letterSpacing: "0.26em", textTransform: "uppercase" as const, color: C.muted, display: "block", marginTop: big ? 4 : 2 }}>Studio</span>
    </div>
  );
}
