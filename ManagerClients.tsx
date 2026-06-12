import { useState, useEffect } from "react";
import { C, SANS, SERIF, LATO, TYPE } from "./constants";
import { useSizeMode } from "./useSizeMode";
import { useClients, type Client } from "./useClients";
import { useProjects, type Project, type ProjectStatus } from "./useProjects";

// ─── HELPERS ──────────────────────────────────────────────

const fmtE = (n: number): string =>
  n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtD = (d: string | null | undefined): string => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day}. ${mo[+m - 1]} ${y}`;
};

const addM = (d: string, months: number): string | null => {
  if (!d || !months) return null;
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + months);
  return dt.toISOString().split("T")[0];
};

const dLeft = (d: string | null | undefined): number | null =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null;

function getUsageMo(qd: Project["qd"]): number | null {
  if (!qd) return null;
  if (qd.mo && qd.mo > 0) return qd.mo;
  for (const l of qd.lines ?? []) {
    if (l.usageLabel) {
      const m = String(l.usageLabel).match(/·\s*(\d+)\s*mo\b/i);
      if (m) return parseInt(m[1]);
    }
  }
  return null;
}

function getLicenseInfo(pr: Project): { usageEnd: string | null; exclEnd: string | null } {
  if (!pr.delivery_date || !["production","invoiced","paid"].includes(pr.status)) {
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

// ─── SUB-COMPONENTS ───────────────────────────────────────

function Lbl({ children, sz }: { children: React.ReactNode; sz: typeof TYPE[keyof typeof TYPE] }) {
  return (
    <p style={{ fontFamily: LATO, fontSize: sz.label, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 5px" }}>
      {children}
    </p>
  );
}

function IR({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", borderBottom: `1px solid ${C.rule}` }}>
      <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.muted }}>{label}</span>
      <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.black }}>{value || "—"}</span>
    </div>
  );
}

function Tag({ children, onRemove }: { children: string; onRemove?: () => void }) {
  return (
    <span style={{ fontSize: 9.5, color: C.muted, border: `1px solid ${C.rule}`, borderRadius: 2, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
      {onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, padding: 0, fontSize: 10, lineHeight: 1 }}>✕</button>}
    </span>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const st = statusStyle(status);
  return (
    <span style={{ fontFamily: LATO, fontSize: 8, letterSpacing: "0.07em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 2, border: `1px solid ${st.border}`, color: st.color, background: st.bg ?? "transparent", whiteSpace: "nowrap" as const }}>
      {status}
    </span>
  );
}

function LicenseBadge({ end }: { end: string }) {
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
    <span style={{ fontFamily: SANS, fontSize: 9, color: col, background: bg, border: `1px solid ${bd}`, borderRadius: 2, padding: "2px 7px", whiteSpace: "nowrap" as const }}>
      {fmtD(end)} · {txt}
    </span>
  );
}

const pdfIcon = (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

function DocBtn({ label, green = false, onClick }: { label: string; green?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ height: 24, padding: "0 9px", background: "none", border: `1px solid ${green ? C.greenBorder : C.rule}`, borderRadius: 2, fontFamily: SANS, fontSize: 10, color: green ? C.green : C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" as const }}>
      {pdfIcon}{label}
    </button>
  );
}

// ─── READ-ONLY PROJECT CARD ───────────────────────────────

function ProjectCard({ pr, sz }: { pr: Project; sz: typeof TYPE[keyof typeof TYPE] }) {
  const [open, setOpen] = useState(false);
  const { usageEnd, exclEnd } = getLicenseInfo(pr);
  const showQuote    = !!pr.qd;
  const showContract = !!pr.qd && ["contracted","production","invoiced","paid"].includes(pr.status);
  const showInvoice  = !!pr.qd && ["invoiced","paid"].includes(pr.status);

  return (
    <div
      style={{ border: `1px solid ${C.rule}`, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}
    >
      {/* Row header — always visible, click to expand */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 13px", cursor: "pointer", gap: 8 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: sz.input, color: C.black, margin: "0 0 4px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pr.project_name || pr.brand}
          </p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
            <StatusBadge status={pr.status} />
            <span style={{ fontFamily: SANS, fontSize: 10, color: C.muted }}>{fmtD(pr.quote_date)}</span>
            {usageEnd && <LicenseBadge end={usageEnd} />}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: 14, color: C.black, margin: "0 0 3px" }}>€ {fmtE(pr.amount)}</p>
          <span style={{ fontFamily: SANS, fontSize: 10, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded detail — read-only */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.rule}`, padding: "11px 13px", background: C.white }}>

          {/* Dates */}
          <div style={{ marginBottom: 10 }}>
            {pr.quote_date    && <IR label="Quote date"    value={fmtD(pr.quote_date)} />}
            {pr.delivery_date && <IR label="Delivery"      value={fmtD(pr.delivery_date)} />}
            {pr.valid_until   && <IR label="Valid until"   value={fmtD(pr.valid_until)} />}
            {pr.paid_date     && <IR label="Paid"          value={fmtD(pr.paid_date)} />}
            {pr.notes         && <IR label="Notes"         value={pr.notes} />}
          </div>

          {/* Line items summary */}
          {pr.qd?.lines && pr.qd.lines.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontFamily: LATO, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: C.light, margin: "0 0 6px" }}>Line Items</p>
              {pr.qd.lines.map((l: any, i: number) => (
                <div key={l.id ?? i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${C.rule}` }}>
                  <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.black }}>{l.name}</span>
                  <span style={{ fontFamily: SERIF, fontSize: 10.5, color: C.muted }}>€ {fmtE(l.amt)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0 0" }}>
                <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.muted }}>Total</span>
                <span style={{ fontFamily: SERIF, fontSize: 12, color: C.black }}>€ {fmtE(pr.amount)}</span>
              </div>
            </div>
          )}

          {/* License tracker */}
          {(usageEnd || exclEnd) && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontFamily: LATO, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: C.light, margin: "0 0 6px" }}>License Tracker</p>
              {usageEnd && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.muted }}>Usage Rights</span>
                  <LicenseBadge end={usageEnd} />
                </div>
              )}
              {exclEnd && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.muted }}>Exclusivity</span>
                  <LicenseBadge end={exclEnd} />
                </div>
              )}
            </div>
          )}

          {/* Documents — read-only open */}
          {(showQuote || showContract || showInvoice || pr.amendments.length > 0 || pr.renewals.length > 0) && (
            <div>
              <p style={{ fontFamily: LATO, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: C.light, margin: "0 0 6px" }}>Documents</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {showQuote    && <DocBtn label="Quote"    onClick={() => {}} />}
                {showContract && <DocBtn label="Contract" onClick={() => {}} />}
                {showInvoice  && <DocBtn label="Invoice"  green onClick={() => {}} />}
                {pr.amendments.map((a, i) => <DocBtn key={a.id ?? i} label={`Amend ${i + 1}`} onClick={() => {}} />)}
                {pr.renewals.map((r, i)   => <DocBtn key={r.id ?? i} label={`Renewal ${i + 1}`} green onClick={() => {}} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CLIENT DETAIL PANEL ─────────────────────────────────

function ClientDetail({
  client, projects, sz, mobile,
  onClose, onSave, onDelete,
}: {
  client:    Client;
  projects:  Project[];
  sz:        typeof TYPE[keyof typeof TYPE];
  mobile:    boolean;
  onClose:   () => void;
  onSave:    (patch: Partial<Client>) => void;
  onDelete:  () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [ed, setEd]             = useState<Partial<Client>>({});
  const [tagInput, setTagInput] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);

  // Financial snapshot from linked projects
  const paid       = projects.filter(p => p.paid);
  const totalRev   = paid.reduce((s, p) => s + p.amount, 0);
  const lastPaid   = [...paid].sort((a, b) => (b.quote_date ?? "").localeCompare(a.quote_date ?? ""))[0];
  const avgDeal    = paid.length ? Math.round(totalRev / paid.length) : 0;
  const outstanding = projects.filter(p => p.status === "invoiced" && !p.paid).reduce((s, p) => s + p.amount, 0);

  // Usage rights tracker
  const allRights = projects.flatMap(pr => {
    const { usageEnd, exclEnd } = getLicenseInfo(pr);
    const items: { name: string; end: string; label: string }[] = [];
    if (usageEnd) items.push({ name: pr.project_name || pr.brand, end: usageEnd, label: "Usage" });
    if (exclEnd)  items.push({ name: pr.project_name || pr.brand, end: exclEnd,  label: "Excl." });
    return items;
  });

  const edt = editMode ? { ...client, ...ed } : client;

  const handleSave = () => {
    onSave(ed);
    setEditMode(false);
    setEd({});
  };

  const handleCancel = () => {
    setEditMode(false);
    setEd({});
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const tags = [...(edt.tags ?? []), tagInput.trim()];
    setEd(p => ({ ...p, tags }));
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setEd(p => ({ ...p, tags: (edt.tags ?? []).filter(x => x !== t) }));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: sz.fieldH, padding: sz.inputPad,
    border: `1px solid ${C.rule}`, background: C.white,
    fontFamily: SANS, fontSize: sz.input, color: C.black,
    borderRadius: 2, outline: "none", boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  return (
    <div style={{ flex: "0 0 56%", minWidth: 0, overflowY: "auto", maxHeight: "calc(100vh - 80px)", paddingLeft: mobile ? 0 : 4 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          {editMode
            ? <input value={edt.name} onChange={e => setEd(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, fontSize: 18, fontFamily: SERIF, marginBottom: 4 }} />
            : <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: "normal", margin: "0 0 6px" }}>{client.name}</h2>
          }
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {(edt.tags ?? []).map(t => (
              <Tag key={t} onRemove={editMode ? () => removeTag(t) : undefined}>{t}</Tag>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-start" }}>
          {editMode
            ? <><button onClick={handleSave} style={{ height: 28, padding: "0 12px", background: C.black, color: C.white, border: "none", borderRadius: 2, cursor: "pointer", fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.09em", textTransform: "uppercase" }}>Save</button>
                <button onClick={handleCancel} style={{ height: 28, padding: "0 12px", background: "none", color: C.muted, border: `1px solid ${C.rule}`, borderRadius: 2, cursor: "pointer", fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.09em", textTransform: "uppercase" }}>Cancel</button></>
            : <><button onClick={() => { setEd({}); setEditMode(true); }} style={{ height: 28, padding: "0 12px", background: "none", color: C.muted, border: `1px solid ${C.rule}`, borderRadius: 2, cursor: "pointer", fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.09em", textTransform: "uppercase" }}>Edit</button>
                {delConfirm
                  ? <span style={{ fontSize: 10, color: C.red, display: "flex", alignItems: "center", gap: 5 }}>
                      Delete?
                      <button onClick={onDelete} style={{ fontSize: 9.5, color: C.red, background: "none", border: `1px solid ${C.redBorder}`, borderRadius: 2, padding: "2px 8px", cursor: "pointer", fontFamily: SANS }}>Yes</button>
                      <button onClick={() => setDelConfirm(false)} style={{ fontSize: 9.5, color: C.muted, background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}>No</button>
                    </span>
                  : <button onClick={() => setDelConfirm(true)} style={{ fontSize: 9.5, color: C.red, border: `1px solid ${C.redBorder}`, padding: "5px 10px", borderRadius: 2, cursor: "pointer", background: "none", fontFamily: SANS, letterSpacing: "0.08em", textTransform: "uppercase" }}>Delete</button>
                }</>
          }
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 18, lineHeight: 1, padding: "2px 0 0 4px" }}>✕</button>
        </div>
      </div>

      {/* Brand Info + Financial Snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={{ border: `1px solid ${C.rule}`, borderRadius: 2, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 10px" }}>Brand Info</p>
          {editMode ? (
            <>
              <Lbl sz={sz}>Contact</Lbl>
              <input value={edt.contact ?? ""} onChange={e => setEd(p => ({ ...p, contact: e.target.value }))} style={inputStyle} />
              <Lbl sz={sz}>Email</Lbl>
              <input type="email" value={edt.email ?? ""} onChange={e => setEd(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
              <Lbl sz={sz}>Type</Lbl>
              <select value={edt.agency ?? "Direct"} onChange={e => setEd(p => ({ ...p, agency: e.target.value as any }))} style={selectStyle}>
                <option>Direct</option><option>Agency</option>
              </select>
              <Lbl sz={sz}>Country</Lbl>
              <input value={edt.country ?? ""} onChange={e => setEd(p => ({ ...p, country: e.target.value }))} style={inputStyle} />
              <Lbl sz={sz}>Tags</Lbl>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 5 }}>
                {(edt.tags ?? []).map(t => <Tag key={t} onRemove={() => removeTag(t)}>{t}</Tag>)}
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag" onKeyDown={e => { if (e.key === "Enter") addTag(); }} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addTag} style={{ height: sz.fieldH, padding: "0 10px", background: "none", border: `1px solid ${C.rule}`, borderRadius: 2, cursor: "pointer", fontFamily: SANS, fontSize: 11, color: C.muted }}>+</button>
              </div>
            </>
          ) : (
            <>
              <IR label="Contact" value={client.contact} />
              <IR label="Email"   value={client.email} />
              <IR label="Type"    value={client.agency} />
              <IR label="Country" value={client.country} />
            </>
          )}
        </div>
        <div style={{ border: `1px solid ${C.rule}`, borderRadius: 2, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 10px" }}>Financial Snapshot</p>
          <IR label="Total Revenue"  value={`€ ${fmtE(totalRev)}`} />
          <IR label="Paid Projects"  value={String(paid.length)} />
          <IR label="Last Invoice"   value={lastPaid ? `€ ${fmtE(lastPaid.amount)} · ${fmtD(lastPaid.quote_date)}` : "—"} />
          <IR label="Avg. Deal"      value={avgDeal ? `€ ${fmtE(avgDeal)}` : "—"} />
          <IR label="Outstanding"    value={`€ ${fmtE(outstanding)}`} />
        </div>
      </div>

      {/* Relationship Notes */}
      <div style={{ border: `1px solid ${C.rule}`, borderRadius: 2, padding: "12px 14px", marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 9px" }}>Relationship Notes</p>
        {editMode
          ? <textarea value={edt.notes ?? ""} onChange={e => setEd(p => ({ ...p, notes: e.target.value }))} style={{ width: "100%", minHeight: 60, padding: "7px 10px", border: `1px solid ${C.rule}`, background: C.white, fontFamily: SANS, fontSize: sz.input, color: C.black, borderRadius: 2, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          : <p style={{ fontSize: 11, color: client.notes ? C.black : C.light, margin: 0, lineHeight: 1.6 }}>{client.notes || "No notes yet…"}</p>
        }
      </div>

      {/* Usage Rights Tracker */}
      {allRights.length > 0 && (
        <div style={{ border: `1px solid ${C.rule}`, borderRadius: 2, padding: "12px 14px", marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 10px" }}>Usage Rights Tracker</p>
          {allRights.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < allRights.length - 1 ? `1px solid ${C.rule}` : "none" }}>
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.black }}>{r.name} <span style={{ color: C.muted }}>· {r.label}</span></span>
              <LicenseBadge end={r.end} />
            </div>
          ))}
        </div>
      )}

      {/* Collaboration History — read-only project cards */}
      <div style={{ marginBottom: 9 }}>
        <p style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 9px" }}>Collaboration History</p>
        {projects.length === 0
          ? <p style={{ fontSize: 11, color: C.light }}>No projects yet.</p>
          : projects.map(pr => <ProjectCard key={pr.id} pr={pr} sz={sz} />)
        }
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────

type SortOrder = "recent" | "name_az" | "revenue_hi" | "revenue_lo" | "status";
type StatusFilter = "all" | "quoted" | "contracted" | "production" | "invoiced" | "paid";
type TypeFilter = "all" | "Direct" | "Agency";

export function ManagerClients() {
  const mobile = useSizeMode() === "mobile";
  const sz     = mobile ? TYPE.mobile : TYPE.desktop;

  const { loaded: clientsLoaded, clients, saveClient, removeClient } = useClients();
  const { loaded: projectsLoaded, projects } = useProjects();

  const [sel,          setSel]          = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>("all");
  const [sortOrder,    setSortOrder]    = useState<SortOrder>("recent");

  const loaded = clientsLoaded && projectsLoaded;

  // Projects grouped by client_id
  const projectsByClient = (clientId: string): Project[] =>
    projects.filter(p => (p as any).client_id === clientId)
            .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  // Inactivity flag — no project activity for 90+ days
  const daysSince = (ps: Project[]): number => {
    if (!ps.length) return 9999;
    const latest = ps.reduce((a, b) => (a.created_at ?? "") > (b.created_at ?? "") ? a : b);
    return Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 864e5);
  };

  const flagged = clients.filter(c => {
    const ps = projectsByClient(c.id);
    if (!ps.length) return false;
    const hasActive = ps.some(p => ["invoiced","production","contracted","quoted"].includes(p.status));
    return !hasActive && daysSince(ps) > 90;
  });

  // Filtered + sorted list
  const filtered = (() => {
    let arr = clients.filter(c => {
      const ps = projectsByClient(c.id);
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !(c.tags ?? []).some(t => t.toLowerCase().includes(q))) return false;
      if (typeFilter !== "all" && c.agency !== typeFilter) return false;
      if (statusFilter !== "all") {
        const match = statusFilter === "paid"
          ? ps.some(p => p.paid)
          : ps.some(p => p.status === statusFilter && !p.paid);
        if (!match) return false;
      }
      return true;
    });

    const latestDate = (c: Client) => {
      const ps = projectsByClient(c.id);
      return ps.reduce((d, p) => (p.created_at ?? "") > d ? (p.created_at ?? "") : d, "");
    };
    const totalRev = (c: Client) => projectsByClient(c.id).filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
    const STATUS_PRI: Record<string, number> = { invoiced: 0, production: 1, contracted: 2, quoted: 3, paid: 4, lead: 5 };
    const bestPri = (c: Client) => {
      const ps = projectsByClient(c.id);
      return ps.length ? Math.min(...ps.map(p => STATUS_PRI[p.paid ? "paid" : p.status] ?? 99)) : 99;
    };

    if (sortOrder === "status")     return [...arr].sort((a, b) => bestPri(a) - bestPri(b));
    if (sortOrder === "name_az")    return [...arr].sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === "revenue_hi") return [...arr].sort((a, b) => totalRev(b) - totalRev(a));
    if (sortOrder === "revenue_lo") return [...arr].sort((a, b) => totalRev(a) - totalRev(b));
    return [...arr].sort((a, b) => latestDate(b).localeCompare(latestDate(a)));
  })();

  const selClient = sel ? clients.find(c => c.id === sel) : null;

  const handleSave = async (patch: Partial<Client>) => {
    if (!sel) return;
    await saveClient({ id: sel, ...patch });
  };

  const handleDelete = async () => {
    if (!sel) return;
    await removeClient(sel);
    setSel(null);
  };

  if (!loaded) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px" : "26px 24px", boxSizing: "border-box" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: sz.title, fontWeight: "normal", color: C.black, marginBottom: 20 }}>Clients</h1>
        <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.light }}>Loading…</p>
      </div>
    );
  }

  // ── Mobile: show detail full-screen when selected
  if (selClient && mobile) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", boxSizing: "border-box" }}>
        <ClientDetail
          client={selClient}
          projects={projectsByClient(selClient.id)}
          sz={sz} mobile={mobile}
          onClose={() => setSel(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px" : "26px 24px", boxSizing: "border-box" }}>
      <div style={{ display: selClient && !mobile ? "flex" : "block", gap: 28, alignItems: "flex-start" }}>

        {/* ── LEFT: Client list ── */}
        <div style={{
          flex: selClient && !mobile ? "0 0 42%" : "1 1 100%",
          minWidth: 0,
          overflowY: selClient && !mobile ? "auto" : undefined,
          maxHeight: selClient && !mobile ? "calc(100vh - 80px)" : undefined,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
            <h1 style={{ fontFamily: SERIF, fontSize: sz.title, fontWeight: "normal", margin: 0, color: C.black }}>Clients</h1>
          </div>

          {/* Inactivity warning */}
          {flagged.length > 0 && (
            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 2, padding: "9px 13px", marginBottom: 10 }}>
              <p style={{ fontSize: 10.5, color: C.amber, margin: 0 }}>⚠ {flagged.length} client{flagged.length > 1 ? "s" : ""} — no activity 3+ months</p>
            </div>
          )}

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients, tags…"
            style={{ width: "100%", height: 34, padding: "0 11px", border: `1px solid ${C.rule}`, background: C.white, fontFamily: SANS, fontSize: sz.input, color: C.black, borderRadius: 2, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
          />

          {/* Filters */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginBottom: 11 }}>
            <select
              value={statusFilter !== "all" ? statusFilter : typeFilter !== "all" ? typeFilter.toLowerCase() : "all"}
              onChange={e => {
                const v = e.target.value;
                if (v === "direct" || v === "agency") { setTypeFilter(v === "direct" ? "Direct" : "Agency"); setStatusFilter("all"); }
                else { setStatusFilter(v as StatusFilter); setTypeFilter("all"); }
              }}
              style={{ fontSize: 9, fontFamily: SANS, color: C.muted, background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 2, padding: "4px 8px", cursor: "pointer", outline: "none" }}
            >
              <option value="all">Filter: All</option>
              <optgroup label="Status">
                <option value="quoted">Quoted</option>
                <option value="contracted">Contracted</option>
                <option value="production">Production</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </optgroup>
              <optgroup label="Type">
                <option value="direct">Direct</option>
                <option value="agency">Agency</option>
              </optgroup>
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              style={{ fontSize: 9, fontFamily: SANS, color: C.muted, background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 2, padding: "4px 8px", cursor: "pointer", outline: "none" }}
            >
              <option value="recent">Sort: Most Recent</option>
              <option value="status">Sort: Status Priority</option>
              <option value="name_az">Sort: Name A → Z</option>
              <option value="revenue_hi">Sort: Revenue ↓</option>
              <option value="revenue_lo">Sort: Revenue ↑</option>
            </select>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontFamily: SERIF, fontSize: 16, color: C.muted, fontWeight: "normal", margin: "0 0 5px" }}>No clients yet</p>
              <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.light, margin: 0 }}>Add a project in the Projects tab to get started</p>
            </div>
          )}

          {/* Client rows */}
          {filtered.map(c => {
            const ps = projectsByClient(c.id);
            const latest = ps[0];
            const allRights = ps.flatMap(pr => {
              const { usageEnd, exclEnd } = getLicenseInfo(pr);
              const items: { end: string; label: string }[] = [];
              if (usageEnd) items.push({ end: usageEnd, label: "Usage" });
              if (exclEnd)  items.push({ end: exclEnd,  label: "Excl." });
              return items;
            });

            return (
              <div
                key={c.id}
                onClick={() => setSel(c.id)}
                style={{
                  border: `1px solid ${sel === c.id ? C.light : C.rule}`, borderRadius: 2,
                  padding: "11px 13px", marginBottom: 8, cursor: "pointer",
                  background: sel === c.id ? "rgba(26,26,26,0.03)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 13, color: C.black, margin: "0 0 2px", fontWeight: 500 }}>{c.name}</p>
                    <p style={{ fontSize: 10.5, color: C.muted, margin: 0 }}>
                      {c.contact}{c.email ? ` · ${c.email}` : ""}
                    </p>
                    {(c.tags ?? []).length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {c.tags.map(t => <Tag key={t}>{t}</Tag>)}
                      </div>
                    )}
                    {latest && <p style={{ fontSize: 10.5, color: C.muted, margin: "4px 0 0" }}>{latest.project_name || latest.brand}</p>}
                  </div>
                  {latest && (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: SERIF, fontSize: 14, color: C.black, margin: "0 0 3px" }}>€ {fmtE(latest.amount)}</p>
                      <StatusBadge status={latest.status} />
                    </div>
                  )}
                </div>
                {allRights.length > 0 && (
                  <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${C.rule}`, display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {allRights.map((r, i) => <LicenseBadge key={i} end={r.end} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Client detail ── */}
        {selClient && !mobile && (
          <ClientDetail
            client={selClient}
            projects={projectsByClient(selClient.id)}
            sz={sz} mobile={mobile}
            onClose={() => setSel(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
