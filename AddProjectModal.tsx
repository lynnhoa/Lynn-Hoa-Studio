import { useState, useEffect } from "react";
import { C, SANS, SERIF, LATO, TYPE } from "./constants";
import { useSizeMode } from "./useSizeMode";
import { insertProject, type ProjectStatus } from "./useProjects";
import { matchOrCreateClient } from "./useClients";

// ─── HELPERS ──────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];
const uid   = () => Math.random().toString(36).slice(2, 9);

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "quoted",      label: "Quoted"      },
  { value: "contracted",  label: "Contracted"  },
  { value: "production",  label: "Production"  },
  { value: "invoiced",    label: "Invoiced"    },
  { value: "paid",        label: "Paid"        },
];

// ─── FIELD ────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", required = false, sz,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
  sz: typeof TYPE[keyof typeof TYPE];
}) {
  return (
    <div>
      <p style={{
        fontFamily: LATO, fontSize: sz.label, color: C.muted,
        letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 5px",
      }}>
        {label}{required && <span style={{ color: C.amber, marginLeft: 2 }}>*</span>}
      </p>
      <input
        type={type}
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
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────

export function AddProjectModal({ onClose, onSaved }: {
  onClose:  () => void;
  onSaved?: (id: string) => void;
}) {
  const mobile = useSizeMode() === "mobile";
  const sz     = mobile ? TYPE.mobile : TYPE.desktop;

  const [brand,    setBrand]    = useState("");
  const [contact,  setContact]  = useState("");
  const [projName, setProjName] = useState("");
  const [status,   setStatus]   = useState<ProjectStatus>("quoted");
  const [amount,   setAmount]   = useState("");
  const [date,     setDate]     = useState(today());
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = sw + "px";
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  const canSave = brand.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const isPaid  = status === "paid";
    const qNo     = `QUO-${uid().toUpperCase()}`;
    const amtNum  = parseFloat(amount.replace(",", ".")) || 0;

    const result = await insertProject({
      brand:         brand.trim(),
      contact:       contact.trim(),
      project_name:  projName.trim() || brand.trim(),
      status,
      amount:        amtNum,
      quote_date:    date || today(),
      q_no:          qNo,
      qd:            null,
      amendments:    [],
      renewals:      [],
      notes:         notes.trim(),
      paid:          isPaid,
      paid_date:     isPaid ? (date || today()) : null,
    });

    if (!result.ok || !result.id) {
      setError("Could not save. Check your connection.");
      setSaving(false);
      return;
    }

    // Auto-match or create client and link
    await matchOrCreateClient(brand.trim(), contact.trim(), result.id);

    setSaving(false);
    if (onSaved) onSaved(result.id);
    onClose();
  };

  // Shared button style
  const btnBase: React.CSSProperties = {
    height: sz.fieldH, borderRadius: 2, cursor: "pointer",
    fontFamily: LATO, fontSize: sz.micro, letterSpacing: "0.1em",
    textTransform: "uppercase", border: "none", transition: "opacity 0.15s",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(26,26,26,0.35)",
        display: "flex",
        alignItems: mobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: mobile ? 0 : 16,
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg, width: mobile ? "100%" : 440,
          maxWidth: "100%",
          borderRadius: mobile ? "12px 12px 0 0" : 6,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: mobile ? "90dvh" : "92vh",
          boxSizing: "border-box",
        }}
      >
        {/* Handle — mobile */}
        {mobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.rule }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: mobile ? "10px 18px 12px" : "16px 20px 14px",
          borderBottom: `1px solid ${C.rule}`,
        }}>
          <p style={{
            fontFamily: LATO, fontSize: sz.micro, color: C.muted,
            letterSpacing: "0.1em", textTransform: "uppercase", margin: 0,
          }}>
            Add Project
          </p>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 16, lineHeight: 1, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: mobile ? "16px 18px" : "18px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <Field label="Brand name" value={brand} onChange={setBrand} placeholder="Sephora" required sz={sz} />
            <Field label="Contact" value={contact} onChange={setContact} placeholder="Anna Müller" sz={sz} />
            <Field label="Project name" value={projName} onChange={setProjName} placeholder={brand || "Summer Campaign"} sz={sz} />

            {/* Status + Amount in a row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <p style={{
                  fontFamily: LATO, fontSize: sz.label, color: C.muted,
                  letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 5px",
                }}>
                  Status
                </p>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ProjectStatus)}
                  style={{
                    width: "100%", height: sz.fieldH, padding: sz.inputPad,
                    border: `1px solid ${C.rule}`, background: C.white,
                    fontFamily: SANS, fontSize: sz.input, color: C.black,
                    borderRadius: 2, outline: "none", boxSizing: "border-box", cursor: "pointer",
                  }}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <Field label="Amount €" value={amount} onChange={setAmount} placeholder="0" type="text" sz={sz} />
            </div>

            <Field label="Date" value={date} onChange={setDate} type="date" sz={sz} />

            {/* Notes textarea */}
            <div>
              <p style={{
                fontFamily: LATO, fontSize: sz.label, color: C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 5px",
              }}>
                Notes
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any context…"
                rows={3}
                style={{
                  width: "100%", padding: sz.areaPad,
                  border: `1px solid ${C.rule}`, background: C.white,
                  fontFamily: SANS, fontSize: sz.input, color: C.black,
                  borderRadius: 2, outline: "none", resize: "vertical",
                  boxSizing: "border-box", lineHeight: 1.5,
                }}
              />
            </div>

            {error && (
              <p style={{ fontFamily: SANS, fontSize: sz.body, color: C.red, margin: 0 }}>{error}</p>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", gap: 8, padding: mobile ? "12px 18px 20px" : "14px 20px",
          borderTop: `1px solid ${C.rule}`,
        }}>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              ...btnBase, flex: 2,
              background: canSave && !saving ? C.black : C.light,
              color: C.white,
              cursor: canSave && !saving ? "pointer" : "default",
            }}
          >
            {saving ? "Saving…" : "Save Project"}
          </button>
          <button
            onClick={onClose}
            style={{
              ...btnBase, flex: 1,
              background: "none", color: C.muted,
              border: `1px solid ${C.rule}`,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
