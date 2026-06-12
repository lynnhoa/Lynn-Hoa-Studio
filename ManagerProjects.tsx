import { useState, useEffect, useRef, useCallback } from "react";
import { C, SANS, SERIF, LATO, TYPE, CONTENT_MAX } from "./constants";
import { useSizeMode } from "./useSizeMode";
import { useProjects, type Project, type ProjectStatus } from "./useProjects";
import { AddProjectModal } from "./AddProjectModal";

// ─── HELPERS ──────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

const fmtD = (d: string | null | undefined): string => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day}. ${mo[+m - 1]} ${y}`;
};

const fmtE = (n: number): string => n.toLocaleString("de-DE");

const addM = (d: string, months: number): string | null => {
  if (!d || !months) return null;
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + months);
  return dt.toISOString().split("T")[0];
};

const dLeft = (d: string | null | undefined): number | null =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null;

// ─── STATUS LIFECYCLE ─────────────────────────────────────

const PREV_STATUS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  contracted: "quoted",
  production: "contracted",
  invoiced:   "production",
  paid:       "invoiced",
};

// ─── STATUS STYLE ─────────────────────────────────────────

function statusStyle(s: ProjectStatus): { color: string; bg?: string; border: string } {
  switch (s) {
    case "quoted":      return { color: C.light,  border: C.light };
    case "contracted":  return { color: C.amber,  bg: C.amberBg, border: C.amberBorder };
    case "production":  return { color: C.white,  bg: C.black,   border: C.black };
    case "invoiced":    return { color: C.green,  bg: C.greenBg, border: C.greenBorder };
    case "paid":        return { color: C.green,  bg: C.greenBg, border: C.greenBorder };
    default:            return { color: C.light,  border: C.light };
  }
}

// ─── LICENSE TRACKER ──────────────────────────────────────

const LICENSE_STATUSES: ProjectStatus[] = ["production", "invoiced", "paid"];

function getUsageMo(qd: Project["qd"]): number | null {
  if (!qd) return null;
  if (qd.mo && qd.mo > 0) return qd.mo;
  for (const l of qd.lines ?? []) {
    if (l.usageLabel) {
      const m1 = String(l.usageLabel).match(/·\s*(\d+)\s*mo\b/i);
      if (m1) return parseInt(m1[1]);
      const m2 = String(l.usageLabel).match(/(\d+)\s*month/i);
      if (m2) return parseInt(m2[1]);
    }
  }
  return null;
}

function getLicenseInfo(pr: Project): { usageEnd: string | null; exclEnd: string | null } {
  if (!pr.delivery_date || !LICENSE_STATUSES.includes(pr.status)) {
    return { usageEnd: null, exclEnd: null };
  }
  const mo = getUsageMo(pr.qd);
  const originalUsageEnd = mo && mo > 0 ? addM(pr.delivery_date, mo) : null;
  const renewalUsageDates = pr.renewals.filter(r => r.type !== "excl" && r.endDate).map(r => r.endDate);
  const allUsageDates = [originalUsageEnd, ...renewalUsageDates].filter(Boolean) as string[];
  const usageEnd = allUsageDates.length > 0 ? allUsageDates.reduce((a, b) => a > b ? a : b) : null;
  const exclDates = pr.renewals.filter(r => r.type === "excl" && r.endDate).map(r => r.endDate);
  const exclEnd = exclDates.length > 0 ? exclDates.reduce((a, b) => a > b ? a : b) : null;
  return { usageEnd, exclEnd };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────

function StatusBadge({ status, sz }: { status: ProjectStatus; sz: typeof TYPE[keyof typeof TYPE] }) {
  const st = statusStyle(status);
  return (
    <span style={{
      fontFamily: LATO, fontSize: 8, letterSpacing: "0.07em",
      textTransform: "uppercase", padding: "2px 8px", borderRadius: 2,
      border: `1px solid ${st.border}`, color: st.color,
      background: st.bg ?? "transparent", whiteSpace: "nowrap" as const,
    }}>
      {status}
    </span>
  );
}

function LicenseLine({ label, end, sz }: { label: string; end: string; sz: typeof TYPE[keyof typeof TYPE] }) {
  const d = dLeft(end);
  if (d === null) return null;
  const expired  = d < 0;
  const expiring = !expired && d <= 7;
  const soon     = !expired && !expiring && d <= 30;
  const col = expired || expiring ? C.red   : soon ? C.amber   : C.green;
  const bg  = expired || expiring ? C.redBg : soon ? C.amberBg : C.greenBg;
  const bd  = expired || expiring ? C.redBorder : soon ? C.amberBorder : C.greenBorder;
  const txt = expired ? `+${Math.abs(d)}d expired` : expiring ? `${d}d left` : `${d}d`;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 9px", background: bg, border: `1px solid ${bd}`, borderRadius: 2, marginBottom: 4 }}>
      <span style={{ fontFamily: SANS, fontSize: sz.body, color: col }}>{label}</span>
      <span style={{ fontFamily: SANS, fontSize: sz.body, color: col, fontWeight: 500 }}>{fmtD(end)} · {txt}</span>
    </div>
  );
}

function DocBtn({ label, sz, green = false }: { label: string; sz: typeof TYPE[keyof typeof TYPE]; green?: boolean }) {
  const pdfIcon = (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
  return (
    <button
      onClick={e => e.stopPropagation()}
      style={{
        height: 26, padding: "0 10px", background: "none",
        border: `1px solid ${green ? C.greenBorder : C.rule}`,
        borderRadius: 2, fontFamily: SANS, fontSize: sz.body,
        color: green ? C.green : C.muted,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        whiteSpace: "nowrap" as const,
      }}
    >
      {pdfIcon}
      {label}
    </button>
  );
}

function ExpTitle({ children, sz }: { children: React.ReactNode; sz: typeof TYPE[keyof typeof TYPE] }) {
  return (
    <p style={{ fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: C.light, margin: "0 0 7px" }}>
      {children}
    </p>
  );
}

function SectionLabel({ left, right, sz }: { left: string; right?: string; sz: typeof TYPE[keyof typeof TYPE] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
      <span style={{ fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, fontWeight: 700 }}>{left}</span>
      {right && <span style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted }}>{right}</span>}
    </div>
  );
}

// ─── CAT PILL ─────────────────────────────────────────────

const CAT_PILL: Record<string, { bg: string; color: string }> = {
  influencer: { bg: "#f0f0f5", color: "#6a6aaa" },
  ugc:        { bg: "#fdf5ee", color: "#c0956a" },
  editorial:  { bg: "#f0f5f0", color: "#6a9a6a" },
};
const CAT_LABELS: Record<string, string> = {
  influencer: "Brand Collab",
  ugc:        "UGC",
  editorial:  "Editorial",
};

// ─── PROJECT ROW ──────────────────────────────────────────

function ProjectRow({ pr, muted = false, sz, mobile, autoOpen = false, selectMode = false, selected = false, onSelect, onDelete, onUpdate, onOpenCalc }: {
  pr:           Project;
  muted?:       boolean;
  sz:           typeof TYPE[keyof typeof TYPE];
  mobile:       boolean;
  autoOpen?:    boolean;
  selectMode?:  boolean;
  selected?:    boolean;
  onSelect?:    (id: string) => void;
  onDelete?:    (id: string) => Promise<{ ok: boolean; message: string }>;
  onUpdate?:    (id: string, patch: Partial<Project>) => Promise<{ ok: boolean; message: string }>;
  onOpenCalc?:  (pr: Project) => void;
}) {
  const [open,       setOpen]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [delError,   setDelError]   = useState<string | null>(null);
  const [acting,     setActing]     = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoOpen) return;
    setOpen(true);
    const t = setTimeout(() => rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close confirm when entering select mode
  useEffect(() => { if (selectMode) setConfirmDel(false); }, [selectMode]);

  const { usageEnd, exclEnd } = getLicenseInfo(pr);
  const hasLicense = !!(usageEnd || exclEnd);

  const act = async (patch: Partial<Project>) => {
    if (acting || !onUpdate) return;
    setActing(true);
    try { await onUpdate(pr.id, patch); }
    finally { setActing(false); }
  };

  const setStatus = (s: ProjectStatus) => {
    const patch: Partial<Project> = { status: s };
    if (s === "paid") { patch.paid = true; patch.paid_date = today(); }
    if (s !== "paid") { patch.paid = false; }
    act(patch);
  };

  const undoStatus = () => {
    const prev = PREV_STATUS[pr.status];
    if (!prev) return;
    act({ status: prev, paid: false, paid_date: null });
  };

  const canUndo    = !!PREV_STATUS[pr.status];
  const prevStatus = PREV_STATUS[pr.status];

  const subLine = pr.delivery_date
    ? `Delivery ${fmtD(pr.delivery_date)}`
    : pr.valid_until
    ? `Valid until ${fmtD(pr.valid_until)}`
    : pr.quote_date
    ? `Sent ${fmtD(pr.quote_date)}`
    : "";

  const showQuote    = !!pr.qd;
  const showContract = ["contracted","production","invoiced","paid"].includes(pr.status) && !!pr.qd;
  const showInvoice  = ["invoiced","paid"].includes(pr.status) && !!pr.qd;
  const showAmends   = pr.amendments.length > 0;
  const showRenewals = pr.renewals.length > 0;
  const hasDocs      = showQuote || showContract || showInvoice || showAmends || showRenewals;

  const S = {
    primary: {
      height: 28, padding: "0 14px", background: acting ? C.light : C.black,
      color: C.white, border: "none", borderRadius: 2,
      fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.1em",
      textTransform: "uppercase" as const, cursor: acting ? "default" : "pointer",
      whiteSpace: "nowrap" as const, flexShrink: 0,
    } as React.CSSProperties,
    secondary: {
      height: 28, padding: "0 12px", background: "none",
      border: `1px solid ${C.rule}`, borderRadius: 2,
      fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.1em",
      textTransform: "uppercase" as const, color: C.muted,
      cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0,
    } as React.CSSProperties,
    greenSec: {
      height: 28, padding: "0 12px", background: "none",
      border: `1px solid ${C.greenBorder}`, borderRadius: 2,
      fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.1em",
      textTransform: "uppercase" as const, color: C.green,
      cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0,
    } as React.CSSProperties,
    arr: (active: boolean) => ({
      background: "none", border: "none", padding: 0,
      fontSize: 17, lineHeight: "1",
      color: active ? C.muted : C.rule,
      cursor: active ? "pointer" : "default",
      flexShrink: 0,
    } as React.CSSProperties),
  };

  const handleRowClick = () => {
    if (selectMode) { onSelect?.(pr.id); return; }
    if (confirmDel) return;
    setOpen(o => !o);
  };

  return (
    <div
      ref={rowRef}
      style={{
        background: selected ? C.amberBg : C.white,
        border: `1px solid ${selected ? C.amberBorder : C.rule}`,
        borderRadius: 8,
        padding: mobile ? "12px 14px" : "14px 18px",
        marginBottom: 8,
        opacity: muted ? 0.55 : 1,
        boxSizing: "border-box",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onClick={handleRowClick}
    >
      {/* ── Collapsed ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        borderLeft: autoOpen && !open && !selectMode ? `2px solid ${C.green}` : "2px solid transparent",
        paddingLeft: autoOpen && !open && !selectMode ? 10 : 0,
        background: autoOpen && !open && !selectMode ? C.greenBg : "transparent",
        transition: "border-left-color 0.4s ease, background 0.4s ease, padding-left 0.4s ease",
        marginLeft: autoOpen && !open && !selectMode ? -2 : 0,
      }}>

        {/* Checkbox — select mode only */}
        {selectMode && (
          <div style={{
            width: 16, height: 16, borderRadius: 2, flexShrink: 0,
            border: `1px solid ${selected ? C.black : C.rule}`,
            background: selected ? C.black : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}>
            {selected && <div style={{ width: 6, height: 4, borderLeft: "1.5px solid #fff", borderBottom: "1.5px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.brand}</p>
          <p style={{ fontFamily: SANS, fontSize: sz.input, color: C.black, fontWeight: 500, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.project_name}</p>
          <p style={{ fontFamily: SANS, fontSize: sz.micro, color: C.light, margin: 0 }}>{subLine}</p>
        </div>

        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p style={{ fontFamily: SERIF, fontSize: 14, color: C.black, margin: "0 0 5px" }}>€ {fmtE(pr.amount)}</p>
          <StatusBadge status={pr.status} sz={sz} />
          {!selectMode && (
            <div style={{ marginTop: 5 }} onClick={e => e.stopPropagation()}>
              {!confirmDel ? (
                <p
                  onClick={() => setConfirmDel(true)}
                  style={{ fontFamily: LATO, fontSize: 7.5, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.amber, margin: 0, cursor: "pointer" }}
                >
                  Delete
                </p>
              ) : (
                <p style={{ fontFamily: LATO, fontSize: 7.5, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: 0, display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
                  <span style={{ color: C.muted }}>Sure?</span>
                  <span style={{ color: C.rule }}>·</span>
                  <span
                    onClick={async () => {
                      setDeleting(true);
                      setDelError(null);
                      const res = await onDelete?.(pr.id);
                      setDeleting(false);
                      if (!res?.ok) setDelError(res?.message ?? "Delete failed");
                    }}
                    style={{ color: C.amber, cursor: deleting ? "default" : "pointer", opacity: deleting ? 0.4 : 1 }}
                  >
                    {deleting ? "…" : "Yes, delete"}
                  </span>
                  <span style={{ color: C.rule }}>·</span>
                  <span
                    onClick={() => { setConfirmDel(false); setDelError(null); }}
                    style={{ color: C.muted, cursor: "pointer" }}
                  >
                    Cancel
                  </span>
                </p>
              )}
              {delError && <p style={{ fontFamily: LATO, fontSize: 7.5, color: C.red, margin: "3px 0 0" }}>{delError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded ── */}
      {open && !selectMode && (
        <div style={{ paddingTop: 12, borderTop: `1px solid ${C.rule}`, marginTop: 10 }} onClick={e => e.stopPropagation()}>

          {/* Details */}
          <div style={{ marginBottom: 16 }}>
            <ExpTitle sz={sz}>Details</ExpTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {pr.q_no    && <div style={{ display: "flex", justifyContent: "space-between", fontSize: sz.body }}><span style={{ color: C.muted }}>Quote No.</span><span style={{ color: C.black, fontWeight: 500 }}>{pr.q_no}</span></div>}
              {pr.contact && <div style={{ display: "flex", justifyContent: "space-between", fontSize: sz.body }}><span style={{ color: C.muted }}>Contact</span><span style={{ color: C.black, fontWeight: 500 }}>{pr.contact}</span></div>}
              {pr.quote_date && <div style={{ display: "flex", justifyContent: "space-between", fontSize: sz.body }}><span style={{ color: C.muted }}>Date</span><span style={{ color: C.black, fontWeight: 500 }}>{fmtD(pr.quote_date)}</span></div>}
              {pr.valid_until && <div style={{ display: "flex", justifyContent: "space-between", fontSize: sz.body }}><span style={{ color: C.muted }}>Valid until</span><span style={{ color: C.black, fontWeight: 500 }}>{fmtD(pr.valid_until)}</span></div>}
              {["production","invoiced","paid"].includes(pr.status) ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: sz.body }}>
                  <span style={{ color: C.muted }}>Delivery</span>
                  <input
                    type="date"
                    value={pr.delivery_date ?? ""}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { const v = e.target.value; if (v) act({ delivery_date: v }); }}
                    style={{ height: 24, padding: "0 8px", border: `1px solid ${C.rule}`, borderRadius: 2, background: C.bg, fontFamily: SANS, fontSize: sz.body, color: C.black, outline: "none" }}
                  />
                </div>
              ) : pr.delivery_date ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: sz.body }}><span style={{ color: C.muted }}>Delivery</span><span style={{ color: C.black, fontWeight: 500 }}>{fmtD(pr.delivery_date)}</span></div>
              ) : null}
              {pr.paid_date && <div style={{ display: "flex", justifyContent: "space-between", fontSize: sz.body }}><span style={{ color: C.muted }}>Paid</span><span style={{ color: C.black, fontWeight: 500 }}>{fmtD(pr.paid_date)}</span></div>}
            </div>
          </div>

          {/* Deliverables */}
          {pr.qd && (pr.qd.lines ?? []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <ExpTitle sz={sz}>Deliverables</ExpTitle>
              {(pr.qd.lines ?? []).map((line, i) => {
                const pill = CAT_PILL[line.cat] ?? CAT_PILL.influencer;
                const hasExtras = (line.usageFee ?? 0) > 0 || (line.exclFee ?? 0) > 0 || (line.totalAddOns ?? 0) > 0;
                const hasTotal  = line.recurring || hasExtras;
                const lineTotal = line.recurring
                  ? (line.monthly ?? 0) * (line.term ?? 1) + (line.usageFee ?? 0) + (line.exclFee ?? 0) + (line.totalAddOns ?? 0)
                  : line.amt;
                return (
                  <div key={line.id ?? i}>
                    {i > 0 && <div style={{ height: 0.5, background: C.rule, margin: "10px 0" }} />}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.black }}>{line.name}{line.qty > 1 ? ` × ${line.qty}` : ""}</span>
                      <span style={{ fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "2px 6px", borderRadius: 2, background: pill.bg, color: pill.color, flexShrink: 0 }}>{CAT_LABELS[line.cat] ?? line.cat}</span>
                      {line.recurring && (
                        <span style={{ fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "2px 6px", borderRadius: 2, background: "#f0f5f0", color: C.green, flexShrink: 0 }}>
                          Retainer {line.term} mo
                        </span>
                      )}
                      {!line.recurring && (
                        <>
                          <span style={{ flex: 1 }} />
                          <span style={{ fontFamily: SERIF, fontSize: sz.input, color: C.black, flexShrink: 0 }}>
                            {fmtE(line.up * line.qty)} €
                          </span>
                        </>
                      )}
                    </div>
                    {line.recurring && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                        <div>
                          <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Retainer {line.term} mo</div>
                          <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                            {fmtE(line.up)}{line.qty > 1 ? " × " + line.qty + " = " + fmtE(line.up * line.qty) : ""} − {line.retainerPct}% = {fmtE(line.monthly ?? 0)}/mo × {line.term} = {fmtE((line.monthly ?? 0) * (line.term ?? 1))} €
                          </div>
                        </div>
                        <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.black, flexShrink: 0 }}>
                          {fmtE((line.monthly ?? 0) * (line.term ?? 1))} €
                        </span>
                      </div>
                    )}
                    {(line.usageFee ?? 0) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                        <div>
                          <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Usage: {line.usageLabel}</div>
                          <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                            {line.qty > 1 ? fmtE(line.up) + " × " + line.qty + " = " + fmtE(line.up * line.qty) : fmtE(line.up * line.qty)} × {line.usagePct}% = {fmtE(line.usageFee!)} €
                          </div>
                        </div>
                        <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                          + {fmtE(line.usageFee!)} €
                        </span>
                      </div>
                    )}
                    {(line.exclFee ?? 0) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                        <div>
                          <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Exclusivity: {line.exclLabel}</div>
                          <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                            {line.qty > 1 ? fmtE(line.up) + " × " + line.qty + " = " + fmtE(line.up * line.qty) : fmtE(line.up * line.qty)} × {line.exclPct}% = {fmtE(line.exclFee!)} €
                          </div>
                        </div>
                        <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                          + {fmtE(line.exclFee!)} €
                        </span>
                      </div>
                    )}
                    {(line.addOns ?? []).map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                        <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>
                          {a.name}{a.weeks ? " · " + a.weeks + " wk" : ""}
                        </div>
                        <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                          + {fmtE(a.fee)} €
                        </span>
                      </div>
                    ))}
                    {hasTotal && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 5, paddingTop: 6, borderTop: `1px solid ${C.rule}` }}>
                        <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>Total</span>
                        <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: "normal", color: C.black }}>{fmtE(lineTotal)} €</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Build Quote — only shown when no qd yet */}
          {!pr.qd && onOpenCalc && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={e => { e.stopPropagation(); onOpenCalc(pr); }}
                style={{
                  height: 30, padding: "0 14px", background: C.black,
                  border: "none", borderRadius: 2, cursor: "pointer",
                  fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.09em",
                  textTransform: "uppercase" as const, color: C.white,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                Build Quote →
              </button>
            </div>
          )}

          {/* Documents */}
          {hasDocs && (
            <div style={{ marginBottom: 16 }}>
              <ExpTitle sz={sz}>Documents</ExpTitle>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {showQuote    && <DocBtn label="Quote"    sz={sz} />}
                {showContract && <DocBtn label="Contract" sz={sz} />}
                {showInvoice  && <DocBtn label="Invoice"  sz={sz} green />}
                {showAmends   && pr.amendments.map((a, i) => <DocBtn key={a.id ?? i} label={`Amend ${i + 1}`} sz={sz} />)}
                {showRenewals && pr.renewals.map((r, i)   => <DocBtn key={r.id ?? i} label={`Renewal ${i + 1}`} sz={sz} green />)}
              </div>
            </div>
          )}

          {/* License tracker */}
          {hasLicense && (
            <div style={{ marginBottom: 16 }}>
              <ExpTitle sz={sz}>License Tracker</ExpTitle>
              {usageEnd && <LicenseLine label="Usage Rights" end={usageEnd} sz={sz} />}
              {exclEnd  && <LicenseLine label="Exclusivity"  end={exclEnd}  sz={sz} />}
            </div>
          )}

          {/* Notes */}
          {pr.notes && (
            <div style={{ marginBottom: 16 }}>
              <ExpTitle sz={sz}>Notes</ExpTitle>
              <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted, lineHeight: 1.65, margin: 0 }}>{pr.notes}</p>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
            {pr.status === "quoted" && <>
              <button style={S.secondary} onClick={() => act({ status: "quoted" })}>Revise Quote</button>
              <button style={S.primary}   onClick={() => setStatus("contracted")}>Create Contract</button>
              <span style={{ flex: 1 }} />
            </>}
            {pr.status === "contracted" && <>
              <button style={S.secondary} onClick={e => { e.stopPropagation(); }}>Revise Contract</button>
              <button style={S.primary}   onClick={() => setStatus("production")}>Mark Signed</button>
              <span style={{ flex: 1 }} />
            </>}
            {pr.status === "production" && <>
              <button
                style={{ ...S.primary, opacity: pr.delivery_date ? 1 : 0.4, cursor: pr.delivery_date ? "pointer" : "default" }}
                onClick={() => { if (pr.delivery_date) setStatus("invoiced"); }}
                title={pr.delivery_date ? "" : "Set a delivery date first"}
              >
                Create Invoice
              </button>
              <span style={{ flex: 1 }} />
            </>}
            {pr.status === "invoiced" && <>
              <button style={S.primary} onClick={() => setStatus("paid")}>Mark Paid</button>
              <span style={{ flex: 1 }} />
            </>}
            {pr.status === "paid" && <>
              <button style={S.greenSec} onClick={e => e.stopPropagation()}>Add Renewal</button>
              <span style={{ flex: 1 }} />
            </>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button style={S.arr(canUndo)} onClick={() => { if (canUndo) undoStatus(); }} title={canUndo ? `Undo to ${prevStatus}` : ""}>←</button>
              <button style={S.arr(false)} title="Use action buttons to move forward">→</button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────

type FilterValue = "all" | "active" | "quoted" | "contracted" | "production" | "invoiced" | "paid";
type SortValue   = "newest" | "oldest" | "amount_hi" | "amount_lo" | "delivery";

export function ManagerProjects({ highlightId, onOpenCalc }: { highlightId?: string; onOpenCalc?: (pr: Project) => void } = {}) {
  const mobile = useSizeMode() === "mobile";
  const sz     = mobile ? TYPE.mobile : TYPE.desktop;

  const { loaded, projects, saveProject, removeProject } = useProjects();

  const [filter,      setFilter]      = useState<FilterValue>("all");
  const [sort,        setSort]        = useState<SortValue>("newest");
  const [selectMode,  setSelectMode]  = useState(false);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting,setBulkDeleting]= useState(false);
  const [showAddModal,setShowAddModal]= useState(false);

  const onUpdate = async (id: string, patch: Partial<Project>) => {
    return await saveProject({ id, ...patch } as any);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
    setBulkConfirm(false);
  };

  const allVisible = [...projects.filter(applyFilter), ...projects.filter(pr => pr.paid)];
  const allSelected = allVisible.length > 0 && allVisible.every(pr => selected.has(pr.id));
  const someSelected = allVisible.some(pr => selected.has(pr.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allVisible.map(pr => pr.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    await Promise.all([...selected].map(id => removeProject(id)));
    setBulkDeleting(false);
    exitSelectMode();
  };

  const activeStatuses: ProjectStatus[] = ["quoted","contracted","production","invoiced"];

  function applyFilter(pr: Project): boolean {
    if (pr.paid) return false;
    if (filter === "all" || filter === "active") return true;
    return pr.status === filter;
  }

  const applySort = (a: Project, b: Project): number => {
    switch (sort) {
      case "newest":    return b.created_at.localeCompare(a.created_at);
      case "oldest":    return a.created_at.localeCompare(b.created_at);
      case "amount_hi": return b.amount - a.amount;
      case "amount_lo": return a.amount - b.amount;
      case "delivery":  return (a.delivery_date ?? "9999").localeCompare(b.delivery_date ?? "9999");
      default:          return 0;
    }
  };

  const active   = projects.filter(applyFilter).sort(applySort);
  const paid     = projects.filter(pr => pr.paid).sort(applySort);

  const activeAll   = projects.filter(pr => activeStatuses.includes(pr.status));
  const pipeline    = activeAll.reduce((s, p) => s + p.amount, 0);
  const inProd      = activeAll.filter(p => p.status === "production").length;
  const invoicedAmt = activeAll.filter(p => p.status === "invoiced").reduce((s, p) => s + p.amount, 0);

  if (!loaded) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px" : "26px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: sz.title, fontWeight: "normal", color: C.black, marginBottom: 20 }}>Projects</h1>
          <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.light }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px" : "26px 24px", boxSizing: "border-box" }}>

      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto 18px", display: "flex", alignItems: "baseline" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: sz.title, fontWeight: "normal", color: C.black, margin: 0 }}>Projects</h1>
      </div>

      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", boxSizing: "border-box" }}>

        {/* Stats */}
        {activeAll.length > 0 && (
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            {[
              { label: "Active",     value: String(activeAll.length),   bold: false },
              { label: "Pipeline",   value: `€ ${fmtE(pipeline)}`,      bold: true  },
              { label: "Production", value: String(inProd),              bold: false },
              ...(invoicedAmt > 0 ? [{ label: "Invoiced", value: `€ ${fmtE(invoicedAmt)}`, bold: true }] : []),
            ].map((s, i, arr) => (
              <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>
                  {s.label}{" "}<strong style={{ color: s.bold ? C.amber : C.black, fontWeight: 500 }}>{s.value}</strong>
                </span>
                {i < arr.length - 1 && <span style={{ color: C.light, fontSize: 11 }}>·</span>}
              </span>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          {!selectMode ? (
            <>
              {projects.length > 0 && (
                <button
                  onClick={() => setSelectMode(true)}
                  style={{ height: 28, padding: "0 4px", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: sz.body, color: C.muted, whiteSpace: "nowrap" as const }}
                >
                  Select
                </button>
              )}
              {/* Add Project */}
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  height: 28, padding: "0 12px", background: C.black, border: "none",
                  borderRadius: 2, cursor: "pointer", fontFamily: LATO,
                  fontSize: sz.micro, letterSpacing: "0.09em",
                  textTransform: "uppercase" as const, color: C.white, whiteSpace: "nowrap" as const,
                }}
              >
                + Add Project
              </button>
              <span style={{ flex: 1 }} />
              <select value={filter} onChange={e => setFilter(e.target.value as FilterValue)}
                style={{ height: 28, padding: "0 10px", border: `1px solid ${C.rule}`, borderRadius: 2, background: C.bg, fontFamily: SANS, fontSize: sz.body, color: C.black, outline: "none", cursor: "pointer" }}>
                <option value="all">Filter: All</option>
                <option value="active">Active</option>
                <option value="quoted">Quoted</option>
                <option value="contracted">Contracted</option>
                <option value="production">Production</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </select>
              <select value={sort} onChange={e => setSort(e.target.value as SortValue)}
                style={{ height: 28, padding: "0 10px", border: `1px solid ${C.rule}`, borderRadius: 2, background: C.bg, fontFamily: SANS, fontSize: sz.body, color: C.black, outline: "none", cursor: "pointer" }}>
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="amount_hi">Sort: Amount ↓</option>
                <option value="amount_lo">Sort: Amount ↑</option>
                <option value="delivery">Sort: Delivery</option>
              </select>
            </>
          ) : (
            <>
              <button
                onClick={exitSelectMode}
                style={{ height: 28, padding: "0 4px", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: sz.body, color: C.muted, whiteSpace: "nowrap" as const }}
              >
                Done
              </button>
              <div
                onClick={toggleSelectAll}
                style={{
                  width: 16, height: 16, borderRadius: 2, flexShrink: 0,
                  border: `1px solid ${someSelected ? C.black : C.rule}`,
                  background: allSelected ? C.black : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "background 0.15s",
                }}
              >
                {allSelected
                  ? <div style={{ width: 6, height: 4, borderLeft: "1.5px solid #fff", borderBottom: "1.5px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />
                  : someSelected
                  ? <div style={{ width: 8, height: 1.5, background: C.black }} />
                  : null
                }
              </div>
              <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>
                {selected.size > 0 ? `${selected.size} selected` : "Select items"}
              </span>
              <span style={{ flex: 1 }} />
              {selected.size > 0 && (
                <button
                  onClick={() => setBulkConfirm(true)}
                  style={{ height: 28, padding: "0 12px", background: "none", border: `1px solid ${C.redBorder}`, borderRadius: 2, cursor: "pointer", fontFamily: SANS, fontSize: sz.body, color: C.red, whiteSpace: "nowrap" as const }}
                >
                  Delete selected
                </button>
              )}
            </>
          )}
        </div>

        {/* Empty */}
        {projects.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 17, color: C.muted, fontWeight: "normal", margin: "0 0 6px" }}>No projects yet</p>
            <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.light, margin: 0 }}>Quotes you generate in the Calculator will appear here</p>
          </div>
        )}

        {/* Active */}
        {active.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <SectionLabel left={`Active — ${active.length}`} right={`€ ${fmtE(active.reduce((s, p) => s + p.amount, 0))}`} sz={sz} />
            {active.map(pr => (
              <ProjectRow key={pr.id} pr={pr} sz={sz} mobile={mobile}
                autoOpen={pr.id === highlightId}
                selectMode={selectMode}
                selected={selected.has(pr.id)}
                onSelect={toggleSelect}
                onDelete={id => removeProject(id)}
                onUpdate={onUpdate}
                onOpenCalc={onOpenCalc}
              />
            ))}
          </div>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <SectionLabel left={`Paid — ${paid.length}`} right={`€ ${fmtE(paid.reduce((s, p) => s + p.amount, 0))} earned`} sz={sz} />
            {paid.map(pr => (
              <ProjectRow key={pr.id} pr={pr} muted sz={sz} mobile={mobile}
                selectMode={selectMode}
                selected={selected.has(pr.id)}
                onSelect={toggleSelect}
                onDelete={id => removeProject(id)}
                onUpdate={onUpdate}
                onOpenCalc={onOpenCalc}
              />
            ))}
          </div>
        )}

      </div>

      {/* Bulk delete modal */}
      {/* Add Project Modal */}
      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => setShowAddModal(false)}
        />
      )}

      {bulkConfirm && (
        <div
          onClick={() => { if (!bulkDeleting) setBulkConfirm(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(26,26,26,0.32)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 4, width: "100%", maxWidth: 260, boxSizing: "border-box" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 17px" }}>
              <span style={{ fontFamily: LATO, fontSize: 11, fontWeight: "normal", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.black, flex: 1, textAlign: "center" as const }}>Delete projects</span>
              <button
                onClick={() => { if (!bulkDeleting) setBulkConfirm(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 12, lineHeight: 1, padding: 0 }}
              >✕</button>
            </div>
            <div style={{ borderTop: `1px solid ${C.rule}` }} />
            <div style={{ padding: "16px 17px 18px" }}>
              <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, lineHeight: 1.65, margin: "0 0 18px", textAlign: "center" as const }}>
                Delete <strong style={{ color: C.black }}>{selected.size} {selected.size === 1 ? "project" : "projects"}</strong>? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 7 }}>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  style={{ flex: 1, height: 34, background: bulkDeleting ? C.light : C.black, color: C.white, border: "none", borderRadius: 2, cursor: bulkDeleting ? "default" : "pointer", fontFamily: LATO, fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase" as const, transition: "background 0.15s" }}
                >
                  {bulkDeleting ? "Deleting…" : "Delete"}
                </button>
                <button
                  onClick={() => setBulkConfirm(false)}
                  disabled={bulkDeleting}
                  style={{ flex: 1, height: 34, background: "none", border: `1px solid ${C.rule}`, borderRadius: 2, cursor: bulkDeleting ? "default" : "pointer", fontFamily: LATO, fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase" as const, color: C.muted }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
