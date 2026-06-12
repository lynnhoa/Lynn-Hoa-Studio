import { useState, useRef, useEffect, useCallback } from "react";
import { C, SANS, SERIF, LATO, TYPE, CONTENT_MAX } from "./constants";
import { useSizeMode } from "./useSizeMode";
import { useServiceCatalog } from "./useServiceCatalog";
import type { CatalogSection } from "./useServiceCatalog";
import type { Project } from "./useProjects";
import { matchOrCreateClient } from "./useClients";

// ─── LOCAL HELPERS ────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const uid   = () => Math.random().toString(36).slice(2, 9);

const isSingle = (t: string) =>
  !["usage", "exclusiv", "add-on", "addon", "package", "retainer", "hosted", "volume", "ambassador"]
    .some(k => t.toLowerCase().includes(k));

// Parse percentage from catalog m field e.g. "+30%" or "−20%" → 30
const parsePct = (m: string | null | undefined): number => {
  if (!m) return 0;
  const n = parseFloat(m.split("").filter((c:string)=>c>="0"&&c<="9"||c===".").join(""));
  return isNaN(n) ? 0 : n;
};

// Build a clean display label from a raw catalog item name
function buildUsageLabel(name: string): string {
  const n = name.toLowerCase();
  const type = n.includes("organic") ? "Organic"
             : n.includes("paid") || n.includes("ads") ? "Paid Ads"
             : n.includes("buyout") || n.includes("perpetual") ? "Buyout"
             : name;
  const m = n.split(" ").find((w:string) => w.length > 0 && w[0] >= "0" && w[0] <= "9");
  const dur = m ? parseInt(m) : 0;
  return dur > 0 ? type + " · " + dur + " mo" : type;
}

function buildExclLabel(name: string): string {
  const n = name.toLowerCase();
  const type = n.includes("category") ? "Category"
             : n.includes("full") ? "Full"
             : name;
  const m = n.split(" ").find((w:string) => w.length > 0 && w[0] >= "0" && w[0] <= "9");
  const dur = m ? parseInt(m) : 0;
  return dur > 0 ? type + " · " + dur + " mo" : type;
}

type CatKey = "influencer" | "ugc" | "editorial";

// Soft pastel pill colors per category
const CAT_PILL: Record<CatKey, { bg: string; color: string }> = {
  influencer: { bg: "#f0f0f5", color: "#6a6aaa" },
  ugc:        { bg: "#fdf5ee", color: "#c0956a" },
  editorial:  { bg: "#f0f5f0", color: "#6a9a6a" },
};

const CAT_LABELS: Record<CatKey, string> = {
  influencer: "Brand Collab",
  ugc:        "UGC",
  editorial:  "Editorial",
};

// ─── LOCAL ATOMS ──────────────────────────────────────────
function Lbl({ children, sz }: { children: React.ReactNode; sz: typeof TYPE[keyof typeof TYPE] }) {
  return (
    <p style={{
      fontFamily: LATO, fontSize: sz.label, color: C.muted,
      letterSpacing: "0.08em", textTransform: "uppercase", margin: "14px 0 5px",
    }}>
      {children}
    </p>
  );
}

function Field({ value, onChange, placeholder, sz }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; sz: typeof TYPE[keyof typeof TYPE];
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", height: sz.fieldH, padding: sz.inputPad,
        border: `1px solid ${C.rule}`, background: C.white,
        fontFamily: SANS, fontSize: sz.input, color: C.black,
        borderRadius: 2, outline: "none", boxSizing: "border-box",
      }}
    />
  );
}

// ─── DELIVERABLE SELECT ───────────────────────────────────
type DeliverableItem = {
  id: string; n: string; note: string;
  p: number | null; sectionTitle: string; cat: CatKey;
};

