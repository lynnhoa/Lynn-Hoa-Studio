// ─── CONSTANTS — single source of truth ───────────────────
// All rates, rules, shared pools live here.
// Import from this file everywhere. Never duplicate these values.

export const PASS = "lynnhoa2025";

export const STATUS = ["lead","quoted","revised","contracted","production","invoiced","paid"];

export const SETTINGS_DEFAULT = {
  name:"",company:"",street:"",plz:"",city:"",country:"Deutschland",
  email:"",website:"",phone:"",
  bankName:"",iban:"",bic:"",paypalEmail:"",
  kleinunternehmer:"true",
  steuernummer:"",ustIdNr:"",vatRate:"19",
  taxNote:"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
  password:"lynnhoa2025",
};

// ─── THEME ────────────────────────────────────────────────
export const C = {
  bg:"#faf9f7", black:"#1a1a1a", muted:"#888", light:"#b8b3ad",
  rule:"#e8e4df", white:"#fff", amber:"#c0956a", amberBg:"#fdf5ee",
  amberBorder:"#e8d8c8", red:"#c0857a", redBg:"#fdf0ee",
  redBorder:"#e8d8d5", green:"#6a9a6a", greenBg:"#f0f5f0", greenBorder:"#b8d4b8"
};
export const SERIF = "'Georgia','Times New Roman',serif";
export const SANS  = "'Helvetica Neue',Arial,sans-serif";

