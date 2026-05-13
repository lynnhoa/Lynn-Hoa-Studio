import { useState, useEffect } from "react";
import { C, SERIF, SANS, AppLogo } from "./shared";

// ─── CREATOR PAGE ─────────────────────────────────────────
export default function CreatorPage({
  settings,
  logout,
}: {
  settings: any;
  logout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 680);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 680);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const initials = (() => {
    const n = (settings.name || settings.company || "Lynn Hoa").trim();
    const p = n.split(/\s+/);
    return p.length >= 2
      ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
      : n.slice(0, 2).toUpperCase();
  })();

  const AvatarMenu = ({ alignRight = false }: { alignRight?: boolean }) => (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setMenuOpen(false)} />
      )}
      <button
        onClick={() => setMenuOpen(m => !m)}
        title="Account"
        style={{
          width: 30, height: 30, borderRadius: "50%",
          background: C.black, color: C.white,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SANS, fontSize: 9, letterSpacing: "0.04em",
          flexShrink: 0, position: "relative", zIndex: 200,
        }}
      >
        {initials}
      </button>

      {menuOpen && (
        <div style={{
          position: "absolute",
          ...(alignRight ? { right: 0 } : { left: 0 }),
          top: "calc(100% + 13px)",
          background: C.bg, border: `1px solid ${C.rule}`,
          borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          minWidth: 172, zIndex: 200,
        }}>
          <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${C.rule}` }}>
            <p style={{ fontSize: 11, color: C.black, margin: "0 0 1px", fontFamily: SERIF }}>
              {settings.name || settings.company || "Lynn Hoa"}
            </p>
            <p style={{ fontSize: 7.5, color: C.light, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Creator · Private
            </p>
          </div>
          <div style={{ borderTop: `1px solid ${C.rule}` }} />
          <button
            onClick={() => { setMenuOpen(false); logout(); }}
            style={{
              display: "flex", alignItems: "center",
              width: "100%", padding: "10px 14px",
              background: "none", border: "none", cursor: "pointer",
              textAlign: "left", fontFamily: SANS, fontSize: 10,
              color: C.red, letterSpacing: "0.04em", boxSizing: "border-box",
            }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: SANS, color: C.black }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${C.rule}`,
        position: "sticky", top: 0,
        background: C.bg, zIndex: 100,
      }}>
        {isMobile ? (
          <>
            <div style={{ textAlign: "center", padding: "10px 20px 7px" }}>
              <AppLogo />
            </div>
            <div style={{ borderTop: `1px solid ${C.rule}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 44 }}>
              <AvatarMenu alignRight={false} />
              <div />
            </div>
          </>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center", padding: "0 28px", height: 56,
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <AvatarMenu alignRight={false} />
            </div>
            <div style={{ textAlign: "center" }}>
              <AppLogo size="web" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }} />
          </div>
        )}
      </div>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <p style={{ fontFamily: SERIF, fontSize: 28, fontWeight: "normal", color: C.black, margin: "0 0 14px" }}>
          Creator View
        </p>
        <p style={{ fontSize: 11, color: C.muted, letterSpacing: "0.03em", lineHeight: 1.7 }}>
          This space is being built.<br />Check back soon.
        </p>
      </div>

    </div>
  );
}