function DeliverableSelect({ sections, selectedIndex, onSelect, cat, loaded, sz, mobile }: {
  sections: CatalogSection[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
  cat: CatKey;
  loaded: boolean;
  sz: typeof TYPE[keyof typeof TYPE];
  mobile: boolean;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const searchRef         = useRef<HTMLInputElement>(null);

  const allItems: DeliverableItem[] = sections.flatMap(sec =>
    sec.items.map(it => ({ ...it, sectionTitle: sec.t, cat }))
  );

  const selected = selectedIndex >= 0 ? allItems[selectedIndex] : null;
  const pill     = CAT_PILL[cat];

  // Filter by search query
  const q = query.toLowerCase().trim();
  const filteredSections = q
    ? sections
        .map(sec => ({ ...sec, items: sec.items.filter(it => it.n.toLowerCase().includes(q)) }))
        .filter(sec => sec.items.length > 0)
    : sections;

  const openModal  = () => { if (loaded) { setQuery(""); setOpen(true); } };
  const closeModal = () => { setOpen(false); setQuery(""); };


  // Lock body scroll when open — compensate scrollbar width to prevent layout shift
  useEffect(() => {
    if (!open) return; // only run when opening — cleanup handles close
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = sw + "px";
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  const listContent = (
    <>
      {filteredSections.length === 0 && (
        <p style={{ textAlign: "center", padding: "28px 0", fontFamily: SANS, fontSize: sz.body, color: C.light, margin: 0 }}>
          No results
        </p>
      )}
      {filteredSections.map(sec => (
        <div key={sec.id}>
          <div style={{ padding: "8px 16px 3px", fontFamily: LATO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: C.light }}>
            {sec.t}
          </div>
          {sec.items.map(it => {
            const globalIdx  = allItems.findIndex(a => a.id === it.id);
            const isSelected = globalIdx === selectedIndex;
            return (
              <div
                key={it.id}
                onClick={() => { onSelect(globalIdx); closeModal(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: mobile ? "12px 16px" : "9px 16px",
                  cursor: "pointer",
                  background: isSelected ? "#f5f3f0" : C.white,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#faf9f7"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#f5f3f0" : C.white; }}
              >
                <span style={{ flex: 1, display: "inline-flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.black }}>{it.n}</span>
                  <span style={{
                    fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.07em",
                    textTransform: "uppercase", padding: "1px 5px", borderRadius: 2,
                    background: pill.bg, color: pill.color,
                    verticalAlign: "super", lineHeight: 1.2, flexShrink: 0,
                  }}>
                    {CAT_LABELS[cat]}
                  </span>
                </span>
                {it.p != null && (
                  <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                    € {it.p.toLocaleString("de-DE")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* ── Trigger ── */}
      <button
        onClick={openModal}
        style={{
          width: "100%", height: sz.fieldH, padding: "0 36px 0 12px",
          border: `1px solid ${open ? C.black : C.rule}`,
          background: C.white, borderRadius: 2,
          display: "flex", alignItems: "center", gap: 8,
          cursor: loaded ? "pointer" : "default",
          outline: "none", boxSizing: "border-box",
          transition: "border-color 0.15s", position: "relative",
        }}
      >
        {selected ? (
          <>
            <span style={{ flex: 1, display: "inline-flex", alignItems: "baseline", gap: 5, overflow: "hidden" }}>
              <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.black, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {selected.n}
              </span>
              <span style={{
                fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.07em",
                textTransform: "uppercase", padding: "1px 5px", borderRadius: 2,
                background: pill.bg, color: pill.color,
                verticalAlign: "super", lineHeight: 1.2, flexShrink: 0,
              }}>
                {CAT_LABELS[cat]}
              </span>
            </span>
            <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted, flexShrink: 0, marginRight: 4 }}>
              {selected.p != null ? `€ ${selected.p.toLocaleString("de-DE")}` : ""}
            </span>
          </>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.light }}>
            — Select deliverable —
          </span>
        )}
        <span style={{
          position: "absolute", right: 12, top: "50%",
          transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`,
          transition: "transform 0.15s", color: C.muted, fontSize: 10, lineHeight: 1, pointerEvents: "none",
        }}>▾</span>
      </button>

      {/* ── Modal overlay ── */}
      {open && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 400,
            background: "rgba(26,26,26,0.35)",
            display: "flex",
            alignItems: mobile ? "flex-end" : "flex-start",
            justifyContent: "center",
            paddingTop: mobile ? 0 : "16vh",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.white,
              width: mobile ? "100%" : 440,
              maxWidth: "100%",
              borderRadius: mobile ? "12px 12px 0 0" : 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: mobile ? "80dvh" : "70vh",
            }}
          >
            {/* Handle — mobile only */}
            {mobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: C.rule }} />
              </div>
            )}

            {/* Header + search */}
            <div style={{ padding: mobile ? "10px 16px 12px" : "16px 16px 10px", borderBottom: `1px solid ${C.rule}` }}>
              <p style={{
                fontFamily: LATO, fontSize: sz.micro, color: C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px",
              }}>
                {CAT_LABELS[cat]} — Select Deliverable
              </p>
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                style={{
                  width: "100%", height: sz.fieldH, padding: sz.inputPad,
                  border: `1px solid ${C.rule}`, background: C.bg,
                  fontFamily: SANS, fontSize: sz.input, color: C.black,
                  borderRadius: 2, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Scrollable list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {listContent}
            </div>

            {/* Cancel — mobile only */}
            {mobile && (
              <div style={{ borderTop: `1px solid ${C.rule}`, padding: "12px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
                <button
                  onClick={closeModal}
                  style={{
                    width: "100%", height: sz.fieldH,
                    background: "transparent", border: `1px solid ${C.rule}`,
                    borderRadius: 2, cursor: "pointer",
                    fontFamily: LATO, fontSize: sz.button,
                    letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}



// ─── ADDON MODAL ─────────────────────────────────────────
function AddonModal({ options, selected, onToggle, onWeeksChange, onClose, sz, mobile, subtotalBase, bTerm, bRecurring }: {
  options: any[];
  selected: {id:string;name:string;weeks?:number}[];
  onToggle: (item: any) => void;  // item carries weeks for link-in-bio
  onWeeksChange: (id: string, weeks: number) => void;
  onClose: () => void;
  sz: typeof TYPE[keyof typeof TYPE];
  mobile: boolean;
  subtotalBase: number;
  bTerm: number;
  bRecurring: boolean;
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = sw + "px";
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  const q = query.toLowerCase().trim();
  const filtered = q ? options.filter(o => o.n.toLowerCase().includes(q)) : options;

  const calcFee = (item: any, weeks?: number): { fee: number; perMonth: boolean } => {
    const isPerWeek  = !!(item.m?.includes("/wk"));
    const isPerMonth = !!(item.m?.includes("/mo"));
    if (item.p != null) {
      return { fee: isPerWeek ? item.p * (weeks ?? 1) : item.p, perMonth: false };
    }
    if (item.m) {
      const pct = parsePct(item.m);
      const fee = Math.round(subtotalBase * pct / 100);
      return { fee: isPerMonth && bRecurring ? fee * bTerm : fee, perMonth: isPerMonth && bRecurring };
    }
    return { fee: 0, perMonth: false };
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(26,26,26,0.35)",
        display: "flex",
        alignItems: mobile ? "flex-end" : "flex-start",
        justifyContent: "center",
        paddingTop: mobile ? 0 : "16vh",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.white,
          width: mobile ? "100%" : 440,
          maxWidth: "100%",
          borderRadius: mobile ? "12px 12px 0 0" : 8,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: mobile ? "80dvh" : "70vh",
        }}
      >
        {mobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.rule }} />
          </div>
        )}

        {/* Header + search */}
        <div style={{ padding: mobile ? "10px 16px 12px" : "16px 16px 10px", borderBottom: `1px solid ${C.rule}` }}>
          <p style={{
            fontFamily: LATO, fontSize: sz.micro, color: C.muted,
            letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px",
          }}>
            Add-ons
          </p>
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            style={{
              width: "100%", height: sz.fieldH, padding: sz.inputPad,
              border: `1px solid ${C.rule}`, background: C.bg,
              fontFamily: SANS, fontSize: sz.input, color: C.black,
              borderRadius: 2, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", padding: "28px 0", fontFamily: SANS, fontSize: sz.body, color: C.light, margin: 0 }}>
              No results
            </p>
          )}
          {filtered.map(item => {
            const sel = selected.find(s => s.id === item.id);
            const isOn = !!sel;
            const isPerWeek  = !!(item.m?.includes("/wk"));
            const isPerMonth = !!(item.m?.includes("/mo"));
            const { fee, perMonth } = calcFee(item, sel?.weeks);
            // Rate display string — single clean line
            const rateStr = item.p != null
              ? (isPerWeek ? "€ " + String(item.p) + "/wk" : "€ " + String(item.p))
              : (item.m?.replace("/wk","").replace("/mo","").trim() ?? "");
            const rateSuffix = isPerWeek ? "/wk" : isPerMonth ? "/mo" : "";

            return (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: mobile ? "12px 16px" : "9px 16px",
                  background: isOn ? "#f5f3f0" : C.white,
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onClick={() => onToggle({ ...item, weeks: sel?.weeks ?? 1 })}
              >
                {/* Checkbox */}
                <div style={{
                  width: 16, height: 16, borderRadius: 2, flexShrink: 0,
                  border: `1px solid ${isOn ? C.black : C.rule}`,
                  background: isOn ? C.black : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}>
                  {isOn && <div style={{ width: 6, height: 4, borderLeft: "1.5px solid #fff", borderBottom: "1.5px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />}
                </div>

                {/* Name + modifier */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.black }}>{item.n}</span>
                  {isPerMonth && bRecurring && (
                    <span style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginLeft: 6 }}>
                      × {bTerm} mo
                    </span>
                  )}
                </div>

                {/* Weeks picker — any /wk item */}
                {isPerWeek && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const w = Math.max(1, (sel?.weeks ?? 1) - 1);
                        if (!isOn) onToggle({ ...item, weeks: w });
                        else onWeeksChange(item.id, w);
                      }}
                      style={{ width: 24, height: 24, border: `1px solid ${C.rule}`, borderRadius: 2, background: C.white, color: C.muted, cursor: "pointer", fontFamily: SANS, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >−</button>
                    <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.black, minWidth: 20, textAlign: "center" }}>
                      {sel?.weeks ?? 1}
                    </span>
                    <button
                      onClick={() => {
                        const w = (sel?.weeks ?? 1) + 1;
                        if (!isOn) onToggle({ ...item, weeks: w });
                        else onWeeksChange(item.id, w);
                      }}
                      style={{ width: 24, height: 24, border: `1px solid ${C.rule}`, borderRadius: 2, background: C.white, color: C.muted, cursor: "pointer", fontFamily: SANS, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                    <span style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted }}>wk</span>
                  </div>
                )}

                {/* Rate + fee — one line: rate when unselected, fee when selected */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                  {isOn && fee > 0 ? (
                    <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>
                      +€ {fee.toLocaleString("de-DE")}{perMonth ? " total" : ""}
                    </span>
                  ) : (
                    <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>
                      {rateStr}{!item.p && rateSuffix}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Done button */}
        <div style={{ borderTop: `1px solid ${C.rule}`, padding: "12px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", height: sz.fieldH,
              background: C.black, border: "none", borderRadius: 2,
              cursor: "pointer", fontFamily: LATO, fontSize: sz.button,
              letterSpacing: "0.1em", textTransform: "uppercase", color: C.white,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function NegRateField({ value, onChange, sz }: {
  value: string; onChange: (v: string) => void; sz: typeof TYPE[keyof typeof TYPE];
}) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{
        position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
        fontFamily: SANS, fontSize: sz.input, color: value ? C.black : C.light,
        pointerEvents: "none", lineHeight: 1,
      }}>€</span>
      <input
        type="number" min={0} value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(String(Math.round(v / 10) * 10));
          else onChange("");
        }}
        placeholder="—"
        style={{
          width: "100%", height: sz.fieldH,
          paddingLeft: 26, paddingRight: value ? 30 : 13,
          border: `1px solid ${value ? C.black : C.rule}`,
          background: value ? "#faf9f7" : C.white,
          fontFamily: SANS, fontSize: sz.input, color: C.black,
          borderRadius: 2, outline: "none", boxSizing: "border-box",
          transition: "border-color 0.15s, background 0.15s",
        } as React.CSSProperties}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: C.light, fontSize: 13, lineHeight: 1, padding: 0,
          }}
        >✕</button>
      )}
    </div>
  );
}

function QtyField({ value, onChange, sz }: {
  value: number | string; onChange: (v: number | string) => void; sz: typeof TYPE[keyof typeof TYPE];
}) {
  return (
    <input
      type="number" min={1} value={value}
      onChange={e => onChange(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
      onBlur={e => onChange(parseInt(e.target.value) || 1)}
      style={{
        width: "100%", height: sz.fieldH, padding: sz.inputPad,
        border: `1px solid ${C.rule}`, background: C.white,
        fontFamily: SANS, fontSize: sz.input, color: C.black,
        borderRadius: 2, outline: "none", boxSizing: "border-box",
        textAlign: "center",
      } as React.CSSProperties}
    />
  );
}

// ─── MANAGER CALCULATOR ───────────────────────────────────
export function ManagerCalculator({ onSaveToProjects, saveProject, attachToProject }: {
  onSaveToProjects?: (id: string) => void;
  saveProject?: (p: any) => Promise<{ ok: boolean; message: string; id?: string }>;
  attachToProject?: Project | null;
} = {}) {
  const sizeMode = useSizeMode();
  const sz       = TYPE[sizeMode];
  const mobile   = sizeMode === "mobile";

  const [brand,    setBrand]    = useState(attachToProject?.brand       ?? "");
  const [contact,  setContact]  = useState(attachToProject?.contact     ?? "");
  const [projName, setProjName] = useState(attachToProject?.project_name ?? "");
  const [qDate,    setQDate]    = useState(today());
  const [vDays,    setVDays]    = useState<number | string>(14);
  const [bCat,       setBCat]       = useState<CatKey>("influencer");
  const [bDel,       setBDel]       = useState(-1);
  const [bQty,       setBQty]       = useState<number | string>(1);
  const [bNeg,       setBNeg]       = useState<string>("");
  const [bRecurring, setBRecurring] = useState(false);
  const [bTerm,      setBTerm]      = useState(6);
  const [bUsage,     setBUsage]     = useState(-2);  // -2=off, -1=on+sentinel, >=0=selected
  const [bExcl,      setBExcl]      = useState(-2);  // -2=off, -1=on+sentinel, >=0=selected
  const [bAddons,    setBAddons]    = useState<{id:string;name:string;weeks?:number}[]>([]);
  const [addonOpen,  setAddonOpen]  = useState(false);
  const [items,      setItems]      = useState<any[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedFlash,   setSavedFlash]   = useState(false);

  const { loaded, catalog } = useServiceCatalog();

  const deliverableSections: CatalogSection[] = loaded && catalog
    ? catalog[bCat].sections.filter(s => isSingle(s.t))
    : [];

  // Retainer discount % from catalog — parse from retainer section m field
  // e.g. "-20%" → 20. Falls back to 0 if no retainer section found.
  const retainerPct: number = (() => {
    if (!catalog) return 0;
    const sec = catalog[bCat].sections.find(s => s.t.toLowerCase().includes("retainer"));
    if (!sec || !sec.items[0]?.m) return 0;
    const n = parseFloat(sec.items[0].m.split("").filter((c:string)=>c>="0"&&c<="9"||c===".").join(""));
    return isNaN(n) ? 0 : n;
  })();

  const handleCatSwitch = (k: CatKey) => {
    setBCat(k); setBDel(-1); setBQty(1); setBNeg("");
    setBRecurring(false); setBTerm(6);
    setBUsage(-2);
    setBExcl(-2); setBAddons([]); setAddonOpen(false);
  };

  // Usage + exclusivity options from catalog
  const usageOptions = loaded && catalog
    ? (catalog[bCat].sections.find(s => s.t.toLowerCase().includes("usage"))?.items ?? [])
    : [];
  const exclOptions = loaded && catalog
    ? (catalog[bCat].sections.find(s => s.t.toLowerCase().includes("exclusiv"))?.items ?? [])
    : [];

  const allDeliverablesFlat = deliverableSections.flatMap(s => s.items);
  const selectedItem        = (bDel >= 0 && bDel < allDeliverablesFlat.length) ? (allDeliverablesFlat[bDel] ?? null) : null;
  const canAddItem          = bDel >= 0 && selectedItem !== null;

  // Quote metadata
  const qNo       = "QUO-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3);
  const vuDate    = new Date(qDate);
  vuDate.setDate(vuDate.getDate() + (parseInt(String(vDays)) || 14));
  const validUntil = vuDate.toISOString().split("T")[0];
  const cats       = [...new Set(items.map((it: any) => it.cat))];
  const ctype      = cats.length > 1         ? "Content Creator"
                   : cats[0] === "ugc"       ? "UGC Creator"
                   : cats[0] === "editorial" ? "Editorial Content Creator"
                   : "Content Creator";
  // Usage months for license tracker
  const usageLine  = items.find((it: any) => it.usageLabel);
  const moMatch    = usageLine?.usageLabel?.match(/·\s*(\d+)\s*mo\b/i);
  const usageMo    = moMatch ? parseInt(moMatch[1]) : null;
  const canSave    = items.length > 0 && brand.trim().length > 0;

  // Core price calculations
  const basePrice    = bNeg
    ? Math.round(parseFloat(bNeg) / 10) * 10
    : (selectedItem?.p ?? 0);
  const qty          = parseInt(String(bQty)) || 1;
  const subtotalBase = basePrice * qty;

  // Retainer
  const monthlyFee = bRecurring
    ? Math.round(subtotalBase * (1 - retainerPct / 100))
    : 0;

  // Usage fee — on subtotalBase always
  const usagePct     = bUsage >= 0 ? parsePct(usageOptions[bUsage]?.m) : 0;  // -1 sentinel = 0
  const usageFeeCalc = Math.round(subtotalBase * usagePct / 100);
  const usageFee     = usageFeeCalc;

  // Exclusivity fee — on subtotalBase always
  const exclPct     = bExcl >= 0 ? parsePct(exclOptions[bExcl]?.m) : 0;  // -1 sentinel = 0
  const exclFeeCalc = Math.round(subtotalBase * exclPct / 100);
  const exclFee     = exclFeeCalc;

  // Add-ons from catalog
  const addonOptions = loaded && catalog
    ? (catalog[bCat].sections
        .find(s => s.t.toLowerCase().includes("add-on") || s.t.toLowerCase().includes("addon"))
        ?.items ?? [])
        .filter(it => !it.n.toLowerCase().includes("kill"))
    : [];

  // Add-on fee live calculation — always derived from current subtotalBase
  // Never stored on bAddons to prevent stale values when deliverable/qty/neg rate changes
  const calcAddonFee = (id: string, weeks?: number): number => {
    const item = addonOptions.find(o => o.id === id);
    if (!item) return 0;
    const isPerWeek  = !!(item.m?.includes("/wk"));
    const isPerMonth = !!(item.m?.includes("/mo"));
    if (item.p != null) return isPerWeek ? item.p * (weeks ?? 1) : item.p;
    if (item.m) {
      const pct  = parsePct(item.m);
      const base = Math.round(subtotalBase * pct / 100);
      // Per-month % items multiply by term when retainer active
      return isPerMonth && bRecurring ? base * bTerm : base;
    }
    return 0;
  };

  const totalAddOns = bAddons.reduce((sum, a) => sum + calcAddonFee(a.id, a.weeks), 0);

  // Line totals
  const oneOffTotal   = subtotalBase + usageFee + exclFee + totalAddOns;
  const retainerTotal = (monthlyFee * bTerm) + usageFee + exclFee + totalAddOns;

  const handleSaveToProjects = useCallback(async () => {
    if (!canSave || saving) return;
    if (!saveProject) return;
    setSaving(true);
    try {
    // Build retainer info from items
    const hasRetainer = items.some((it: any) => it.recurring);
    const retainerItem = items.find((it: any) => it.recurring);
    const result = await saveProject({
      // If attaching to an existing project, pass its id → triggers UPDATE
      ...(attachToProject ? { id: attachToProject.id } : {}),
      brand,
      contact,
      project_name: projName.trim() || brand.trim(),
      status:        "quoted" as const,
      amount:        items.reduce((s: number, it: any) => s + it.amt, 0),
      quote_date:    qDate,
      valid_until:   validUntil,
      q_no:          qNo,
      qd: {
        qNo,
        brand,
        contact,
        date:      qDate,
        validUntil,
        ctype,
        lines:     items,
        retainer:  hasRetainer,
        retMo:     retainerItem?.term ?? undefined,
        mo:        usageMo ?? undefined,
        footer:    "Looking forward to working together.",
      },
      amendments: [],
      renewals:   [],
      notes:      "",
      paid:       false,
    });
    if (result.ok) {
      const savedId = attachToProject?.id ?? result.id ?? "";
      // Only run matchOrCreateClient on new projects (not updates — already linked)
      if (!attachToProject && savedId) {
        await matchOrCreateClient(brand, contact, savedId);
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      if (onSaveToProjects) onSaveToProjects(savedId);
    }
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, items, brand, contact, projName, qDate, validUntil, qNo, ctype, usageMo, saveProject, onSaveToProjects]);

  const addItem = () => {
    if (!canAddItem || !selectedItem) return;
    const amt = bRecurring ? retainerTotal : oneOffTotal;
    setItems(prev => [...prev, {
      id:           uid(),
      cat:          bCat,
      name:         selectedItem.n,
      note:         selectedItem.note,
      qty,
      up:           bNeg ? basePrice : (selectedItem.p ?? 0),
      subtotalBase,
      amt,
      // Retainer
      recurring:    bRecurring,
      term:         bRecurring ? bTerm : null,
      monthly:      bRecurring ? monthlyFee : null,
      retainerPct:  bRecurring ? retainerPct : null,
      // Usage
      usageLabel:   bUsage >= 0 && usageOptions[bUsage] ? buildUsageLabel(usageOptions[bUsage].n) : null,
      usagePct,
      usageFee:     bUsage >= 0 ? usageFee : 0,  // 0 if sentinel or off
      // Exclusivity
      exclLabel:    bExcl >= 0 && exclOptions[bExcl] ? buildExclLabel(exclOptions[bExcl].n) : null,
      exclPct,
      exclFee:      bExcl >= 0 ? exclFee : 0,
      addOns:       bAddons.map(a => ({ ...a, fee: calcAddonFee(a.id, a.weeks) })),
      totalAddOns,
    }]);
    // Reset all Add Item fields
    setBDel(-1); setBQty(1); setBNeg("");
    setBRecurring(false); setBTerm(6);
    setBUsage(-2);
    setBExcl(-2); setBAddons([]); setAddonOpen(false);
  };

  const card: React.CSSProperties = mobile
    ? { padding: "20px 16px", boxSizing: "border-box" }
    : {
        maxWidth: CONTENT_MAX, margin: "0 auto", background: C.white,
        border: `1px solid ${C.rule}`, borderRadius: 12,
        padding: "26px 28px", boxSizing: "border-box",
      };

  return (
    <>
    <div style={{ padding: mobile ? "20px 0" : "26px 24px", boxSizing: "border-box" }}>
      <div style={card}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: sz.title, fontWeight: "normal", color: C.black, margin: "0 0 5px" }}>
            Calculator
          </h2>
          <p style={{ fontFamily: LATO, fontSize: sz.micro, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            Build a Quote
          </p>
        </div>

        {/* Section 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Lbl sz={sz}>Brand / Company</Lbl>
            <Field value={brand} onChange={setBrand} placeholder="Sephora" sz={sz} />
          </div>
          <div>
            <Lbl sz={sz}>Contact Name</Lbl>
            <Field value={contact} onChange={setContact} placeholder="Anna Müller" sz={sz} />
          </div>
        </div>

        <div>
          <Lbl sz={sz}>
            Project Name{" "}
            <span style={{ fontWeight: "normal", color: C.light, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </Lbl>
          <Field value={projName} onChange={setProjName} placeholder="e.g. Spring Campaign 2026" sz={sz} />
        </div>

        {/* Section 2 */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "2fr 1fr" : "1fr 1fr", gap: 12 }}>
          <div>
            <Lbl sz={sz}>Quote Date</Lbl>
            <input
              type="date" value={qDate} onChange={e => setQDate(e.target.value)}
              style={{
                width: "100%", height: sz.fieldH, padding: sz.inputPad,
                border: `1px solid ${C.rule}`, background: C.white,
                fontFamily: SANS, fontSize: sz.input, color: C.black,
                borderRadius: 2, outline: "none", boxSizing: "border-box",
                WebkitAppearance: "none", appearance: "none",
              } as React.CSSProperties}
            />
          </div>
          <div>
            <Lbl sz={sz}>Valid for (days)</Lbl>
            <input
              type="number" min={1} value={vDays}
              onChange={e => setVDays(e.target.value === "" ? "" : parseInt(e.target.value) || 14)}
              onBlur={e => setVDays(parseInt(e.target.value) || 14)}
              style={{
                width: "100%", height: sz.fieldH, padding: sz.inputPad,
                border: `1px solid ${C.rule}`, background: C.white,
                fontFamily: SANS, fontSize: sz.input, color: C.black,
                borderRadius: 2, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Section 3: Add Item */}
        <div style={{
          border: `1px solid ${C.rule}`, borderRadius: 4,
          padding: mobile ? "14px" : "18px 20px", marginTop: 20,
        }}>
          <p style={{
            fontFamily: LATO, fontSize: sz.micro, color: C.muted,
            letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px",
          }}>
            Add Item
          </p>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {(["influencer", "ugc", "editorial"] as const).map(k => {
              const on = bCat === k;
              return (
                <button
                  key={k}
                  onClick={() => handleCatSwitch(k)}
                  style={{
                    padding: mobile ? "7px 14px" : "6px 14px",
                    border: `1px solid ${on ? C.black : C.rule}`,
                    background: on ? C.black : "transparent",
                    color: on ? C.white : C.muted,
                    borderRadius: 2, cursor: "pointer",
                    fontFamily: LATO, fontSize: sz.button,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                >
                  {CAT_LABELS[k]}
                </button>
              );
            })}
          </div>

          {/* Deliverable — full width on mobile, 3-col row on desktop */}
          {mobile ? (
            <>
              <div>
                <Lbl sz={sz}>Deliverable</Lbl>
                <DeliverableSelect
                  key={bCat}
                  sections={deliverableSections}
                  selectedIndex={bDel}
                  onSelect={setBDel}
                  cat={bCat}
                  loaded={loaded}
                  sz={sz}
                  mobile={mobile}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <div>
                  <Lbl sz={sz}>
                    Neg. Rate{" "}
                    <span style={{ fontWeight: "normal", color: C.light, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </Lbl>
                  <NegRateField value={bNeg} onChange={setBNeg} sz={sz} />
                </div>
                <div>
                  <Lbl sz={sz}>Qty</Lbl>
                  <QtyField value={bQty} onChange={setBQty} sz={sz} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1.4fr 0.8fr", gap: 10, alignItems: "end" }}>
              <div>
                <Lbl sz={sz}>Deliverable</Lbl>
                <DeliverableSelect
                  key={bCat}
                  sections={deliverableSections}
                  selectedIndex={bDel}
                  onSelect={setBDel}
                  cat={bCat}
                  loaded={loaded}
                  sz={sz}
                  mobile={mobile}
                />
              </div>
              <div>
                <Lbl sz={sz}>
                  Neg. Rate{" "}
                  <span style={{ fontWeight: "normal", color: C.light, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </Lbl>
                <NegRateField value={bNeg} onChange={setBNeg} sz={sz} />
              </div>
              <div>
                <Lbl sz={sz}>Qty</Lbl>
                <QtyField value={bQty} onChange={setBQty} sz={sz} />
              </div>
            </div>
          )}

          {/* Amber override notice */}
          {bNeg && (
            <p style={{
              fontFamily: SANS, fontSize: sz.micro, color: C.amber,
              margin: "5px 0 0", letterSpacing: "0.03em",
            }}>
              Card price overridden — using € {(Math.round(parseFloat(bNeg) / 10) * 10).toLocaleString("de-DE")}
            </p>
          )}

          {/* ── Retainer toggle ── */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>

              {/* Left: toggle + label + pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, paddingTop: 3 }}>
                <div
                  onClick={() => {
                    if (loaded && retainerPct === 0) return; // no rate in catalog — block toggle
                    setBRecurring(r => !r);
                    if (!bRecurring) setBTerm(6);
                  }}
                  style={{
                    width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                    background: bRecurring ? C.black : C.rule,
                    position: "relative",
                    cursor: (loaded && retainerPct === 0) ? "not-allowed" : "pointer",
                    opacity: (loaded && retainerPct === 0) ? 0.4 : 1,
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: bRecurring ? 19 : 3,
                    width: 14, height: 14, borderRadius: "50%", background: C.white,
                    transition: "left 0.2s",
                  }} />
                </div>
                <span style={{
                  fontFamily: SANS, fontSize: sz.body,
                  color: retainerPct === 0 ? C.light : bRecurring ? C.black : C.muted,
                  transition: "color 0.15s",
                }}>
                  Retainer
                </span>
                {loaded && retainerPct === 0 && (
                  <span style={{
                    fontSize: 8, fontFamily: LATO, letterSpacing: "0.07em",
                    textTransform: "uppercase", padding: "2px 7px", borderRadius: 2,
                    background: C.redBg, color: C.red, flexShrink: 0,
                  }}>
                    No rate in catalog
                  </span>
                )}
                {bRecurring && retainerPct > 0 && (
                  <span style={{
                    fontSize: 8, fontFamily: LATO, letterSpacing: "0.07em",
                    textTransform: "uppercase", padding: "2px 7px", borderRadius: 2,
                    background: "#f0f5f0", color: C.green, flexShrink: 0,
                  }}>
                    −{retainerPct}%
                  </span>
                )}
              </div>

              {/* Right: months dropdown + full calc */}
              {bRecurring && (() => {
                const TERMS = [3, 6, 9, 12, 18, 24];
                const allItems = deliverableSections.flatMap(s => s.items);
                const item     = bDel >= 0 ? allItems[bDel] : null;
                const bp       = bNeg ? Math.round(parseFloat(bNeg) / 10) * 10 : (item?.p ?? 0);
                const qty      = parseInt(String(bQty)) || 1;
                const fullBase = bp * qty;
                const mo       = Math.round(fullBase * (1 - retainerPct / 100));
                const total    = mo * bTerm;
                return (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                    {/* Months dropdown */}
                    <div style={{ position: "relative" }}>
                      <select
                        value={bTerm}
                        onChange={e => setBTerm(parseInt(e.target.value))}
                        style={{
                          height: 26, paddingLeft: 10, paddingRight: 28,
                          border: `1px solid ${C.rule}`, borderRadius: 2,
                          background: C.bg, fontFamily: SANS, fontSize: sz.body,
                          color: C.black, outline: "none", cursor: "pointer",
                          WebkitAppearance: "none", appearance: "none",
                        } as React.CSSProperties}
                      >
                        {TERMS.map(mo => (
                          <option key={mo} value={mo}>{mo} months</option>
                        ))}
                      </select>
                      <span style={{
                        position: "absolute", right: 9, top: "50%",
                        transform: "translateY(-50%)", fontSize: 9,
                        color: C.muted, pointerEvents: "none",
                      }}>▾</span>
                    </div>
                    {/* Full calculation line */}
                    {item && (
                      <p style={{
                        fontFamily: SANS, fontSize: 10, color: C.muted,
                        textAlign: "right", lineHeight: 1.6, margin: 0,
                      }}>
                        {retainerPct > 0
                          ? <>
                              € {fullBase.toLocaleString("de-DE")} −{retainerPct}% ={" "}
                              <strong style={{ color: C.black }}>€ {mo.toLocaleString("de-DE")}{" /mo"}</strong>
                              {" "}×{bTerm} ={" "}
                              <strong style={{ color: C.black }}>€ {total.toLocaleString("de-DE")}</strong>
                            </>
                          : <>
                              <strong style={{ color: C.black }}>€ {mo.toLocaleString("de-DE")}{" /mo"}</strong>
                              {" "}×{bTerm} ={" "}
                              <strong style={{ color: C.black }}>€ {total.toLocaleString("de-DE")}</strong>
                            </>
                        }
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

                    {/* ── Usage Rights + Exclusivity — side by side ── */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              {/* ── Usage Rights ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div
                    onClick={() => { setBUsage(v => v >= -1 ? -2 : -1); }}
                    style={{
                      width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                      background: bUsage >= -1 ? C.black : C.rule,
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, left: bUsage >= -1 ? 19 : 3,
                      width: 14, height: 14, borderRadius: "50%", background: C.white,
                      transition: "left 0.2s",
                    }} />
                  </div>
                  <span style={{
                    fontFamily: SANS, fontSize: sz.body,
                    color: bUsage >= -1 ? C.black : C.muted, transition: "color 0.15s",
                  }}>
                    Usage Rights
                  </span>
                </div>

                {bUsage >= -1 ? (
                  <>
                    <div style={{ position: "relative" }}>
                      <select
                        value={bUsage}
                        onChange={e => setBUsage(parseInt(e.target.value))}
                        style={{
                          width: "100%", height: sz.fieldH,
                          paddingLeft: 10, paddingRight: 24,
                          border: `1px solid ${C.rule}`, borderRadius: 2,
                          background: C.bg, fontFamily: SANS, fontSize: sz.body,
                          color: C.black, outline: "none", cursor: "pointer",
                          WebkitAppearance: "none", appearance: "none",
                        } as React.CSSProperties}
                      >
                        <option value={-1}>— No usage rights —</option>
                      {usageOptions.map((opt, i) => (
                          <option key={opt.id} value={i}>{opt.n}</option>
                        ))}
                      </select>
                      <span style={{
                        position: "absolute", right: 8, top: "50%",
                        transform: "translateY(-50%)", fontSize: 9,
                        color: C.muted, pointerEvents: "none",
                      }}>▾</span>
                    </div>
                    {usagePct > 0 && selectedItem && (
                      <p style={{ fontFamily: SANS, fontSize: 10, color: C.muted, margin: "6px 0 0", lineHeight: 1.7 }}>
                        {qty > 1
                          ? <>€ {basePrice.toLocaleString("de-DE")} × {qty} = € {subtotalBase.toLocaleString("de-DE")} × {usagePct}% = <strong style={{ color: C.black }}>+€ {usageFee.toLocaleString("de-DE")}</strong></>
                          : <>€ {subtotalBase.toLocaleString("de-DE")} × {usagePct}% = <strong style={{ color: C.black }}>+€ {usageFee.toLocaleString("de-DE")}</strong></>
                        }
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{
                    height: sz.fieldH, border: `1px solid ${C.rule}`, borderRadius: 2,
                    display: "flex", alignItems: "center", paddingLeft: 10,
                    fontFamily: SANS, fontSize: sz.body, color: C.light,
                    background: C.bg,
                  }}>
                    — none —
                  </div>
                )}
              </div>

              {/* ── Exclusivity ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div
                    onClick={() => setBExcl(v => v >= -1 ? -2 : -1)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                      background: bExcl >= -1 ? C.black : C.rule,
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, left: bExcl >= -1 ? 19 : 3,
                      width: 14, height: 14, borderRadius: "50%", background: C.white,
                      transition: "left 0.2s",
                    }} />
                  </div>
                  <span style={{
                    fontFamily: SANS, fontSize: sz.body,
                    color: bExcl >= -1 ? C.black : C.muted, transition: "color 0.15s",
                  }}>
                    Exclusivity
                  </span>
                </div>

                {bExcl >= -1 ? (
                  <>
                    <div style={{ position: "relative" }}>
                      <select
                        value={bExcl}
                        onChange={e => setBExcl(parseInt(e.target.value))}
                        style={{
                          width: "100%", height: sz.fieldH,
                          paddingLeft: 10, paddingRight: 24,
                          border: `1px solid ${C.rule}`, borderRadius: 2,
                          background: C.bg, fontFamily: SANS, fontSize: sz.body,
                          color: C.black, outline: "none", cursor: "pointer",
                          WebkitAppearance: "none", appearance: "none",
                        } as React.CSSProperties}
                      >
                        <option value={-1}>— No exclusivity —</option>
                      {exclOptions.map((opt, i) => (
                          <option key={opt.id} value={i}>{opt.n}</option>
                        ))}
                      </select>
                      <span style={{
                        position: "absolute", right: 8, top: "50%",
                        transform: "translateY(-50%)", fontSize: 9,
                        color: C.muted, pointerEvents: "none",
                      }}>▾</span>
                    </div>
                    {exclPct > 0 && selectedItem && (
                      <p style={{ fontFamily: SANS, fontSize: 10, color: C.muted, margin: "6px 0 0", lineHeight: 1.7 }}>
                        {qty > 1
                          ? <>€ {basePrice.toLocaleString("de-DE")} × {qty} = € {subtotalBase.toLocaleString("de-DE")} × {exclPct}% = <strong style={{ color: C.black }}>+€ {exclFee.toLocaleString("de-DE")}</strong></>
                          : <>€ {subtotalBase.toLocaleString("de-DE")} × {exclPct}% = <strong style={{ color: C.black }}>+€ {exclFee.toLocaleString("de-DE")}</strong></>
                        }
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{
                    height: sz.fieldH, border: `1px solid ${C.rule}`, borderRadius: 2,
                    display: "flex", alignItems: "center", paddingLeft: 10,
                    fontFamily: SANS, fontSize: sz.body, color: C.light,
                    background: C.bg,
                  }}>
                    — none —
                  </div>
                )}
              </div>

            </div>

            {/* ── Add-ons ── */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
              <Lbl sz={sz}>Add-ons</Lbl>
              <button
                onClick={() => setAddonOpen(true)}
                style={{
                  width: "100%", height: sz.fieldH,
                  border: `1px solid ${bAddons.length > 0 ? C.black : C.rule}`,
                  borderRadius: 2, background: C.white,
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "0 12px", cursor: "pointer", outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.15s",
                }}
              >
                {bAddons.length > 0 ? (
                  <div style={{ display: "flex", gap: 5, flex: 1, flexWrap: "wrap", overflow: "hidden" }}>
                    {bAddons.map(a => (
                      <span key={a.id} style={{
                        fontSize: 9, fontFamily: SANS, padding: "2px 4px 2px 7px",
                        border: `1px solid ${C.rule}`, borderRadius: 2, color: C.black,
                        whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        {a.name}{a.weeks ? " · " + a.weeks + " wk" : ""} +€ {calcAddonFee(a.id, a.weeks).toLocaleString("de-DE")}
                        <button
                          onClick={e => { e.stopPropagation(); setBAddons(prev => prev.filter(x => x.id !== a.id)); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 10, lineHeight: 1, padding: 0, flexShrink: 0 }}
                        >✕</button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ flex: 1, fontFamily: SANS, fontSize: sz.body, color: C.light }}>
                    — tap to select —
                  </span>
                )}
                <span style={{ fontSize: 9, color: C.muted, flexShrink: 0 }}>▾</span>
              </button>
            </div>

            {/* ── Line Preview ── */}
            {selectedItem && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.rule}` }}>
                <p style={{ fontFamily: LATO, fontSize: sz.micro, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
                  Line preview
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

                  {/* Name row — price always on right except retainer (retainer replaces it) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.black }}>
                      {selectedItem.n}{qty > 1 ? " × " + qty : ""}
                    </span>
                    <span style={{
                      fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.06em",
                      textTransform: "uppercase", padding: "2px 6px", borderRadius: 2,
                      background: CAT_PILL[bCat].bg, color: CAT_PILL[bCat].color, flexShrink: 0,
                    }}>
                      {CAT_LABELS[bCat]}
                    </span>
                    {bRecurring && retainerPct > 0 && (
                      <span style={{
                        fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.06em",
                        textTransform: "uppercase", padding: "2px 6px", borderRadius: 2,
                        background: "#f0f5f0", color: C.green, flexShrink: 0,
                      }}>
                        Retainer {bTerm} mo
                      </span>
                    )}
                    {!bRecurring && (
                      <>
                        <span style={{ flex: 1 }} />
                        <span style={{ fontFamily: SERIF, fontSize: sz.input, color: C.black, flexShrink: 0 }}>
                          {subtotalBase.toLocaleString("de-DE")} €
                        </span>
                      </>
                    )}
                  </div>

                  {/* Retainer row — math note folds in base price */}
                  {bRecurring && retainerPct > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Retainer {bTerm} mo</div>
                        <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                          {basePrice.toLocaleString("de-DE")}{qty > 1 ? " × " + qty + " = " + subtotalBase.toLocaleString("de-DE") : ""} − {retainerPct}% = {monthlyFee.toLocaleString("de-DE")}/mo × {bTerm} = {(monthlyFee * bTerm).toLocaleString("de-DE")} €
                        </div>
                      </div>
                      <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.black, flexShrink: 0 }}>
                        {(monthlyFee * bTerm).toLocaleString("de-DE")} €
                      </span>
                    </div>
                  )}

                  {/* Usage row — math note folds in base price */}
                  {bUsage >= 0 && usagePct > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>
                          Usage: {bUsage >= 0 && usageOptions[bUsage] ? buildUsageLabel(usageOptions[bUsage].n) : ""}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                          {qty > 1 ? basePrice.toLocaleString("de-DE") + " × " + qty + " = " + subtotalBase.toLocaleString("de-DE") : subtotalBase.toLocaleString("de-DE")} × {usagePct}% = {usageFee.toLocaleString("de-DE")} €
                        </div>
                      </div>
                      <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                        + {usageFee.toLocaleString("de-DE")} €
                      </span>
                    </div>
                  )}

                  {/* Excl row */}
                  {bExcl >= 0 && exclPct > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>
                          Exclusivity: {bExcl >= 0 && exclOptions[bExcl] ? buildExclLabel(exclOptions[bExcl].n) : ""}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                          {qty > 1 ? basePrice.toLocaleString("de-DE") + " × " + qty + " = " + subtotalBase.toLocaleString("de-DE") : subtotalBase.toLocaleString("de-DE")} × {exclPct}% = {exclFee.toLocaleString("de-DE")} €
                        </div>
                      </div>
                      <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                        + {exclFee.toLocaleString("de-DE")} €
                      </span>
                    </div>
                  )}

                  {/* Add-on rows */}
                  {bAddons.map(a => {
                    const aItem = addonOptions.find((o: any) => o.id === a.id);
                    const aFee  = calcAddonFee(a.id, a.weeks);
                    const isWk  = !!(aItem?.m?.includes("/wk"));
                    const isMo  = !!(aItem?.m?.includes("/mo"));
                    const aPct  = aItem?.m ? parsePct(aItem.m) : 0;
                    const mathNote = isWk && aItem?.p != null
                      ? aItem.p.toLocaleString("de-DE") + " × " + (a.weeks ?? 1) + " wk = " + aFee.toLocaleString("de-DE") + " €"
                      : isMo && bRecurring
                        ? subtotalBase.toLocaleString("de-DE") + " × " + aPct + "% × " + bTerm + " mo = " + aFee.toLocaleString("de-DE") + " €"
                        : aPct > 0
                          ? subtotalBase.toLocaleString("de-DE") + " × " + aPct + "% = " + aFee.toLocaleString("de-DE") + " €"
                          : "";
                    return (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>
                            {a.name}{a.weeks ? " · " + a.weeks + " wk" : ""}
                          </div>
                          {mathNote && (
                            <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                              {mathNote}
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                          + {aFee.toLocaleString("de-DE")} €
                        </span>
                      </div>
                    );
                  })}

                  {/* Total — only when there are extras */}
                  {(bRecurring || bUsage >= 0 && usagePct > 0 || bExcl >= 0 && exclPct > 0 || bAddons.length > 0) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 7, borderTop: `1px solid ${C.rule}`, marginTop: 2 }}>
                      <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>Total</span>
                      <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: "normal", color: C.black }}>
                        {bRecurring ? retainerTotal.toLocaleString("de-DE") : oneOffTotal.toLocaleString("de-DE")} €
                      </span>
                    </div>
                  )}

                </div>

                {/* Add to Quote button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button
                    onClick={addItem}
                    disabled={!canAddItem}
                    style={{
                      padding: "0 18px", height: 32,
                      background: canAddItem ? C.black : C.rule,
                      color: canAddItem ? C.white : C.light,
                      border: "none", borderRadius: 2,
                      cursor: canAddItem ? "pointer" : "default",
                      fontFamily: LATO, fontSize: sz.button,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      transition: "background 0.15s, color 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Add to Quote
                  </button>
                </div>

              </div>
            )}
          </div>

                    {/* Addon modal */}
          {addonOpen && (
            <AddonModal
              options={addonOptions}
              selected={bAddons}
              onToggle={item => {
                setBAddons(prev => {
                  const exists = prev.find(a => a.id === item.id);
                  if (exists) return prev.filter(a => a.id !== item.id);
                  const isPerWeek = !!(item.m?.includes("/wk"));
                  // Store only id, name, weeks — fee recalculated live
                  return [...prev, { id: item.id, name: item.n, weeks: isPerWeek ? (item.weeks ?? 1) : undefined }];
                });
              }}
              onWeeksChange={(id, weeks) => {
                setBAddons(prev => prev.map(a => a.id !== id ? a : { ...a, weeks }));
              }}
              onClose={() => setAddonOpen(false)}
              sz={sz}
              mobile={mobile}
              subtotalBase={subtotalBase}
              bTerm={bTerm}
              bRecurring={bRecurring}
            />
          )}

        </div>

      </div>
    </div>

    {/* ── Items Card ── */}
    {(() => {
      const cats = (["influencer","ugc","editorial"] as CatKey[]).filter(c => items.some(it => it.cat === c));
      const oneOffTotal   = items.filter(it => !it.recurring).reduce((s,it) => s + it.amt, 0);
      const retainerTotal = items.filter(it =>  it.recurring).reduce((s,it) => s + it.amt, 0);
      const grandTotal    = oneOffTotal + retainerTotal;

      return (
        <div style={{ padding: mobile ? "0 0 32px" : "0 24px 32px", boxSizing: "border-box" }}>
          <div style={mobile
            ? { padding: "20px 16px", boxSizing: "border-box" }
            : { maxWidth: CONTENT_MAX, margin: "0 auto", background: C.white, border: `1px solid ${C.rule}`, borderRadius: 12, padding: "26px 28px", boxSizing: "border-box" }
          }>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: mobile ? 17 : 18, fontWeight: "normal", color: C.black, margin: 0 }}>
                Items
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Flash */}
                {savedFlash && (
                  <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.green }}>Saved ✓</span>
                )}
                {/* PDF — disabled placeholder */}
                <button
                  disabled
                  title="Export PDF"
                  aria-label="Export PDF"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "none", border: `1px solid ${C.rule}`,
                    borderRadius: 2, padding: "0 10px",
                    height: mobile ? 30 : 26,
                    fontSize: sz.button, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: C.muted,
                    fontFamily: SANS, whiteSpace: "nowrap",
                    flexShrink: 0, cursor: "default",
                    opacity: items.length > 0 ? 1 : 0.4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  PDF
                </button>
                {/* Save to Projects */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={handleSaveToProjects}
                    disabled={!canSave || saving}
                    title={!brand.trim() ? "Add a brand name first" : ""}
                    style={{
                      height: mobile ? 30 : 26,
                      padding: "0 12px",
                      background: canSave && !saving ? C.black : C.rule,
                      color: canSave && !saving ? C.white : C.light,
                      border: "none", borderRadius: 2,
                      cursor: canSave && !saving ? "pointer" : "default",
                      fontFamily: LATO, fontSize: sz.button,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      whiteSpace: "nowrap", transition: "background 0.15s",
                    }}
                  >
                    {saving ? "Saving…" : "Save to Projects →"}
                  </button>
                  {items.length > 0 && !brand.trim() && (
                    <span style={{
                      position: "absolute", top: "100%", right: 0, marginTop: 4,
                      fontFamily: SANS, fontSize: sz.micro, color: C.red,
                      whiteSpace: "nowrap",
                    }}>
                      Add a brand name above
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Empty state */}
            {items.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.light, margin: "0 0 5px" }}>No items yet</p>
                <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.light, margin: 0 }}>Configure a deliverable above and click + Add to Quote</p>
              </div>
            )}

            {/* Items */}
            {items.length > 0 && (
              <div>
                {cats.map((cat, ci) => {
                  const catItems = items.filter(it => it.cat === cat);
                  const oneOff   = catItems.filter(it => !it.recurring);
                  const retainer = catItems.filter(it =>  it.recurring);
                  const pill     = CAT_PILL[cat];

                  return (
                    <div key={cat} style={{
                      marginBottom: 6,
                      paddingTop: ci > 0 ? 16 : 0,
                      borderTop: ci > 0 ? `1px solid ${C.rule}` : "none",
                    }}>
                      {/* Category label — only 2+ cats */}
                      {cats.length > 1 && (
                        <p style={{ fontFamily: LATO, fontSize: sz.micro, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                          {CAT_LABELS[cat]}
                        </p>
                      )}

                      {[...oneOff, ...retainer].map(item => {
                        const hasExtras = item.usageFee > 0 || item.exclFee > 0 || item.totalAddOns > 0;
                        const hasTotal  = item.recurring || hasExtras;
                        const lineTotal = item.recurring
                          ? (item.monthly * item.term) + (item.usageFee ?? 0) + (item.exclFee ?? 0) + (item.totalAddOns ?? 0)
                          : item.subtotalBase + (item.usageFee ?? 0) + (item.exclFee ?? 0) + (item.totalAddOns ?? 0);

                        return (
                          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: "0 8px", marginBottom: 14 }}>

                            {/* ✕ left gutter */}
                            <div style={{ paddingTop: 2 }}>
                              <button
                                onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.rule, fontSize: mobile ? 13 : 11, padding: 0, lineHeight: 1, display: "block" }}
                              >✕</button>
                            </div>

                            {/* Content col */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>

                              {/* Name row — price inline when no extras */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontFamily: SANS, fontSize: sz.input, color: C.black }}>
                                  {item.name}{item.qty > 1 ? ` × ${item.qty}` : ""}
                                </span>
                                <span style={{
                                  fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.06em",
                                  textTransform: "uppercase", padding: "2px 6px", borderRadius: 2,
                                  background: pill.bg, color: pill.color, flexShrink: 0,
                                }}>
                                  {CAT_LABELS[cat]}
                                </span>
                                {item.recurring && (
                                  <span style={{
                                    fontSize: 7.5, fontFamily: LATO, letterSpacing: "0.06em",
                                    textTransform: "uppercase", padding: "2px 6px", borderRadius: 2,
                                    background: "#f0f5f0", color: C.green, flexShrink: 0,
                                  }}>
                                    Retainer {item.term} mo
                                  </span>
                                )}
                                {!item.recurring && (
                                  <>
                                    <span style={{ flex: 1 }} />
                                    <span style={{ fontFamily: SERIF, fontSize: sz.input, color: C.black, flexShrink: 0 }}>
                                      {item.subtotalBase.toLocaleString("de-DE")} €
                                    </span>
                                  </>
                                )}
                              </div>
                              {item.recurring && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                  <div>
                                    <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Retainer {item.term} mo</div>
                                    <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                                      {item.up.toLocaleString("de-DE")}{item.qty > 1 ? " × " + item.qty + " = " + item.subtotalBase.toLocaleString("de-DE") : ""} − {item.retainerPct}% = {item.monthly.toLocaleString("de-DE")}/mo × {item.term} = {(item.monthly * item.term).toLocaleString("de-DE")} €
                                    </div>
                                  </div>
                                  <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.black, flexShrink: 0 }}>
                                    {(item.monthly * item.term).toLocaleString("de-DE")} €
                                  </span>
                                </div>
                              )}

                              {/* Usage */}
                              {item.usageFee > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                  <div>
                                    <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Usage: {item.usageLabel}</div>
                                    <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                                      {item.qty > 1 ? item.up.toLocaleString("de-DE") + " × " + item.qty + " = " + item.subtotalBase.toLocaleString("de-DE") : item.subtotalBase.toLocaleString("de-DE")} × {item.usagePct}% = {item.usageFee.toLocaleString("de-DE")} €
                                    </div>
                                  </div>
                                  <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                                    + {item.usageFee.toLocaleString("de-DE")} €
                                  </span>
                                </div>
                              )}

                              {/* Exclusivity */}
                              {item.exclFee > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                  <div>
                                    <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>Exclusivity: {item.exclLabel}</div>
                                    <div style={{ fontFamily: SANS, fontSize: sz.micro, color: C.muted, marginTop: 1, opacity: 0.8 }}>
                                      {item.qty > 1 ? item.up.toLocaleString("de-DE") + " × " + item.qty + " = " + item.subtotalBase.toLocaleString("de-DE") : item.subtotalBase.toLocaleString("de-DE")} × {item.exclPct}% = {item.exclFee.toLocaleString("de-DE")} €
                                    </div>
                                  </div>
                                  <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                                    + {item.exclFee.toLocaleString("de-DE")} €
                                  </span>
                                </div>
                              )}

                              {/* Add-ons */}
                              {item.addOns?.map((a: any) => (
                                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                  <div style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>
                                    {a.name}{a.weeks ? " · " + a.weeks + " wk" : ""}
                                  </div>
                                  <span style={{ fontFamily: SERIF, fontSize: sz.body, color: C.muted, flexShrink: 0 }}>
                                    + {a.fee.toLocaleString("de-DE")} €
                                  </span>
                                </div>
                              ))}

                              {/* Total — only when there are extras or retainer */}
                              {hasTotal && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 6, borderTop: `1px solid ${C.rule}`, marginTop: 2 }}>
                                  <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>Total</span>
                                  <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: "normal", color: C.black }}>
                                    {lineTotal.toLocaleString("de-DE")} €
                                  </span>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Summary */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.black}` }}>
                  {oneOffTotal > 0 && retainerTotal > 0 && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>One-off total</span>
                        <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>€ {oneOffTotal.toLocaleString("de-DE")}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>Retainer contract value</span>
                        <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.black }}>€ {retainerTotal.toLocaleString("de-DE")}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: "normal", color: C.black }}>Grand total</span>
                    <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: "normal", color: C.black }}>€ {grandTotal.toLocaleString("de-DE")}</span>
                  </div>
                </div>

                {/* Clear items */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  {resetConfirm ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: SANS, fontSize: sz.body, color: C.muted }}>Clear all items?</span>
                      <button onClick={() => setResetConfirm(false)} style={{ background: "none", border: `1px solid ${C.rule}`, borderRadius: 2, padding: "3px 12px", cursor: "pointer", fontFamily: SANS, fontSize: sz.body, color: C.muted }}>Cancel</button>
                      <button onClick={() => { setItems([]); setResetConfirm(false); }} style={{ background: "none", border: `1px solid ${C.rule}`, borderRadius: 2, padding: "3px 12px", cursor: "pointer", fontFamily: SANS, fontSize: sz.body, color: C.black }}>Clear</button>
                    </div>
                  ) : (
                    <button onClick={() => setResetConfirm(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: sz.body, color: C.light, textDecoration: "underline", padding: 0 }}>
                      Clear items
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      );
    })()}
    </>
  );
}