// ─── HELPERS ──────────────────────────────────────────────
export const fmt   = (n: number | null | undefined) => `€ ${Number(n||0).toLocaleString("de-DE")}`;
export const today = () => new Date().toISOString().split("T")[0];
export const fmtD  = (d: string | null | undefined, l?: boolean) => {
  if(!d) return "—";
  const [y,m,day] = d.split("-");
  const mo = l
    ? ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day}. ${mo[+m-1]} ${y}`;
};
export const addM  = (d: string, m: number) => {
  if(!d||!m) return null;
  const dt=new Date(d); dt.setMonth(dt.getMonth()+m);
  return dt.toISOString().split("T")[0];
};
export const dLeft = (d: string | null | undefined) =>
  d ? Math.ceil((new Date(d).getTime()-new Date().getTime())/864e5) : null;
export const uid   = () => Math.random().toString(36).slice(2,9);

// item.kind is the source of truth — no string heuristics
export const isSingle = (it: any) => it.kind === "single";

// ─── USAGE RIGHTS — per category ──────────────────────────
// Each category owns its own set. Edit here = updates calculator globally.

export const USAGE_INFLUENCER = [
  {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
  {l:"Organic — 3 months (included)",pct:0,mo:3},
  {l:"Organic — 12 months (included)",pct:0,mo:12},
  {l:"Paid ads — 1 month (+30%)",pct:30,mo:1},
  {l:"Paid ads — 3 months (+60%)",pct:60,mo:3},
  {l:"Paid ads — 6 months (+100%)",pct:100,mo:6},
  {l:"Paid ads — 12 months (+150%)",pct:150,mo:12}];

export const USAGE_UGC = [
  {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
  {l:"Organic — 3 months (included)",pct:0,mo:3},
  {l:"Organic — 12 months (included)",pct:0,mo:12},
  {l:"Paid ads — 1 month (+20%)",pct:20,mo:1},
  {l:"Paid ads — 3 months (+50%)",pct:50,mo:3},
  {l:"Paid ads — 6 months (+80%)",pct:80,mo:6},
  {l:"Paid ads — 12 months (+120%)",pct:120,mo:12}];

export const USAGE_EDITORIAL = [
  {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
  {l:"Organic — 3 months (included)",pct:0,mo:3},
  {l:"Organic — 12 months (included)",pct:0,mo:12},
  {l:"Paid ads — 1 month (+30%)",pct:30,mo:1},
  {l:"Paid ads — 3 months (+60%)",pct:60,mo:3},
  {l:"Paid ads — 6 months (+100%)",pct:100,mo:6},
  {l:"Paid ads — 12 months (+150%)",pct:150,mo:12}];

// ─── EXCLUSIVITY — per category ───────────────────────────

export const EXCL_INFLUENCER = [
  {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
  {l:"Category — 1 month (+30%)",pct:30,mo:1},
  {l:"Category — 3 months (+60%)",pct:60,mo:3},
  {l:"Full — 1 month (+75%)",pct:75,mo:1},
  {l:"Full — 3 months (+125%)",pct:125,mo:3}];

export const EXCL_UGC = [
  {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
  {l:"Category — 1 month (+25%)",pct:25,mo:1},
  {l:"Category — 3 months (+50%)",pct:50,mo:3},
  {l:"Full — 1 month (+50%)",pct:50,mo:1},
  {l:"Full — 3 months (+100%)",pct:100,mo:3}];

export const EXCL_EDITORIAL = [
  {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
  {l:"Category — 1 month (+30%)",pct:30,mo:1},
  {l:"Category — 3 months (+60%)",pct:60,mo:3},
  {l:"Full — 1 month (+75%)",pct:75,mo:1},
  {l:"Full — 3 months (+125%)",pct:125,mo:3}];

// Usage/excl lookup by category key
export const USAGE_BY_CAT: Record<string,any[]> = {
  influencer: USAGE_INFLUENCER,
  ugc:        USAGE_UGC,
  editorial:  USAGE_EDITORIAL,
  hotels:     USAGE_INFLUENCER, // hotels = merge, use influencer scale as default
};
export const EXCL_BY_CAT: Record<string,any[]> = {
  influencer: EXCL_INFLUENCER,
  ugc:        EXCL_UGC,
  editorial:  EXCL_EDITORIAL,
  hotels:     EXCL_INFLUENCER,
};

// ─── ADD-ONS — single shared pool, all categories ─────────
// One pool. All categories. Same IDs, same prices.
// Internal items (not on client rate cards) included here for calculator use.
export const AO_SHARED: any[] = [
  {id:"ao1", n:"Additional Story frame",       note:"per frame",                          flat:50},
  {id:"ao2", n:"Link in bio",                  note:"per week",                           flat:100},
  {id:"ao3", n:"Whitelisting / boosting",      note:"Ads through Lynn's account",         pct:30},
  {id:"ao4", n:"Rush delivery",                note:"Under 5 business days",              pct:25},
  {id:"ao5", n:"Pinned post",                  note:"Post kept pinned",                   flat:100},
  // Additional revision — 3 entries, one per category, clearly labelled
  {id:"ao6a",n:"Brand Collaboration — Additional revision", note:"per round · 1 included", flat:50},
  {id:"ao6b",n:"UGC — Additional revision",    note:"per round · 1 included",             flat:80},
  {id:"ao6c",n:"Editorial — Additional revision", note:"per round · 1 included",          flat:150},
  {id:"ao7", n:"Aspect ratio adaptation",      note:"per format",                         flat:65},
  {id:"ao8", n:"Raw footage",                  note:"Unedited files — not on client card",pct:30},
  {id:"ao9", n:"Kill fee",                     note:"If cancelled after production",      pct:50},
  {id:"ao10",n:"Hook / CTA variation",         note:"Additional version of same video",   flat:80},
  {id:"ao11",n:"Additional image",             note:"Same concept and set",               flat:200},
  {id:"ao12",n:"Additional video cut",         note:"",                                   flat:300},
  {id:"ao13",n:"Additional location",          note:"Additional venue or setting",        flat:150},
];

// ─── DISCOUNT RULES (from reference card) ─────────────────
// Used by calculator computePrice and rate card builder package suggestions.
export const DISCOUNT_RULES = {
  // UGC & Influencer volume
  volUgcInfluencer3:  15, // 3+ pieces same deliverable → 15% off
  volUgcInfluencer10: 20, // 10+ pieces → 20% off
  // Editorial package
  editorialPackage:   10, // any package → 10% off
  // Retainer / Brand Ambassador
  retainer:           20, // monthly retainer → 20% off/month
};

export const RENEWAL_OPTS: Record<string, any[]> = {
  usage:[
    {l:"Organic — 3 months",mo:3,pct:0},
    {l:"Organic — 12 months",mo:12,pct:0},
    {l:"Paid ads — 1 month",mo:1,pct:30},
    {l:"Paid ads — 3 months",mo:3,pct:60},
    {l:"Paid ads — 6 months",mo:6,pct:100},
    {l:"Paid ads — 12 months",mo:12,pct:150}],
  excl:[
    {l:"Category exclusivity — 1 month",mo:1,pct:30},
    {l:"Category exclusivity — 3 months",mo:3,pct:60},
    {l:"Full exclusivity — 1 month",mo:1,pct:75},
    {l:"Full exclusivity — 3 months",mo:3,pct:125}]
};
