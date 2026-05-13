import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ─── DATA PERSISTENCE (localStorage replaces Replit backend) ──────────────
function useGetData() {
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
function useSaveData() {
  return {
    mutate: ({ data }: { data: any }) => {
      try {
        localStorage.setItem("lynnhoa_data", JSON.stringify(data));
      } catch(e) { console.error("Save failed", e); }
    }
  };
}

// ─── THEME ────────────────────────────────────────────────
const C = {
  bg:"#faf9f7", black:"#1a1a1a", muted:"#888", light:"#b8b3ad",
  rule:"#e8e4df", white:"#fff", amber:"#c0956a", amberBg:"#fdf5ee",
  amberBorder:"#e8d8c8", red:"#c0857a", redBg:"#fdf0ee",
  redBorder:"#e8d8d5", green:"#6a9a6a", greenBg:"#f0f5f0", greenBorder:"#b8d4b8"
};
const SERIF = "'Georgia','Times New Roman',serif";
const SANS  = "'Helvetica Neue',Arial,sans-serif";

// ─── HELPERS ──────────────────────────────────────────────
const fmt   = (n: number | null | undefined) => `€ ${Number(n||0).toLocaleString("de-DE")}`;
const today = () => new Date().toISOString().split("T")[0];
const fmtD  = (d: string | null | undefined, l?: boolean) => {
  if(!d) return "—";
  const [y,m,day] = d.split("-");
  const mo = l
    ? ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day}. ${mo[+m-1]} ${y}`;
};
const addM  = (d: string, m: number) => { if(!d||!m) return null; const dt=new Date(d); dt.setMonth(dt.getMonth()+m); return dt.toISOString().split("T")[0]; };
const dLeft = (d: string | null | undefined) => d ? Math.ceil((new Date(d).getTime()-new Date().getTime())/864e5) : null;
const uid   = () => Math.random().toString(36).slice(2,9);
const PASS  = "lynnhoa2025";
const STATUS = ["lead","quoted","revised","contracted","production","invoiced","paid"];

const SETTINGS_DEFAULT = {
  name:"",company:"",street:"",plz:"",city:"",country:"Deutschland",
  email:"",website:"",phone:"",
  bankName:"",iban:"",bic:"",paypalEmail:"",
  kleinunternehmer:"true",
  steuernummer:"",ustIdNr:"",vatRate:"19",
  taxNote:"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
  password:"lynnhoa2025",
};

// ─── RATE CARD DATA ────────────────────────────────────────
const RC0: Record<string, any> = {
  influencer:{
    label:"Content Creator", sub:"Content Creator · Based in Germany",
    sections:[
      {t:"01 — Brand Collaboration", items:[
        {id:"i1",n:"Photo",note:"Feed post",p:200},
        {id:"i2",n:"Photo Set",note:"Carousel · 3–5 images",p:300},
        {id:"i3",n:"Short-form video",note:"Reels / TikTok / YouTube Shorts",p:350},
        {id:"i4",n:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",p:450},
        {id:"i5",n:"Story Set",note:"3 frames",p:180}]},
      {t:"Packages", items:[
        {id:"ip1",n:"Starter",note:"3 short-form videos · instead of € 1,050",p:890},
        {id:"ip2",n:"Full launch",note:"2 short-form videos + Story set · instead of € 880",p:750},
        {id:"ip3",n:"Campaign",note:"4 short-form videos + 2 Story sets · instead of € 1,760",p:1500}]},
      {t:"Brand Ambassador", items:[
        {id:"iba",n:"Brand Ambassador",note:"6 months · min. 3 pieces/month · 20% off/month",p:null}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"iu1",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"iu2",n:"Paid ads — 1 month",note:"",p:null,m:"+30%"},
        {id:"iu3",n:"Paid ads — 3 months",note:"",p:null,m:"+60%"},
        {id:"iu4",n:"Paid ads — 6 months",note:"",p:null,m:"+100%"},
        {id:"iu5",n:"Paid ads — 12 months",note:"",p:null,m:"+150%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"ie1",n:"Category exclusivity — 1 month",note:"",p:null,m:"+30%"},
        {id:"ie2",n:"Category exclusivity — 3 months",note:"",p:null,m:"+60%"},
        {id:"ie3",n:"Full exclusivity — 1 month",note:"",p:null,m:"+75%"},
        {id:"ie4",n:"Full exclusivity — 3 months",note:"",p:null,m:"+125%"}]},
      {t:"Add-ons", items:[
        {id:"ia1",n:"Additional Story frame",note:"per frame",p:50},
        {id:"ia2",n:"Link in bio",note:"per week",p:100},
        {id:"ia3",n:"Whitelisting / boosting",note:"Ads through Lynn's account",p:null,m:"+30%/mo"},
        {id:"ia4",n:"Rush delivery",note:"Under 5 business days",p:null,m:"+25%"},
        {id:"ia5",n:"Pinned post",note:"Post kept pinned",p:100},
        {id:"ia6",n:"Additional revision",note:"per round · 1 included",p:50},
        {id:"ia7",n:"Aspect ratio adaptation",note:"per format",p:65},
        {id:"ia8",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"},
        {id:"ia9",n:"Kill fee",note:"If cancelled after production",p:null,m:"50%"}]}
    ],
    fine:"All collaborations paid. 1 revision included per deliverable. Product provided by brand, not part of fee. Travel expenses billed separately if applicable.",
    usage:[
      {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
      {l:"Organic — 3 months (included)",pct:0,mo:3},
      {l:"Organic — 12 months (included)",pct:0,mo:12},
      {l:"Paid ads — 1 month (+30%)",pct:30,mo:1},
      {l:"Paid ads — 3 months (+60%)",pct:60,mo:3},
      {l:"Paid ads — 6 months (+100%)",pct:100,mo:6},
      {l:"Paid ads — 12 months (+150%)",pct:150,mo:12}],
    excl:[
      {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
      {l:"Category — 1 month (+30%)",pct:30,mo:1},
      {l:"Category — 3 months (+60%)",pct:60,mo:3},
      {l:"Full — 1 month (+75%)",pct:75,mo:1},
      {l:"Full — 3 months (+125%)",pct:125,mo:3}]
  },
  ugc:{
    label:"UGC Creator", sub:"UGC Creator · Based in Germany",
    sections:[
      {t:"01 — Organic Social Media Content", items:[
        {id:"u1",n:"Photo",note:"Static post",p:200},
        {id:"u2",n:"UGC Photo Set",note:"Carousel · 3–5 images",p:300},
        {id:"u3",n:"Short-form video",note:"Reels / TikTok / YouTube Shorts",p:350},
        {id:"u4",n:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",p:450}]},
      {t:"02 — Ad / Campaign Content", items:[
        {id:"u5",n:"Campaign video",note:"9:16 · structured for conversion",p:500},
        {id:"u6",n:"Campaign video, voiceover",note:"9:16 · structured for conversion",p:700}]},
      {t:"03 — Editorial", items:[
        {id:"u7",n:"Short hero video",note:"Up to 15 sec · 9:16 or 16:9",p:800},
        {id:"u8",n:"Hero video",note:"Up to 30 sec · cinematic · 9:16 or 16:9",p:1200}]},
      {t:"Packages", items:[
        {id:"up1",n:"Starter",note:"3 organic social videos · instead of € 1,050",p:890},
        {id:"up2",n:"Growth",note:"5 organic social videos · instead of € 1,750",p:1490},
        {id:"up3",n:"Campaign",note:"3 campaign videos · instead of € 1,500",p:1280},
        {id:"up4",n:"Video + Photo Set",note:"3 organic videos + photo set · instead of € 1,550",p:1320}]},
      {t:"Retainer", items:[
        {id:"uvd1",n:"3+ pieces (same deliverable)",note:"",p:null,m:"−15%"},
        {id:"uvd2",n:"Retainer — 6 months",note:"Min. 3 pieces/month · same deliverables",p:null,m:"−20%/mo"}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"uu1",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"uu2",n:"Paid ads — 1 month",note:"",p:null,m:"+20%"},
        {id:"uu3",n:"Paid ads — 3 months",note:"",p:null,m:"+50%"},
        {id:"uu4",n:"Paid ads — 6 months",note:"",p:null,m:"+80%"},
        {id:"uu5",n:"Paid ads — 12 months",note:"",p:null,m:"+120%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"ue1",n:"Category exclusivity — 1 month",note:"",p:null,m:"+25%"},
        {id:"ue2",n:"Category exclusivity — 3 months",note:"",p:null,m:"+50%"},
        {id:"ue3",n:"Full exclusivity — 1 month",note:"",p:null,m:"+50%"},
        {id:"ue4",n:"Full exclusivity — 3 months",note:"",p:null,m:"+100%"}]},
      {t:"Add-ons", items:[
        {id:"ua1",n:"Hook / CTA variation",note:"Additional version of same video",p:80},
        {id:"ua2",n:"Whitelisting / boosting",note:"Ads through Lynn's account",p:null,m:"+30%/mo"},
        {id:"ua3",n:"Rush delivery",note:"Under 5 business days",p:null,m:"+25%"},
        {id:"ua4",n:"Additional revision",note:"per round · 1 included",p:80},
        {id:"ua5",n:"Aspect ratio adaptation",note:"per format",p:65},
        {id:"ua6",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"},
        {id:"ua7",n:"Kill fee",note:"If cancelled after production",p:null,m:"50%"}]}
    ],
    fine:"Organic usage included for 3 months. Usage rights always time-limited. 1 revision included per deliverable. Product provided by brand, not part of fee. Music license fee not included.",
    usage:[
      {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
      {l:"Organic — 3 months (included)",pct:0,mo:3},
      {l:"Organic — 12 months (included)",pct:0,mo:12},
      {l:"Paid ads — 1 month (+20%)",pct:20,mo:1},
      {l:"Paid ads — 3 months (+50%)",pct:50,mo:3},
      {l:"Paid ads — 6 months (+80%)",pct:80,mo:6},
      {l:"Paid ads — 12 months (+120%)",pct:120,mo:12}],
    excl:[
      {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
      {l:"Category — 1 month (+25%)",pct:25,mo:1},
      {l:"Category — 3 months (+50%)",pct:50,mo:3},
      {l:"Full — 1 month (+50%)",pct:50,mo:1},
      {l:"Full — 3 months (+100%)",pct:100,mo:3}]
  },
  editorial:{
    label:"Editorial Content Creator", sub:"Editorial Content Creator · Based in Germany",
    sections:[
      {t:"Photography", items:[
        {id:"e1",n:"1 hero image",note:"Retouched · full resolution",p:400},
        {id:"e2",n:"Mini set",note:"3 images · single concept",p:900},
        {id:"e3",n:"Full photo story",note:"6–10 images · complete visual narrative",p:1800}]},
      {t:"Editorial Video", items:[
        {id:"e4",n:"Short hero video",note:"Up to 15 sec · 9:16",p:800},
        {id:"e5",n:"Hero video",note:"Up to 30 sec · cinematic · 9:16 or 16:9",p:1200},
        {id:"e6",n:"Long hero video",note:"Up to 60 sec · cinematic · 9:16 or 16:9",p:1800},
        {id:"e7",n:"Hero video + BTS",note:"30 sec hero + BTS cutdown",p:1500}]},
      {t:"Packages", items:[
        {id:"ep1",n:"Essentials",note:"1 hero video (30 sec) + 3 images · instead of € 2,100",p:1890},
        {id:"ep2",n:"Campaign",note:"1 hero video (30 sec) + 6 images · instead of € 3,000",p:2700},
        {id:"ep3",n:"Premium",note:"1 long hero + 1 hero + 10 images · instead of € 4,800",p:4320}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"eu1",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"eu2",n:"Paid ads — 1 month",note:"",p:null,m:"+30%"},
        {id:"eu3",n:"Paid ads — 3 months",note:"",p:null,m:"+60%"},
        {id:"eu4",n:"Paid ads — 6 months",note:"",p:null,m:"+100%"},
        {id:"eu5",n:"Paid ads — 12 months",note:"",p:null,m:"+150%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"ee1",n:"Category exclusivity — 1 month",note:"",p:null,m:"+30%"},
        {id:"ee2",n:"Category exclusivity — 3 months",note:"",p:null,m:"+60%"},
        {id:"ee3",n:"Full exclusivity — 1 month",note:"",p:null,m:"+75%"},
        {id:"ee4",n:"Full exclusivity — 3 months",note:"",p:null,m:"+125%"}]},
      {t:"Add-ons", items:[
        {id:"ea1",n:"Additional image",note:"Same concept and set",p:200},
        {id:"ea2",n:"Additional video cut",note:"",p:300},
        {id:"ea3",n:"Whitelisting / boosting",note:"",p:300},
        {id:"ea4",n:"Rush delivery",note:"Under 7 business days",p:null,m:"+30%"},
        {id:"ea5",n:"Additional revision",note:"per round · 1 included per project",p:150},
        {id:"ea6",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"},
        {id:"ea7",n:"Aspect ratio adaptation",note:"per format",p:65},
        {id:"ea8",n:"Kill fee",note:"If cancelled after production",p:null,m:"50%"}]}
    ],
    fine:"Product provided by brand, not part of fee. Usage rights always time-limited. 1 revision included per deliverable. Concept approved before production. Min. 2 weeks from brief to delivery.",
    usage:[
      {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
      {l:"Organic — 3 months (included)",pct:0,mo:3},
      {l:"Organic — 12 months (included)",pct:0,mo:12},
      {l:"Paid ads — 1 month (+30%)",pct:30,mo:1},
      {l:"Paid ads — 3 months (+60%)",pct:60,mo:3},
      {l:"Paid ads — 6 months (+100%)",pct:100,mo:6},
      {l:"Paid ads — 12 months (+150%)",pct:150,mo:12}],
    excl:[
      {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
      {l:"Category — 1 month (+30%)",pct:30,mo:1},
      {l:"Category — 3 months (+60%)",pct:60,mo:3},
      {l:"Full — 1 month (+75%)",pct:75,mo:1},
      {l:"Full — 3 months (+125%)",pct:125,mo:3}]
  },
  hotels:{
    label:"Hotels & Hospitality", sub:"Content Creator · Based in Germany",
    sections:[
      {t:"Hosted Collaboration", items:[
        {id:"h1",n:"Carousel",note:"In exchange for hosting",p:null,m:"hosted"},
        {id:"h2",n:"Short-form video",note:"In exchange for hosting",p:null,m:"hosted"},
        {id:"h3",n:"Story set",note:"3 frames · in exchange for hosting",p:null,m:"hosted"}]},
      {t:"Editorial Content", items:[
        {id:"h4",n:"1 hero image",note:"Retouched · full resolution",p:400},
        {id:"h5",n:"Mini set",note:"3 images · single concept",p:900},
        {id:"h6",n:"Full photo story",note:"6–10 images",p:1800},
        {id:"h7",n:"Short hero video",note:"Up to 15 sec · 9:16",p:800},
        {id:"h8",n:"Hero video",note:"Up to 30 sec · cinematic",p:1200},
        {id:"h9",n:"Long hero video",note:"Up to 60 sec · cinematic",p:1800}]},
      {t:"UGC Content", items:[
        {id:"h10",n:"Photo",note:"Static post",p:200},
        {id:"h11",n:"UGC Photo Set",note:"Carousel · 3–5 images",p:300},
        {id:"h12",n:"Short-form video",note:"Reels / TikTok / YouTube Shorts",p:350},
        {id:"h13",n:"Story set",note:"3 frames",p:180}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"hu1",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"hu2",n:"Paid ads — 1 month",note:"",p:null,m:"+20%"},
        {id:"hu3",n:"Paid ads — 3 months",note:"",p:null,m:"+50%"},
        {id:"hu4",n:"Paid ads — 6 months",note:"",p:null,m:"+80%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"he1",n:"Category exclusivity — 1 month",note:"",p:null,m:"+25%"},
        {id:"he2",n:"Category exclusivity — 3 months",note:"",p:null,m:"+50%"},
        {id:"he3",n:"Full exclusivity — 1 month",note:"",p:null,m:"+50%"},
        {id:"he4",n:"Full exclusivity — 3 months",note:"",p:null,m:"+100%"}]},
      {t:"Add-ons", items:[
        {id:"ha1",n:"Additional image",note:"Same concept and set",p:200},
        {id:"ha2",n:"Additional location",note:"Additional venue or setting",p:150},
        {id:"ha3",n:"Whitelisting / boosting",note:"Ads through Lynn's account",p:null,m:"+30%/mo"},
        {id:"ha4",n:"Rush delivery",note:"Under 5 business days",p:null,m:"+25%"},
        {id:"ha5",n:"Additional revision",note:"per round · 1 included",p:80},
        {id:"ha6",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"}]}
    ],
    fine:"Scope of hosted collaboration to be agreed per project. All content production invoiced separately. Organic usage included for 3 months. Usage rights always time-limited.",
    usage:[
      {l:"— Select usage rights —",pct:0,mo:0,sentinel:true},
      {l:"Organic — 3 months (included)",pct:0,mo:3},
      {l:"Organic — 12 months (included)",pct:0,mo:12},
      {l:"Paid ads — 1 month (+20%)",pct:20,mo:1},
      {l:"Paid ads — 3 months (+50%)",pct:50,mo:3},
      {l:"Paid ads — 6 months (+80%)",pct:80,mo:6}],
    excl:[
      {l:"— Select exclusivity —",pct:0,mo:0,sentinel:true},
      {l:"Category — 1 month (+25%)",pct:25,mo:1},
      {l:"Category — 3 months (+50%)",pct:50,mo:3},
      {l:"Full — 1 month (+50%)",pct:50,mo:1},
      {l:"Full — 3 months (+100%)",pct:100,mo:3}]
  }
};

// ─── ADD-ONS ──────────────────────────────────────────────
const AO: Record<string, any[]> = {
  influencer:[
    {id:"ao_i1",n:"Additional Story frame",flat:50},
    {id:"ao_i2",n:"Link in bio",flat:100},
    {id:"ao_i3",n:"Whitelisting / boosting",pct:30},
    {id:"ao_i4",n:"Rush delivery",pct:25},
    {id:"ao_i5",n:"Pinned post",flat:100},
    {id:"ao_i6",n:"Additional revision",flat:50},
    {id:"ao_i7",n:"Aspect ratio adaptation",flat:65},
    {id:"ao_i8",n:"Raw footage",pct:30},
    {id:"ao_i9",n:"Kill fee",pct:50}],
  ugc:[
    {id:"ao_u1",n:"Hook / CTA variation",flat:80},
    {id:"ao_u2",n:"Whitelisting / boosting",pct:30},
    {id:"ao_u3",n:"Rush delivery",pct:25},
    {id:"ao_u4",n:"Additional revision",flat:80},
    {id:"ao_u5",n:"Aspect ratio adaptation",flat:65},
    {id:"ao_u6",n:"Raw footage",pct:30},
    {id:"ao_u7",n:"Kill fee",pct:50},
    {id:"ao_u8",n:"Pinned post",flat:100}],
  editorial:[
    {id:"ao_e1",n:"Additional image",flat:200},
    {id:"ao_e2",n:"Additional video cut",flat:300},
    {id:"ao_e3",n:"Whitelisting / boosting",flat:300},
    {id:"ao_e4",n:"Rush delivery",pct:30},
    {id:"ao_e5",n:"Additional revision",flat:150},
    {id:"ao_e6",n:"Aspect ratio adaptation",flat:65},
    {id:"ao_e7",n:"Raw footage",pct:30},
    {id:"ao_e8",n:"Kill fee",pct:50}]
};
AO.complete = [...AO.influencer,...AO.ugc,...AO.editorial]
  .filter((a,i,ar)=>ar.findIndex((b: any)=>b.id===a.id)===i);
AO.hotels = AO.complete;

const RENEWAL_OPTS: Record<string, any[]> = {
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

const isSingle = (t: string) => !["package","usage","excl","add","volume","brand ambass","retainer","hosted"].some(k=>t.toLowerCase().includes(k));

// ─── ATOMS ────────────────────────────────────────────────
const I = ({s,...p}: any) => <input style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box",...s}} {...p}/>;
const S = ({s,...p}: any) => <select style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box",...s}} {...p}/>;
const B = ({v="pri",s,...p}: any) => <button style={{padding:"7px 14px",border:v==="pri"?"none":`1px solid ${C.rule}`,background:v==="pri"?C.black:"transparent",color:v==="pri"?C.white:C.muted,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap",...s}} {...p}/>;
const Pill = ({on,onClick,children}: any) => <button onClick={onClick} style={{padding:"5px 13px",border:`1px solid ${on?C.black:C.rule}`,background:on?C.black:"transparent",color:on?C.white:C.muted,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase"}}>{children}</button>;
const Lbl = ({children}: any) => <p style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"12px 0 5px"}}>{children}</p>;
const Tag = ({children,onRemove}: any) => <span style={{display:"inline-flex",alignItems:"center",gap:4,border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 8px",fontSize:10,color:C.muted}}>{children}{onRemove&&<button onClick={onRemove} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:10,padding:0}}>✕</button>}</span>;
const IR = ({label,value}: any) => <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.rule}`}}><span style={{fontSize:10.5,color:C.muted}}>{label}</span><span style={{fontSize:10.5,color:C.black,fontWeight:"500",maxWidth:"60%",textAlign:"right"}}>{value||"—"}</span></div>;
const scol = (s: string) => ({invoiced:C.amber,contracted:C.muted,quoted:C.light,revised:"#b8a090",production:"#8fa89a",paid:C.green,lead:C.light}[s as keyof typeof C]||C.light);

function UBadge({end,label="Usage"}: {end: string|null|undefined,label?: string}) {
  if(!end) return null;
  const d=dLeft(end);
  const exp=d!==null&&d<0;
  const urgent=d!==null&&d>=0&&d<=14;
  const soon=d!==null&&d>14&&d<=30;
  const col=exp||urgent?C.red:soon?C.amber:C.green;
  const bg=exp||urgent?C.redBg:soon?C.amberBg:C.greenBg;
  const bd=exp||urgent?C.redBorder:soon?C.amberBorder:C.greenBorder;
  return <span style={{fontSize:9.5,color:col,border:`1px solid ${bd}`,background:bg,padding:"2px 8px",borderRadius:2}}>
    {exp?`${label} expired`:`${label} ends ${fmtD(end)} · ${d}d left`}
  </span>;
}

// ─── LICENSE TRACKER ROW (per project) ───────────────────
function LicenseLine({label,end,note}: {label:string,end:string,note?:string}) {
  const d=dLeft(end);
  if(d===null)return null;
  const expired=d<0;
  const expiring=!expired&&d<=7;
  const col=expired?C.red:expiring?C.amber:C.green;
  const bg=expired?C.redBg:expiring?C.amberBg:C.greenBg;
  const bd=expired?C.redBorder:expiring?C.amberBorder:C.greenBorder;
  const txt=expired?`+${Math.abs(d)}d expired`:expiring?`${d}d left`:`${d}d`;
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:bg,border:`1px solid ${bd}`,borderRadius:2,marginBottom:3}}>
      <span style={{fontSize:9.5,color:col,fontWeight:"500"}}>{label}{note?` · ${note}`:""}</span>
      <span style={{fontSize:9.5,color:col,fontWeight:"600"}}>{fmtD(end)} · {txt}</span>
    </div>
  );
}

function getUsageMo(qd: any): number|null {
  if(!qd)return null;
  if(qd.mo&&qd.mo>0)return qd.mo;
  const lines=qd.lines||[];
  for(const l of lines){
    if(l.usageLabel){
      const m=String(l.usageLabel).match(/([0-9]+)\s*month/i);
      if(m)return parseInt(m[1]);
    }
    if(l.name&&String(l.name).toLowerCase().includes("usage")){
      const m=String(l.name).match(/([0-9]+)\s*month/i);
      if(m)return parseInt(m[1]);
    }
  }
  return null;
}

function ProjectLicenseTracker({pr}: {pr:any}) {
  if(!pr||!pr.qd)return null;
  const mo=getUsageMo(pr.qd);
  const originalUsageEnd=(pr.usageEndOverride||(pr.deliveryDate&&mo?addM(pr.deliveryDate,mo):null));
  const usageRenewalDates=(pr.renewals||[]).filter((r: any)=>r&&r.type!=="excl"&&r.endDate).map((r: any)=>r.endDate as string);
  const allUsageDates=[originalUsageEnd,...usageRenewalDates].filter(Boolean) as string[];
  const activeUsageEnd=allUsageDates.length>0?allUsageDates.reduce((a,b)=>a>b?a:b):null;
  const exclDates=(pr.renewals||[]).filter((r: any)=>r&&r.type==="excl"&&r.endDate).map((r: any)=>r.endDate as string);
  const activeExclEnd=exclDates.length>0?exclDates.reduce((a,b)=>a>b?a:b):null;
  if(!activeUsageEnd&&!activeExclEnd)return null;
  return(
    <div style={{marginBottom:8,marginTop:4}}>
      <p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 4px"}}>License Tracker</p>
      {activeUsageEnd&&<LicenseLine label="Usage Rights" end={activeUsageEnd}/>}
      {activeExclEnd&&<LicenseLine label="Exclusivity" end={activeExclEnd}/>}
    </div>
  );
}

// ─── PDF ENGINE ────────────────────────────────────────────
function A4({d,type,lang,settings,extraSigMargin,clauseGuards,tRowGuards}: any) {
  const s={...SETTINGS_DEFAULT,...(settings||{})};
  const l=lang==="de";
  const baseLines=d.lines||[];
  const deliverablesList=baseLines.length>0?baseLines.map((ln: any)=>`${ln.qty?ln.qty+"× ":""}${ln.name}`).join(", "):null;
  const allPlat=[...new Set((d.lines||[]).flatMap((ln: any)=>ln.platforms||[]))];
  const platformsList=allPlat.length>0?allPlat.join(", "):null;
  const amendLines=(type==="invoice")?(d.amendments||[]).flatMap((a: any)=>a.lines||[]):[];
  const allLines=[...baseLines,...amendLines];
  const total=type==="amendment"
    ?(d.amendTotal||0)
    :allLines.reduce((s: number,ln: any)=>s+(parseFloat(ln.amt)||0),0);
  const cNo=`CON-${(d.qNo||"").replace("QUO","").trim()||"001"}`;
  const iNo=d.iNo||`INV-${(d.qNo||"").replace("QUO","").trim()||"001"}`;
  const countryDisplay=l?(s.country==="Germany"?"Deutschland":s.country):(s.country==="Deutschland"?"Germany":s.country);
  const creatorAddrLine=[s.street,[s.plz,s.city].filter(Boolean).join(" "),countryDisplay].filter(Boolean).join(", ");
  const creatorFullLine=[s.company,s.name,s.street,[s.plz,s.city].filter(Boolean).join(" "),countryDisplay].filter(Boolean).join(" · ")||"Company · Your Name · Address";
  const titles: Record<string,string> = {
    quote:l?"Angebot":"Quote",
    revised:`${l?"Angebot":"Quote"} — R${d.rev||1}`,
    contract:l?"Vertrag":"Contract",
    amendment:l?"Nachtrag":"Amendment",
    invoice:l?"Rechnung":"Invoice",
    renewal:l?"Lizenzerneuerung":"License Renewal"
  };
  const MRow=({lb,v}: any) => <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:8}}><span style={{color:C.muted}}>{lb}</span><span>{v}</span></div>;
  const catBadgeLabel: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC Creator",editorial:"Editorial"};
  const TRow=({ln,prevLn,idx}: any)=>{
    const showCat=!!(ln.cat&&catBadgeLabel[ln.cat]&&ln.cat!==(prevLn?.cat));
    const subDetails=[
      ln.usageLabel,
      ln.exclLabel,
      ...(ln.addons||[]),
      ...(ln.platforms||[])
    ].filter(Boolean);
    return(
      <div data-trow={idx} style={{paddingTop:tRowGuards?.[idx]||0,borderBottom:`1px solid ${C.rule}`}}>
        {showCat&&<div style={{paddingTop:10,paddingBottom:1}}><span style={{fontSize:5.5,letterSpacing:"0.14em",textTransform:"uppercase",color:C.light}}>{catBadgeLabel[ln.cat]}</span></div>}
        <div style={{padding:"4px 0",display:"grid",gridTemplateColumns:"1fr 28px 52px 46px",alignItems:"baseline"}}>
          <div>
            <span style={{fontSize:8.5}}>{ln.name}</span>
            {ln.note&&<span style={{fontSize:7,color:C.light,display:"block"}}>{ln.note}</span>}
            {subDetails.length>0&&<span style={{fontSize:7,color:C.muted,display:"block"}}>{subDetails.join(" · ")}</span>}
          </div>
          <span style={{fontSize:8,textAlign:"right",color:C.muted}}>{ln.qty||""}</span>
          <span style={{fontSize:8,textAlign:"right",color:C.muted}}>{ln.up?`€ ${Number(ln.up).toLocaleString("de-DE")}`:""}</span>
          <span style={{fontSize:8,textAlign:"right"}}>€ {Number(ln.amt||0).toLocaleString("de-DE")}</span>
        </div>
      </div>
    );
  };
  return(
    <div style={{padding:"120px 62px 90px",fontSize:9.5,lineHeight:1.5,position:"relative",fontFamily:SANS,color:C.black,background:C.bg}}>
      <div style={{margin:"0 0 22px"}}>
        <h1 style={{fontFamily:SERIF,fontSize:19,fontWeight:"normal",margin:"0 0 28px"}}>{titles[type]||type}</h1>
        {type!=="contract"&&<p style={{fontSize:7.5,color:C.muted,margin:0}}>{creatorFullLine}</p>}
      </div>
      <div style={{display:"flex",justifyContent:type==="contract"?"flex-end":"space-between",marginBottom:13}}>
        {type!=="contract"&&<div>
          <p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 4px"}}>{["contract","amendment"].includes(type)?(l?"Auftraggeber":"Client"):(l?"An":"To")}</p>
          <p style={{fontSize:9,fontWeight:"500",margin:"0 0 1px"}}>{d.brand||"[Brand]"}</p>
          <p style={{fontSize:8,color:C.muted,margin:0}}>{d.contact||""}</p>
        </div>}
        <div style={{width:145}}>
          <p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 4px"}}>Details</p>
          {type==="quote"&&<><MRow lb={l?"Angebotsnr.":"Quote No."} v={d.qNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Gültig bis":"Valid Until"} v={fmtD(d.validUntil,l)}/></>}
          {type==="revised"&&<><MRow lb={l?"Angebotsnr.":"Quote No."} v={d.qNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb="Revision" v={`R${d.rev||1}`}/></>}
          {type==="contract"&&<><MRow lb={l?"Vertragsnr.":"Contract No."} v={cNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Angebotsnr.":"Quote Ref."} v={d.qNo}/></>}
          {type==="amendment"&&<><MRow lb={l?"Nachtragsnr.":"Amendment No."} v={d.aNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Vertragsnr.":"Contract Ref."} v={cNo}/></>}
          {type==="invoice"&&<><MRow lb={l?"Rechnungsnr.":"Invoice No."} v={iNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Lieferdatum":"Delivery Date"} v={fmtD(d.delivery,l)}/></>}
          {type==="renewal"&&<><MRow lb={l?"Rechnungsnr.":"Invoice No."} v={d.rNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Orig. Rechnung":"Orig. Invoice"} v={iNo}/></>}
        </div>
      </div>
      {type==="contract"&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:12,paddingBottom:10}}>
        <div style={{flex:1,paddingRight:16}}><p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 3px"}}>{l?"Zwischen":"Between"}</p><p style={{fontSize:9,fontWeight:"500",margin:0}}>{s.company||s.name||"Lynn Hoa"}</p><p style={{fontSize:8,color:C.muted,margin:"0 0 1px"}}>{s.name&&s.company?s.name:""}</p><p style={{fontSize:8,color:C.muted,margin:0}}>{creatorAddrLine}</p></div>
        <div style={{flex:1}}><p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 3px"}}>{l?"Und":"And"}</p><p style={{fontSize:9,fontWeight:"500",margin:0}}>{d.brand}</p><p style={{fontSize:8,color:C.muted,margin:0}}>{d.contact}</p></div>
      </div>}
      {type==="renewal"&&d.origContent?.length>0&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 11px",marginBottom:12,background:"#f5f3f0"}}>
        <p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 5px"}}>{l?"Lizenz für folgende Inhalte":"License applies to the following content"}</p>
        {d.origContent.map((c: any,i: number)=><p key={i} style={{fontSize:8.5,margin:"0 0 2px"}}>{c.qty?`${c.qty}× `:""}{c.name}{c.cat?` [${({influencer:"Influencer",ugc:"UGC",editorial:"Editorial"})[c.cat]||c.cat}]`:""}{c.note?` — ${c.note}`:""}</p>)}
        <p style={{fontSize:7.5,color:C.muted,margin:"5px 0 0"}}>{l?"Projekt":"Project"}: {d.projName} · {l?"Typ":"Type"}: {d.rType}</p>
      </div>}
      {(type!=="contract"||(d.quoteRef||"none")==="table")&&<>
        <div style={{borderTop:`1px solid ${C.rule}`,borderBottom:`1px solid ${C.rule}`,padding:"4px 0",display:"grid",gridTemplateColumns:"1fr 28px 52px 46px",marginBottom:0}}>
          {[l?"Leistung":"Description",l?"Anz.":"Qty",l?"Einzelpreis":"Unit Price",l?"Betrag":"Amount"].map((h,i)=><span key={h} style={{fontSize:6,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,textAlign:i>0?"right":"left"}}>{h}</span>)}
        </div>
        {(type==="invoice"?allLines:baseLines).map((ln: any,i: number,arr: any[])=><TRow key={i} idx={i} ln={ln} prevLn={arr[i-1]}/>)}
        {type==="amendment"
          ?<div data-sig-anchor="true" style={{marginTop:22+(extraSigMargin||0)}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <div style={{width:175}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:8}}><span style={{color:C.muted}}>{l?"Ursprünglicher Betrag":"Original Total"}</span><span>{fmt(d.origTotal||0)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:8}}><span style={{color:C.muted}}>{l?"Nachtragsbetrag":"Amendment Total"}</span><span>{fmt(d.amendTotal||0)}</span></div>
                <div style={{borderTop:`1px solid ${C.rule}`,paddingTop:6,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{l?"Neuer Gesamtbetrag":"New Total"}</span>
                  <span style={{fontFamily:SERIF,fontSize:14}}>€ {Number((d.origTotal||0)+(d.amendTotal||0)).toLocaleString("de-DE")}</span>
                </div>
              </div>
            </div>
            <div style={{paddingTop:14,borderTop:`1px solid ${C.rule}`}}>
              <p style={{fontSize:8,color:C.muted,lineHeight:1.75,margin:"0 0 18px"}}>{l?"Dieser Nachtrag ergänzt den genannten Vertrag. Alle übrigen Bedingungen bleiben unverändert.":"This amendment extends the original contract. All other terms remain unchanged and in full effect."}</p>
            </div>
          </div>
          :<div data-sig-anchor="true" style={{marginTop:22+(extraSigMargin||0)}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <div style={{textAlign:"right"}}><p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 3px"}}>{l?"Gesamt (EUR)":"Total (EUR)"}</p><p style={{fontFamily:SERIF,fontSize:15,margin:0}}>€ {Number(total).toLocaleString("de-DE")}</p></div>
            </div>
            {["quote","revised"].includes(type)&&<div style={{paddingTop:14,borderTop:`1px solid ${C.rule}`}}>
              <p style={{fontSize:8,color:C.muted,lineHeight:1.75,margin:"0 0 6px"}}>{l?"Dieses Angebot ist 14 Tage gültig. Preise basieren auf dem vereinbarten Umfang. Produkt von der Marke gestellt. Nutzungsrechte zeitlich begrenzt. 1 Korrektur je Leistung inklusive.":"This quote is valid for 14 days. Prices based on agreed scope. Product provided by brand. Usage rights time-limited. One revision included per deliverable."}</p>
              <p style={{fontSize:9,fontStyle:"italic",margin:"14px 0 0"}}>{d.footer||"Looking forward to working together."}</p>
            </div>}
            {["invoice","renewal"].includes(type)&&<div style={{paddingTop:14,borderTop:`1px solid ${C.rule}`}}>
              <p style={{fontSize:8,color:C.light,lineHeight:1.75,margin:"0 0 8px"}}>{l
                ?`Zahlbar an ${s.bankName||"[Bank Name]"}${s.iban?`, IBAN: ${s.iban}`:""}${s.bic?`, BIC: ${s.bic}`:""}${s.paypalEmail?` oder per PayPal: ${s.paypalEmail}`:""} . Zahlungsziel: 14 Tage. Verwendungszweck: ${(s.name||s.company||"IHRE FIRMA").toUpperCase()} – ${d.brand||"[Marke]"} – ${type==="renewal"?d.rNo:iNo}. ${s.taxNote||"Gemäß §19 UStG wird keine Umsatzsteuer erhoben."}`
                :`Please transfer to ${s.bankName||"[Bank Name]"}${s.iban?`, IBAN: ${s.iban}`:""}${s.bic?`, BIC: ${s.bic}`:""}${s.paypalEmail?` or via PayPal: ${s.paypalEmail}`:""} . Payment due within 14 days. Reference: ${(s.name||s.company||"YOUR COMPANY").toUpperCase()} – ${d.brand||"[Brand]"} – ${type==="renewal"?d.rNo:iNo}. ${s.taxNote||"No VAT charged pursuant to §19 UStG."}`
              }</p>
              <p style={{fontSize:9,fontStyle:"italic",margin:"14px 0 0"}}>{d.footer||(l?"Vielen Dank für die angenehme Zusammenarbeit.":"Thank you for the pleasure of working together.")}</p>
            </div>}
          </div>}
      </>}
      {type==="contract"&&(d.quoteRef||"none")==="ref"&&<div style={{padding:"10px 0",marginBottom:0}}>
        <p style={{fontSize:8.5,color:C.muted,margin:0,fontStyle:"italic"}}>{l?`Bezugnehmend auf Angebot ${d.qNo||""}${d.date?` vom ${fmtD(d.date,l)}`:""}.`:`As per the agreed quote ${d.qNo||""}${d.date?` dated ${fmtD(d.date,l)}`:""}.`}</p>
      </div>}
      {type==="contract"&&<div style={{marginTop:16,paddingTop:12,borderTop:`1px solid ${C.rule}`}}>
        {(d.clauses&&d.clauses.length>0?d.clauses:[
          {title:l?"§ 1 — Vertragsgegenstand":"§ 1 — Subject Matter",text:l?`${s.company||s.name||"Der/Die Auftragnehmer/in"} verpflichtet sich, folgende Leistungen gegen ein vereinbartes Honorar von ${fmt(total)} zu erbringen: ${deliverablesList||"den vereinbarten Content gemäß obiger Übersicht"}. Umfang, Format und Zeitplan werden vor Produktionsbeginn schriftlich von beiden Parteien bestätigt. Das kreative Konzept bedarf der schriftlichen Freigabe beider Parteien vor Beginn der Produktion.`:`${s.company||s.name||"The creator"} agrees to produce and deliver the following for a total agreed fee of ${fmt(total)}: ${deliverablesList||"the content specified above"}. The deliverable scope, format, and timeline shall be confirmed in writing by both parties prior to production. The creative concept is subject to mutual written approval before work begins.`},
          {title:l?"§ 2 — Lieferung":"§ 2 — Delivery",text:l?"Die Lieferung erfolgt innerhalb des schriftlich vereinbarten Zeitrahmens. Stellt der Auftraggeber erforderliche Materialien, Freigaben, Produkte oder Zugänge nicht innerhalb von 5 Werktagen nach vereinbartem Termin zur Verfügung, verlängert sich die Lieferfrist entsprechend. Auftraggeber-seitige Verzögerungen berechtigen nicht zur Minderung des Honorars.":"Delivery follows the project timeline confirmed at commencement. If the client delays providing required materials, approvals, products, or access by more than 5 business days beyond any agreed handover date, the delivery deadline extends by the same period. Client-caused delays do not reduce the agreed fee."},
          {title:l?"§ 3 — Korrekturen":"§ 3 — Revisions",text:l?"Eine (1) Korrektur je Leistung ist im Honorar enthalten. Korrekturwünsche sind innerhalb von 5 Werktagen nach Ablieferung schriftlich einzureichen; später eingereichte Anfragen können als neue Aufträge gewertet werden. Weitere Korrekturen werden nach dem jeweils gültigen Tagessatz berechnet. Kreativstil und redaktionelle Linie bleiben stets beim Auftragnehmer.":"One revision per deliverable is included in the agreed fee. Revision requests must be submitted in writing within 5 business days of each delivery; requests received after this period may be treated as new work. Additional revisions are charged at the creator's current rate. The creator's editorial voice and creative direction remain at the creator's sole discretion throughout."},
          {title:l?"§ 4 — Nutzungsrechte":"§ 4 — Usage Rights",text:l?`${s.company||s.name||"Der/Die Auftragnehmer/in"} räumt dem Auftraggeber ein zeitlich begrenztes, nicht-exklusives, nicht übertragbares Nutzungsrecht an den vereinbarten Inhalten für ${platformsList||"die vereinbarten Plattformen"}, den vereinbarten Zweck, Zeitraum und Geltungsbereich ein. Urheberrecht und Persönlichkeitsrechte verbleiben ausschließlich bei ${s.company||s.name||"dem/der Auftragnehmer/in"}. Es werden weder dauerhafte noch exklusive Rechte gewährt; Unterlizenzierung ist ohne schriftliche Zustimmung unzulässig. Der Auftragnehmer behält das Recht zur Verwendung der Inhalte im eigenen Portfolio. Mit Ablauf des Nutzungszeitraums fallen alle eingeräumten Rechte vollständig zurück.`:`${s.company||s.name||"The creator"} grants the client a time-limited, non-exclusive, non-transferable licence to use the delivered content for ${platformsList||"the agreed platforms"}, purpose, duration, and territory only. All copyright, moral rights, and ownership vest exclusively in ${s.company||s.name||"the creator"}. No perpetual, exclusive, or sub-licensable rights are granted; sub-licensing requires prior written consent. The creator retains the right to display the content in their portfolio and press materials. Upon expiry of the licence period, all granted rights revert in full to the creator.`},
          {title:l?"§ 5 — Zahlung":"§ 5 — Payment",text:l?`Das Honorar in Höhe von ${fmt(total)} ist innerhalb von 14 Tagen nach Rechnungsdatum fällig. Bei Zahlungsverzug ist ${s.company||s.name||"der/die Auftragnehmer/in"} berechtigt, Verzugszinsen gemäß § 288 BGB ab dem ersten Verzugstag geltend zu machen. ${s.taxNote||"Gemäß § 19 UStG wird keine Umsatzsteuer erhoben."}`:`The total fee of ${fmt(total)} is due within 14 days of the invoice date. In the event of late payment, statutory default interest pursuant to § 288 BGB is charged from the first day of delay. ${s.taxNote||"No VAT is charged pursuant to § 19 UStG."}`},
          {title:l?"§ 6 — Stornierung":"§ 6 — Cancellation",text:l?`Stornierungen bedürfen der Schriftform. Bei Stornierung vor Produktionsbeginn sind 25 % des vereinbarten Honorars fällig. Bei Stornierung nach Produktionsbeginn sind 50 % fällig. Ist die Leistung im Wesentlichen erbracht, ist das vollständige Honorar zu entrichten. Als Produktionsbeginn gilt jede Vorarbeit, Recherche, Konzeptentwicklung, Anreise, Produktion oder Beauftragung Dritter durch ${s.company||s.name||"den/die Auftragnehmer/in"} im Zusammenhang mit diesem Vertrag.`:`Cancellation must be submitted in writing. If the client cancels before production begins, 25% of the agreed fee is due. If the client cancels after production has begun, 50% of the agreed fee is due. If the deliverable is substantially complete, the full fee is payable. Production is deemed to have commenced upon any preparatory work, research, concept development, travel, filming, or third-party commitments made by ${s.company||s.name||"the creator"} in connection with this contract.`}
        ]).map((cl: any,ci: number)=>(
          <div data-clause={ci} key={ci} style={{marginBottom:0,paddingTop:10+(clauseGuards?.[ci]||0),paddingBottom:11}}>
            <p style={{fontFamily:SERIF,fontSize:7.5,fontWeight:"normal",color:"#5a5a5a",letterSpacing:"0.01em",margin:"0 0 5px"}}>{cl.title}</p>
            <p style={{fontSize:8.5,lineHeight:1.85,margin:0,color:"#404040"}}>{cl.text}</p>
          </div>
        ))}
      </div>}
      {["contract","amendment"].includes(type)&&<div data-sig-anchor="true" style={{display:"flex",justifyContent:"space-between",marginTop:44+(extraSigMargin||0)}}>
        {[s.company||s.name||"Lynn Hoa",d.brand||"[Brand]"].map((nm: string)=><div key={nm} style={{width:"44%"}}>
          <p style={{fontSize:8.5,fontWeight:"500",margin:"0 0 2px"}}>{nm}</p>
          <div style={{borderBottom:`1px solid ${C.rule}`,margin:"30px 0 5px"}}/>
          <p style={{fontSize:7.5,color:C.muted,margin:"0 0 26px"}}>{l?"Unterschrift":"Signature"}</p>
          <div style={{borderBottom:`1px solid ${C.rule}`,margin:"0 0 5px"}}/>
          <p style={{fontSize:7.5,color:C.muted,margin:0}}>{l?"Datum, Ort":"Date and Place"}</p>
        </div>)}
      </div>}
    </div>
  );
}

function PDFModal({data,type,onClose,onSave,onSaveClose,settings,isNew}: any) {
  const init=()=>JSON.parse(JSON.stringify(data));
  const [hs,setHs]=useState({hist:[init()],idx:0});
  const staged=hs.hist[hs.idx];
  const [preview,setPreview]=useState<any>(init);
  const [lang,setLang]=useState("en");
  const [panelW,setPanelW]=useState(380);
  const [flash,setFlash]=useState<string|null>(null);
  const [confirmClose,setConfirmClose]=useState(false);
  const [savedClean,setSavedClean]=useState(false);
  const setStaged=(fn: any)=>{
    setSavedClean(false);
    setHs(prev=>{
      const curr=prev.hist[prev.idx];
      const newD=typeof fn==="function"?fn(curr):fn;
      const next=[...prev.hist.slice(0,prev.idx+1),JSON.parse(JSON.stringify(newD))];
      return{hist:next,idx:next.length-1};
    });
  };
  const [downloading,setDownloading]=useState(false);
  const canUndo=hs.idx>0,canRedo=hs.idx<hs.hist.length-1;
  const docRef=useRef<HTMLDivElement>(null);
  const [docHeight,setDocHeight]=useState(841);
  const PAGE_H=841;
  const CHROME_H=210; // top padding (120px) + bottom padding (90px) inside A4 div — only add a page if real body content overflows
  const numPages=docHeight>PAGE_H+CHROME_H?Math.ceil(docHeight/PAGE_H):1;
  const s={...SETTINGS_DEFAULT,...(settings||{})};
  const isDE=lang==="de";
  const _dc=s.company||s.name||(isDE?"Der/Die Auftragnehmer/in":"The creator");
  const _dd=(staged.lines||[]).length>0?(staged.lines||[]).map((ln: any)=>`${ln.qty?ln.qty+"× ":""}${ln.name}`).join(", "):null;
  const _total=fmt((staged.lines||[]).reduce((a:number,ln:any)=>a+(parseFloat(ln.amt)||0),0));
  const defClauses=type==="contract"?[
    {title:isDE?"§ 1 — Vertragsgegenstand":"§ 1 — Subject Matter",text:isDE?`${_dc} verpflichtet sich, folgende Leistungen gegen ein vereinbartes Honorar von ${_total} zu erbringen: ${_dd||"den vereinbarten Content gemäß Angebot"}. Umfang, Format und Zeitplan werden vor Produktionsbeginn schriftlich von beiden Parteien bestätigt. Das kreative Konzept bedarf der schriftlichen Freigabe beider Parteien vor Beginn der Produktion.`:`${_dc} agrees to produce and deliver the following for a total agreed fee of ${_total}: ${_dd||"the content as per the agreed quote"}. The deliverable scope, format, and timeline shall be confirmed in writing by both parties prior to production. The creative concept is subject to mutual written approval before work begins.`},
    {title:isDE?"§ 2 — Lieferung":"§ 2 — Delivery",text:isDE?"Die Lieferung erfolgt innerhalb des schriftlich vereinbarten Zeitrahmens. Stellt der Auftraggeber erforderliche Materialien, Freigaben, Produkte oder Zugänge nicht innerhalb von 5 Werktagen nach vereinbartem Termin zur Verfügung, verlängert sich die Lieferfrist entsprechend. Auftraggeber-seitige Verzögerungen berechtigen nicht zur Minderung des Honorars.":"Delivery follows the project timeline confirmed at commencement. If the client delays providing required materials, approvals, products, or access by more than 5 business days beyond any agreed handover date, the delivery deadline extends by the same period. Client-caused delays do not reduce the agreed fee."},
    {title:isDE?"§ 3 — Korrekturen":"§ 3 — Revisions",text:isDE?"Eine (1) Korrektur je Leistung ist im Honorar enthalten. Korrekturwünsche sind innerhalb von 5 Werktagen nach Ablieferung schriftlich einzureichen; später eingereichte Anfragen können als neue Aufträge gewertet werden. Weitere Korrekturen werden nach dem jeweils gültigen Tagessatz berechnet. Kreativstil und redaktionelle Linie bleiben stets beim Auftragnehmer.":"One revision per deliverable is included in the agreed fee. Revision requests must be submitted in writing within 5 business days of each delivery; requests received after this period may be treated as new work. Additional revisions are charged at the creator's current rate. The creator's editorial voice and creative direction remain at the creator's sole discretion throughout."},
    {title:isDE?"§ 4 — Nutzungsrechte":"§ 4 — Usage Rights",text:isDE?`${_dc} räumt dem Auftraggeber ein zeitlich begrenztes, nicht-exklusives, nicht übertragbares Nutzungsrecht an den vereinbarten Inhalten für die festgelegten Plattformen, den vereinbarten Zweck, Zeitraum und Geltungsbereich ein. Urheberrecht und Persönlichkeitsrechte verbleiben ausschließlich bei ${_dc}. Es werden weder dauerhafte noch exklusive Rechte gewährt; Unterlizenzierung ist ohne schriftliche Zustimmung unzulässig. ${_dc} behält das Recht zur Verwendung der Inhalte im eigenen Portfolio. Mit Ablauf des Nutzungszeitraums fallen alle eingeräumten Rechte vollständig zurück.`:`${_dc} grants the client a time-limited, non-exclusive, non-transferable licence to use the delivered content for the agreed platforms, purpose, duration, and territory only. All copyright, moral rights, and ownership vest exclusively in ${_dc}. No perpetual, exclusive, or sub-licensable rights are granted; sub-licensing requires prior written consent. ${_dc} retains the right to display the content in their portfolio and press materials. Upon expiry of the licence period, all granted rights revert in full to ${_dc}.`},
    {title:isDE?"§ 5 — Zahlung":"§ 5 — Payment",text:isDE?`Das Honorar in Höhe von ${_total} ist innerhalb von 14 Tagen nach Rechnungsdatum fällig. Bei Zahlungsverzug ist ${_dc} berechtigt, Verzugszinsen gemäß § 288 BGB ab dem ersten Verzugstag geltend zu machen. ${s.taxNote||"Gemäß § 19 UStG wird keine Umsatzsteuer erhoben."}`:`The total fee of ${_total} is due within 14 days of the invoice date. In the event of late payment, statutory default interest pursuant to § 288 BGB is charged from the first day of delay. ${s.taxNote||"No VAT is charged pursuant to § 19 UStG."}`},
    {title:isDE?"§ 6 — Stornierung":"§ 6 — Cancellation",text:isDE?`Stornierungen bedürfen der Schriftform. Bei Stornierung vor Produktionsbeginn sind 25 % des vereinbarten Honorars fällig. Bei Stornierung nach Produktionsbeginn sind 50 % fällig. Ist die Leistung im Wesentlichen erbracht, ist das vollständige Honorar zu entrichten. Als Produktionsbeginn gilt jede Vorarbeit, Recherche, Konzeptentwicklung, Anreise, Produktion oder Beauftragung Dritter durch ${_dc} im Zusammenhang mit diesem Vertrag.`:`Cancellation must be submitted in writing. If the client cancels before production begins, 25% of the agreed fee is due. If the client cancels after production has begun, 50% of the agreed fee is due. If the deliverable is substantially complete, the full fee is payable. Production is deemed to have commenced upon any preparatory work, research, concept development, travel, filming, or third-party commitments made by ${_dc} in connection with this contract.`}
  ]:[];
  const [winW,setWinW]=useState(()=>window.innerWidth);
  const [showEdit,setShowEdit]=useState(false);
  const [extraSigMargin,setExtraSigMargin]=useState(0);
  const [clauseGuards,setClauseGuards]=useState<number[]>(Array(6).fill(0));
  const [tRowGuards,setTRowGuards]=useState<number[]>([]);
  useEffect(()=>{const fn=()=>setWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const isMobile=winW<700;
  const pageScale=isMobile?Math.min(1,(winW-32)/595):1;
  useEffect(()=>{
    setClauseGuards(Array(6).fill(0));
    setTRowGuards([]);
    const el=docRef.current;
    if(!el)return;
    const calc=()=>{
      setDocHeight(el.scrollHeight);
      // Signature guard
      const sigEl=el.querySelector("[data-sig-anchor]") as HTMLElement|null;
      if(!sigEl){setExtraSigMargin(0);}
      else{
        const sigTop=sigEl.offsetTop;
        const GUARD=200;
        const HEADER_H=49;
        const pageNum=Math.floor(sigTop/PAGE_H);
        const posInPage=sigTop-pageNum*PAGE_H;
        if(posInPage>(PAGE_H-GUARD)){
          const needed=(PAGE_H-posInPage)+HEADER_H+6;
          setExtraSigMargin(prev=>Math.abs(needed-prev)>2?needed:prev);
        } else if(pageNum>0&&posInPage>0&&posInPage<HEADER_H+4){
          const push=(HEADER_H+6)-posInPage;
          setExtraSigMargin(prev=>Math.abs(push)>2?prev+push:prev);
        } else if(pageNum===0||posInPage>HEADER_H+80){
          setExtraSigMargin(prev=>prev>0?0:prev);
        }
      }
      // Clause guards — at most one pushed clause per page, monotonic (never decrease)
      if(type==="contract"){
        const newGuards:number[]=Array(6).fill(0);
        const clauseEls=Array.from(el.querySelectorAll("[data-clause]")) as HTMLElement[];
        const guardedPages=new Set<number>();
        clauseEls.forEach((clauseEl,idx)=>{
          const bottom=clauseEl.offsetTop+clauseEl.offsetHeight;
          const pageNum=Math.floor(clauseEl.offsetTop/PAGE_H);
          const bottomInPage=bottom-pageNum*PAGE_H;
          if(bottomInPage>PAGE_H-100&&!guardedPages.has(pageNum)){
            newGuards[idx]=Math.max(0,PAGE_H+72-clauseEl.offsetTop-10);
            guardedPages.add(pageNum);
          }
        });
        setClauseGuards(prev=>{
          const next=newGuards.map((v,i)=>Math.max(v,prev[i]));
          return next.some((v,i)=>v!==prev[i])?next:prev;
        });
      }
      // Table row guards — for non-contract types, push any row that bleeds into footer zone
      if(type!=="contract"){
        const rowEls=Array.from(el.querySelectorAll("[data-trow]")) as HTMLElement[];
        if(rowEls.length>0){
          const newGuards:number[]=Array(rowEls.length).fill(0);
          const guardedPages=new Set<number>();
          rowEls.forEach((rowEl)=>{
            const idx=parseInt(rowEl.getAttribute("data-trow")||"0",10);
            const bottom=rowEl.offsetTop+rowEl.offsetHeight;
            const pageNum=Math.floor(rowEl.offsetTop/PAGE_H);
            const bottomInPage=bottom-pageNum*PAGE_H;
            if(bottomInPage>(PAGE_H-80)&&!guardedPages.has(pageNum)){
              newGuards[idx]=Math.max(0,PAGE_H+72-rowEl.offsetTop);
              guardedPages.add(pageNum);
            }
          });
          setTRowGuards(prev=>{
            if(newGuards.length!==prev.length)return newGuards;
            const next=newGuards.map((v,i)=>Math.max(v,prev[i]));
            return next.some((v,i)=>v!==prev[i])?next:prev;
          });
        }
      }
    };
    calc();
    const ro=new ResizeObserver(calc);
    ro.observe(el);
    return()=>ro.disconnect();
  },[preview,lang]);

  const commit=(snap: any)=>{
    setPreview(snap);
  };
  const undo=()=>{
    const ni=Math.max(0,hs.idx-1);
    if(ni===hs.idx)return;
    setHs(p=>({...p,idx:ni}));
    commit(JSON.parse(JSON.stringify(hs.hist[ni])));
    setSavedClean(false);
  };
  const redo=()=>{
    const ni=Math.min(hs.hist.length-1,hs.idx+1);
    if(ni===hs.idx)return;
    setHs(p=>({...p,idx:ni}));
    commit(JSON.parse(JSON.stringify(hs.hist[ni])));
    setSavedClean(false);
  };
  const handleUpdate=()=>commit(JSON.parse(JSON.stringify(staged)));
  const handleSave=()=>{
    const snap=JSON.parse(JSON.stringify(staged));
    commit(snap);
    if(onSave)onSave(snap);
    setSavedClean(true);
    setFlash("saved");
    setTimeout(()=>setFlash(null),2500);
  };
  const updStagedLine=(i: number,k: string,v: string)=>setStaged((prev: any)=>{
    const lines=[...(prev.lines||[])];
    lines[i]={...lines[i],[k]:v,
      amt:k==="qty"?(parseFloat(lines[i].up)||0)*(parseInt(v)||1)
         :k==="up"?(parseFloat(v)||0)*(parseInt(lines[i].qty)||1)
         :parseFloat(v)||lines[i].amt};
    return{...prev,lines};
  });
  const startDrag=(e: React.MouseEvent)=>{
    e.preventDefault();
    const startX=e.clientX,startW=panelW;
    const onMove=(ev: MouseEvent)=>setPanelW(Math.max(240,Math.min(700,startW+ev.clientX-startX)));
    const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };
  const isMobileDevice=()=>/iPad|iPhone|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const download=async()=>{
    if(downloading)return;
    const mobile=isMobileDevice();
    const mw=mobile?window.open("","_blank"):null;
    const pages=Array.from(document.querySelectorAll("[data-pdf-page]")) as HTMLElement[];
    if(!pages.length){mw?.close();return;}
    const savedT=pages.map(p=>p.style.transform);
    pages.forEach(p=>{p.style.transform="none";});
    setDownloading(true);
    try{
      const [{default:html2canvas},{default:jsPDF}]=await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const pdf=new (jsPDF as any)({orientation:"portrait",unit:"mm",format:"a4"});
      const pdfW=pdf.internal.pageSize.getWidth();
      const pdfH=pdf.internal.pageSize.getHeight();
      for(let i=0;i<pages.length;i++){
        if(i>0)pdf.addPage();
        const canvas=await (html2canvas as any)(pages[i],{scale:2,useCORS:true,backgroundColor:"#faf9f7"});
        pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,pdfW,pdfH);
      }
      const dateStr=(preview.date||new Date().toISOString().slice(0,10)).replace(/-/g,"_");
      const derivedCNo=`CON-${(preview.qNo||"").replace(/QUO-?/i,"").trim()||"001"}`;
      const derivedINo=preview.iNo||`INV-${(preview.qNo||"").replace(/QUO-?/i,"").trim()||"001"}`;
      const docNo=type==="contract"?derivedCNo
        :type==="invoice"?derivedINo
        :type==="renewal"?(preview.rNo||derivedINo)
        :type==="amendment"?(preview.aNo||"AMD")
        :(preview.qNo||type);
      const fname=`${dateStr} ${docNo}`;
      if(mw){
        mw.location.href=pdf.output("bloburl") as string;
      }else{
        pdf.save(`${fname}.pdf`);
      }
    }finally{pages.forEach((p,i)=>{p.style.transform=savedT[i];});setDownloading(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,display:"flex",flexDirection:"column",fontFamily:SANS}}>
      <div style={{height:46,borderBottom:`1px solid ${C.rule}`,display:"flex",alignItems:"center",padding:"0 14px",gap:6,flexShrink:0}}>
        <button onClick={undo} disabled={!canUndo} title="Undo" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:`1px solid ${canUndo?C.rule:"transparent"}`,borderRadius:2,cursor:canUndo?"pointer":"default",color:canUndo?C.black:C.light,fontSize:15}}>←</button>
        <button onClick={redo} disabled={!canRedo} title="Redo" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:`1px solid ${canRedo?C.rule:"transparent"}`,borderRadius:2,cursor:canRedo?"pointer":"default",color:canRedo?C.black:C.light,fontSize:15}}>→</button>
        <div style={{width:1,height:20,background:C.rule,margin:"0 4px"}}/>
        <Pill on={lang==="en"} onClick={()=>setLang("en")}>EN</Pill>
        <Pill on={lang==="de"} onClick={()=>setLang("de")}>DE</Pill>
        <div style={{flex:1}}/>
        {isMobile&&<button onClick={()=>setShowEdit(e=>!e)} style={{padding:"5px 12px",background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:C.black,marginRight:4}}>{showEdit?"View PDF":"Edit"}</button>}
        <B onClick={download} s={{opacity:downloading?0.5:1,cursor:downloading?"default":"pointer"}}>{downloading?"Saving…":"Save PDF"}</B>
        <button onClick={()=>{
          if(isNew){setConfirmClose(true);return;}
          if(savedClean){onClose();return;}
          const isDirty=JSON.stringify(staged)!==JSON.stringify(data);
          isDirty?setConfirmClose(true):onClose();
        }} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22,marginLeft:4}}>✕</button>
      </div>
      {confirmClose&&createPortal(<div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(250,249,247,0.88)"}}>
        <div style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"24px 28px",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",textAlign:"center",minWidth:220}}>
          <p style={{fontFamily:SERIF,fontSize:15,fontWeight:"normal",color:C.black,margin:"0 0 6px"}}>{isNew?"Save this document?":"Save before closing?"}</p>
          <p style={{fontSize:10,color:C.muted,margin:"0 0 18px"}}>{isNew?"It will be added to the client's project.":"Changes will be lost if you don't save."}</p>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <B onClick={()=>{handleSave();setConfirmClose(false);if(onSaveClose)onSaveClose();else onClose();}}>Yes, save</B>
            <B v="sec" onClick={()=>{setConfirmClose(false);onClose();}}>No, discard</B>
          </div>
        </div>
      </div>,document.body)}
      <div style={{flex:1,display:"flex",overflow:"hidden",flexDirection:isMobile?"column":"row"}}>
        {(!isMobile||showEdit)&&<div style={{width:isMobile?"100%":panelW,flexShrink:0,display:"flex",flexDirection:"column",borderRight:isMobile?"none":`1px solid ${C.rule}`,borderBottom:isMobile?`1px solid ${C.rule}`:"none",maxHeight:isMobile?"50%":undefined}}>
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
            <Lbl>Brand</Lbl><I value={staged.brand||""} onChange={(e: any)=>setStaged((p: any)=>({...p,brand:e.target.value}))} s={{marginBottom:6}}/>
            <Lbl>Contact</Lbl><I value={staged.contact||""} onChange={(e: any)=>setStaged((p: any)=>({...p,contact:e.target.value}))} s={{marginBottom:6}}/>
            <Lbl>Date</Lbl><I type="date" value={staged.date||""} onChange={(e: any)=>setStaged((p: any)=>({...p,date:e.target.value}))} s={{marginBottom:6}}/>
            {["quote","revised"].includes(type)&&<><Lbl>Valid Until</Lbl><I type="date" value={staged.validUntil||""} onChange={(e: any)=>setStaged((p: any)=>({...p,validUntil:e.target.value}))} s={{marginBottom:6}}/></>}
            {["invoice","renewal"].includes(type)&&<><Lbl>Invoice No.</Lbl><I value={staged.iNo||staged.rNo||""} onChange={(e: any)=>setStaged((p: any)=>({...p,iNo:e.target.value,rNo:e.target.value}))} s={{marginBottom:6}}/><Lbl>Delivery Date</Lbl><I type="date" value={staged.delivery||""} onChange={(e: any)=>setStaged((p: any)=>({...p,delivery:e.target.value}))} s={{marginBottom:6}}/></>}
            {type==="contract"&&<>
              <Lbl>Quote Table</Lbl>
              <div style={{display:"flex",gap:4,marginBottom:6}}>
                {([["table","Full table"],["ref","Quote ref."],["none","No table"]] as [string,string][]).map(([v,label])=>(
                  <Pill key={v} on={(staged.quoteRef||"none")===v} onClick={()=>setStaged((p:any)=>({...p,quoteRef:v}))}>{label}</Pill>
                ))}
              </div>
            </>}
            {(type!=="contract"||(staged.quoteRef||"none")==="table")&&<>
              <Lbl>Line Items</Lbl>
              {(staged.lines||[]).map((ln: any,i: number)=>(
                <div key={i} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:10,marginBottom:7}}>
                  <I value={ln.name||""} onChange={(e: any)=>updStagedLine(i,"name",e.target.value)} s={{marginBottom:5}}/>
                  <I value={ln.note||""} onChange={(e: any)=>updStagedLine(i,"note",e.target.value)} s={{marginBottom:5,color:C.muted,fontSize:10}} placeholder="note (optional)"/>
                  <div style={{display:"grid",gridTemplateColumns:"56px 1fr 76px",gap:5}}>
                    <I type="number" value={ln.qty||""} onChange={(e: any)=>updStagedLine(i,"qty",e.target.value)} placeholder="qty" s={{fontSize:10}}/>
                    <I type="number" value={ln.up||""} onChange={(e: any)=>updStagedLine(i,"up",e.target.value)} placeholder="unit €" s={{fontSize:10}}/>
                    <I type="number" value={ln.amt||""} onChange={(e: any)=>updStagedLine(i,"amt",e.target.value)} placeholder="total €" s={{fontSize:10}}/>
                  </div>
                </div>
              ))}
            </>}
            {type==="contract"&&<div style={{marginTop:6}}>
              <Lbl>Contract Clauses</Lbl>
              {(staged.clauses&&staged.clauses.length>0?staged.clauses:defClauses).map((cl: any,ci: number)=>{
                const clauses=staged.clauses&&staged.clauses.length>0?staged.clauses:defClauses;
                const updClause=(field: string,val: string)=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];arr[ci]={...arr[ci],[field]:val};return{...p,clauses:arr};});
                const moveClause=(dir: number)=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];const ni=ci+dir;if(ni<0||ni>=arr.length)return p;[arr[ci],arr[ni]]=[arr[ni],arr[ci]];return{...p,clauses:arr};});
                const delClause=()=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];arr.splice(ci,1);return{...p,clauses:arr};});
                return(
                  <div key={ci} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 10px",marginBottom:7,background:C.white}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:9,color:C.muted,letterSpacing:"0.06em"}}>§{ci+1}</span>
                      <div style={{display:"flex",gap:3}}>
                        <button onClick={()=>moveClause(-1)} disabled={ci===0} style={{background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:ci===0?"default":"pointer",color:ci===0?C.light:C.muted,fontSize:10,padding:"1px 6px",lineHeight:1}}>↑</button>
                        <button onClick={()=>moveClause(1)} disabled={ci===clauses.length-1} style={{background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:ci===clauses.length-1?"default":"pointer",color:ci===clauses.length-1?C.light:C.muted,fontSize:10,padding:"1px 6px",lineHeight:1}}>↓</button>
                        <button onClick={delClause} style={{background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:"pointer",color:C.red,fontSize:10,padding:"1px 6px",lineHeight:1}}>✕</button>
                      </div>
                    </div>
                    <I value={cl.title||""} onChange={(e: any)=>updClause("title",e.target.value)} s={{marginBottom:5,fontFamily:SERIF,fontSize:10}} placeholder="Clause title"/>
                    <textarea value={cl.text||""} onChange={(e: any)=>updClause("text",e.target.value)} style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:10,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box",minHeight:72}} placeholder="Clause text"/>
                  </div>
                );
              })}
              <button onClick={()=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];arr.push({title:`§${arr.length+1} — New Clause`,text:""});return{...p,clauses:arr};})} style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:"0 0 10px",fontFamily:SANS,letterSpacing:"0.04em",textDecoration:"underline",textDecorationColor:C.rule}}>+ Add clause</button>
            </div>}
            <Lbl>Closing Note</Lbl>
            <textarea value={staged.footer||""} onChange={(e: any)=>setStaged((p: any)=>({...p,footer:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:10,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box",minHeight:72}}/>
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${C.rule}`,flexShrink:0}}>
            {flash==="saved"&&<p style={{fontSize:9,color:C.green,margin:"0 0 7px",letterSpacing:"0.06em"}}>Saved ✓</p>}
            <B onClick={handleSave} s={{width:"100%",textAlign:"center"}}>Save</B>
          </div>
        </div>}
        {!isMobile&&<div onMouseDown={startDrag} style={{width:6,flexShrink:0,cursor:"col-resize",background:C.rule,opacity:0.5,transition:"opacity 0.15s"}} onMouseEnter={(e: any)=>{e.currentTarget.style.opacity="1";}} onMouseLeave={(e: any)=>{e.currentTarget.style.opacity="0.5";}}/>}
        {(!isMobile||!showEdit)&&<div style={{flex:1,background:"#888",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:isMobile?"16px 0":"32px 28px",gap:isMobile?16:28}}>
          {Array.from({length:numPages},(_,i)=>(
            <div key={i} style={{width:595*pageScale,height:PAGE_H*pageScale,overflow:"hidden",flexShrink:0,boxShadow:"0 4px 24px rgba(0,0,0,0.28)"}}>
              <div data-pdf-page="true" style={{width:595,height:PAGE_H,overflow:"hidden",background:C.bg,position:"relative",transform:pageScale<1?`scale(${pageScale})`:"none",transformOrigin:"top left"}}>
                <div ref={i===0?docRef:undefined} style={{position:"absolute",top:-i*PAGE_H,left:0,width:595}}>
                  <A4 d={preview} type={type} lang={lang} settings={settings} extraSigMargin={extraSigMargin} clauseGuards={clauseGuards} tRowGuards={tRowGuards}/>
                </div>
                <div style={{position:"absolute",bottom:type==="invoice"?64:59,left:0,right:0,height:28,background:C.bg,zIndex:2,pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:0,left:0,right:0,background:C.bg,zIndex:3,borderBottom:`1px solid ${C.rule}`}}>
                  <div style={{padding:"13px 62px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{s.company||s.name||"Lynn Hoa"}</span>
                    <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{preview.ctype||"Content Creator"}</span>
                  </div>
                </div>
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg,zIndex:3,borderTop:`1px solid ${C.rule}`}}>
                  {type==="invoice"
                    ?<div style={{padding:"12px 62px 18px",display:"flex",alignItems:"flex-start",gap:0}}>
                      <div style={{fontSize:7,color:C.muted,lineHeight:1.5,flex:"1 1 0",minWidth:0,overflow:"hidden"}}>
                        <div style={{fontWeight:500,color:C.black}}>{s.company||s.name||"Your Company"}</div>
                        {s.email&&<div>{s.email}</div>}
                        {s.website&&<div>{s.website}</div>}
                        {s.steuernummer&&<div style={{marginTop:4}}>{isDE?"St.-Nr.":"Tax No."} {s.steuernummer}</div>}
                      </div>
                      <div style={{fontSize:7,color:C.muted,lineHeight:1.5,flex:"1 1 0",minWidth:0,overflow:"hidden"}}>
                        <div style={{fontWeight:500,color:C.black}}>{isDE?"Zahlungsdetails":"Payment Details"}</div>
                        {s.bankName&&<div>{s.bankName}</div>}
                        {s.iban&&<div>IBAN {s.iban}</div>}
                        {s.bic&&<div>BIC {s.bic}</div>}
                      </div>
                      <div style={{fontSize:7,color:C.muted,lineHeight:1.5,flex:"1 1 0",minWidth:0,overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"space-between",alignSelf:"stretch"}}>
                        <div>
                          {s.paypalEmail&&<><div style={{fontWeight:500,color:C.black}}>PayPal</div><div>{s.paypalEmail}</div></>}
                        </div>
                        {numPages>1&&<div style={{fontSize:7,color:C.light,letterSpacing:"0.04em",textAlign:"right"}}>{i+1}</div>}
                      </div>
                    </div>
                    :<div style={{padding:"26px 62px 22px",fontSize:7,color:C.muted,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span>{[s.email,s.website].filter(Boolean).join(" · ")||"your@email.com · yourwebsite.com"}</span>
                      {numPages>1&&<span style={{letterSpacing:"0.04em",color:C.light}}>{i+1}</span>}
                    </div>}
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────
function AppLogo({size="nav"}: {size?: "nav"|"auth"|"web"}) {
  const big=size==="auth";
  const web=size==="web";
  return(
    <div style={{textAlign:"center",lineHeight:1,display:"inline-block"}}>
      <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:big?26:web?24:18,letterSpacing:"0.02em",color:C.black,display:"block"}}>Lynn Hoa</span>
      <span style={{fontFamily:SANS,fontSize:big?8:web?7:6.5,letterSpacing:"0.26em",textTransform:"uppercase" as const,color:C.muted,display:"block",marginTop:big?4:2}}>Studio</span>
    </div>
  );
}

function Auth({onAuth,currentPass}: {onAuth: (role:"manager"|"creator")=>void,currentPass: string}) {
  const [role,setRole]=useState<"manager"|"creator"|null>("manager");
  const [pw,setPw]=useState(""),[ err,setErr]=useState(false);
  const go=()=>{ if(!role)return; if(pw===(currentPass||PASS))onAuth(role); else setErr(true); };
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS}}>
      <div style={{width:300,textAlign:"center"}}>
        <div style={{marginBottom:6}}><AppLogo size="auth"/></div>
        <p style={{fontSize:9,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase",margin:"0 0 28px"}}>Private Access</p>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {(["Manager","Creator"] as const).map(r=>{
            const v=r.toLowerCase() as "manager"|"creator";
            const sel=role===v;
            return <button key={r} onClick={()=>setRole(v)} style={{flex:1,padding:"9px 0",border:`1px solid ${sel?C.black:C.rule}`,background:sel?C.black:C.bg,color:sel?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",borderRadius:2}}>{r}</button>;
          })}
        </div>
        <input type="password" placeholder="Password" value={pw}
          onChange={e=>{setPw(e.target.value);setErr(false);}}
          onKeyDown={e=>e.key==="Enter"&&go()}
          style={{width:"100%",padding:"10px 14px",border:`1px solid ${err?C.red:C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        {err&&<p style={{fontSize:10,color:C.red,margin:"0 0 8px"}}>Incorrect password</p>}
        <button onClick={go} disabled={!role} style={{width:"100%",padding:10,background:role?C.black:C.rule,color:role?C.white:C.muted,border:"none",borderRadius:2,cursor:role?"pointer":"default",fontFamily:SANS,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase"}}>Enter</button>
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────
function Settings({settings,setSettings,isMobile}: any) {
  const s={...SETTINGS_DEFAULT,...settings};
  const upd=(k: string,v: string)=>setSettings((p: any)=>({...p,[k]:v}));
  const setKU=(v: "true"|"false")=>setSettings((p: any)=>({...p,kleinunternehmer:v,taxNote:v==="true"?"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.":""}));
  const Sec=({title}: {title: string})=>(
    <p style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"28px 0 11px",paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>{title}</p>
  );
  const Toggle=({val,opt,labels,onChange}: {val:string,opt:[string,string],labels:[string,string],onChange:(v:string)=>void})=>(
    <div style={{display:"flex",gap:7,marginTop:5}}>
      {opt.map((o,i)=><button key={o} onClick={()=>onChange(o)} style={{padding:"6px 14px",border:`1px solid ${val===o?C.black:C.rule}`,background:val===o?C.black:C.bg,color:val===o?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",borderRadius:2}}>{labels[i]}</button>)}
    </div>
  );
  const ku=s.kleinunternehmer!=="false";
  return(
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>Creator Profile</h2>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",margin:0}}>Business info used on all PDFs</p>
      </div>

      <Sec title="Identity"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Full Name</Lbl><I value={s.name} onChange={(e: any)=>upd("name",e.target.value)} placeholder="My Linh Hoa"/></div>
        <div><Lbl>Business / Brand Name</Lbl><I value={s.company} onChange={(e: any)=>upd("company",e.target.value)} placeholder="Lynn Hoa Studio"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Phone (optional)</Lbl><I value={s.phone} onChange={(e: any)=>upd("phone",e.target.value)} placeholder="+49 …"/></div>
      </div>

      <Sec title="Address"/>
      <div style={{marginBottom:9}}>
        <Lbl>Street & Number</Lbl>
        <I value={s.street} onChange={(e: any)=>upd("street",e.target.value)} placeholder="Musterstraße 12"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Postal Code (PLZ)</Lbl><I value={s.plz} onChange={(e: any)=>upd("plz",e.target.value)} placeholder="10115"/></div>
        <div><Lbl>City</Lbl><I value={s.city} onChange={(e: any)=>upd("city",e.target.value)} placeholder="Berlin"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Country</Lbl><I value={s.country} onChange={(e: any)=>upd("country",e.target.value)} placeholder="Deutschland"/></div>
      </div>

      <Sec title="Online"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Email</Lbl><I value={s.email} onChange={(e: any)=>upd("email",e.target.value)} placeholder="hello@lynnhoa.com"/></div>
        <div><Lbl>Website</Lbl><I value={s.website} onChange={(e: any)=>upd("website",e.target.value)} placeholder="lynnhoa.com"/></div>
      </div>

      <Sec title="Banking"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Bank</Lbl><I value={s.bankName} onChange={(e: any)=>upd("bankName",e.target.value)} placeholder="Commerzbank"/></div>
        <div><Lbl>IBAN</Lbl><I value={s.iban} onChange={(e: any)=>upd("iban",e.target.value)} placeholder="DE89 …"/></div>
        <div><Lbl>BIC</Lbl><I value={s.bic} onChange={(e: any)=>upd("bic",e.target.value)} placeholder="COBADEFFXXX"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>PayPal (optional)</Lbl><I value={s.paypalEmail} onChange={(e: any)=>upd("paypalEmail",e.target.value)} placeholder="pay@lynnhoa.com"/></div>
      </div>

      <Sec title="Tax"/>
      <div style={{marginBottom:14}}>
        <Lbl>Kleinunternehmerregelung (§ 19 UStG)</Lbl>
        <Toggle val={s.kleinunternehmer||"true"} opt={["true","false"]} labels={["Yes","No"]} onChange={v=>setKU(v as "true"|"false")}/>
        <p style={{fontSize:10.5,color:C.muted,margin:"7px 0 0",lineHeight:1.6}}>
          {ku?"No VAT charged on invoices":"VAT is charged on invoices"}
        </p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Tax Number (Steuernummer)</Lbl><I value={s.steuernummer} onChange={(e: any)=>upd("steuernummer",e.target.value)} placeholder="12/345/67890 (Finanzamt)"/></div>
        {!ku&&<div><Lbl>VAT ID (USt-IdNr.)</Lbl><I value={s.ustIdNr} onChange={(e: any)=>upd("ustIdNr",e.target.value)} placeholder="DE123456789"/></div>}
      </div>
      {!ku&&<div style={{marginBottom:9}}>
        <Lbl>VAT Rate</Lbl>
        <Toggle val={s.vatRate||"19"} opt={["19","7"]} labels={["19 % (standard)","7 % (reduced)"]} onChange={v=>upd("vatRate",v)}/>
      </div>}
      <div style={{marginBottom:9,marginTop:ku?0:9}}>
        <Lbl>Invoice Tax Note</Lbl>
        <I value={s.taxNote} onChange={(e: any)=>upd("taxNote",e.target.value)}
          placeholder={ku?"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.":"zzgl. 19 % MwSt"}/>
        <p style={{fontSize:10,color:C.muted,margin:"5px 0 0"}}>Appears on every PDF</p>
      </div>

      <div style={{marginTop:16,padding:"11px 14px",background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:2}}>
        <p style={{fontSize:10.5,color:C.amber,margin:0}}>Changes save automatically. Business info appears on every new PDF.</p>
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD ──────────────────────────────────────
function ChangePassword({settings,setSettings}: any) {
  const s={...SETTINGS_DEFAULT,...settings};
  const [curPw,setCurPw]=useState("");
  const [newPw,setNewPw]=useState("");
  const [confPw,setConfPw]=useState("");
  const [pwMsg,setPwMsg]=useState<{text:string,ok:boolean}|null>(null);
  const changePass=()=>{
    if(curPw!==(s.password||PASS)){setPwMsg({text:"Current password is incorrect.",ok:false});return;}
    if(newPw.length<6){setPwMsg({text:"New password must be at least 6 characters.",ok:false});return;}
    if(newPw!==confPw){setPwMsg({text:"Passwords do not match.",ok:false});return;}
    setSettings((p: any)=>({...p,password:newPw}));
    setCurPw("");setNewPw("");setConfPw("");
    setPwMsg({text:"Password updated successfully.",ok:true});
  };
  return(
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>Change Password</h2>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",margin:0}}>Update your studio access password</p>
      </div>
      <div style={{maxWidth:380}}>
        <Lbl>Current Password</Lbl><I type="password" value={curPw} onChange={(e: any)=>setCurPw(e.target.value)} placeholder="Current password" s={{marginBottom:9}}/>
        <Lbl>New Password</Lbl><I type="password" value={newPw} onChange={(e: any)=>setNewPw(e.target.value)} placeholder="Min. 6 characters" s={{marginBottom:9}}/>
        <Lbl>Confirm New Password</Lbl><I type="password" value={confPw} onChange={(e: any)=>setConfPw(e.target.value)} onKeyDown={(e: any)=>e.key==="Enter"&&changePass()} placeholder="Repeat" s={{marginBottom:12}}/>
        <B v="sec" onClick={changePass}>Change Password</B>
        {pwMsg&&<p style={{fontSize:10.5,color:pwMsg.ok?C.green:C.red,margin:"10px 0 0"}}>{pwMsg.text}</p>}
      </div>
    </div>
  );
}

// ─── RATE CARDS TAB ───────────────────────────────────────
function RCContent({card,lang,cleanSecT,rcSecGuards}: any) {
  const l=lang==="de";
  return(
    <div style={{padding:"90px 62px 130px",fontSize:9.5,lineHeight:1.5,fontFamily:SANS,color:C.black,background:C.bg}}>
      <div style={{marginBottom:22}}>
        <h1 style={{fontFamily:SERIF,fontSize:19,fontWeight:"normal",margin:"0 0 4px"}}>{l?"Preisliste":"Rate Card"}</h1>
        <p style={{fontSize:7.5,color:C.muted,margin:0}}>{card.sub}</p>
      </div>
      {card.sections.map((sec: any,si: number)=>(
        <div key={si} data-rcsec={si} style={{marginBottom:14,paddingTop:rcSecGuards?.[si]||0}}>
          <p style={{fontSize:6.5,letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted,margin:"0 0 3px",paddingBottom:"3px",borderBottom:`1px solid ${C.rule}`}}>{cleanSecT(sec.t)}</p>
          {sec.items.map((it: any)=>(
            <div key={it.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.rule}`}}>
              <div><span style={{fontSize:8.5}}>{it.n}</span>{it.note&&<span style={{fontSize:7,color:C.light,display:"block"}}>{it.note}</span>}</div>
              <span style={{fontFamily:SERIF,fontSize:8.5,whiteSpace:"nowrap",marginLeft:12}}>{it.p!=null?`€ ${it.p.toLocaleString("de-DE")}`:it.m||""}</span>
            </div>
          ))}
        </div>
      ))}
      {card.fine&&<p style={{fontSize:7.5,color:C.muted,lineHeight:1.7,marginTop:14}}>{card.fine}</p>}
    </div>
  );
}
// ─── RATE CARD BUILDER PREVIEW ────────────────────────────
function RateCardBuilderPreview({card,settings,onSave,onClose}: any) {
  const init=()=>JSON.parse(JSON.stringify(card));
  const [hs,setHs]=useState({hist:[init()],idx:0});
  const staged=hs.hist[hs.idx];
  const [pdfLang,setPdfLang]=useState("en");
  const [downloading,setDownloading]=useState(false);
  const [docHeight,setDocHeight]=useState(841);
  const [winW,setWinW]=useState(()=>window.innerWidth);
  const [rcSecGuards,setRcSecGuards]=useState<number[]>([]);
  const [savedClean,setSavedClean]=useState(false);
  const setStaged=(fn: any)=>{
    setSavedClean(false);
    setHs(prev=>{
      const curr=prev.hist[prev.idx];
      const newD=typeof fn==="function"?fn(curr):fn;
      const next=[...prev.hist.slice(0,prev.idx+1),JSON.parse(JSON.stringify(newD))];
      return{hist:next,idx:next.length-1};
    });
  };
  const canUndo=hs.idx>0,canRedo=hs.idx<hs.hist.length-1;
  const undo=()=>{const ni=Math.max(0,hs.idx-1);if(ni!==hs.idx)setHs(p=>({...p,idx:ni}));};
  const redo=()=>{const ni=Math.min(hs.hist.length-1,hs.idx+1);if(ni!==hs.idx)setHs(p=>({...p,idx:ni}));};
  const [flash,setFlash]=useState(false);
  const [confirmClose,setConfirmClose]=useState(false);
  const measureRef=useRef<HTMLDivElement>(null);
  const PAGE_H=841;
  const CHROME_H=220; // top padding (90px) + bottom padding (130px) inside RCContent div — only add a page if real body content overflows
  const numPages=docHeight>PAGE_H+CHROME_H?Math.ceil(docHeight/PAGE_H):1;
  const pageScale=winW<700?Math.min(1,(winW-32)/595):1;
  const sett={...SETTINGS_DEFAULT,...(settings||{})};
  const cleanSecT=(t: string)=>t.replace(/\s*[—–-]\s*\d+%[^"<]*/g,"").replace(/^Volume Discount\s*[&]\s*/i,"").trim();
  useEffect(()=>{const fn=()=>setWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  useEffect(()=>{
    setRcSecGuards([]);
    const el=measureRef.current;if(!el)return;
    const calc=()=>{
      const h=el.offsetHeight;if(h>100)setDocHeight(h);
      const secEls=Array.from(el.querySelectorAll("[data-rcsec]")) as HTMLElement[];
      if(secEls.length>0){
        const newGuards:number[]=Array(secEls.length).fill(0);
        const guardedPages=new Set<number>();
        secEls.forEach(secEl=>{
          const idx=parseInt(secEl.getAttribute("data-rcsec")||"0",10);
          const bottom=secEl.offsetTop+secEl.offsetHeight;
          const pageNum=Math.floor(secEl.offsetTop/PAGE_H);
          const bottomInPage=bottom-pageNum*PAGE_H;
          if(bottomInPage>(PAGE_H-80)&&!guardedPages.has(pageNum)){newGuards[idx]=Math.max(0,PAGE_H+52-secEl.offsetTop);guardedPages.add(pageNum);}
        });
        setRcSecGuards(prev=>{if(newGuards.length!==prev.length)return newGuards;const next=newGuards.map((v,i)=>Math.max(v,prev[i]));return next.some((v,i)=>v!==prev[i])?next:prev;});
      }
    };
    calc();const ro=new ResizeObserver(calc);ro.observe(el);return()=>ro.disconnect();
  },[staged,pdfLang]);
  const isMobileDevice=()=>/iPad|iPhone|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const download=async()=>{
    if(downloading)return;
    const mobile=isMobileDevice();
    const mw=mobile?window.open("","_blank"):null;
    const pages=Array.from(document.querySelectorAll("[data-pdf-page]")) as HTMLElement[];
    if(!pages.length){mw?.close();return;}
    const savedT=pages.map(p=>p.style.transform);
    pages.forEach(p=>{p.style.transform="none";});
    setDownloading(true);
    try{
      const [{default:html2canvas},{default:jsPDF}]=await Promise.all([import("html2canvas"),import("jspdf")]);
      const pdf=new (jsPDF as any)({orientation:"portrait",unit:"mm",format:"a4"});
      const pdfW=pdf.internal.pageSize.getWidth(),pdfH=pdf.internal.pageSize.getHeight();
      for(let i=0;i<pages.length;i++){
        if(i>0)pdf.addPage();
        const canvas=await (html2canvas as any)(pages[i],{scale:2,useCORS:true,backgroundColor:"#faf9f7"});
        pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,pdfW,pdfH);
      }
      const fname=`rate-card-${(staged.label||"custom").toLowerCase().replace(/\s+/g,"-")}`;
      if(mw){mw.location.href=pdf.output("bloburl") as string;}else{pdf.save(`${fname}.pdf`);}
    }finally{pages.forEach((p,i)=>{p.style.transform=savedT[i];});setDownloading(false);}
  };
  const doSave=()=>{onSave(staged);setSavedClean(true);setFlash(true);setTimeout(()=>setFlash(false),2500);};
  const confirmPopup=confirmClose?createPortal(
    <div style={{position:"fixed",inset:0,zIndex:10001,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(250,249,247,0.88)"}}>
      <div style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"24px 28px",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",textAlign:"center",minWidth:220}}>
        <p style={{fontFamily:SERIF,fontSize:15,fontWeight:"normal",color:C.black,margin:"0 0 6px"}}>Save before closing?</p>
        <p style={{fontSize:10,color:C.muted,margin:"0 0 18px"}}>Changes will be lost if you don't save.</p>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <B onClick={()=>{doSave();setConfirmClose(false);onClose();}}>Yes, save</B>
          <B v="sec" onClick={()=>{setConfirmClose(false);onClose();}}>No, discard</B>
        </div>
      </div>
    </div>,document.body):null;
  return(<>{confirmPopup}{createPortal(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:9999,display:"flex",flexDirection:"column",fontFamily:SANS}}>
      <div ref={measureRef} style={{position:"fixed",top:0,left:-9999,width:595,visibility:"hidden",pointerEvents:"none",zIndex:-1}}>
        <RCContent card={staged} lang={pdfLang} cleanSecT={cleanSecT} rcSecGuards={rcSecGuards}/>
      </div>
      {/* toolbar — identical layout to PDFModal */}
      <div style={{height:46,borderBottom:`1px solid ${C.rule}`,display:"flex",alignItems:"center",padding:"0 14px",gap:6,flexShrink:0}}>
        <button onClick={undo} disabled={!canUndo} title="Undo" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:`1px solid ${canUndo?C.rule:"transparent"}`,borderRadius:2,cursor:canUndo?"pointer":"default",color:canUndo?C.black:C.light,fontSize:15}}>←</button>
        <button onClick={redo} disabled={!canRedo} title="Redo" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:`1px solid ${canRedo?C.rule:"transparent"}`,borderRadius:2,cursor:canRedo?"pointer":"default",color:canRedo?C.black:C.light,fontSize:15}}>→</button>
        <div style={{width:1,height:20,background:C.rule,margin:"0 4px"}}/>
        <Pill on={pdfLang==="en"} onClick={()=>setPdfLang("en")}>EN</Pill>
        <Pill on={pdfLang==="de"} onClick={()=>setPdfLang("de")}>DE</Pill>
        <div style={{flex:1}}/>
        <B onClick={download} s={{opacity:downloading?0.5:1,cursor:downloading?"default":"pointer"}}>{downloading?"Saving…":"Save PDF"}</B>
        <button onClick={()=>{
          if(savedClean){onClose();return;}
          const isDirty=JSON.stringify(staged)!==JSON.stringify(card);
          isDirty?setConfirmClose(true):onClose();
        }} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22,marginLeft:4}}>✕</button>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* left edit panel — identical structure to PDFModal */}
        <div style={{width:320,flexShrink:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${C.rule}`}}>
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
            <Lbl>Card Label</Lbl>
            <I value={staged.label||""} onChange={(e: any)=>setStaged((p: any)=>({...p,label:e.target.value}))} s={{marginBottom:8}}/>
            <Lbl>Subtitle</Lbl>
            <I value={staged.sub||""} onChange={(e: any)=>setStaged((p: any)=>({...p,sub:e.target.value}))} s={{marginBottom:10}}/>
            {staged.sections?.map((sec: any,si: number)=>(
              <div key={si} style={{marginBottom:10,border:`1px solid ${C.rule}`,borderRadius:2,padding:"8px 10px",background:C.white}}>
                <I value={sec.t} onChange={(e: any)=>setStaged((p: any)=>({...p,sections:p.sections.map((s: any,i: number)=>i!==si?s:{...s,t:e.target.value})}))} s={{marginBottom:6,fontSize:9,fontWeight:"500"}}/>
                {sec.items.map((it: any)=>(
                  <div key={it.id} style={{display:"flex",gap:5,alignItems:"center",marginBottom:4}}>
                    <I value={it.n} onChange={(e: any)=>setStaged((p: any)=>({...p,sections:p.sections.map((s: any,i: number)=>i!==si?s:{...s,items:s.items.map((x: any)=>x.id!==it.id?x:{...x,n:e.target.value})})}))} s={{flex:2,fontSize:9}}/>
                    <I type="number" value={it.p??""} onChange={(e: any)=>setStaged((p: any)=>({...p,sections:p.sections.map((s: any,i: number)=>i!==si?s:{...s,items:s.items.map((x: any)=>x.id!==it.id?x:{...x,p:e.target.value===""?null:parseFloat(e.target.value)||0})})}))} s={{width:52,fontSize:9}} placeholder="€"/>
                    <button onClick={()=>setStaged((p: any)=>({...p,sections:p.sections.map((s: any,i: number)=>i!==si?s:{...s,items:s.items.filter((x: any)=>x.id!==it.id)})}))} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12,padding:0,flexShrink:0}}>✕</button>
                  </div>
                ))}
              </div>
            ))}
            <Lbl>Fine Print</Lbl>
            <textarea value={staged.fine||""} onChange={(e: any)=>setStaged((p: any)=>({...p,fine:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:10,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box",minHeight:64}}/>
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${C.rule}`,flexShrink:0}}>
            {flash&&<p style={{fontSize:9,color:C.green,margin:"0 0 7px",letterSpacing:"0.06em"}}>Saved ✓</p>}
            <B onClick={doSave} s={{width:"100%",textAlign:"center"}}>Save</B>
          </div>
        </div>
        {/* A4 preview */}
        <div style={{flex:1,background:"#888",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:winW<700?"16px 0":"32px 28px",gap:winW<700?16:28}}>
          {Array.from({length:numPages},(_,i)=>(
            <div key={i} style={{width:595*pageScale,height:PAGE_H*pageScale,overflow:"hidden",flexShrink:0,boxShadow:"0 4px 24px rgba(0,0,0,0.32)"}}>
              <div data-pdf-page="true" style={{width:595,height:PAGE_H,overflow:"hidden",background:C.bg,position:"relative",transform:pageScale<1?`scale(${pageScale})`:"none",transformOrigin:"top left"}}>
                <div style={{position:"absolute",top:-i*PAGE_H,left:0,width:595}}><RCContent card={staged} lang={pdfLang} cleanSecT={cleanSecT} rcSecGuards={rcSecGuards}/></div>
                <div style={{position:"absolute",bottom:59,left:0,right:0,height:28,background:C.bg,zIndex:2,pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:0,left:0,right:0,background:C.bg,zIndex:3,borderBottom:`1px solid ${C.rule}`}}>
                  <div style={{padding:"13px 62px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{sett.company||sett.name||"Lynn Hoa"}</span>
                    <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{staged.label||"Rate Card"}</span>
                  </div>
                </div>
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg,zIndex:3,borderTop:`1px solid ${C.rule}`}}>
                  <div style={{padding:"26px 62px 22px",fontSize:7,color:C.muted,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{[sett.email,sett.website].filter(Boolean).join(" · ")||"your@email.com · yourwebsite.com"}</span>
                    {numPages>1&&<span style={{letterSpacing:"0.04em",color:C.light}}>{i+1}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,document.body)}</>);
}

// ─── RATE CARD BUILDER MODAL ──────────────────────────────
function RateCardBuilderModal({rc,onSave,onClose}: any) {
  const CAT_KEYS=["influencer","ugc","editorial"];
  const CAT_LABEL: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC",editorial:"Editorial"};
  const DEFAULT_HEADINGS: Record<string,string[]>={
    influencer:["01 — Brand Collaboration","02 — Packages","03 — Usage Rights","04 — Add-ons"],
    ugc:["01 — UGC Creation","02 — Packages","03 — Usage Rights","04 — Add-ons"],
    editorial:["01 — Editorial","02 — Packages","03 — Usage Rights","04 — Add-ons"],
    other:["01 — Services","02 — Packages","03 — Usage Rights","04 — Add-ons"],
  };
  const [baseCat,setBaseCat]=useState<string|null>(null);
  const [customName,setCustomName]=useState("");
  const [sections,setSections]=useState<any[]>([]);
  const [fine,setFine]=useState("");
  const [showPreview,setShowPreview]=useState(false);

  // all items from service catalog for picking
  const allItems=CAT_KEYS.flatMap(k=>(rc[k]?.sections||[]).flatMap((sec: any)=>sec.items.map((it: any)=>({...it,_cat:k,_sec:sec.t}))));
  const catItems=(cat: string)=>cat==="other"?allItems:allItems.filter((it: any)=>it._cat===cat);

  const initBuilder=(cat: string)=>{
    setBaseCat(cat);
    const headings=DEFAULT_HEADINGS[cat]||DEFAULT_HEADINGS.other;
    setSections(headings.map((h,i)=>({id:uid(),t:h,items:[]})));
    setFine(rc[cat]?.fine||rc.influencer?.fine||"");
  };

  const addItemToSection=(si: number,it: any)=>{
    setSections(prev=>prev.map((s,i)=>i!==si?s:{...s,items:[...s.items,{id:uid(),n:it.n,note:it.note||"",p:it.p,m:it.m}]}));
  };
  const remItemFromSection=(si: number,id: string)=>setSections(prev=>prev.map((s,i)=>i!==si?s:{...s,items:s.items.filter((it: any)=>it.id!==id)}));
  const upSecT=(si: number,v: string)=>setSections(prev=>prev.map((s,i)=>i!==si?s:{...s,t:v}));
  const addSection=()=>setSections(prev=>[...prev,{id:uid(),t:`0${prev.length+1} — New Section`,items:[]}]);
  const remSection=(si: number)=>setSections(prev=>prev.filter((_,i)=>i!==si));

  const label=baseCat==="other"?(customName||"Custom"):CAT_LABEL[baseCat||""]||"";
  const builtCard={label,sub:rc[baseCat||""]?.sub||label,sections,fine,usage:rc[baseCat||""]?.usage||rc.influencer?.usage||[],excl:rc[baseCat||""]?.excl||rc.influencer?.excl||[]};
  const catKey=baseCat==="other"?(customName.toLowerCase().replace(/\s+/g,"_")||"custom"):(baseCat||"custom");

  if(showPreview)return<RateCardBuilderPreview card={builtCard} settings={null} onSave={(saved: any)=>{onSave(catKey,saved);}} onClose={()=>setShowPreview(false)}/>;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.bg,width:"100%",maxWidth:600,borderRadius:2,padding:20,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{fontFamily:SERIF,fontSize:18,fontWeight:"normal",margin:0}}>Add Rate Card</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.muted}}>✕</button>
        </div>

        {/* Step 1 — choose base */}
        {!baseCat&&<>
          <p style={{fontSize:10.5,color:C.muted,margin:"0 0 14px"}}>Choose a base category or start custom:</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {CAT_KEYS.map(k=>(
              <button key={k} onClick={()=>initBuilder(k)} style={{padding:"14px 12px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.white,cursor:"pointer",fontFamily:SANS,textAlign:"left"}}>
                <p style={{fontSize:12,color:C.black,margin:"0 0 3px",fontWeight:"500"}}>{CAT_LABEL[k]}</p>
                <p style={{fontSize:9.5,color:C.muted,margin:0}}>{rc[k]?.sections?.length||0} sections · {(rc[k]?.sections||[]).reduce((s: number,sec: any)=>s+sec.items.length,0)} items</p>
              </button>
            ))}
            <button onClick={()=>initBuilder("other")} style={{padding:"14px 12px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.white,cursor:"pointer",fontFamily:SANS,textAlign:"left"}}>
              <p style={{fontSize:12,color:C.black,margin:"0 0 3px",fontWeight:"500"}}>Custom / Other</p>
              <p style={{fontSize:9.5,color:C.muted,margin:0}}>Pick from all categories</p>
            </button>
          </div>
        </>}

        {/* Step 2 — builder */}
        {baseCat&&<>
          {baseCat==="other"&&<div style={{marginBottom:12}}>
            <Lbl>Card Name</Lbl>
            <I value={customName} onChange={(e: any)=>setCustomName(e.target.value)} placeholder="e.g. Hotels, Campaign Bundle…"/>
          </div>}

          {sections.map((sec,si)=>{
            const available=catItems(baseCat).filter((it: any)=>!sec.items.find((s: any)=>s.id===it.id));
            return(
              <div key={sec.id} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"11px 12px",marginBottom:10,background:C.white}}>
                {/* section heading */}
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}>
                  <I value={sec.t} onChange={(e: any)=>upSecT(si,e.target.value)} s={{flex:1,fontSize:9,fontWeight:"500"}}/>
                  <button onClick={()=>remSection(si)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:13,padding:0,flexShrink:0}}>✕</button>
                </div>
                {/* picked items */}
                {sec.items.map((it: any)=>(
                  <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.rule}`}}>
                    <div><span style={{fontSize:10.5}}>{it.n}</span>{it.note&&<span style={{fontSize:9,color:C.muted,display:"block"}}>{it.note}</span>}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:8}}>
                      <span style={{fontSize:10,fontFamily:SERIF,color:C.muted}}>{it.p!=null?`€ ${it.p}`:it.m||""}</span>
                      <button onClick={()=>remItemFromSection(si,it.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12,padding:0}}>✕</button>
                    </div>
                  </div>
                ))}
                {/* add item dropdown */}
                {available.length>0&&<select onChange={(e: any)=>{const it=available.find((x: any)=>x.id===e.target.value);if(it)addItemToSection(si,it);e.target.value="";}} style={{marginTop:7,width:"100%",padding:"6px 8px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:9.5,color:C.muted,borderRadius:2,outline:"none"}}>
                  <option value="">+ Add item from Service Catalog…</option>
                  {baseCat==="other"&&<>
                    {CAT_KEYS.map(ck=><optgroup key={ck} label={CAT_LABEL[ck]}>{available.filter((it: any)=>it._cat===ck).map((it: any)=><option key={it.id} value={it.id}>{it.n}{it.p!=null?` — € ${it.p}`:""}</option>)}</optgroup>)}
                  </>}
                  {baseCat!=="other"&&available.map((it: any)=><option key={it.id} value={it.id}>{it.n}{it.p!=null?` — € ${it.p}`:""}</option>)}
                </select>}
              </div>
            );
          })}

          <button onClick={addSection} style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:"0 0 12px",fontFamily:SANS,textDecoration:"underline",textDecorationColor:C.rule}}>+ Add section</button>

          <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:`1px solid ${C.rule}`}}>
            <B v="sec" onClick={()=>setBaseCat(null)}>← Back</B>
            <div style={{display:"flex",gap:8}}>
              <B v="sec" onClick={onClose}>Cancel</B>
              <B onClick={()=>setShowPreview(true)} s={{opacity:sections.some(s=>s.items.length>0)?1:0.4}}>Preview & Save</B>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── RATE CARD (nav tab · client-facing · preview + PDF) ──
function RateCard({rc,setRc,settings}: any) {
  const [tab,setTab]=useState("influencer");
  const [showBuilder,setShowBuilder]=useState(false);
  const [showPreview,setShowPreview]=useState(false);
  // all available tabs = base 3 + any custom saved
  const BASE=["influencer","ugc","editorial"];
  const CAT_LABEL: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC",editorial:"Editorial"};
  const tabs=BASE.filter(k=>rc[k]).concat(Object.keys(rc).filter(k=>!BASE.includes(k)&&k!=="hotels"&&rc[k]?.label));
  const card=rc[tab]||rc.influencer;
  const saveBuilt=(key: string,saved: any)=>{
    setRc((prev: any)=>({...prev,[key]:saved}));
    setTab(key);
    setShowBuilder(false);
  };
  return(
    <div>
      {showBuilder&&<RateCardBuilderModal rc={rc} onSave={saveBuilt} onClose={()=>setShowBuilder(false)}/>}
      {showPreview&&<RateCardBuilderPreview card={card} settings={settings} onSave={(saved: any)=>{setRc((prev: any)=>({...prev,[tab]:saved}));}} onClose={()=>setShowPreview(false)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
        <div><h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Rate Card</h2><p style={{fontSize:8,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>Fashion · Beauty · Lifestyle</p></div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <B v="sec" onClick={()=>setShowPreview(true)}>Preview</B>
          <B onClick={()=>setShowBuilder(true)}>+ Add Rate Card</B>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        {tabs.map(k=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:2}}>
            <Pill on={tab===k} onClick={()=>setTab(k)}>{rc[k]?.label||CAT_LABEL[k]||k}</Pill>
            {!BASE.includes(k)&&<button onClick={()=>{if(window.confirm(`Delete "${rc[k]?.label||k}"?`)){setRc((prev: any)=>{const n={...prev};delete n[k];return n;});setTab("influencer");}}} style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:11,padding:"0 2px",lineHeight:1}} title="Delete">✕</button>}
          </div>
        ))}
      </div>
      {card.sections?.map((sec: any,si: number)=>(
        <div key={si} style={{marginBottom:14}}>
          <div style={{padding:"4px 0",borderBottom:`1px solid ${C.rule}`}}>
            <span style={{fontSize:9.5,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase",border:`1px solid ${C.rule}`,padding:"3px 9px",borderRadius:2}}>{sec.t}</span>
          </div>
          {sec.items.map((it: any)=>(
            <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.rule}`}}>
              <div><p style={{fontSize:12,color:C.black,margin:"0 0 3px"}}>{it.n}</p>{it.note&&<p style={{fontSize:10.5,color:C.muted,margin:0}}>{it.note}</p>}</div>
              <span style={{fontSize:11,fontFamily:SERIF,color:C.black,whiteSpace:"nowrap",marginLeft:12}}>{it.m&&<span style={{fontSize:9,color:C.muted,marginRight:5}}>{it.m}</span>}{it.p!=null?`€ ${it.p.toLocaleString("de-DE")}`:""}</span>
            </div>
          ))}
        </div>
      ))}
      {card.fine&&<p style={{fontSize:10.5,color:C.muted,lineHeight:1.75,marginTop:10}}>{card.fine}</p>}
    </div>
  );
}

// ─── SERVICE CATALOG (profile menu · internal editor) ──────
function ServiceCatalog({rc,setRc}: any) {
  const [tab,setTab]=useState("influencer");
  const [edit,setEdit]=useState(false);
  const card=rc[tab]||rc.influencer;
  const upI=(si: number,id: string,f: string,v: string)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:sc.items.map((it: any)=>it.id!==id?it:{...it,[f]:f==="p"?(v===""?null:parseFloat(v)||0):v})})}}));
  const remI=(si: number,id: string)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:sc.items.filter((it: any)=>it.id!==id)})}}));
  const addI=(si: number)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:[...sc.items,{id:uid(),n:"New item",note:"",p:0}]})}}));
  const upFine=(v: string)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],fine:v}}));
  const upSecT=(si: number,v: string)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,t:v})}}));
  const addSec=()=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:[...(prev[tab]?.sections||[]),{id:uid(),t:"New Section",items:[]}]}}));
  const remSec=(si: number)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.filter((_: any,i: number)=>i!==si)}}));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
        <div><h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Service Catalog</h2><p style={{fontSize:8,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>Single source of truth · Fashion · Beauty · Lifestyle</p></div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {edit&&<B v="sec" s={{fontSize:8}} onClick={addSec}>+ Section</B>}
          <B v="sec" onClick={()=>setEdit(e=>!e)}>{edit?"Done":"Edit"}</B>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {["influencer","ugc","editorial"].map(k=><Pill key={k} on={tab===k} onClick={()=>setTab(k)}>{{influencer:"Brand Collaboration",ugc:"UGC",editorial:"Editorial"}[k as keyof object]}</Pill>)}
      </div>
      {card.sections.map((sec: any,si: number)=>(
        <div key={si} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.rule}`}}>
            {edit
              ?<div style={{display:"flex",gap:6,flex:1,alignItems:"center"}}>
                  <I value={sec.t} onChange={(e: any)=>upSecT(si,e.target.value)} s={{flex:1,fontSize:9}}/>
                  <button onClick={()=>remSec(si)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:13,padding:0}}>✕</button>
                </div>
              :<span style={{fontSize:9.5,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase",border:`1px solid ${C.rule}`,padding:"3px 9px",borderRadius:2}}>{sec.t}</span>}
            {edit&&<B v="sec" onClick={()=>addI(si)} s={{fontSize:8,marginLeft:6}}>+ Add</B>}
          </div>
          {sec.items.map((it: any)=>(
            <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.rule}`}}>
              {edit
                ?<div style={{flex:1,display:"flex",gap:6,alignItems:"center"}}>
                    <I value={it.n} onChange={(e: any)=>upI(si,it.id,"n",e.target.value)} s={{flex:1}}/>
                    <I value={it.note||""} onChange={(e: any)=>upI(si,it.id,"note",e.target.value)} s={{flex:1}}/>
                    <I type="number" value={it.p??""} onChange={(e: any)=>upI(si,it.id,"p",e.target.value)} s={{width:60}}/>
                    {it.m!==undefined&&<I value={it.m||""} onChange={(e: any)=>upI(si,it.id,"m",e.target.value)} s={{width:52}}/>}
                    <button onClick={()=>remI(si,it.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13}}>✕</button>
                  </div>
                :<><div><p style={{fontSize:12,color:C.black,margin:"0 0 3px"}}>{it.n}</p>{it.note&&<p style={{fontSize:10.5,color:C.muted,margin:0}}>{it.note}</p>}</div>
                  <span style={{fontSize:11,fontFamily:SERIF,color:C.black,whiteSpace:"nowrap",marginLeft:12}}>{it.m&&<span style={{fontSize:9,color:C.muted,marginRight:5}}>{it.m}</span>}{it.p!=null?`€ ${it.p.toLocaleString("de-DE")}`:""}</span></>}
            </div>
          ))}
        </div>
      ))}
      {edit
        ?<div style={{marginTop:10}}><Lbl>Fine Print</Lbl><textarea value={card.fine||""} onChange={(e: any)=>upFine(e.target.value)} style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:10,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box",minHeight:64}}/></div>
        :<p style={{fontSize:10.5,color:C.muted,lineHeight:1.75,marginTop:10}}>{card.fine}</p>}
    </div>
  );
}

// ─── CALCULATOR ───────────────────────────────────────────
function Calculator({onSave,prefill,clearPrefill,rc,settings,isMobile,onAfterSave}: any) {
  const isRev=prefill?.isRev||false;
  const isAmend=prefill?.isAmend||false;
  const revN=prefill?.revN||1;
  const amendN=prefill?.amendN||1;

  const [brand,setBrand]=useState(prefill?.brand||"");
  const [contact,setContact]=useState(prefill?.contact||"");
  const [projName,setProjName]=useState("");
  const [qDate,setQDate]=useState(today());
  const [vDays,setVDays]=useState(14);

  const [bCat,setBCat]=useState("influencer");
  const [bDel,setBDel]=useState(-1); // -1 = sentinel "— Select deliverable —"
  const [bQty,setBQty]=useState(1);
  const [bUsage,setBUsage]=useState(0); // 0 = sentinel
  const [bExcl,setBExcl]=useState(0);  // 0 = sentinel
  const [bNeg,setBNeg]=useState("");
  const [bVol,setBVol]=useState(false);
  const [bAddons,setBAddons]=useState<string[]>([]);
  const [bAoSel,setBaAoSel]=useState("");
  const [bCLabel,setBCLabel]=useState("");
  const [bCAmt,setBCAmt]=useState("");
  const [bPlatforms,setBPlatforms]=useState<string[]>([]);

  const [items,setItems]=useState<any[]>(()=>{
    if(prefill?.isRev&&prefill?.origLines?.length){
      return prefill.origLines.map((ln: any)=>({id:uid(),cat:prefill.ctab||"influencer",name:ln.name||"",note:ln.note||"",qty:ln.qty||1,up:ln.up||0,amt:ln.amt||0,usageLabel:undefined,exclLabel:undefined,addons:[]}));
    }
    return[];
  });
  const [retOn,setRetOn]=useState(false);
  const [retMo,setRetMo]=useState(6);
  const [pdf,setPdf]=useState<any>(null);

  const card=rc[bCat]||rc.influencer;
  const deliverables=card.sections.filter((s: any)=>isSingle(s.t)).flatMap((s: any)=>s.items);
  const addonList=AO[bCat]||[];

  const computePrice=()=>{
    const item=bDel>=0?deliverables[bDel]:null;
    const base=bNeg!==""?parseFloat(bNeg)||0:(item?.p||0);
    const lb=base*(bQty||1);
    let vp=0;if(bVol){if(bCat==="editorial")vp=10;else if(bQty>=10)vp=20;else if(bQty>=3)vp=15;}
    const av=lb*(1-vp/100);
    const usagePct=card.usage[bUsage]?.sentinel?0:(card.usage[bUsage]?.pct||0);
    const exclPct=card.excl[bExcl]?.sentinel?0:(card.excl[bExcl]?.pct||0);
    const am=av*(1+(usagePct+exclPct)/100);
    let at=0;bAddons.forEach(aid=>{const a=addonList.find((x: any)=>x.id===aid);if(!a)return;if(a.flat)at+=a.flat;else if(a.pct)at+=am*a.pct/100;});
    return Math.round(am+at+(parseFloat(bCAmt)||0));
  };

  const canAdd=bDel>=0; // must have a deliverable selected

  const addItem=()=>{
    if(!canAdd)return;
    const item=deliverables[bDel];
    const price=computePrice();
    const usageSel=card.usage[bUsage];
    const exclSel=card.excl[bExcl];
    setItems(prev=>[...prev,{
      id:uid(),cat:bCat,
      name:item?.n||"",note:item?.note||"",
      qty:bQty,up:item?.p||parseFloat(bNeg)||0,amt:price,
      usageLabel:usageSel?.sentinel?undefined:usageSel?.l,
      exclLabel:exclSel?.sentinel?undefined:exclSel?.l,
      addons:bAddons.map(aid=>addonList.find((x: any)=>x.id===aid)?.n).filter(Boolean),
      platforms:bPlatforms,
    }]);
    setBDel(-1);setBQty(1);setBUsage(0);setBExcl(0);setBNeg("");setBAddons([]);setBVol(false);setBCLabel("");setBCAmt("");setBPlatforms([]);
  };

  const subtotal=items.reduce((s,it)=>s+it.amt,0);
  const grand=Math.round(subtotal*(1-(retOn?20:0)/100));
  const vu=new Date(qDate);vu.setDate(vu.getDate()+(parseInt(String(vDays))||14));
  const validUntil=vu.toISOString().split("T")[0];
  const qNo=isAmend?`AMD-${(prefill?.qNo||"").replace(/QUO-?/i,"").trim()||new Date().getFullYear()}-${String(amendN).padStart(2,"0")}`:isRev?(prefill?.qNo||`QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`):(`QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`);

  const openPreview=()=>{
    const cats=[...new Set(items.map(it=>it.cat))];
    const ctype=cats.length>1?"Content Creator":cats[0]==="ugc"?"UGC Creator":cats[0]==="editorial"?"Editorial Content Creator":"Content Creator (Influencer)";
    const ctab=cats.length===1?cats[0]:(cats.length>1?"complete":"influencer");
    // derive usage months from selected usage option on items
    const usageItem=items.find(it=>it.usageLabel);
    let mo=3; // default organic 3 months
    if(usageItem?.usageLabel){
      const cardKey=usageItem.cat||ctab;
      const cardRef=(rc&&rc[cardKey])||Object.values(rc||{})[0]||{usage:[]};
      const found=(cardRef.usage||[]).find((u: any)=>u.l===usageItem.usageLabel);
      if(found&&found.mo)mo=found.mo;
      else{const m=usageItem.usageLabel.match(/(\d+)\s*month/i);if(m)mo=parseInt(m[1]);}
    }
    // Merge same name+cat — sum qty and amt, keep all other fields from first occurrence
    const mergedMap=new Map<string,any>();
    items.forEach(it=>{
      const key=`${it.cat}__${it.name}`;
      if(mergedMap.has(key)){
        const ex=mergedMap.get(key);
        ex.qty=(ex.qty||1)+(it.qty||1);
        ex.amt=(ex.amt||0)+(it.amt||0);
      } else {
        mergedMap.set(key,{id:it.id,name:it.name,note:it.note,qty:it.qty,up:it.up,amt:it.amt,cat:it.cat,platforms:it.platforms||[],usageLabel:it.usageLabel,exclLabel:it.exclLabel,addons:it.addons||[]});
      }
    });
    const mergedLines=Array.from(mergedMap.values());
    setPdf({brand,contact,date:qDate,validUntil,qNo,rev:isRev?revN:0,mo,ctab,
      lines:mergedLines,
      total:grand,ctype,footer:"Looking forward to working together."});
  };

  const reset=()=>{setItems([]);setBrand("");setContact("");setProjName("");setRetOn(false);if(clearPrefill)clearPrefill();};
  const catLabel: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC Creator",editorial:"Editorial"};

  return(
    <div>
      {pdf&&<PDFModal data={pdf} type={isRev?"revised":isAmend?"amendment":"quote"} onClose={()=>{setPdf(null);}} settings={settings} isNew={true}
        onSave={(doc: any)=>{onSave({...doc,id:uid(),status:isAmend?"production":"quoted"},doc.brand,doc.contact,isRev,revN,projName,isAmend,amendN,prefill?.origLines||[]);if(onAfterSave)onAfterSave(doc.brand||brand,isAmend?null:doc.qNo);}}/>}
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>Calculator</h2>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",margin:0}}>{isAmend?`Amendment ${amendN} — ${prefill?.qNo||""}`:isRev?`Revising ${prefill?.qNo} — R${revN}`:"Build a Quote"}</p>
      </div>

      {isAmend&&prefill?.origLines?.length>0&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:16,background:C.white}}>
        <p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 9px"}}>Original Quote — read only</p>
        {prefill.origLines.map((ln: any,i: number)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderBottom:`1px solid ${C.rule}`}}>
            <span style={{fontSize:10,color:C.black,display:"flex",alignItems:"center",gap:6}}>{ln.qty>1?`${ln.qty}× `:""}{ln.name}{ln.cat&&<span style={{fontSize:8,color:C.white,background:ln.cat==="ugc"?C.amber:ln.cat==="editorial"?"#8fa89a":C.muted,padding:"1px 6px",borderRadius:2,letterSpacing:"0.05em"}}>{({influencer:"Influencer",ugc:"UGC",editorial:"Editorial"})[ln.cat]||ln.cat}</span>}</span>
            <span style={{fontSize:10,fontFamily:SERIF,color:C.muted,flexShrink:0,marginLeft:8}}>{fmt(ln.amt)}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",paddingTop:7,marginTop:2}}>
          <span style={{fontSize:9,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase"}}>Original Total</span>
          <span style={{fontSize:12,fontFamily:SERIF,color:C.black}}>{fmt(prefill.origLines.reduce((s: number,l: any)=>s+(l.amt||0),0))}</span>
        </div>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <div><Lbl>Brand / Company</Lbl><I value={brand} onChange={(e: any)=>setBrand(e.target.value)} placeholder="Sephora"/></div>
        <div><Lbl>Contact Name</Lbl><I value={contact} onChange={(e: any)=>setContact(e.target.value)} placeholder="Anna Müller"/></div>
      </div>
      <div style={{marginBottom:9}}>
        <Lbl>Project Name <span style={{fontWeight:"normal",color:C.light}}>(optional)</span></Lbl>
        <I value={projName} onChange={(e: any)=>setProjName(e.target.value)} placeholder="e.g. Spring Campaign 2026"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:20}}>
        <div style={{minWidth:0,overflow:"hidden"}}><Lbl>Quote Date</Lbl><I type="date" value={qDate} onChange={(e: any)=>setQDate(e.target.value)} s={{minWidth:0,WebkitAppearance:"none",appearance:"none"}}/></div>
        <div style={{minWidth:0}}><Lbl>Valid for (days)</Lbl><I type="number" value={vDays} onChange={(e: any)=>setVDays(e.target.value)}/></div>
      </div>

      <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"16px 18px",marginBottom:16,background:C.white}}>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 13px"}}>Add Item</p>
        <div style={{display:"flex",gap:6,marginBottom:13,flexWrap:"wrap"}}>
          {(["influencer","ugc","editorial"] as const).map(k=><Pill key={k} on={bCat===k} onClick={()=>{setBCat(k);setBDel(-1);setBAddons([]);}}>{catLabel[k]}</Pill>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:9}}>
          <div><Lbl>Deliverable</Lbl><S value={bDel} onChange={(e: any)=>setBDel(parseInt(e.target.value))}>
            <option value={-1}>— Select deliverable —</option>
            {deliverables.map((it: any,i: number)=><option key={i} value={i}>{it.n}{it.p?` — € ${it.p}`:""}</option>)}
          </S></div>
          <div><Lbl>Qty</Lbl><I type="number" min={1} value={bQty} onChange={(e: any)=>setBQty(parseInt(e.target.value)||1)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:9}}>
          <div>
            <Lbl>Usage Rights</Lbl>
            <S value={bUsage} onChange={(e: any)=>setBUsage(parseInt(e.target.value))}>
              {card.usage.map((u: any,i: number)=><option key={i} value={i}>{u.l}</option>)}
            </S>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:5}}>
              {(["Instagram","TikTok","YouTube","Other"] as const).map(p=>{const on=bPlatforms.includes(p);return<button key={p} type="button" onClick={()=>setBPlatforms(pr=>on?pr.filter(x=>x!==p):[...pr,p])} style={{padding:"3px 8px",border:`1px solid ${on?C.black:C.rule}`,background:on?C.black:C.bg,color:on?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:8.5,letterSpacing:"0.05em",borderRadius:2}}>{p}</button>;})}
            </div>
          </div>
          <div><Lbl>Exclusivity</Lbl><S value={bExcl} onChange={(e: any)=>setBExcl(parseInt(e.target.value))}>
            {card.excl.map((e: any,i: number)=><option key={i} value={i}>{e.l}</option>)}
          </S></div>
        </div>
        <div style={{marginBottom:9}}>
          <Lbl>Add-ons</Lbl>
          <S value={bAoSel} onChange={(e: any)=>{const v=e.target.value;if(v&&!bAddons.includes(v))setBAddons(p=>[...p,v]);setBaAoSel("");}} s={{marginBottom:5}}>
            <option value="">— Select add-on —</option>
            {addonList.filter((a: any)=>!bAddons.includes(a.id)).map((a: any)=><option key={a.id} value={a.id}>{a.n}{a.flat?` +€${a.flat}`:a.pct?` +${a.pct}%`:""}</option>)}
          </S>
          {bAddons.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {bAddons.map(aid=>{const a=addonList.find((x: any)=>x.id===aid);if(!a)return null;return<Tag key={aid} onRemove={()=>setBAddons(p=>p.filter(x=>x!==aid))}>{a.n}</Tag>;})}
          </div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"flex-end",marginBottom:12}}>
          <div><Lbl>Negotiated Rate <span style={{fontWeight:"normal",color:C.light}}>(overrides card)</span></Lbl><I type="number" placeholder="€" value={bNeg} onChange={(e: any)=>setBNeg(e.target.value)}/></div>
          <label style={{display:"flex",alignItems:"center",gap:5,fontSize:9,cursor:"pointer",paddingBottom:8,whiteSpace:"nowrap"}}><input type="checkbox" checked={bVol} onChange={(e: any)=>setBVol(e.target.checked)}/>Vol. disc.</label>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:`1px solid ${C.rule}`}}>
          <span style={{fontSize:10.5,color:C.muted}}>Line total: <strong style={{color:canAdd?C.black:C.light,fontFamily:SERIF,fontSize:17}}>{canAdd?fmt(computePrice()):"—"}</strong></span>
          <B onClick={addItem} s={{paddingLeft:20,paddingRight:20,opacity:canAdd?1:0.4,cursor:canAdd?"pointer":"default"}}>+ Add to Quote</B>
        </div>
      </div>

      {items.length>0?(
        <>
          <div style={{marginBottom:12}}>
            {items.map((it: any)=>(
              <div key={it.id} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.rule}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <span style={{fontSize:9,color:C.white,background:C.muted,padding:"2px 8px",borderRadius:2,textTransform:"uppercase",letterSpacing:"0.07em",flexShrink:0}}>{catLabel[it.cat]}</span>
                    <span style={{fontSize:12,color:C.black}}>{it.qty>1?`${it.qty}× `:""}{it.name}</span>
                  </div>
                  {it.note&&<p style={{fontSize:10.5,color:C.muted,margin:"0 0 1px",paddingLeft:52}}>{it.note}</p>}
                  {it.addons?.length>0&&<p style={{fontSize:10.5,color:C.muted,margin:"0 0 1px",paddingLeft:52}}>{it.addons.join(" · ")}</p>}
                  {(it.usageLabel||it.exclLabel)&&<p style={{fontSize:10.5,color:C.muted,margin:"0 0 1px",paddingLeft:52}}>{[it.usageLabel,it.exclLabel].filter(Boolean).join(" · ")}</p>}
                  {it.platforms?.length>0&&<p style={{fontSize:10.5,color:C.muted,margin:0,paddingLeft:52}}>{it.platforms.join(" · ")}</p>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:14}}>
                  <span style={{fontSize:12,fontFamily:SERIF,color:C.black}}>{fmt(it.amt)}</span>
                  <button onClick={()=>setItems(p=>p.filter((x: any)=>x.id!==it.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:14,padding:0,lineHeight:1}}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11,padding:"9px 12px",border:`1px solid ${C.rule}`,borderRadius:2}}>
            <input type="checkbox" id="ret" checked={retOn} onChange={(e: any)=>setRetOn(e.target.checked)}/>
            <label htmlFor="ret" style={{fontSize:10,cursor:"pointer"}}>Retainer{retOn?" (−20%)":""}</label>
            {retOn&&<><I type="number" min={1} value={retMo} onChange={(e: any)=>setRetMo(parseInt(e.target.value)||6)} s={{width:50}}/><span style={{fontSize:9,color:C.muted}}>months</span></>}
          </div>

          <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 16px",marginBottom:14}}>
            {retOn&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}><span style={{fontSize:9,color:C.muted}}>Subtotal</span><span style={{fontSize:10,color:C.muted}}>{fmt(subtotal)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>Total (EUR)</span>
              <span style={{fontFamily:SERIF,fontSize:22,color:C.black}}>{fmt(grand)}</span>
            </div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <B v="sec" onClick={()=>{if(window.confirm("Reset all items and start over?"))reset();}}>Reset</B>
            <B s={{flex:"1 1 auto",textAlign:"center"}} onClick={openPreview}>{isRev?"Preview Revised Quote":"Preview & Generate Quote"}</B>
          </div>
        </>
      ):(
        <div style={{textAlign:"center",padding:"36px 0",borderTop:`1px solid ${C.rule}`}}>
          <p style={{fontFamily:SERIF,fontSize:17,color:C.muted,margin:"0 0 4px",fontWeight:"normal"}}>No items yet</p>
          <p style={{fontSize:9,color:C.light,margin:0}}>Configure an item above and click "+ Add to Quote"</p>
        </div>
      )}
    </div>
  );
}

// ─── CLIENT DETAIL PANEL ─────────────────────────────────
function ClientDetail({cl,fin,editMode,ed,setEd,upCl,setEditMode,delCl,tagI,setTagI,uEnd,showAddP,setShowAddP,newPN,setNewPN,addP,onGoToCalc,upP,setClients,openPDF,openReviseContract,setPdf,onRevise,onAmend,setAmendT,setRenewT,setStatus,nxt,prv,editPrName,setEditPrName,editPrNameVal,setEditPrNameVal,delConfirm,setDelConfirm,setSel,highlightedProjectQNo,onClearHighlight,isMobile}: any) {
  const f=fin(cl);
  const edt=editMode?ed:cl;
  // Mobile-scaled sizes
  const FS={sectionLabel:isMobile?11:10,bodyText:isMobile?13:11,metaText:isMobile?12:10.5,valueText:isMobile?13:10.5,projectName:isMobile?15:12,projectDate:isMobile?12:10.5,amountText:isMobile?16:14,statusBadge:isMobile?11:9.5,actionBtn:isMobile?10:8,docBtn:isMobile?10:8,pad:isMobile?"16px 16px":"12px 14px",gap:isMobile?12:10};
  return(
    <div style={{flex:isMobile?undefined:"0 0 56%",minWidth:0,overflowY:isMobile?undefined:"auto",maxHeight:isMobile?undefined:"calc(100vh - 80px)",paddingLeft:isMobile?0:4}}>

      {/* ── HEADER ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?18:14,gap:8,flexWrap:"wrap"}}>
        <div style={{minWidth:0}}>
          {editMode
            ?<I value={edt.name} onChange={(e: any)=>setEd((p: any)=>({...p,name:e.target.value}))} s={{fontSize:isMobile?20:18,fontFamily:SERIF,marginBottom:4}}/>
            :<h2 style={{fontFamily:SERIF,fontSize:isMobile?26:22,fontWeight:"normal",margin:"0 0 6px"}}>{cl.name}</h2>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{cl.tags?.map((t: string)=><Tag key={t}>{t}</Tag>)}</div>
        </div>
        <div style={{display:"flex",gap:isMobile?8:6,flexShrink:0,alignItems:"flex-start"}}>
          {editMode
            ?<><B onClick={()=>{upCl(cl.id,ed);setEditMode(false);}} s={isMobile?{fontSize:11,padding:"9px 16px"}:{}}>Save</B><B v="sec" onClick={()=>setEditMode(false)} s={isMobile?{fontSize:11,padding:"9px 16px"}:{}}>Cancel</B></>
            :<><B v="sec" onClick={()=>{setEd({...cl});setEditMode(true);}} s={isMobile?{fontSize:11,padding:"9px 16px"}:{}}>Edit</B>
              <button onClick={()=>delCl(cl.id)} style={{fontSize:9.5,color:C.red,border:`1px solid ${C.redBorder}`,padding:"5px 10px",borderRadius:2,cursor:"pointer",background:"none",fontFamily:SANS,letterSpacing:"0.08em",textTransform:"uppercase"}}>Delete</button></>}
          <button onClick={()=>{setSel(null);setEditMode(false);}} title="Close" style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:isMobile?22:18,lineHeight:1,padding:"2px 0 0 4px",marginLeft:2}}>✕</button>
        </div>
      </div>

      {/* ── INFO GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:FS.gap,marginBottom:FS.gap}}>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:FS.pad}}>
          <p style={{fontSize:FS.sectionLabel,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:`0 0 ${isMobile?12:10}px`}}>Brand Info</p>
          {editMode?<>
            <Lbl>Contact</Lbl><I value={edt.contact||""} onChange={(e: any)=>setEd((p: any)=>({...p,contact:e.target.value}))} s={isMobile?{fontSize:14,padding:"10px 12px"}:{}}/>
            <Lbl>Email</Lbl><I value={edt.email||""} onChange={(e: any)=>setEd((p: any)=>({...p,email:e.target.value}))} type="email" s={isMobile?{fontSize:14,padding:"10px 12px"}:{}}/>
            <Lbl>Agency / Direct</Lbl><S value={edt.agency||"Direct"} onChange={(e: any)=>setEd((p: any)=>({...p,agency:e.target.value}))} s={isMobile?{fontSize:14,padding:"10px 12px"}:{}}><option>Direct</option><option>Agency</option></S>
            <Lbl>Country</Lbl><I value={edt.country||""} onChange={(e: any)=>setEd((p: any)=>({...p,country:e.target.value}))} s={isMobile?{fontSize:14,padding:"10px 12px"}:{}}/>
            <Lbl>Tags</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>{(edt.tags||[]).map((t: string)=><Tag key={t} onRemove={()=>setEd((p: any)=>({...p,tags:p.tags.filter((x: string)=>x!==t)}))}>{t}</Tag>)}</div>
            <div style={{display:"flex",gap:5}}><I value={tagI} onChange={(e: any)=>setTagI(e.target.value)} placeholder="Add tag" s={isMobile?{fontSize:14,padding:"10px 12px"}:{}} onKeyDown={(e: any)=>{if(e.key==="Enter"&&tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} /><B v="sec" onClick={()=>{if(tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} s={{fontSize:isMobile?11:9}}>+</B></div>
          </>:<>
            {[["Contact",cl.contact],["Email",cl.email],["Type",cl.agency],["Country",cl.country]].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:`${isMobile?9:6}px 0`,borderBottom:`1px solid ${C.rule}`}}>
                <span style={{fontSize:FS.metaText,color:C.muted}}>{lbl}</span>
                <span style={{fontSize:FS.valueText,color:C.black,fontWeight:"500",maxWidth:"60%",textAlign:"right"}}>{val||"—"}</span>
              </div>
            ))}
          </>}
        </div>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:FS.pad}}>
          <p style={{fontSize:FS.sectionLabel,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:`0 0 ${isMobile?12:10}px`}}>Financial Snapshot</p>
          {[["Total Revenue",fmt(f.total)],["Paid Projects",`${f.count}`],["Last Invoice",f.lastDate?`${fmt(f.last)} · ${fmtD(f.lastDate)}`:"—"],["Avg. Deal",f.avg?fmt(f.avg):"—"],["Outstanding",fmt(f.out)]].map(([lbl,val])=>(
            <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:`${isMobile?9:6}px 0`,borderBottom:`1px solid ${C.rule}`}}>
              <span style={{fontSize:FS.metaText,color:C.muted}}>{lbl}</span>
              <span style={{fontSize:FS.valueText,color:C.black,fontWeight:"500",textAlign:"right"}}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── NOTES ── */}
      <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:FS.pad,marginBottom:FS.gap}}>
        <p style={{fontSize:FS.sectionLabel,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:`0 0 ${isMobile?10:9}px`}}>Relationship Notes</p>
        {editMode
          ?<textarea value={edt.notes||""} onChange={(e: any)=>setEd((p: any)=>({...p,notes:e.target.value}))} style={{width:"100%",minHeight:isMobile?80:50,padding:isMobile?"10px 12px":"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:isMobile?14:11,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
          :<p style={{fontSize:FS.bodyText,color:cl.notes?C.black:C.light,margin:0,lineHeight:1.65}}>{cl.notes||"No notes yet…"}</p>}
      </div>

      {/* ── USAGE RIGHTS TRACKER ── */}
      {cl.projects.some((pr: any)=>uEnd(pr))&&(
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:FS.pad,marginBottom:FS.gap}}>
          <p style={{fontSize:FS.sectionLabel,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:`0 0 ${isMobile?12:10}px`}}>Usage Rights Tracker</p>
          {cl.projects.filter((pr: any)=>uEnd(pr)).map((pr: any)=>(
            <div key={pr.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:`${isMobile?10:5}px 0`,borderBottom:`1px solid ${C.rule}`,gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:FS.bodyText}}>{pr.name}</span>
              <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                <UBadge end={uEnd(pr)}/>
                {(pr.renewals||[]).length>0&&<span style={{fontSize:9.5,color:C.green,border:`1px solid ${C.greenBorder}`,padding:"2px 7px",borderRadius:2}}>{pr.renewals.length} renewal{pr.renewals.length>1?"s":""}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COLLABORATION HISTORY ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:`0 0 ${isMobile?12:9}px`}}>
        <p style={{fontSize:FS.sectionLabel,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:0}}>Projects</p>
        <B v="sec" s={{fontSize:FS.actionBtn,padding:isMobile?"8px 14px":"5px 10px"}} onClick={()=>{setShowAddP((s: boolean)=>!s);setNewPN("");}}>+ Add Project</B>
      </div>
      {showAddP&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:FS.pad,marginBottom:FS.gap}}>
        <p style={{fontSize:FS.sectionLabel,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:`0 0 ${isMobile?12:9}px`}}>Add Project</p>
        <B s={{width:"100%",textAlign:"center",marginBottom:isMobile?10:8,fontSize:isMobile?11:9.5,padding:isMobile?"11px":"7px 14px"}} onClick={()=>{onGoToCalc(cl.name);setShowAddP(false);}}>Build Quote in Calculator</B>
        <p style={{fontSize:isMobile?12:10,color:C.muted,textAlign:"center",margin:`0 0 ${isMobile?10:8}px`}}>— or add manually —</p>
        <div style={{display:"flex",gap:7}}>
          <I placeholder="Project name" value={newPN} onChange={(e: any)=>setNewPN(e.target.value)} s={isMobile?{fontSize:14,padding:"10px 12px"}:{}} onKeyDown={(e: any)=>e.key==="Enter"&&addP(cl.id)}/>
          <B v="sec" s={isMobile?{fontSize:11,padding:"10px 14px"}:{}} onClick={()=>addP(cl.id)}>Add</B>
          <B v="sec" s={isMobile?{fontSize:11,padding:"10px 14px"}:{}} onClick={()=>{setShowAddP(false);setNewPN("");}}>✕</B>
        </div>
      </div>}

      {/* ── PROJECT CARDS ── */}
      {cl.projects.map((pr: any,i: number)=>{
        const end=uEnd(pr);const ns=nxt(pr.status);const ps=prv(pr.status);
        const isHighlighted=highlightedProjectQNo&&pr.qd?.qNo===highlightedProjectQNo;
        return(
          <div key={pr.id} onClick={()=>{if(isHighlighted&&onClearHighlight)onClearHighlight();}} style={{border:`1px solid ${isHighlighted?C.light:C.rule}`,borderRadius:2,padding:FS.pad,marginBottom:FS.gap,background:isHighlighted?"rgba(26,26,26,0.03)":undefined}}>

            {/* project header row */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?12:8}}>
              <div style={{flex:1,minWidth:0}}>
                {editPrName===pr.id
                  ?<input autoFocus value={editPrNameVal} onChange={e=>setEditPrNameVal(e.target.value)} onBlur={()=>{upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}} onKeyDown={e=>{if(e.key==="Enter"){upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}if(e.key==="Escape")setEditPrName(null);}} style={{fontSize:isMobile?15:12,fontFamily:SANS,border:`1px solid ${C.rule}`,borderRadius:2,padding:"4px 8px",background:C.bg,color:C.black,outline:"none",width:"100%",marginBottom:4}}/>
                  :<p onClick={()=>{setEditPrName(pr.id);setEditPrNameVal(pr.name);setDelConfirm(null);}} style={{fontSize:FS.projectName,color:C.black,margin:`0 0 ${isMobile?4:3}px`,fontWeight:i===0?"500":"normal",cursor:"text"}} title="Click to rename">{pr.name} <span style={{fontSize:isMobile?11:9,color:C.light}}>✎</span></p>}
                <p style={{fontSize:FS.projectDate,color:C.muted,margin:`0 0 ${isMobile?8:6}px`}}>{fmtD(pr.date)}</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:FS.statusBadge,color:scol(pr.paid?"paid":pr.status),border:`1px solid ${scol(pr.paid?"paid":pr.status)}`,padding:isMobile?"4px 10px":"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{pr.paid?"Paid":pr.status}</span>

                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:isMobile?14:8}}>
                <p style={{fontFamily:SERIF,fontSize:FS.amountText,color:C.black,margin:`0 0 ${isMobile?4:3}px`}}>{fmt(pr.amount)}</p>
                {(pr.amendments||[]).length>0&&<p style={{fontSize:10,color:C.muted,margin:"0 0 2px"}}>incl. {pr.amendments.length} amend.</p>}
                {(pr.renewals||[]).length>0&&<p style={{fontSize:10,color:C.green,margin:0}}>{pr.renewals.length} renewal{pr.renewals.length>1?"s":""}</p>}
                <div style={{marginTop:4}}>
                  {delConfirm===pr.id
                    ?<span style={{fontSize:isMobile?11:8,color:C.red}}>Delete? <button onClick={()=>{setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.filter((proj: any)=>proj.id!==pr.id)}));setDelConfirm(null);}} style={{color:C.red,background:"none",border:"none",cursor:"pointer",fontSize:isMobile?11:8,padding:"0 3px"}}>Yes</button> <button onClick={()=>setDelConfirm(null)} style={{color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:isMobile?11:8,padding:"0 3px"}}>No</button></span>
                    :<button onClick={()=>{setDelConfirm(pr.id);setEditPrName(null);}} style={{fontSize:isMobile?11:9.5,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:SANS}}>delete</button>}
                </div>
              </div>
            </div>

            {/* delivery date — desktop only shows full row; mobile shows compact */}
            {["production","invoiced","paid"].includes(pr.status)&&<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:isMobile?12:8}}>
              <span style={{fontSize:isMobile?12:10,color:C.muted,whiteSpace:"nowrap",letterSpacing:"0.07em",textTransform:"uppercase"}}>Delivery</span>
              <I type="date" value={pr.deliveryDate||""} onChange={(e: any)=>upP(cl.id,pr.id,{deliveryDate:e.target.value})} s={{width:isMobile?160:138,fontSize:isMobile?13:10,padding:isMobile?"9px 10px":"5px 8px"}}/>
            </div>}

            {/* ── LICENSE TRACKER ── */}
            <ProjectLicenseTracker pr={pr}/>

            {pr.notes&&<p style={{fontSize:isMobile?12:9,color:C.muted,margin:`0 0 ${isMobile?10:7}px`,lineHeight:1.6}}>{pr.notes}</p>}

            {/* ── DOCUMENTS ── */}
            <div style={{display:"flex",gap:isMobile?8:5,flexWrap:"wrap",marginBottom:isMobile?10:7}}>
              {!pr.qd&&<B s={{fontSize:FS.docBtn,padding:isMobile?"9px 14px":"5px 10px"}} onClick={()=>onGoToCalc(cl.name)}>+ Create Quote</B>}
              {pr.qd&&<B v="sec" s={{fontSize:FS.docBtn,padding:isMobile?"9px 14px":"5px 10px"}} onClick={()=>openPDF(pr,"quote","en",cl.id)}>{pr.qd.rev>0?`Quote R${pr.qd.rev}`:"Quote"}</B>}
              {["contracted","production","invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:FS.docBtn,padding:isMobile?"9px 14px":"5px 10px"}} onClick={()=>openPDF(pr,"contract","en",cl.id)}>{pr.qd.contractRev>0?`Contract R${pr.qd.contractRev}`:"Contract"}</B>}
              {!isMobile&&(pr.amendments||[]).map((a: any,ai: number)=>(
                <B key={ai} v="sec" s={{fontSize:8,color:a.signed?C.black:C.amber,borderColor:a.signed?C.rule:C.amberBorder}} onClick={()=>setPdf({data:{brand:pr.qd?.brand,contact:pr.qd?.contact,date:today(),ctype:pr.qd?.ctype||"Content Creator",qNo:pr.qd?.qNo,aNo:a.aNo,lines:a.lines||[],amendTotal:a.amendTotal,origTotal:pr.amount-a.amendTotal},type:"amendment",lang:"en"})}>Amend {ai+1}{!a.signed?" · unsigned":""}</B>
              ))}
              {["invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:FS.docBtn,padding:isMobile?"9px 14px":"5px 10px"}} onClick={()=>openPDF(pr,"invoice","en",cl.id)}>Invoice</B>}
              {(pr.renewals||[]).map((r: any,ri: number)=>(
                r.doc&&<B key={ri} v="sec" s={{fontSize:FS.docBtn,padding:isMobile?"9px 14px":"5px 10px",color:r.paid?C.black:C.green,borderColor:r.paid?C.rule:C.greenBorder}} onClick={()=>setPdf({data:r.doc,type:"renewal",lang:"en"})}>Renewal {ri+1}</B>
              ))}
            </div>

            {/* ── ACTIONS ── */}
            <div style={{display:"flex",gap:isMobile?8:5,flexWrap:"wrap",alignItems:"center",paddingTop:isMobile?10:7,borderTop:`1px solid ${C.rule}`}}>
              {["quoted","revised"].includes(pr.status)&&<>
                <B v="sec" s={{fontSize:FS.actionBtn}} onClick={()=>onRevise(pr,cl)}>Revise Quote</B>
                <B s={{fontSize:FS.actionBtn,padding:isMobile?"10px 18px":"7px 14px"}} onClick={()=>{setStatus(cl.id,pr.id,"contracted");openPDF({...pr,status:"contracted"},"contract","en",cl.id);}}>→ Contract</B>
              </>}
              {pr.status==="contracted"&&<>
                <B v="sec" s={{fontSize:FS.actionBtn}} onClick={()=>openReviseContract(pr,cl.id)}>Revise Contract</B>
                <B s={{fontSize:FS.actionBtn,padding:isMobile?"10px 18px":"7px 14px"}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Mark Signed</B>
              </>}
              {pr.status==="production"&&<>
                <B s={{fontSize:FS.actionBtn,padding:isMobile?"10px 18px":"7px 14px"}} onClick={()=>{setStatus(cl.id,pr.id,"invoiced");openPDF({...pr,status:"invoiced"},"invoice","en",cl.id);}}>Create Invoice</B>
              </>}
              {pr.status==="invoiced"&&!pr.paid&&<>
                <B s={{fontSize:FS.actionBtn,padding:isMobile?"10px 18px":"7px 14px"}} onClick={()=>setStatus(cl.id,pr.id,"paid")}>Mark Paid</B>
              </>}
              {pr.paid&&<>
                <B v="sec" s={{fontSize:FS.actionBtn,color:C.green,borderColor:C.greenBorder,padding:isMobile?"10px 18px":"7px 14px"}} onClick={()=>setRenewT({p:pr,cid:cl.id,pid:pr.id})}>Add Renewal</B>
                <B v="sec" s={{fontSize:FS.actionBtn,color:C.amber,padding:isMobile?"10px 18px":"7px 14px"}} onClick={()=>upP(cl.id,pr.id,{paid:false,status:"invoiced"})}>Undo Paid</B>
              </>}
              {(pr.renewals||[]).map((r: any,ri: number)=>(
                <span key={r.id||ri} style={{display:"contents"}}>
                  {!r.paid&&<B v="sec" s={{fontSize:FS.actionBtn,color:C.green,borderColor:C.greenBorder,padding:isMobile?"10px 14px":"7px 14px"}} onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any)=>rn.id===r.id?{...rn,paid:true}:rn)})}))}>Mark Renewal {ri+1} Paid</B>}
                  {!r.paid&&<B v="sec" s={{fontSize:FS.actionBtn,color:C.amber,padding:isMobile?"10px 14px":"7px 14px"}} onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.filter((_: any,i: number)=>i!==ri)})}))}>Undo Renewal {ri+1}</B>}
                  {r.paid&&<B v="sec" s={{fontSize:FS.actionBtn,color:C.amber,padding:isMobile?"10px 14px":"7px 14px"}} onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any)=>rn.id===r.id?{...rn,paid:false}:rn)})}))}>Undo Renewal {ri+1}</B>}
                </span>
              ))}
              {!pr.paid&&pr.status!=="quoted"&&<B v="sec" s={{fontSize:FS.actionBtn,color:C.muted,padding:isMobile?"10px 14px":"7px 14px"}} onClick={()=>setStatus(cl.id,pr.id,ps)}>Undo</B>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RENEWAL MODAL ────────────────────────────────────────
const CAT_FROM_ID=(id: string)=>{
  if(!id)return"";
  const p=id.charAt(0);
  return p==="i"?"Influencer":p==="u"?"UGC":p==="e"?"Editorial":p==="h"?"Hotels":"";
};
const addD=(d: string,days: number)=>{if(!d||!days)return null;const dt=new Date(d);dt.setDate(dt.getDate()+days);return dt.toISOString().split("T")[0];};

function RenewalModal({p,onSave,onClose,rc,settings}: any) {
  const q=p.qd;
  const sett={...SETTINGS_DEFAULT,...(settings||{})};
  // all billable lines from quote + signed amendments
  const origLines=(q?.lines||[]).map((l: any)=>({...l,_src:"quote"}));
  const amendLines=(p.amendments||[]).filter((a: any)=>a.signed).flatMap((a: any)=>
    (a.lines||[]).map((l: any)=>({...l,_src:`Amend ${a.aNo}`}))
  );
  const allLines=[...origLines,...amendLines].filter((l: any)=>l.amt>0);
  const catLabel=CAT_FROM_ID;

  // 01 deliverables — qty stepper (0 = not selected, max = qty in quote)
  const [selQty,setSelQty]=useState<Record<string,number>>({});
  const setQty=(key: string,max: number,val: number)=>setSelQty(p=>({...p,[key]:Math.max(0,Math.min(max,val))}));
  const selIds=Object.keys(selQty).filter(k=>selQty[k]>0);
  const base=allLines.reduce((s: number,l: any,i: number)=>{
    const key=l.id||`line_${i}`;
    const qty=selQty[key]||0;
    return s+(parseFloat(l.up||0)*qty);
  },0);

  // 02 usage rights
  const [uMode,setUMode]=useState<"predefined"|"custom"|"none">("none");
  const [uIdx,setUIdx]=useState(0);
  const [uCustomDays,setUCustomDays]=useState("");
  const [uCustomUnit,setUCustomUnit]=useState<"days"|"months">("days");
  const [uCustomFee,setUCustomFee]=useState("");
  const uOpt=RENEWAL_OPTS.usage[uIdx];
  const uFee=uMode==="predefined"?Math.round(base*(uOpt.pct/100)):uMode==="custom"?parseFloat(uCustomFee)||0:0;

  // 02 exclusivity
  const [eMode,setEMode]=useState<"predefined"|"custom"|"none">("none");
  const [eIdx,setEIdx]=useState(0);
  const [eCustomDays,setECustomDays]=useState("");
  const [eCustomUnit,setECustomUnit]=useState<"days"|"months">("days");
  const [eCustomFee,setECustomFee]=useState("");
  const eOpt=RENEWAL_OPTS.excl[eIdx];
  const eFee=eMode==="predefined"?Math.round(base*(eOpt.pct/100)):eMode==="custom"?parseFloat(eCustomFee)||0:0;

  // 03 dates
  const [startD,setStartD]=useState(today());
  const calcEnd=(mode: string,opt: any,customDays: string,customUnit: string)=>{
    if(mode==="predefined")return addM(startD,opt.mo);
    if(mode==="custom"){
      const n=parseInt(customDays)||0;
      return customUnit==="days"?addD(startD,n):addM(startD,n);
    }
    return null;
  };
  const uEnd=calcEnd(uMode,uOpt,uCustomDays,uCustomUnit);
  const eEnd=calcEnd(eMode,eOpt,eCustomDays,eCustomUnit);
  const endD=uEnd&&eEnd?(uEnd>eEnd?uEnd:eEnd):uEnd||eEnd;

  const totalFee=uFee+eFee;
  const rNo=`RNW-${(q?.qNo||"").replace("QUO","").trim()||"001"}-${String((p.renewals||[]).length+1).padStart(2,"0")}`;
  const canPreview=base>0&&(uMode!=="none"||eMode!=="none")&&totalFee>0;

  const [showPreview,setShowPreview]=useState(false);

  const buildDoc=()=>{
    const lines: any[]=[];
    const selLines=allLines.filter((_l: any,i: number)=>{const key=_l.id||`line_${i}`;return (selQty[key]||0)>0;});
    const itemsSummary=selLines.map((_l: any,i: number)=>{
      const key=_l.id||`line_${i}`;
      const qty=selQty[key]||0;
      const cat=_l.cat==="influencer"?"Influencer":_l.cat==="ugc"?"UGC":_l.cat==="editorial"?"Editorial":"";
      return`${qty}× ${_l.name}${cat?` [${cat}]`:""}`;
    }).join(", ");
    if(uMode!=="none"&&uFee>0){
      const label=uMode==="predefined"?uOpt.l:`Custom (${uCustomDays} ${uCustomUnit})`;
      const pctNote=uMode==="predefined"&&uOpt.pct>0?` · ${fmt(base)} × ${uOpt.pct}% = ${fmt(uFee)}`:"";
      lines.push({name:`Usage Rights — ${label}`,note:`${itemsSummary}${pctNote} · ${fmtD(startD)}${uEnd?` → ${fmtD(uEnd)}`:""}`,qty:1,up:uFee,amt:uFee});
    }
    if(eMode!=="none"&&eFee>0){
      const label=eMode==="predefined"?eOpt.l:`Custom (${eCustomDays} ${eCustomUnit})`;
      const pctNote=eMode==="predefined"&&eOpt.pct>0?` · ${fmt(base)} × ${eOpt.pct}% = ${fmt(eFee)}`:"";
      lines.push({name:`Exclusivity — ${label}`,note:`${itemsSummary}${pctNote} · ${fmtD(startD)}${eEnd?` → ${fmtD(eEnd)}`:""}`,qty:1,up:eFee,amt:eFee});
    }
    return{
      brand:q?.brand,contact:q?.contact,date:today(),
      rNo,qNo:q?.qNo,ctype:q?.ctype||"Content Creator",
      lines,total:totalFee,
      startDate:startD,endDate:endD,
      footer:"Thank you for the pleasure of working together.",
      type:"renewal"
    };
  };

  const SectionHead=({n,title}: any)=>(
    <p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase" as const,margin:"0 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>{n} — {title}</p>
  );
  const ModeToggle=({val,set}: {val:string,set:(v:any)=>void})=>(
    <div style={{display:"flex",gap:4,marginBottom:8}}>
      <Pill on={val==="none"} onClick={()=>set("none")}>None</Pill>
      <Pill on={val==="predefined"} onClick={()=>set("predefined")}>Predefined</Pill>
      <Pill on={val==="custom"} onClick={()=>set("custom")}>Custom</Pill>
    </div>
  );

  if(showPreview){
    const doc=buildDoc();
    const renewal={id:uid(),optLabel:[uMode!=="none"?uOpt?.l:"",eMode!=="none"?eOpt?.l:""].filter(Boolean).join(" + ")||"Custom",startDate:startD,endDate:endD,fee:totalFee,rNo,signed:false,paid:false,doc};
    return<PDFModal data={doc} type="renewal" settings={settings} isNew={true}
      onClose={onClose}
      onSave={()=>onSave(renewal)}
      onSaveClose={onClose}
    />;
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.bg,width:"100%",maxWidth:520,borderRadius:2,padding:20,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontFamily:SERIF,fontSize:17,fontWeight:"normal",margin:0}}>Add Renewal</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
        </div>
        <p style={{fontSize:10.5,color:C.muted,margin:"0 0 16px"}}>Project: <strong style={{color:C.black}}>{p.name}</strong></p>

        {/* 01 — Deliverables */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="01" title="Which Deliverables"/>
          <p style={{fontSize:9.5,color:C.muted,margin:"0 0 8px"}}>Select items the renewal fee applies to. Their prices are the base for % calculation.</p>
          {allLines.map((l: any,i: number)=>{
            const key=l.id||`line_${i}`;
            const max=l.qty||1;
            const qty=selQty[key]||0;
            const catFromId=catLabel(l.id||"");
            const catFromField=l.cat==="influencer"?"Influencer":l.cat==="ugc"?"UGC":l.cat==="editorial"?"Editorial":l.cat==="hotels"?"Hotels":"";
            const cat=catFromId||catFromField;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.rule}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" as const}}>
                    <span style={{fontSize:10.5,color:C.black}}>{l.name}</span>
                    {cat&&<span style={{fontSize:8,color:C.muted,border:`1px solid ${C.rule}`,padding:"1px 6px",borderRadius:2,letterSpacing:"0.06em",textTransform:"uppercase" as const,flexShrink:0}}>{cat}</span>}
                    {l._src!=="quote"&&<span style={{fontSize:8,color:C.amber,border:`1px solid ${C.amberBorder}`,padding:"1px 6px",borderRadius:2,letterSpacing:"0.06em",flexShrink:0}}>{l._src}</span>}
                  </div>
                  <span style={{fontSize:9,color:C.light}}>€{l.up} each · max {max}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                  <button onClick={()=>setQty(key,max,qty-1)} style={{width:22,height:22,border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:13,color:qty>0?C.black:C.light,lineHeight:1}}>−</button>
                  <span style={{fontSize:11,fontFamily:SERIF,minWidth:16,textAlign:"center",color:qty>0?C.black:C.light}}>{qty}</span>
                  <button onClick={()=>setQty(key,max,qty+1)} style={{width:22,height:22,border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:13,color:qty<max?C.black:C.light,lineHeight:1}}>+</button>
                </div>
                <span style={{fontFamily:SERIF,fontSize:10,color:qty>0?C.black:C.muted,flexShrink:0,minWidth:52,textAlign:"right"}}>{qty>0?fmt(parseFloat(l.up||0)*qty):"—"}</span>
              </div>
            );
          })}
          {base>0&&<p style={{fontSize:10,color:C.muted,margin:"8px 0 0",textAlign:"right"}}>Base: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(base)}</strong></p>}
        </div>

        {/* 02 — Usage Rights */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="02" title="Usage Rights"/>
          <ModeToggle val={uMode} set={setUMode}/>
          {uMode==="predefined"&&<>
            <S value={uIdx} onChange={(e: any)=>setUIdx(parseInt(e.target.value))} s={{marginBottom:6}}>
              {RENEWAL_OPTS.usage.map((o,i)=><option key={i} value={i}>{o.l}{o.pct>0?` (+${o.pct}%)`:""}</option>)}
            </S>
            {base>0&&<p style={{fontSize:10,color:C.muted,margin:0}}>Fee: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(uFee)}</strong> ({uOpt.pct}% of {fmt(base)})</p>}
          </>}
          {uMode==="custom"&&<>
            <Lbl>Reference rate <span style={{fontWeight:"normal",color:C.light}}>(for pro-rata calculation)</span></Lbl>
            <S value={uIdx} onChange={(e: any)=>setUIdx(parseInt(e.target.value))} s={{marginBottom:8,opacity:0.6}}>
              {RENEWAL_OPTS.usage.map((o,i)=><option key={i} value={i}>{o.l}{o.pct>0?` (+${o.pct}%)`:""}</option>)}
            </S>
            <div style={{display:"flex",gap:7,marginBottom:6}}>
              <I type="number" placeholder="Duration" value={uCustomDays} onChange={(e: any)=>{
                const d=parseInt(e.target.value)||0;
                setUCustomDays(e.target.value);
                if(d>0&&uOpt.pct>0&&uOpt.mo>0&&base>0){
                  const refDays=uOpt.mo*30;
                  const proRataPct=(d/refDays)*uOpt.pct;
                  setUCustomFee(String(Math.round(base*proRataPct/100)));
                }
              }} s={{flex:1}}/>
              <S value={uCustomUnit} onChange={(e: any)=>setUCustomUnit(e.target.value)} s={{flex:1}}>
                <option value="days">Days</option>
                <option value="months">Months</option>
              </S>
            </div>
            {uCustomDays&&uOpt.pct>0&&base>0&&<p style={{fontSize:9.5,color:C.muted,margin:"0 0 6px"}}>Pro-rata: {parseInt(uCustomDays)||0}d / {uOpt.mo*30}d × {uOpt.pct}% = {Math.round(((parseInt(uCustomDays)||0)/(uOpt.mo*30))*uOpt.pct)}% of {fmt(base)}</p>}
            <I type="number" placeholder="Fee (€)" value={uCustomFee} onChange={(e: any)=>setUCustomFee(e.target.value)}/>
          </>}
        </div>

        {/* 02b — Exclusivity */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="03" title="Exclusivity"/>
          <ModeToggle val={eMode} set={setEMode}/>
          {eMode==="predefined"&&<>
            <S value={eIdx} onChange={(e: any)=>setEIdx(parseInt(e.target.value))} s={{marginBottom:6}}>
              {RENEWAL_OPTS.excl.map((o,i)=><option key={i} value={i}>{o.l}{o.pct>0?` (+${o.pct}%)`:""}</option>)}
            </S>
            {base>0&&<p style={{fontSize:10,color:C.muted,margin:0}}>Fee: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(eFee)}</strong> ({eOpt.pct}% of {fmt(base)})</p>}
          </>}
          {eMode==="custom"&&<>
            <Lbl>Reference rate <span style={{fontWeight:"normal",color:C.light}}>(for pro-rata calculation)</span></Lbl>
            <S value={eIdx} onChange={(e: any)=>setEIdx(parseInt(e.target.value))} s={{marginBottom:8,opacity:0.6}}>
              {RENEWAL_OPTS.excl.map((o,i)=><option key={i} value={i}>{o.l}{o.pct>0?` (+${o.pct}%)`:""}</option>)}
            </S>
            <div style={{display:"flex",gap:7,marginBottom:6}}>
              <I type="number" placeholder="Duration" value={eCustomDays} onChange={(e: any)=>{
                const d=parseInt(e.target.value)||0;
                setECustomDays(e.target.value);
                if(d>0&&eOpt.pct>0&&eOpt.mo>0&&base>0){
                  const refDays=eOpt.mo*30;
                  const proRataPct=(d/refDays)*eOpt.pct;
                  setECustomFee(String(Math.round(base*proRataPct/100)));
                }
              }} s={{flex:1}}/>
              <S value={eCustomUnit} onChange={(e: any)=>setECustomUnit(e.target.value)} s={{flex:1}}>
                <option value="days">Days</option>
                <option value="months">Months</option>
              </S>
            </div>
            {eCustomDays&&eOpt.pct>0&&base>0&&<p style={{fontSize:9.5,color:C.muted,margin:"0 0 6px"}}>Pro-rata: {parseInt(eCustomDays)||0}d / {eOpt.mo*30}d × {eOpt.pct}% = {Math.round(((parseInt(eCustomDays)||0)/(eOpt.mo*30))*eOpt.pct)}% of {fmt(base)}</p>}
            <I type="number" placeholder="Fee (€)" value={eCustomFee} onChange={(e: any)=>setECustomFee(e.target.value)}/>
          </>}
        </div>

        {/* 03 — Dates */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="04" title="Dates"/>
          <Lbl>Start Date</Lbl>
          <I type="date" value={startD} onChange={(e: any)=>setStartD(e.target.value)} s={{marginBottom:6}}/>
          {endD&&<p style={{fontSize:10,color:C.muted,margin:0}}>End date: <strong style={{color:C.black}}>{fmtD(endD)}</strong></p>}
        </div>

        {/* Total */}
        <div style={{padding:"9px 12px",border:`1px solid ${C.rule}`,borderRadius:2,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase" as const}}>Renewal Total</span>
          <span style={{fontFamily:SERIF,fontSize:18}}>{fmt(totalFee)}</span>
        </div>

        <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
          <B v="sec" onClick={onClose}>Cancel</B>
          <B s={{opacity:canPreview?1:0.4}} onClick={()=>{if(!canPreview)return;setShowPreview(true);}}>Preview & Save</B>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENTS ──────────────────────────────────────────────
function Clients({clients,setClients,onRevise,onAmend,goTo,settings,onGoToCalc,isMobile,rc,selReset,onSelChange,pendingClientName,onPendingClear,pendingProjectQNo}: any) {
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [typeFilter,setTypeFilter]=useState("all");
  const [sortOrder,setSortOrder]=useState("recent");
  const [sel,setSel_]=useState<string|null>(null);
  const setSel=(v: string|null)=>{setSel_(v);if(onSelChange)onSelChange(v);};
  useEffect(()=>{setSel(null);},[selReset]);
  const [highlightedProjectQNo,setHighlightedProjectQNo]=useState<string|null>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [nb,setNb]=useState({name:"",contact:"",email:"",agency:"Direct",country:"Germany",tags:[] as string[],notes:""});
  const [tagI,setTagI]=useState("");
  const [editMode,setEditMode]=useState(false);
  const [ed,setEd]=useState<any>(null);
  const [amendT,setAmendT]=useState<any>(null);
  const [renewT,setRenewT]=useState<any>(null);
  useEffect(()=>{setSel(null);},[selReset]);
  useEffect(()=>{
    if(!pendingClientName)return;
    const c=clients.find((x: any)=>x.name.toLowerCase()===pendingClientName.toLowerCase());
    if(c){setSel(c.id);if(pendingProjectQNo)setHighlightedProjectQNo(pendingProjectQNo);}
    if(onPendingClear)setTimeout(()=>onPendingClear(),100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const [revInvT,setRevInvT]=useState<any>(null);
  const [pdf,setPdf]=useState<any>(null);
  const [showAddP,setShowAddP]=useState(false);
  const [newPN,setNewPN]=useState("");
  const [delConfirm,setDelConfirm]=useState<string|null>(null);
  const [editPrName,setEditPrName]=useState<string|null>(null);
  const [editPrNameVal,setEditPrNameVal]=useState("");

  const cl=sel?clients.find((c: any)=>c.id===sel):null;
  const filtered=(()=>{
    const arr=clients.filter((c: any)=>{
      const q=search.toLowerCase();
      if(q&&!c.name.toLowerCase().includes(q)&&!(c.tags||[]).some((t: string)=>t.toLowerCase().includes(q)))return false;
      if(typeFilter!=="all"&&c.agency!==typeFilter)return false;
      if(statusFilter!=="all"){
        const match=statusFilter==="paid"
          ?c.projects.some((pr: any)=>pr.paid)
          :c.projects.some((pr: any)=>pr.status===statusFilter&&!pr.paid);
        if(!match)return false;
      }
      return true;
    });
    const latestDate=(c: any)=>c.projects.reduce((d: string,pr: any)=>pr.date>d?pr.date:d,"");
    const totalRev=(c: any)=>c.projects.filter((pr: any)=>pr.paid).reduce((s: number,pr: any)=>s+pr.amount,0);
    const STATUS_PRI: Record<string,number>={invoiced:0,production:1,contracted:2,revised:3,quoted:4,lead:5,paid:6};
    const bestPri=(c: any)=>c.projects.length?Math.min(...c.projects.map((pr: any)=>STATUS_PRI[pr.paid?"paid":pr.status]??99)):99;
    if(sortOrder==="status")return [...arr].sort((a: any,b: any)=>bestPri(a)-bestPri(b));
    if(sortOrder==="name_az")return [...arr].sort((a: any,b: any)=>a.name.localeCompare(b.name));
    if(sortOrder==="revenue_hi")return [...arr].sort((a: any,b: any)=>totalRev(b)-totalRev(a));
    if(sortOrder==="revenue_lo")return [...arr].sort((a: any,b: any)=>totalRev(a)-totalRev(b));
    return [...arr].sort((a: any,b: any)=>latestDate(b).localeCompare(latestDate(a)));
  })();

  const upCl=(id: string,data: any)=>setClients((p: any[])=>p.map(c=>c.id!==id?c:{...c,...data}));
  const upP=(cid: string,pid: string,data: any)=>setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,...data})}));
  const delCl=(id: string)=>{setClients((p: any[])=>p.filter(c=>c.id!==id));setSel(null);};
  const addCl=()=>{if(!nb.name.trim())return;setClients((p: any[])=>[...p,{id:uid(),...nb,projects:[]}]);setNb({name:"",contact:"",email:"",agency:"Direct",country:"Germany",tags:[],notes:""});setShowAdd(false);};
  const addP=(cid: string)=>{if(!newPN.trim())return;const pr={id:uid(),name:newPN,status:"quoted",amount:0,paid:false,date:today(),deliveryDate:"",notes:"",qd:null,amendments:[],renewals:[]};setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:[pr,...c.projects]}));setNewPN("");setShowAddP(false);};
  const saveAmend=(cid: string,pid: string,amend: any)=>{setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,amendments:[...(pr.amendments||[]),amend],amount:pr.amount+amend.amendTotal})}));setAmendT(null);};
  const saveRenewal=(cid: string,pid: string,renewal: any)=>{setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,renewals:[...(pr.renewals||[]),{...renewal,signed:true}]})}));setRenewT(null);};
  const setStatus=(cid: string,pid: string,st: string)=>upP(cid,pid,{status:st,paid:st==="paid"});
  const nxt=(s: string)=>{const i=STATUS.indexOf(s);return i<STATUS.length-1?STATUS[i+1]:null;};
  const prv=(s: string)=>{const i=STATUS.indexOf(s);return i>0?STATUS[i-1]:null;};
  const uEnd=(pr: any)=>{
    if(!pr.deliveryDate||!pr.qd)return null;
    const ul=(pr.qd?.lines||[]).find((l: any)=>l.usageLabel);
    const hasRenewals=(pr.renewals||[]).length>0;
    if(!ul?.usageLabel&&!hasRenewals)return null;
    if(pr.usageEndOverride)return pr.usageEndOverride;
    if(!ul?.usageLabel)return null;
    const m=ul.usageLabel.match(/(\d+)\s*month/i);
    const mo=m?parseInt(m[1]):null;
    return mo?addM(pr.deliveryDate,mo):null;
  };
  const fin=(c: any)=>{const paid=c.projects.filter((pr: any)=>pr.paid);const tot=paid.reduce((s: number,pr: any)=>s+pr.amount,0);const last=[...paid].sort((a: any,b: any)=>b.date.localeCompare(a.date))[0];return{total:tot,last:last?.amount||0,lastDate:last?.date||null,avg:paid.length?Math.round(tot/paid.length):0,count:paid.length,out:c.projects.filter((pr: any)=>pr.status==="invoiced"&&!pr.paid).reduce((s: number,pr: any)=>s+pr.amount,0)};};
  const flagged=clients.filter((c: any)=>{if(!c.projects.length)return false;if(c.projects.some((pr: any)=>pr.status==="invoiced"||pr.status==="paid"))return false;const lat=c.projects.reduce((a: any,b: any)=>a.date>b.date?a:b);return(new Date().getTime()-new Date(lat.date).getTime())/864e5>90;});

  const openPDF=(pr: any,type: string,lang: string,cid: string)=>{
    const q=pr.qd;
    const iNo=`INV-${(q?.qNo||"").replace("QUO","").trim()||"001"}`;
    // contract opened directly = internal correction, carry saved clauses through
    const data={brand:q?.brand,contact:q?.contact,date:pr.date||today(),validUntil:q?.validUntil,qNo:q?.qNo,rev:q?.rev||0,contractRev:q?.contractRev||0,clauses:q?.clauses||[],iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:type==="invoice"?"Thank you for the pleasure of working together.":"Looking forward to working together."};
    setPdf({cid,pid:pr.id,data,type,lang});
  };

  const openReviseContract=(pr: any,cid: string)=>{
    const q=pr.qd;
    const iNo=`INV-${(q?.qNo||"").replace("QUO","").trim()||"001"}`;
    const nextRev=(q?.contractRev||0)+1;
    // official revision — same preview, onSave bumps contractRev
    const data={brand:q?.brand,contact:q?.contact,date:today(),validUntil:q?.validUntil,qNo:q?.qNo,rev:q?.rev||0,contractRev:nextRev,clauses:q?.clauses||[],iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Looking forward to working together."};
    setPdf({cid,pid:pr.id,data,type:"contract",lang:"en",isRevision:true,nextContractRev:nextRev});
  };

  if(renewT)return<RenewalModal p={renewT.p} onSave={(r: any)=>saveRenewal(renewT.cid,renewT.pid,r)} onClose={()=>setRenewT(null)} rc={rc} settings={settings}/>;
  if(pdf)return<PDFModal data={pdf.data} type={pdf.type} onClose={()=>{setPdf(null);setRevInvT(null);}} settings={settings}
    onSave={revInvT
      ?(doc: any)=>{const tot=(doc.lines||[]).reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);upP(revInvT.cid,revInvT.pid,{qd:{...revInvT.p.qd,lines:doc.lines},amount:tot});}
      :(pdf.cid&&pdf.pid&&pdf.isRevision)
        // official contract revision — bump contractRev, save clauses
        ?(doc: any)=>upP(pdf.cid,pdf.pid,{qd:{...doc,contractRev:pdf.nextContractRev,clauses:doc.clauses||[]}})
        :(pdf.cid&&pdf.pid)
          // internal correction — save clauses silently, no version bump
          ?(doc: any)=>{const tot=doc.total||(doc.lines||[]).reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);upP(pdf.cid,pdf.pid,{qd:{...doc,clauses:doc.clauses||[]},amount:tot});}
          :undefined}/>;

  if(cl&&isMobile){
    return(
      <ClientDetail cl={cl} fin={fin} editMode={editMode} ed={ed} setEd={setEd} upCl={upCl} setEditMode={setEditMode} delCl={delCl} tagI={tagI} setTagI={setTagI} uEnd={uEnd} showAddP={showAddP} setShowAddP={setShowAddP} newPN={newPN} setNewPN={setNewPN} addP={addP} onGoToCalc={onGoToCalc} upP={upP} setClients={setClients} openPDF={openPDF} openReviseContract={openReviseContract} setPdf={setPdf} onRevise={onRevise} onAmend={onAmend} setAmendT={setAmendT} setRenewT={setRenewT} setStatus={setStatus} nxt={nxt} prv={prv} editPrName={editPrName} setEditPrName={setEditPrName} editPrNameVal={editPrNameVal} setEditPrNameVal={setEditPrNameVal} delConfirm={delConfirm} setDelConfirm={setDelConfirm} setSel={setSel} highlightedProjectQNo={highlightedProjectQNo} onClearHighlight={()=>setHighlightedProjectQNo(null)} isMobile={true}/>
    );
  }

  return(
    <div style={{display:cl&&!isMobile?"flex":"block",gap:cl&&!isMobile?28:0,alignItems:"flex-start"}}>
      <div style={{flex:cl&&!isMobile?"0 0 42%":"1 1 100%",minWidth:0,overflowY:cl&&!isMobile?"auto":undefined,maxHeight:cl&&!isMobile?"calc(100vh - 80px)":undefined}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isMobile?16:13}}>
        <h2 style={{fontFamily:SERIF,fontSize:isMobile?26:24,fontWeight:"normal",margin:0}}>Clients</h2>
        <B onClick={()=>setShowAdd((s: boolean)=>!s)} s={isMobile?{fontSize:11,padding:"9px 16px"}:{}}>+ New Client</B>
      </div>
      {flagged.length>0&&<div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:2,padding:"9px 13px",marginBottom:10}}><p style={{fontSize:10.5,color:C.amber,margin:0}}>⚠ {flagged.length} client{flagged.length>1?"s":""} — no activity 3+ months</p></div>}
      <I placeholder="Search clients, tags…" value={search} onChange={(e: any)=>setSearch(e.target.value)} s={{marginBottom:8}}/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:7,marginBottom:11}}>
        <select
          value={typeFilter!=="all"?typeFilter.toLowerCase():statusFilter}
          onChange={(e: any)=>{const v=e.target.value;if(v==="direct"||v==="agency"){setTypeFilter(v==="direct"?"Direct":"Agency");setStatusFilter("all");}else{setStatusFilter(v);setTypeFilter("all");}}}
          style={{fontSize:9,fontFamily:SANS,color:C.muted,background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"4px 8px",cursor:"pointer",outline:"none"}}>
          <option value="all">Filter: All</option>
          <optgroup label="Status">
            <option value="lead">Lead</option>
            <option value="quoted">Quoted</option>
            <option value="revised">Revised</option>
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
        <select value={sortOrder} onChange={(e: any)=>setSortOrder(e.target.value)} style={{fontSize:9,fontFamily:SANS,color:C.muted,background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"4px 8px",cursor:"pointer",outline:"none"}}>
          <option value="recent">Sort: Most Recent</option>
          <option value="status">Sort: Status Priority</option>
          <option value="name_az">Sort: Name A → Z</option>
          <option value="revenue_hi">Sort: Revenue ↓</option>
          <option value="revenue_lo">Sort: Revenue ↑</option>
        </select>
      </div>
      {showAdd&&(
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:13,marginBottom:11,background:C.white}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>New Client</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            <div><Lbl>Brand Name *</Lbl><I value={nb.name} onChange={(e: any)=>setNb(p=>({...p,name:e.target.value}))} placeholder="Sephora"/></div>
            <div><Lbl>Contact</Lbl><I value={nb.contact} onChange={(e: any)=>setNb(p=>({...p,contact:e.target.value}))} placeholder="Anna Müller"/></div>
            <div><Lbl>Email</Lbl><I value={nb.email} onChange={(e: any)=>setNb(p=>({...p,email:e.target.value}))} type="email" placeholder="anna@brand.com"/></div>
            <div><Lbl>Agency / Direct</Lbl><S value={nb.agency} onChange={(e: any)=>setNb(p=>({...p,agency:e.target.value}))}><option>Direct</option><option>Agency</option></S></div>
            <div><Lbl>Country</Lbl><I value={nb.country} onChange={(e: any)=>setNb(p=>({...p,country:e.target.value}))} placeholder="Germany"/></div>
            <div><Lbl>Tags</Lbl>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>{nb.tags.map(t=><Tag key={t} onRemove={()=>setNb(p=>({...p,tags:p.tags.filter(x=>x!==t)}))}>{t}</Tag>)}</div>
              <div style={{display:"flex",gap:5}}><I value={tagI} onChange={(e: any)=>setTagI(e.target.value)} placeholder="Beauty, Fashion…" onKeyDown={(e: any)=>{if(e.key==="Enter"&&tagI.trim()){setNb(p=>({...p,tags:[...p.tags,tagI.trim()]}));setTagI("");}}} /><B v="sec" onClick={()=>{if(tagI.trim()){setNb(p=>({...p,tags:[...p.tags,tagI.trim()]}));setTagI("");}}} s={{fontSize:9}}>+</B></div>
            </div>
          </div>
          <div style={{marginTop:9}}><Lbl>Relationship Notes</Lbl><I value={nb.notes} onChange={(e: any)=>setNb(p=>({...p,notes:e.target.value}))} placeholder="Fast payer, luxury aesthetic…"/></div>
          <div style={{display:"flex",gap:7,marginTop:10}}><B onClick={addCl}>Save Client</B><B v="sec" onClick={()=>setShowAdd(false)}>Cancel</B></div>
        </div>
      )}
      {filtered.length===0&&!showAdd&&<p style={{fontSize:11,color:C.muted}}>No clients yet.</p>}
      {filtered.map((c: any)=>{
        const active=c.projects[0];
        const allRights=c.projects.flatMap((pr: any)=>{
          const items: {prName:string,end:string,label:string}[]=[];
          const ue=uEnd(pr);
          if(ue)items.push({prName:pr.name,end:ue,label:"Usage"});
          (pr.renewals||[]).filter((r: any)=>r.type==="excl"&&r.endDate).forEach((r: any)=>{items.push({prName:pr.name,end:r.endDate,label:"Excl."});});
          return items;
        });
        const multiProj=new Set(allRights.map((r: any)=>r.prName)).size>1;
        return(
          <div key={c.id} onClick={()=>setSel(c.id)} style={{border:`1px solid ${sel===c.id?C.light:C.rule}`,borderRadius:2,padding:isMobile?"14px 16px":"11px 13px",marginBottom:isMobile?10:8,cursor:"pointer",background:sel===c.id?"rgba(26,26,26,0.03)":undefined}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{minWidth:0,flex:1}}>
                <p style={{fontSize:isMobile?16:13,color:C.black,margin:`0 0 ${isMobile?3:2}px`,fontWeight:"500"}}>{c.name}</p>
                <p style={{fontSize:isMobile?13:10.5,color:C.muted,margin:0}}>{c.contact}{c.email&&!isMobile?` · ${c.email}`:""}</p>
                {(c.tags||[]).length>0&&<div style={{display:"flex",gap:4,marginTop:isMobile?6:4,flexWrap:"wrap"}}>{c.tags.map((t: string)=><Tag key={t}>{t}</Tag>)}</div>}
                {active&&<p style={{fontSize:isMobile?13:10.5,color:C.muted,margin:`${isMobile?5:4}px 0 0`}}>{active.name}</p>}
              </div>
              {active&&<div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                <p style={{fontFamily:SERIF,fontSize:isMobile?17:14,color:C.black,margin:`0 0 ${isMobile?5:3}px`}}>{fmt(active.amount)}</p>
                <span style={{fontSize:isMobile?11:9.5,color:scol(active.paid?"paid":active.status),border:`1px solid ${scol(active.paid?"paid":active.status)}`,padding:isMobile?"3px 10px":"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{active.paid?"Paid":active.status}</span>
              </div>}
            </div>
            {allRights.length>0&&<div style={{marginTop:isMobile?9:7,paddingTop:isMobile?9:7,borderTop:`1px solid ${C.rule}`,display:"flex",flexDirection:"column",gap:isMobile?6:4}}>
              {allRights.map((r: any,i: number)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {multiProj&&<span style={{fontSize:isMobile?11:9,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{r.prName}</span>}
                  <UBadge end={r.end} label={r.label}/>
                </div>
              ))}
            </div>}
          </div>
        );
      })}
      </div>{/* end left col */}
      {cl&&!isMobile&&<ClientDetail cl={cl} fin={fin} editMode={editMode} ed={ed} setEd={setEd} upCl={upCl} setEditMode={setEditMode} delCl={delCl} tagI={tagI} setTagI={setTagI} uEnd={uEnd} showAddP={showAddP} setShowAddP={setShowAddP} newPN={newPN} setNewPN={setNewPN} addP={addP} onGoToCalc={onGoToCalc} upP={upP} setClients={setClients} openPDF={openPDF} openReviseContract={openReviseContract} setPdf={setPdf} onRevise={onRevise} onAmend={onAmend} setAmendT={setAmendT} setRenewT={setRenewT} setStatus={setStatus} nxt={nxt} prv={prv} editPrName={editPrName} setEditPrName={setEditPrName} editPrNameVal={editPrNameVal} setEditPrNameVal={setEditPrNameVal} delConfirm={delConfirm} setDelConfirm={setDelConfirm} setSel={setSel} highlightedProjectQNo={highlightedProjectQNo} onClearHighlight={()=>setHighlightedProjectQNo(null)} isMobile={false}/>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────
function Dashboard({clients,goTo,isMobile,setPendingClientName,setPendingProjectQNo,setFromDrill,settings,resetKey,drill,setDrill}: any) {
  const [invoiceTab,setInvoiceTab]=useState<"unpaid"|"paid">("unpaid");
  const [pFilter,setPFilter]=useState<string>("all");
  const [pSort,setPSort]=useState<string>("status");
  const [revYear,setRevYear]=useState<string>("all");
  const [revSort,setRevSort]=useState<string>("date_new");
  const [invTab,setInvTab]=useState<"unpaid"|"paid">("unpaid");
  const [invYear,setInvYear]=useState<string>("all");
  const [invType,setInvType]=useState<string>("all");
  const [invClient,setInvClient]=useState<string>("all");
  const [invSel,setInvSel]=useState<Set<string>>(new Set());
  const [invBulkStatus,setInvBulkStatus]=useState<string|null>(null);
  const [invPdfData,setInvPdfData]=useState<any>(null);
  const [licenseActions,setLicenseActions]=useState<Record<string,string>>({});
  const [licTab,setLicTab]=useState<"usage"|"excl">("usage");
  useEffect(()=>{setDrill(null);},[resetKey]);

  const goToProject=(cName: string,qNo?: string,from?: string)=>{setPendingClientName(cName);if(qNo&&setPendingProjectQNo)setPendingProjectQNo(qNo);if(from&&setFromDrill)setFromDrill(from);goTo(1);};
  const all=clients.flatMap((c: any)=>c.projects.map((pr: any)=>({...pr,cName:c.name,cId:c.id})));
  const paid=all.filter((pr: any)=>pr.paid&&pr.date);
  const openQ=all.filter((pr: any)=>pr.status==="quoted"||pr.status==="revised");
  const unpaid=all.filter((pr: any)=>pr.status==="invoiced"&&!pr.paid);

  const STATUS_ORDER: Record<string,number>={production:0,contracted:1,invoiced:2,quoted:3,revised:4};
  const NEXT_ACTION: Record<string,string>={quoted:"Awaiting client feedback",revised:"Awaiting client feedback",contracted:"Awaiting signature",production:"In production",invoiced:"Awaiting payment"};
  const STATUS_COLOR: Record<string,string>={quoted:C.amber,revised:C.amber,contracted:C.amber,production:C.black,invoiced:C.green};

  const activeProjects=all.filter((pr: any)=>!pr.paid&&pr.status&&pr.status!=="lead"&&pr.status!=="paid");

  const filteredProjects=(()=>{
    let list=activeProjects;
    if(pFilter!=="all")list=list.filter((pr: any)=>pr.status===pFilter);
    if(pSort==="status")list=[...list].sort((a: any,b: any)=>(STATUS_ORDER[a.status]??9)-(STATUS_ORDER[b.status]??9));
    else if(pSort==="amount_hi")list=[...list].sort((a: any,b: any)=>b.amount-a.amount);
    else if(pSort==="amount_lo")list=[...list].sort((a: any,b: any)=>a.amount-b.amount);
    else if(pSort==="delivery")list=[...list].sort((a: any,b: any)=>(a.deliveryDate||"9999").localeCompare(b.deliveryDate||"9999"));
    return list;
  })();

  const rev=paid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const out=unpaid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const uEnd=(pr: any)=>{
    if(!pr.deliveryDate||!pr.qd)return null;
    const ul=(pr.qd?.lines||[]).find((l: any)=>l.usageLabel);
    const hasRenewals=(pr.renewals||[]).length>0;
    if(!ul?.usageLabel&&!hasRenewals)return null;
    if(pr.usageEndOverride)return pr.usageEndOverride;
    if(!ul?.usageLabel)return null;
    const m=ul.usageLabel.match(/(\d+)\s*month/i);
    const mo=m?parseInt(m[1]):null;
    return mo?addM(pr.deliveryDate,mo):null;
  };
  const allLicenses=clients.flatMap((c: any)=>c.projects.flatMap((pr: any)=>{
    const items: {cName:string,cId:string,prName:string,end:string,label:string,type:"usage"|"excl",key:string}[]=[];
    const originalUe=uEnd(pr);
    const usageRenewalDates=(pr.renewals||[]).filter((r: any)=>r.type!=="excl"&&r.endDate).map((r: any)=>r.endDate as string);
    const allUDates=[originalUe,...usageRenewalDates].filter(Boolean) as string[];
    const latestUe=allUDates.length>0?allUDates.reduce((a,b)=>a>b?a:b):null;
    if(latestUe)items.push({cName:c.name,cId:c.id,prName:pr.name,end:latestUe,label:"Usage",type:"usage",key:`usage_${c.id}_${pr.id}`});
    const exclDates=(pr.renewals||[]).filter((r: any)=>r.type==="excl"&&r.endDate).map((r: any)=>r.endDate as string);
    const latestExcl=exclDates.length>0?exclDates.reduce((a: string,b: string)=>a>b?a:b):null;
    if(latestExcl)items.push({cName:c.name,cId:c.id,prName:pr.name,end:latestExcl,label:"Excl.",type:"excl",key:`excl_${c.id}_${pr.id}`});
    return items;
  })).sort((a: any,b: any)=>(dLeft(a.end)??999999)-(dLeft(b.end)??999999));
  const nowY=new Date().getFullYear();
  const nowM=new Date().getMonth();
  const MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const yearOf=(pr: any)=>new Date(pr.date).getFullYear();
  const monthOf=(pr: any)=>new Date(pr.date).getMonth();
  const thisYearPaid=paid.filter((pr: any)=>yearOf(pr)===nowY);
  const thisYearRev=thisYearPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const thisMonthPaid=paid.filter((pr: any)=>yearOf(pr)===nowY&&monthOf(pr)===nowM);
  const thisMonthRev=thisMonthPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const allYears=Array.from(new Set(paid.map((pr: any)=>yearOf(pr)))).sort((a: any,b: any)=>b-a) as number[];
  const monthsToShow=Array.from({length:nowM+1},(_,i)=>i);

  const Card=({label,count,warm,sub,onClick}: any)=>(
    <div onClick={onClick} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px",cursor:onClick?"pointer":"default"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
        <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:SERIF,fontSize:20,color:typeof count==="number"?(count>0&&warm?C.amber:count>0?C.black:C.light):C.black}}>{count}</span>
      </div>
      {sub}
    </div>
  );

  // ── Shared drill layout helpers ──
  const DrillBack=({onClick}: {onClick:()=>void})=>(
    <button onClick={onClick} style={{fontSize:12,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase" as const,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:20}}>← Dashboard</button>
  );
  const DrillHeader=({title,count,sub}: {title:string,count?:any,sub?:string})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:sub?4:20,flexWrap:"wrap" as const,gap:8}}>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>{title}</h2>
      {count!==undefined&&<span style={{fontFamily:SERIF,fontSize:20,color:C.black}}>{count}</span>}
      {sub&&<p style={{fontSize:12,color:C.muted,margin:"0 0 16px",width:"100%"}}>{sub}</p>}
    </div>
  );

  // ── Active Projects drill ──
  if(drill==="projects"){
    const FILTERS=[["all","All"],["production","Production"],["contracted","Contracted"],["invoiced","Invoiced"],["quoted","Quoted"]];
    const SORTS=[["status","By Stage"],["amount_hi","Amount ↓"],["amount_lo","Amount ↑"],["delivery","Delivery"]];
    const totalActive=activeProjects.reduce((s: number,pr: any)=>s+pr.amount,0);
    const daysIn=(pr: any)=>pr.date?Math.floor((Date.now()-new Date(pr.date).getTime())/86400000):null;
    const dCol=(d: number|null)=>d===null?C.light:d>=14?C.red:d>=7?C.amber:C.muted;

    // group: needs your action first, then in progress
    const needsAction=filteredProjects.filter((pr: any)=>["invoiced","contracted"].includes(pr.status));
    const inProgress=filteredProjects.filter((pr: any)=>["production","quoted","revised"].includes(pr.status));

    const Row=({pr}: {pr: any})=>{
      const d=daysIn(pr);
      const col=STATUS_COLOR[pr.status]||C.muted;
      const next=NEXT_ACTION[pr.status]||"";
      const unsignedAmends=(pr.amendments||[]).filter((a: any)=>!a.signed).length;
      return(
        <div onClick={()=>goToProject(pr.cName,pr.qd?.qNo,"projects")} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.rule}`,gap:10,cursor:"pointer"}}>
          <span style={{fontSize:12,color:dCol(d),flexShrink:0,minWidth:32,fontWeight:"500"}}>{d!==null?`${d}d`:"—"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:C.black,fontWeight:"500"}}>{pr.cName}</span>
              <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?90:200}}>{pr.name}</span>
              <span style={{fontSize:10,color:col,border:`1px solid ${col}`,padding:"1px 5px",borderRadius:2,letterSpacing:"0.06em",textTransform:"uppercase" as const,flexShrink:0}}>{pr.status}</span>
            </div>
            <div style={{display:"flex",gap:8,marginTop:3,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.light}}>{next}</span>
              {pr.deliveryDate&&<span style={{fontSize:11,color:C.light}}>· Due {fmtD(pr.deliveryDate)}</span>}
              {unsignedAmends>0&&<span style={{fontSize:11,color:C.amber}}>· {unsignedAmends} unsigned amend</span>}
            </div>
          </div>
          <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flexShrink:0}}>{fmt(pr.amount)}</span>
          <span style={{fontSize:11,color:C.light}}>→</span>
        </div>
      );
    };

    return(
      <div>
        <DrillBack onClick={()=>setDrill(null)}/>
        <DrillHeader title="Active Projects" count={fmt(totalActive)} sub={`${filteredProjects.length} of ${activeProjects.length} project${activeProjects.length!==1?"s":""} in progress`}/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:5,marginBottom:16}}>
          <S value={pFilter} onChange={(e: any)=>setPFilter(e.target.value)} s={{fontSize:11,padding:"5px 10px"}}>
            {FILTERS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </S>
          <S value={pSort} onChange={(e: any)=>setPSort(e.target.value)} s={{fontSize:11,padding:"5px 10px"}}>
            {SORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </S>
        </div>

        {filteredProjects.length===0&&<p style={{fontSize:12,color:C.muted}}>No projects match this filter.</p>}

        {needsAction.length>0&&<>
          <p style={{fontSize:11,color:C.red,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 6px",fontWeight:"600"}}>Needs your action</p>
          {needsAction.map((pr: any,i: number)=><Row key={i} pr={pr}/>)}
        </>}

        {inProgress.length>0&&<>
          <p style={{fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:`${needsAction.length>0?"20px":"0"} 0 6px`,fontWeight:"600"}}>In progress</p>
          {inProgress.map((pr: any,i: number)=><Row key={i} pr={pr}/>)}
        </>}
      </div>
    );
  }
  if(drill==="revenue"){
    // filter + sort
    const revFiltered=revYear==="all"?paid:paid.filter((pr: any)=>String(yearOf(pr))===revYear);
    const revSorted=(()=>{
      const arr=[...revFiltered];
      if(revSort==="date_new")arr.sort((a: any,b: any)=>b.date.localeCompare(a.date));
      else if(revSort==="date_old")arr.sort((a: any,b: any)=>a.date.localeCompare(b.date));
      else if(revSort==="amount_hi")arr.sort((a: any,b: any)=>b.amount-a.amount);
      else if(revSort==="amount_lo")arr.sort((a: any,b: any)=>a.amount-b.amount);
      else if(revSort==="client")arr.sort((a: any,b: any)=>(a.cName||"").localeCompare(b.cName||""));
      return arr;
    })();
    // group by year then month
    const revGroups: {year:number,months:{month:number,rows:any[]}[]}[]=[];
    revSorted.forEach((pr: any)=>{
      const y=yearOf(pr),m=monthOf(pr);
      let yg=revGroups.find(g=>g.year===y);
      if(!yg){yg={year:y,months:[]};revGroups.push(yg);}
      let mg=yg.months.find(x=>x.month===m);
      if(!mg){mg={month:m,rows:[]};yg.months.push(mg);}
      mg.rows.push(pr);
    });
    return(
      <div>
        <DrillBack onClick={()=>setDrill(null)}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4,flexWrap:"wrap" as const,gap:8}}>
          <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Revenue</h2>
          <span style={{fontFamily:SERIF,fontSize:20,color:C.black}}>{fmt(rev)}</span>
        </div>
        <p style={{fontSize:12,color:C.muted,margin:"0 0 16px"}}>{paid.length} paid project{paid.length!==1?"s":""} · all time</p>
        <div style={{display:"flex",justifyContent:"flex-end",gap:5,marginBottom:20}}>
          <S value={revYear} onChange={(e: any)=>setRevYear(e.target.value)} s={{fontSize:11,padding:"5px 10px"}}>
            <option value="all">All years</option>
            {allYears.map((y: number)=><option key={y} value={String(y)}>{y}</option>)}
          </S>
          <S value={revSort} onChange={(e: any)=>setRevSort(e.target.value)} s={{fontSize:11,padding:"5px 10px"}}>
            <option value="date_new">Newest first</option>
            <option value="date_old">Oldest first</option>
            <option value="amount_hi">Amount ↓</option>
            <option value="amount_lo">Amount ↑</option>
            <option value="client">Client A→Z</option>
          </S>
        </div>
        {revSorted.length===0&&<p style={{fontSize:12,color:C.muted}}>No paid projects yet.</p>}
        {revGroups.map((yg,yi)=>(
          <div key={yg.year} style={{marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",paddingBottom:8,borderBottom:`2px solid ${yg.year===nowY?C.black:C.rule}`,marginBottom:4}}>
              <span style={{fontSize:13,color:yg.year===nowY?C.black:C.muted,fontWeight:"600",letterSpacing:"0.04em"}}>{yg.year}{yg.year===nowY?" · Current":""}</span>
              <span style={{fontFamily:SERIF,fontSize:15,color:C.black}}>{fmt(yg.months.flatMap((m: any)=>m.rows).reduce((s: number,pr: any)=>s+pr.amount,0))}</span>
            </div>
            {yg.months.map((mg: any)=>(
              <div key={mg.month} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"8px 0 4px"}}>
                  <span style={{fontSize:11,color:C.light,letterSpacing:"0.09em",textTransform:"uppercase" as const}}>{MO[mg.month]} {yg.year}</span>
                  <span style={{fontSize:11,color:C.muted}}>{fmt(mg.rows.reduce((s: number,pr: any)=>s+pr.amount,0))}</span>
                </div>
                {mg.rows.map((pr: any,i: number)=>(
                  <div key={i} onClick={()=>goToProject(pr.cName,pr.qd?.qNo,"revenue")} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.rule}`,gap:10,cursor:"pointer"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap" as const}}>
                        <span style={{fontSize:13,color:C.black,fontWeight:"500"}}>{pr.cName}</span>
                        <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?90:200}}>{pr.name}</span>
                      </div>
                      <span style={{fontSize:11,color:C.light}}>{fmtD(pr.date)}</span>
                    </div>
                    <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flexShrink:0}}>{fmt(pr.amount)}</span>
                    <span style={{fontSize:11,color:C.light}}>→</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if(drill==="month"){
    return(
      <div>
        <DrillBack onClick={()=>setDrill(null)}/>
        <DrillHeader title="Revenue by Month" count={fmt(thisYearRev)} sub={`${nowY} · Jan — ${MO[nowM]}`}/>
        {[...monthsToShow].reverse().map((m: number)=>{
          const mPaid=paid.filter((pr: any)=>yearOf(pr)===nowY&&monthOf(pr)===m);
          const mRev=mPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
          return(
            <div key={m} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px",marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:mPaid.length?8:0}}>
                <span style={{fontSize:13,color:m===nowM?C.black:C.muted,fontWeight:m===nowM?"500":"normal"}}>{MO[m]} {nowY}{m===nowM?" · This month":""}</span>
                <span style={{fontFamily:SERIF,fontSize:20,color:mRev>0?C.black:C.light}}>{mRev>0?fmt(mRev):"—"}</span>
              </div>
              {mPaid.slice(0,3).map((pr: any,i: number)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                  <span style={{fontSize:12,color:C.muted}}>{pr.cName} · {pr.name}</span>
                  <span style={{fontSize:12}}>{fmt(pr.amount)}</span>
                </div>
              ))}
              {mPaid.length===0&&<p style={{fontSize:12,color:C.light,margin:0}}>No paid projects</p>}
              {mPaid.length>3&&<p style={{fontSize:11,color:C.light,margin:"4px 0 0"}}>+{mPaid.length-3} more</p>}
            </div>
          );
        })}
      </div>
    );
  }
  if(drill==="license"){
    const setAction=(key: string,val: string)=>setLicenseActions(prev=>({...prev,[key]:val}));
    const tabPillLS=(active: boolean):any=>({padding:"6px 15px",border:`1px solid ${active?C.black:C.rule}`,background:active?C.black:"none",color:active?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase" as const,outline:"none"});
    const usageLics=allLicenses.filter((r: any)=>r.type==="usage");
    const exclLics=allLicenses.filter((r: any)=>r.type==="excl");
    const tabLics=licTab==="usage"?usageLics:exclLics;
    // for dashboard card: only show items needing attention (not ignored/taken down)
    const actionedStatuses=["ignored","takendown","renewal"];
    const needsAttention=(r: any)=>!actionedStatuses.includes(licenseActions[r.key]||"");
    // group rows: expiring (≤7d) + expired-unactioned → active → actioned
    const expired=(r: any)=>{const d=dLeft(r.end);return d!==null&&d<0;};
    const expiring=(r: any)=>{const d=dLeft(r.end);return d!==null&&d>=0&&d<=7;};
    const urgentRows=tabLics.filter((r: any)=>(expired(r)||expiring(r))&&needsAttention(r));
    const activeRows=tabLics.filter((r: any)=>!expired(r)&&!expiring(r)&&needsAttention(r));
    const actionedRows=tabLics.filter((r: any)=>!needsAttention(r));
    const STATUS_LABELS: Record<string,string>={ignored:"Ignored",takendown:"Taken down",renewal:"Renewal pending"};
    const ACTION_OPTS=[
      {val:"ignored",label:"Ignore"},
      {val:"takendown",label:"Mark taken down"},
      {val:"renewal",label:"Renewal (coming soon)",disabled:true},
    ];
    const LicRow=({r}: {r: any})=>{
      const d=dLeft(r.end);
      const isExpired=d!==null&&d<0;
      const isExpiring=d!==null&&d>=0&&d<=7;
      const act=licenseActions[r.key]||"";
      const isActioned=actionedStatuses.includes(act);
      const daysText=isExpired?`+${Math.abs(d!)}d expired`:isExpiring?`${d}d left`:`${d}d`;
      const dCol=isExpired?C.red:isExpiring?C.amber:C.green;
      return(
        <div style={{padding:"10px 0",borderBottom:`1px solid ${C.rule}`,opacity:isActioned?0.5:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* days indicator */}
            <span style={{fontSize:12,color:dCol,fontWeight:"500",flexShrink:0,minWidth:88}}>{daysText}</span>
            {/* info */}
            <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>goToProject(r.cName)}>
              <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:C.black,fontWeight:"500"}}>{r.cName}</span>
                <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?90:200}}>{r.prName}</span>
              </div>
              <span style={{fontSize:11,color:C.light}}>{licTab==="excl"?(isExpired?"Free to work again":"Blocked until"):("Expires")} {fmtD(r.end)}</span>
            </div>
            {/* status badge if actioned */}
            {isActioned&&<span style={{fontSize:11,color:C.muted,border:`1px solid ${C.rule}`,padding:"2px 8px",borderRadius:2,flexShrink:0}}>{STATUS_LABELS[act]}</span>}
            {/* action buttons — only when not yet actioned and expired/expiring */}
            {!isActioned&&(isExpired||isExpiring)&&licTab==="usage"&&(
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {ACTION_OPTS.map(o=>(
                  <button key={o.val} onClick={()=>setAction(r.key,o.val)} disabled={o.disabled}
                    style={{fontSize:11,padding:"5px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:o.disabled?"not-allowed":"pointer",color:o.disabled?C.light:C.muted,fontFamily:SANS,letterSpacing:"0.04em",whiteSpace:"nowrap",opacity:o.disabled?0.5:1}}
                  >{o.label}</button>
                ))}
              </div>
            )}
            {/* for excl expired — just a note, no action needed */}
            {!isActioned&&isExpired&&licTab==="excl"&&(
              <button onClick={()=>setAction(r.key,"ignored")} style={{fontSize:11,padding:"5px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",color:C.muted,fontFamily:SANS,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>Mark noted</button>
            )}
          </div>
        </div>
      );
    };
    return(
      <div>
        <DrillBack onClick={()=>setDrill(null)}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>License Tracker</h2>
          <div style={{display:"flex"}}>
            <button onClick={()=>setLicTab("usage")} style={{...tabPillLS(licTab==="usage"),borderRadius:"2px 0 0 2px"}}>Usage Rights <span style={{marginLeft:4,fontSize:10,opacity:0.7}}>{usageLics.length}</span></button>
            <button onClick={()=>setLicTab("excl")} style={{...tabPillLS(licTab==="excl"),borderRadius:"0 2px 2px 0",borderLeft:"none"}}>Exclusivity <span style={{marginLeft:4,fontSize:10,opacity:0.7}}>{exclLics.length}</span></button>
          </div>
        </div>
        {licTab==="usage"&&<p style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>Track when brands' usage rights expire. Expired = they may still be running your content. Mark as ignored, taken down, or flag for renewal.</p>}
        {licTab==="excl"&&<p style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>Track exclusivity periods. Active = you cannot work with competing brands. Expired = you are free to work again.</p>}
        {tabLics.length===0&&<p style={{fontSize:12,color:C.muted}}>No {licTab==="usage"?"usage rights":"exclusivity periods"} tracked.</p>}
        {urgentRows.length>0&&(
          <div style={{marginBottom:16}}>
            <p style={{fontSize:11,color:C.red,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6,fontWeight:"600"}}>Needs attention</p>
            {urgentRows.map((r: any)=><LicRow key={r.key} r={r}/>)}
          </div>
        )}
        {activeRows.length>0&&(
          <div style={{marginBottom:16}}>
            {urgentRows.length>0&&<p style={{fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6,fontWeight:"600",marginTop:20}}>Active</p>}
            {activeRows.map((r: any)=><LicRow key={r.key} r={r}/>)}
          </div>
        )}
        {actionedRows.length>0&&(
          <div style={{marginTop:20}}>
            <p style={{fontSize:11,color:C.light,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6,fontWeight:"600"}}>Handled</p>
            {actionedRows.map((r: any)=><LicRow key={r.key} r={r}/>)}
          </div>
        )}
      </div>
    );
  }
  // ── Invoices drill-down ──────────────────────────────────
  if(drill==="invoices"){
    const allInvRows=buildInvoiceRows(clients);
    const tabRows=invTab==="unpaid"?allInvRows.filter((r: any)=>!r.pr.paid):allInvRows.filter((r: any)=>r.pr.paid);
    // build period options: "all", "y:2026", "m:2026:4"
    const allInvYears=Array.from(new Set(allInvRows.map((r: any)=>r.year))).sort((a: any,b: any)=>b-a) as number[];
    const periodOptions: {value:string,label:string,indent:boolean}[]=[{value:"all",label:"All periods",indent:false}];
    allInvYears.forEach(y=>{
      periodOptions.push({value:`y:${y}`,label:String(y),indent:false});
      const monthsInYear=Array.from(new Set(allInvRows.filter((r: any)=>r.year===y).map((r: any)=>r.month))).sort((a: any,b: any)=>b-a) as number[];
      monthsInYear.forEach(m=>periodOptions.push({value:`m:${y}:${m}`,label:`${MO_SHORT[m]} ${y}`,indent:true}));
    });
    const filteredInvRows=tabRows.filter((r: any)=>{
      if(invYear==="all")return true;
      if(invYear.startsWith("y:"))return String(r.year)===invYear.slice(2);
      if(invYear.startsWith("m:")){const[,y,m]=invYear.split(":");return String(r.year)===y&&String(r.month)===m;}
      return true;
    });
    // group by year→month, newest first
    const invGrouped: {year:number,months:{month:number,rows:any[]}[]}[]=[];
    filteredInvRows.forEach((r: any)=>{
      let yg=invGrouped.find(g=>g.year===r.year);
      if(!yg){yg={year:r.year,months:[]};invGrouped.push(yg);}
      let mg=yg.months.find(m=>m.month===r.month);
      if(!mg){mg={month:r.month,rows:[]};yg.months.push(mg);}
      mg.rows.push(r);
    });
    invGrouped.sort((a,b)=>b.year-a.year);
    invGrouped.forEach(yg=>yg.months.sort((a,b)=>b.month-a.month));

    const toggleSel=(key: string)=>setInvSel(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);return n;});
    const selRows=filteredInvRows.filter((r: any)=>invSel.has(r.iNo));

    const openInvPreview=(r: any)=>{
      const pr=r.pr;const q=pr.qd;
      setInvPdfData({data:{brand:q?.brand,contact:q?.contact,date:pr.date||today(),qNo:q?.qNo,iNo:r.iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Thank you for the pleasure of working together."},type:"invoice"});
    };

    const doInvBulk=async(rows: any[])=>{
      if(!rows.length||invBulkStatus)return;
      setInvBulkStatus(`Preparing ${rows.length} invoice${rows.length>1?"s":""}…`);
      const [{default:html2canvas},{default:jsPDF}]=await Promise.all([import("html2canvas"),import("jspdf")]);
      for(let i=0;i<rows.length;i++){
        const r=rows[i];const pr=r.pr;const q=pr.qd;
        const d={brand:q?.brand,contact:q?.contact,date:pr.date||today(),qNo:q?.qNo,iNo:r.iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Thank you for the pleasure of working together."};
        setInvBulkStatus(`Saving ${i+1}/${rows.length} — ${r.iNo}`);
        const wrap=document.createElement("div");
        wrap.style.cssText="position:fixed;left:-9999px;top:0;width:595px;z-index:-1;background:#faf9f7;";
        document.body.appendChild(wrap);
        const {createRoot:cr}=await import("react-dom/client");
        const root=cr(wrap);
        await new Promise<void>(res=>{root.render(<A4 d={d} type="invoice" lang="en" settings={settings} extraSigMargin={0} clauseGuards={[]} tRowGuards={[]}/>);setTimeout(res,600);});
        try{
          const pages=Array.from(wrap.querySelectorAll("[data-pdf-page]")) as HTMLElement[];
          const pdf=new (jsPDF as any)({orientation:"portrait",unit:"mm",format:"a4"});
          const pw=pdf.internal.pageSize.getWidth();const ph=pdf.internal.pageSize.getHeight();
          for(let p=0;p<pages.length;p++){
            if(p>0)pdf.addPage();
            const canvas=await (html2canvas as any)(pages[p],{scale:2,useCORS:true,backgroundColor:"#faf9f7"});
            pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,pw,ph);
          }
          pdf.save(`${(pr.date||"").replace(/-/g,"_")} ${r.iNo}.pdf`);
        }finally{root.unmount();document.body.removeChild(wrap);}
        if(i<rows.length-1)await new Promise(res=>setTimeout(res,400));
      }
      setInvBulkStatus(null);setInvSel(new Set());
    };

    const exportMonthCsv=(rows: any[],label: string)=>{
      const headers=["Month","Invoice No.","Client","Project","Type of Work","Collab","TikToks","Reels","Posts","Stories","Income","Expenses","Delivery Date","Payment Status"];
      const lines=[headers];
      rows.forEach(r=>{
        const pr=r.pr;const q=pr.qd;
        const mo=r.dateStr?`${MO_SHORT[r.month]} ${String(r.year).slice(2)}`:"";
        const typeOfWork=getTypeOfWork(pr);
        const isCollab=q?.ctab==="influencer";
        const ls=q?.lines||[];
        const collab=isCollab?String(ls.filter((l:any)=>l.name?.toLowerCase().includes("photo")||l.name?.toLowerCase().includes("carousel")||l.name?.toLowerCase().includes("set")).reduce((s:number,l:any)=>s+(l.qty||1),0)||""):"";
        const tiktoks=isCollab?String(ls.filter((l:any)=>l.name?.toLowerCase().includes("tiktok")||(l.platforms||[]).includes("TikTok")).reduce((s:number,l:any)=>s+(l.qty||1),0)||""):"";
        const reels=isCollab?String(ls.filter((l:any)=>l.name?.toLowerCase().includes("reel")||(l.platforms||[]).includes("Instagram")).reduce((s:number,l:any)=>s+(l.qty||1),0)||""):"";
        const stories=isCollab?String(ls.filter((l:any)=>l.name?.toLowerCase().includes("story")||l.name?.toLowerCase().includes("storie")).reduce((s:number,l:any)=>s+(l.qty||1),0)||""):"";
        const income=pr.amount?`€ ${Number(pr.amount).toFixed(2).replace(".",",")}` :"€ 0,00";
        lines.push([mo,r.iNo,r.cName,pr.name,typeOfWork,collab,tiktoks,reels,"",stories,income,"€ 0,00",pr.deliveryDate||"",pr.paid?"paid":"invoiced"]);
      });
      const csv=lines.map(row=>row.map((v:string)=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
      const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`${label.replace(/\s/g,"_")}.csv`;a.click();
      URL.revokeObjectURL(url);
    };

    const selBtnS: any={height:26,padding:"0 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:11,letterSpacing:"0.07em",color:C.muted,whiteSpace:"nowrap"};
    const filterS: any={height:28,padding:"0 8px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.bg,fontFamily:SANS,fontSize:11,color:C.black,outline:"none"};
    const allChecked=filteredInvRows.length>0&&filteredInvRows.every((r: any)=>invSel.has(r.iNo));
    const someChecked=!allChecked&&filteredInvRows.some((r: any)=>invSel.has(r.iNo));
    const toggleAll=()=>{
      if(allChecked){setInvSel(new Set());}
      else{setInvSel(new Set(filteredInvRows.map((r: any)=>r.iNo)));}
    };

    if(invPdfData)return<PDFModal data={invPdfData.data} type={invPdfData.type} onClose={()=>setInvPdfData(null)} settings={settings}/>;

    const tabPillS=(active: boolean):any=>({
      padding:"6px 15px",border:`1px solid ${active?C.black:C.rule}`,background:active?C.black:"none",
      color:active?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:11,letterSpacing:"0.1em",
      textTransform:"uppercase" as const,outline:"none"
    });

    return(
      <div>
        {/* back */}
        <DrillBack onClick={()=>{setDrill(null);setInvSel(new Set());}}/>

        {/* title + tabs top right */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8,flexWrap:"wrap"}}>
          <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Invoices</h2>
          <div style={{display:"flex"}}>
            <button onClick={()=>{setInvTab("unpaid");setInvSel(new Set());}} style={{...tabPillS(invTab==="unpaid"),borderRadius:"2px 0 0 2px"}}>
              Unpaid <span style={{marginLeft:4,fontSize:10,opacity:0.7}}>{allInvRows.filter((r: any)=>!r.pr.paid).length}</span>
            </button>
            <button onClick={()=>{setInvTab("paid");setInvSel(new Set());}} style={{...tabPillS(invTab==="paid"),borderRadius:"0 2px 2px 0",borderLeft:"none"}}>
              Paid <span style={{marginLeft:4,fontSize:10,opacity:0.7}}>{allInvRows.filter((r: any)=>r.pr.paid).length}</span>
            </button>
          </div>
        </div>

        {/* filter + export row — no border */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <select value={invYear} onChange={(e: any)=>{setInvYear(e.target.value);setInvSel(new Set());}} style={filterS}>
            {periodOptions.map(o=>(
              <option key={o.value} value={o.value}>
                {o.indent?`  ${o.label}`:o.label}
              </option>
            ))}
          </select>
          <button
            onClick={()=>exportMonthCsv(filteredInvRows,invYear==="all"?"all_invoices":invYear.replace(/[:\s]/g,"_"))}
            title="Export current view as CSV"
            style={{height:28,padding:"0 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:SANS,fontSize:11,color:C.muted,letterSpacing:"0.07em"}}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke={C.muted} strokeWidth="1.1"/><line x1="3" y1="4" x2="9" y2="4" stroke={C.muted} strokeWidth="1.1"/><line x1="3" y1="6" x2="9" y2="6" stroke={C.muted} strokeWidth="1.1"/><line x1="3" y1="8" x2="7" y2="8" stroke={C.muted} strokeWidth="1.1"/></svg>
            Export CSV
          </button>
        </div>

        {filteredInvRows.length===0&&<p style={{fontSize:12,color:C.muted}}>No invoices match this filter.</p>}

        {invGrouped.map((yg,yi)=>(
          <div key={yg.year}>
            <p style={{fontSize:12,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:`${yi===0?"0":"20px"} 0 10px`,fontWeight:"600"}}>{yg.year}</p>
            {yg.months.map(mg=>(
              <div key={mg.month} style={{marginBottom:20}}>
                {/* month header — no border, just spacing */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <span style={{fontSize:12,color:C.light,letterSpacing:"0.09em",textTransform:"uppercase"}}>{MO_LONG[mg.month]} {yg.year} · {mg.rows.length}</span>
                  <button
                    onClick={()=>exportMonthCsv(mg.rows,`${MO_SHORT[mg.month]}_${yg.year}`)}
                    title={`Download ${MO_LONG[mg.month]} ${yg.year} as CSV`}
                    style={{height:22,padding:"0 8px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:SANS,fontSize:11,color:C.muted,letterSpacing:"0.06em"}}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke={C.muted} strokeWidth="1.1"/><line x1="3" y1="4" x2="9" y2="4" stroke={C.muted} strokeWidth="1.1"/><line x1="3" y1="6" x2="9" y2="6" stroke={C.muted} strokeWidth="1.1"/><line x1="3" y1="8" x2="7" y2="8" stroke={C.muted} strokeWidth="1.1"/></svg>
                    CSV
                  </button>
                </div>

                {/* select all — right-aligned, directly above checkboxes, no line */}
                {mg.rows.length>0&&(
                  <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:6,padding:"4px 0 2px"}}>
                    <span style={{fontSize:11,color:C.light,letterSpacing:"0.04em"}}>select all</span>
                    <input type="checkbox"
                      checked={mg.rows.every((r: any)=>invSel.has(r.iNo))}
                      ref={(el)=>{if(el)el.indeterminate=!mg.rows.every((r: any)=>invSel.has(r.iNo))&&mg.rows.some((r: any)=>invSel.has(r.iNo));}}
                      onChange={()=>{
                        const allCheckedInMonth=mg.rows.every((r: any)=>invSel.has(r.iNo));
                        setInvSel(prev=>{
                          const n=new Set(prev);
                          if(allCheckedInMonth){mg.rows.forEach((r: any)=>n.delete(r.iNo));}
                          else{mg.rows.forEach((r: any)=>n.add(r.iNo));}
                          return n;
                        });
                      }}
                      style={{flexShrink:0,cursor:"pointer",accentColor:C.black,width:13,height:13}}
                    />
                  </div>
                )}

                {/* one separator line between month header area and first invoice */}
                <div style={{borderTop:`1px solid ${C.rule}`}}/>

                {mg.rows.map((r: any,i: number)=>{
                  const pr=r.pr;
                  const isChecked=invSel.has(r.iNo);
                  return(
                    <div key={r.iNo+i} style={{display:"flex",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.rule}`,gap:10,background:isChecked?"rgba(0,0,0,0.015)":undefined}}>
                      {/* ↓ plain arrow — download PDF */}
                      <button
                        onClick={(e: any)=>{e.stopPropagation();doInvBulk([r]);}}
                        disabled={!!invBulkStatus}
                        title="Download PDF"
                        style={{flexShrink:0,background:"none",border:"none",cursor:invBulkStatus?"not-allowed":"pointer",padding:0,fontSize:14,color:C.light,fontFamily:SANS,opacity:invBulkStatus?0.4:1,lineHeight:1}}
                      >↓</button>
                      {/* main info — clickable to preview */}
                      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>openInvPreview(r)}>
                        <div style={{display:"flex",alignItems:"baseline",gap:7,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,color:C.black,fontWeight:"500"}}>{r.iNo}</span>
                          <span style={{fontSize:12,color:C.muted}}>{r.cName}</span>
                          <span style={{fontSize:12,color:C.light}}>·</span>
                          <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?90:200}}>{pr.name}</span>
                        </div>
                        <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontSize:11,color:C.light,letterSpacing:"0.07em"}}>{fmtD(pr.date)}</span>
                          <span style={{fontSize:11,color:pr.paid?C.green:C.amber,border:`1px solid ${pr.paid?C.greenBorder:C.amberBorder}`,padding:"2px 7px",borderRadius:2,letterSpacing:"0.06em"}}>{pr.paid?"Paid":"Invoiced"}</span>
                        </div>
                      </div>
                      {/* amount */}
                      <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flexShrink:0}}>{fmt(pr.amount)}</span>
                      {/* checkbox right */}
                      <input type="checkbox" checked={isChecked} onChange={()=>toggleSel(r.iNo)}
                        style={{flexShrink:0,cursor:"pointer",accentColor:C.black,width:13,height:13}}
                        onClick={(e: any)=>e.stopPropagation()}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        {/* bulk bar — bottom, appears when rows selected */}
        {invSel.size>0&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:2,marginTop:12}}>
            <span style={{fontSize:12,color:C.amber}}>{invSel.size} selected</span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setInvSel(new Set())} style={{...selBtnS,color:C.amber,border:`1px solid ${C.amberBorder}`}}>Clear</button>
              <button onClick={()=>doInvBulk(selRows)} disabled={!!invBulkStatus} style={{...selBtnS,background:C.black,color:C.white,border:"none",opacity:invBulkStatus?0.5:1}}>
                {invBulkStatus||`↓ Download ${invSel.size} PDF${invSel.size>1?"s":""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Open Quotes drill-down ─────────────────────────────
  if(drill==="quotes"){
    const daysColor=(d: number)=>d>=14?C.red:d>=7?C.amber:C.muted;
    // sort by expiry: expired first, then soonest expiry, then no expiry
    const sorted=[...openQ].sort((a: any,b: any)=>{
      const aExp=a.qd?.validUntil?new Date(a.qd.validUntil).getTime():Infinity;
      const bExp=b.qd?.validUntil?new Date(b.qd.validUntil).getTime():Infinity;
      return aExp-bExp;
    });
    const totalQ=openQ.reduce((s: number,pr: any)=>s+pr.amount,0);
    return(
      <div>
        <DrillBack onClick={()=>setDrill(null)}/>
        <DrillHeader title="Open Quotes" count={fmt(totalQ)}/>
        {sorted.length===0&&<p style={{fontSize:12,color:C.muted}}>No open quotes.</p>}
        {sorted.map((pr: any,i: number)=>{
          const daysSent=pr.date?Math.floor((Date.now()-new Date(pr.date).getTime())/86400000):null;
          const expiry=pr.qd?.validUntil;
          const daysLeft=expiry?Math.ceil((new Date(expiry).getTime()-Date.now())/86400000):null;
          const expired=daysLeft!==null&&daysLeft<0;
          const isRev=pr.status==="revised";
          const expiryCol=expired?C.red:daysLeft!==null&&daysLeft<=7?C.amber:C.green;
          return(
            <div key={i} onClick={()=>goToProject(pr.cName,pr.qd?.qNo)} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.rule}`,gap:10,cursor:"pointer"}}>
              {/* days since sent */}
              <span style={{fontSize:12,color:daysSent!==null?daysColor(daysSent):C.light,flexShrink:0,minWidth:32,fontWeight:"500"}}>{daysSent!==null?`${daysSent}d`:"—"}</span>
              {/* info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,color:C.black,fontWeight:"500"}}>{pr.cName}</span>
                  <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?100:220}}>{pr.name}</span>
                  {isRev&&<span style={{fontSize:10,color:C.amber,border:`1px solid ${C.amberBorder}`,padding:"1px 5px",borderRadius:2,letterSpacing:"0.06em"}}>Revised</span>}
                </div>
                {expiry&&<div style={{marginTop:3}}>
                  <span style={{fontSize:11,color:expiryCol}}>{expired?`Expired ${Math.abs(daysLeft!)}d ago`:`Expires in ${daysLeft}d · ${fmtD(expiry)}`}</span>
                </div>}
              </div>
              {/* amount */}
              <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flexShrink:0}}>{fmt(pr.amount)}</span>
              <span style={{fontSize:11,color:C.light}}>→</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Unsigned Contracts drill-down ───────────────────────
  if(drill==="contracts"){
    const unsignedAll=all.filter((pr: any)=>pr.status==="contracted");
    const sorted=[...unsignedAll].sort((a: any,b: any)=>{
      const ad=a.date?new Date(a.date).getTime():0;
      const bd=b.date?new Date(b.date).getTime():0;
      return ad-bd;
    });
    const totalC=unsignedAll.reduce((s: number,pr: any)=>s+pr.amount,0);
    const hasUrgent=unsignedAll.some((pr: any)=>{
      const d=pr.date?Math.floor((Date.now()-new Date(pr.date).getTime())/86400000):0;
      return d>=14;
    });
    const daysColor=(d: number)=>d>=14?C.red:d>=7?C.amber:C.muted;
    return(
      <div>
        <DrillBack onClick={()=>setDrill(null)}/>
        <DrillHeader title="Unsigned Contracts" count={<span style={{color:hasUrgent?C.amber:C.black}}>{fmt(totalC)}</span>}/>
        {hasUrgent&&<p style={{fontSize:12,color:C.red,marginBottom:16,letterSpacing:"0.03em"}}>One or more contracts waiting 14+ days — follow up now.</p>}
        {!hasUrgent&&<div style={{marginBottom:16}}/>}
        {sorted.length===0&&<p style={{fontSize:12,color:C.muted}}>No unsigned contracts.</p>}
        {sorted.map((pr: any,i: number)=>{
          const days=pr.date?Math.floor((Date.now()-new Date(pr.date).getTime())/86400000):null;
          const col=days!==null?daysColor(days):C.muted;
          return(
            <div key={i} onClick={()=>goToProject(pr.cName,pr.qd?.qNo)} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.rule}`,gap:10,cursor:"pointer",background:days!==null&&days>=14?"rgba(192,133,122,0.04)":undefined}}>
              {/* days waiting */}
              <span style={{fontSize:12,color:col,flexShrink:0,minWidth:32,fontWeight:"500"}}>{days!==null?`${days}d`:"—"}</span>
              {/* info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,color:C.black,fontWeight:"500"}}>{pr.cName}</span>
                  <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?100:220}}>{pr.name}</span>
                </div>
                <span style={{fontSize:11,color:col,marginTop:2,display:"block"}}>{days!==null&&days>=14?"Overdue for signature":days!==null&&days>=7?"Waiting a while":"Sent "+fmtD(pr.date)}</span>
              </div>
              {/* amount */}
              <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flexShrink:0}}>{fmt(pr.amount)}</span>
              <span style={{fontSize:11,color:C.light}}>→</span>
            </div>
          );
        })}
      </div>
    );
  }

  const unsignedC=all.filter((pr: any)=>pr.status==="contracted");
  return(
    <div>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 16px"}}>Dashboard</h2>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>

        {/* 1 — Revenue */}
        <Card label="Revenue" count={fmt(rev)} onClick={()=>setDrill("revenue")}
          sub={<>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
              <span style={{fontSize:10,color:C.muted}}>{nowY}</span>
              <span style={{fontSize:10,color:C.black}}>{fmt(thisYearRev)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
              <span style={{fontSize:10,color:C.muted}}>{MO[nowM]} {nowY}</span>
              <span style={{fontSize:10,color:C.black}}>{fmt(thisMonthRev)}</span>
            </div>
          </>}
        />

        {/* 2 — Invoices */}
        <Card label="Invoices" count={unpaid.length>0?<span style={{color:C.amber}}>{unpaid.length} unpaid</span>:0} onClick={()=>setDrill("invoices")}
          sub={<>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
              <span style={{fontSize:10,color:C.amber}}>Unpaid · {unpaid.length}</span>
              <span style={{fontSize:10,color:C.amber}}>{fmt(out)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
              <span style={{fontSize:10,color:C.muted}}>Paid · {paid.length}</span>
              <span style={{fontSize:10,color:C.muted}}>{fmt(rev)}</span>
            </div>
          </>}
        />

      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>

        {/* 3 — Open Quotes */}
        <Card label="Open Quotes" count={fmt(openQ.reduce((s: number,pr: any)=>s+pr.amount,0))} warm={openQ.length>0} onClick={()=>setDrill("quotes")}
          sub={<>
            {openQ.length===0&&<p style={{fontSize:10,color:C.light,margin:0}}>—</p>}
            <p style={{fontSize:9.5,color:C.muted,margin:"0 0 4px"}}>{openQ.length} quote{openQ.length!==1?"s":""}</p>
            {[...openQ].sort((a: any,b: any)=>{const ae=a.qd?.validUntil?new Date(a.qd.validUntil).getTime():Infinity;const be=b.qd?.validUntil?new Date(b.qd.validUntil).getTime():Infinity;return ae-be;}).slice(0,3).map((pr: any,i: number)=>{
              const days=pr.date?Math.floor((Date.now()-new Date(pr.date).getTime())/86400000):null;
              const col=days!==null&&days>=14?C.red:days!==null&&days>=7?C.amber:C.light;
              return(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                  <span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{pr.cName}</span>
                  {days!==null&&<span style={{fontSize:9.5,color:col,fontWeight:days>=7?"500":"normal"}}>{days}d</span>}
                </div>
              );
            })}
            {openQ.length>3&&<p style={{fontSize:9.5,color:C.light,margin:"4px 0 0"}}>+{openQ.length-3} more</p>}
          </>}
        />

        {/* 4 — Unsigned Contracts */}
        {(()=>{
          const hasUrgentC=unsignedC.some((pr: any)=>pr.date&&Math.floor((Date.now()-new Date(pr.date).getTime())/86400000)>=14);
          const totalUC=unsignedC.reduce((s: number,pr: any)=>s+pr.amount,0);
          return(
            <div onClick={()=>setDrill("contracts")} style={{border:`1px solid ${hasUrgentC?C.amberBorder:C.rule}`,borderRadius:2,padding:"13px 15px",cursor:"pointer",background:hasUrgentC?C.amberBg:undefined}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>Unsigned Contracts</span>
                <span style={{fontFamily:SERIF,fontSize:20,color:unsignedC.length>0?C.black:C.light}}>{fmt(totalUC)}</span>
              </div>
              {unsignedC.length===0&&<p style={{fontSize:10,color:C.light,margin:0}}>—</p>}
              <p style={{fontSize:9.5,color:C.muted,margin:"0 0 4px"}}>{unsignedC.length} contract{unsignedC.length!==1?"s":""}</p>
              {[...unsignedC].sort((a: any,b: any)=>(a.date||"").localeCompare(b.date||"")).slice(0,3).map((pr: any,i: number)=>{
                const days=pr.date?Math.floor((Date.now()-new Date(pr.date).getTime())/86400000):null;
                const col=days!==null&&days>=14?C.red:days!==null&&days>=7?C.amber:C.light;
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                    <span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{pr.cName}</span>
                    {days!==null&&<span style={{fontSize:9.5,color:col,fontWeight:days>=7?"500":"normal"}}>{days}d</span>}
                  </div>
                );
              })}
              {unsignedC.length>3&&<p style={{fontSize:9.5,color:C.light,margin:"4px 0 0"}}>+{unsignedC.length-3} more</p>}
            </div>
          );
        })()}

      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>

        {/* 5 — Active Projects */}
        <Card label="Active Projects" count={fmt(activeProjects.reduce((s: number,pr: any)=>s+pr.amount,0))} onClick={()=>setDrill("projects")}
          sub={<>
            <p style={{fontSize:10,color:C.muted,margin:"0 0 6px"}}>{activeProjects.length} project{activeProjects.length!==1?"s":""} in progress</p>
            {activeProjects.slice(0,3).map((pr: any,i: number)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                <div style={{minWidth:0,flex:1}}>
                  <span style={{fontSize:10.5,color:C.muted}}>{pr.cName}</span>
                  <span style={{fontSize:9.5,color:C.light,display:"block"}}>{pr.name}</span>
                </div>
                <span style={{fontSize:10.5,flexShrink:0,marginLeft:8}}>{fmt(pr.amount)}</span>
              </div>
            ))}
            {activeProjects.length>3&&<p style={{fontSize:9.5,color:C.light,margin:"4px 0 0"}}>+{activeProjects.length-3} more</p>}
          </>}
        />

        {/* 6 — License Tracker */}
        {(()=>{
          const actionedStatuses=["ignored","takendown","renewal"];
          const needsAtt=(r: any)=>!actionedStatuses.includes(licenseActions[r.key]||"");
          const attLics=allLicenses.filter((r: any)=>needsAtt(r));
          const urgentCard=attLics.filter((r: any)=>{const d=dLeft(r.end);return d!==null&&d<=7;});
          const expiredCard=urgentCard.filter((r: any)=>{const d=dLeft(r.end);return d!==null&&d<0;});
          const allClear=attLics.length===0;
          const hasRed=expiredCard.length>0;
          const hasAmber=!hasRed&&urgentCard.length>0;
          const cardBorder=hasRed?C.redBorder:hasAmber?C.amberBorder:C.rule;
          const cardBg=hasRed?C.redBg:hasAmber?C.amberBg:undefined;
          // show top 3 needing attention sorted soonest first
          const toShow=[...attLics].sort((a: any,b: any)=>(dLeft(a.end)??999999)-(dLeft(b.end)??999999)).slice(0,3);
          return(
            <div onClick={()=>setDrill("license")} style={{border:`1px solid ${cardBorder}`,borderRadius:2,padding:"13px 15px",cursor:"pointer",background:cardBg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>License Tracker</span>
                <span style={{fontFamily:SERIF,fontSize:20,color:allClear?C.green:hasRed?C.red:hasAmber?C.amber:C.black}}>{allClear?"All clear":attLics.length}</span>
              </div>
              {allClear&&<p style={{fontSize:10,color:C.green,margin:0}}>No action needed</p>}
              {!allClear&&<>
                {toShow.map((r: any,i: number)=>{
                  const d=dLeft(r.end);
                  const isExp=d!==null&&d<0;
                  const isSoon=d!==null&&d>=0&&d<=7;
                  const col=isExp?C.red:isSoon?C.amber:C.muted;
                  const txt=isExp?`+${Math.abs(d!)}d`:d!==null?`${d}d`:"—";
                  return(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                      <div style={{minWidth:0,flex:1}}>
                        <span style={{fontSize:10,color:C.muted}}>{r.cName}</span>
                        <span style={{fontSize:9,color:C.light,marginLeft:5}}>{r.type==="excl"?"Excl.":"Usage"}</span>
                      </div>
                      <span style={{fontSize:9.5,color:col,fontWeight:isExp||isSoon?"500":"normal",flexShrink:0}}>{txt}</span>
                    </div>
                  );
                })}
                {attLics.length>3&&<p style={{fontSize:9.5,color:C.light,margin:"4px 0 0"}}>+{attLics.length-3} more</p>}
              </>}
            </div>
          );
        })()}

      </div>
    </div>
  );
}


// ─── INVOICES ─────────────────────────────────────────────
const CTYPE_LABEL: Record<string,string> = {influencer:"Collab (Influencer)",ugc:"UGC",editorial:"Editorial"};
const MO_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MO_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getTypeOfWork(pr: any): string {
  if(!pr.amount||pr.amount===0||pr.status==="lead"||pr.status==="quoted"||pr.status==="revised") return "Unpaid";
  const ctab = pr.qd?.ctab||"";
  return CTYPE_LABEL[ctab]||"Unpaid";
}

function buildInvoiceRows(clients: any[]) {
  const rows: any[] = [];
  clients.forEach((c: any) => {
    (c.projects||[]).forEach((pr: any) => {
      if(!["invoiced","paid"].includes(pr.status) && !pr.paid) return;
      const q = pr.qd;
      if(!q) return;
      const iNo = `INV-${(q.qNo||"").replace(/QUO-?/i,"").trim()||"001"}`;
      const dateStr = pr.date||q.date||"";
      rows.push({
        cid: c.id, cName: c.name, pr,
        iNo, dateStr,
        year: dateStr?parseInt(dateStr.slice(0,4)):0,
        month: dateStr?parseInt(dateStr.slice(5,7))-1:0,
      });
    });
  });
  rows.sort((a,b)=>b.dateStr.localeCompare(a.dateStr));
  return rows;
}

function exportExcel(rows: any[]) {
  const headers = ["Month","Invoice No.","Client","Project","Type of Work","Collab","TikToks","Reels","Posts","Stories","Income","Expenses","Delivery Date","Payment Status","Receipt Date"];
  const lines = [headers];
  rows.forEach(r => {
    const pr = r.pr; const q = pr.qd;
    const mo = r.dateStr ? `${MO_SHORT[r.month]} ${String(r.year).slice(2)}` : "";
    const typeOfWork = getTypeOfWork(pr);
    const isCollab = q?.ctab==="influencer";
    const lines2 = q?.lines||[];
    const collab = isCollab ? String(lines2.filter((l:any)=>l.name?.toLowerCase().includes("photo")||l.name?.toLowerCase().includes("carousel")||l.name?.toLowerCase().includes("set")).reduce((s:number,l:any)=>s+(l.qty||1),0)||"") : "";
    const tiktoks = isCollab ? String(lines2.filter((l:any)=>l.name?.toLowerCase().includes("tiktok")||(l.platforms||[]).includes("TikTok")).reduce((s:number,l:any)=>s+(l.qty||1),0)||"") : "";
    const reels = isCollab ? String(lines2.filter((l:any)=>l.name?.toLowerCase().includes("reel")||(l.platforms||[]).includes("Instagram")).reduce((s:number,l:any)=>s+(l.qty||1),0)||"") : "";
    const posts = "";
    const stories = isCollab ? String(lines2.filter((l:any)=>l.name?.toLowerCase().includes("story")||l.name?.toLowerCase().includes("storie")).reduce((s:number,l:any)=>s+(l.qty||1),0)||"") : "";
    const income = pr.amount ? `€ ${Number(pr.amount).toFixed(2).replace(".",",")}` : "€ 0,00";
    const expenses = "€ 0,00";
    const delivery = pr.deliveryDate ? pr.deliveryDate.split("-").reverse().join(".") : "";
    const payStatus = pr.paid ? "paid" : "invoiced";
    const receipt = pr.paid && pr.paidDate ? pr.paidDate.split("-").reverse().join(".") : "";
    lines.push([mo, r.iNo, r.cName, pr.name, typeOfWork, collab, tiktoks, reels, posts, stories, income, expenses, delivery, payStatus, receipt]);
  });
  const csv = lines.map(row => row.map((v:string) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="invoices.csv"; a.click();
  URL.revokeObjectURL(url);
}

function Invoices({clients,settings,isMobile,filterTab}: any) {
  const [pdfData,setPdfData]=useState<any>(null);
  const [dropOpen,setDropOpen]=useState(false);
  const [bulkStatus,setBulkStatus]=useState<string|null>(null);
  const allRows = buildInvoiceRows(clients);
  const rows = filterTab==="unpaid"?allRows.filter((r: any)=>!r.pr.paid):filterTab==="paid"?allRows.filter((r: any)=>r.pr.paid):allRows;

  const openPreview = (r: any) => {
    const pr=r.pr; const q=pr.qd;
    const iNo=r.iNo;
    setPdfData({data:{brand:q?.brand,contact:q?.contact,date:pr.date||today(),qNo:q?.qNo,iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Thank you for the pleasure of working together."},type:"invoice",lang:"en"});
  };

  const bulkDownload = async (rows: any[], label: string) => {
    if(!rows.length) return;
    setDropOpen(false);
    setBulkStatus(`Preparing ${rows.length} invoice${rows.length>1?"s":""}…`);
    const [{default:html2canvas},{default:jsPDF}]=await Promise.all([import("html2canvas"),import("jspdf")]);
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      const pr=r.pr; const q=pr.qd;
      const iNo=r.iNo;
      const d={brand:q?.brand,contact:q?.contact,date:pr.date||today(),qNo:q?.qNo,iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Thank you for the pleasure of working together."};
      setBulkStatus(`Saving ${i+1} / ${rows.length} — ${iNo}`);
      // render invoice into a hidden offscreen container
      const wrap=document.createElement("div");
      wrap.style.cssText="position:fixed;left:-9999px;top:0;width:595px;z-index:-1;background:#faf9f7;";
      document.body.appendChild(wrap);
      const {createRoot:cr}=await import("react-dom/client");
      const root=cr(wrap);
      await new Promise<void>(res=>{
        root.render(<A4 d={d} type="invoice" lang="en" settings={settings} extraSigMargin={0} clauseGuards={[]} tRowGuards={[]}/>);
        setTimeout(res,600);
      });
      try {
        const pages=Array.from(wrap.querySelectorAll("[data-pdf-page]")) as HTMLElement[];
        const pdf=new (jsPDF as any)({orientation:"portrait",unit:"mm",format:"a4"});
        const pw=pdf.internal.pageSize.getWidth();
        const ph=pdf.internal.pageSize.getHeight();
        for(let p=0;p<pages.length;p++){
          if(p>0)pdf.addPage();
          const canvas=await (html2canvas as any)(pages[p],{scale:2,useCORS:true,backgroundColor:"#faf9f7"});
          pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,pw,ph);
        }
        const dateStr=(pr.date||"").replace(/-/g,"_");
        pdf.save(`${dateStr} ${iNo}.pdf`);
      } finally {
        root.unmount();
        document.body.removeChild(wrap);
      }
      if(i<rows.length-1) await new Promise(res=>setTimeout(res,400));
    }
    setBulkStatus(null);
  };

  const grouped: {year:number,months:{month:number,rows:any[]}[]}[] = [];
  rows.forEach((r: any)=>{
    let yg=grouped.find(g=>g.year===r.year);
    if(!yg){yg={year:r.year,months:[]};grouped.push(yg);}
    let mg=yg.months.find(m=>m.month===r.month);
    if(!mg){mg={month:r.month,rows:[]};yg.months.push(mg);}
    mg.rows.push(r);
  });

  // month-only options for bulk dropdown
  const monthOptions: {label:string,rows:any[]}[] = [];
  grouped.forEach(yg=>yg.months.forEach(mg=>monthOptions.push({label:`${MO_LONG[mg.month]} ${yg.year}`,rows:mg.rows})));

  const btnStyle: any = {height:28,padding:"0 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.07em",color:C.muted,display:"flex",alignItems:"center",whiteSpace:"nowrap"};

  if(pdfData) return <PDFModal data={pdfData.data} type={pdfData.type} onClose={()=>setPdfData(null)} settings={settings}/>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
        {!filterTab&&<h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Invoices</h2>}
        {filterTab&&<div/>}
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {/* Bulk download dropdown — months only */}
          <div style={{position:"relative"}}>
            {dropOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setDropOpen(false)}/>}
            <div style={{display:"flex",alignItems:"center",border:`1px solid ${C.rule}`,borderRadius:2,overflow:"hidden"}}>
              <span style={{...btnStyle,border:"none",borderRadius:0,borderRight:`1px solid ${C.rule}`,paddingRight:9,cursor:"default",color:bulkStatus?C.light:C.muted}}>{bulkStatus||"Download"}</span>
              <button onClick={()=>!bulkStatus&&setDropOpen(o=>!o)} style={{...btnStyle,border:"none",borderRadius:0,padding:"0 8px",position:"relative",zIndex:200,opacity:bulkStatus?0.4:1}}>▾</button>
            </div>
            {dropOpen&&monthOptions.length>0&&<div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 16px rgba(0,0,0,0.08)",minWidth:170,zIndex:200,maxHeight:260,overflowY:"auto"}}>
              {monthOptions.map((opt,i)=>(
                <button key={i} onClick={()=>bulkDownload(opt.rows,opt.label)} style={{display:"block",width:"100%",padding:"8px 13px",background:"none",border:"none",borderBottom:i<monthOptions.length-1?`1px solid ${C.rule}`:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.muted,letterSpacing:"0.02em",boxSizing:"border-box"}}>{opt.label}</button>
              ))}
            </div>}
          </div>
          {/* Excel icon */}
          <button onClick={()=>exportExcel(rows)} title="Export all as Excel" style={{...btnStyle,padding:"0 8px"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 1v8M7 9l-3-3M7 9l3-3M2 11h10" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      {rows.length===0&&<p style={{fontSize:11,color:C.muted}}>No invoices yet. Projects move here once invoiced or paid.</p>}
      {grouped.map(yg=>(
        <div key={yg.year}>
          <div style={{marginBottom:8,marginTop:18}}>
            <p style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:0,fontWeight:"600"}}>{yg.year}</p>
          </div>
          {yg.months.map(mg=>(
            <div key={mg.month} style={{marginBottom:14}}>
              <div style={{padding:"6px 0",borderBottom:`1px solid ${C.rule}`,marginBottom:0}}>
                <p style={{fontSize:10,color:C.light,letterSpacing:"0.09em",textTransform:"uppercase",margin:0}}>{MO_LONG[mg.month]} {yg.year}</p>
              </div>
              {mg.rows.map((r,i)=>{
                const pr=r.pr;
                const typeOfWork=getTypeOfWork(pr);
                return(
                  <div key={r.iNo+i} style={{display:"flex",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.rule}`,gap:8,cursor:"pointer"}} onClick={()=>openPreview(r)}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"baseline",gap:7,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:C.black,fontWeight:"500"}}>{r.iNo}</span>
                        <span style={{fontSize:10,color:C.muted}}>{r.cName}</span>
                        <span style={{fontSize:10,color:C.light}}>·</span>
                        <span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?100:200}}>{pr.name}</span>
                      </div>
                      <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:9,color:C.light,letterSpacing:"0.07em"}}>{fmtD(pr.date)}</span>
                        <span style={{fontSize:9,color:C.light}}>·</span>
                        <span style={{fontSize:9,color:C.muted}}>{typeOfWork}</span>
                        <span style={{fontSize:9,color:pr.paid?C.green:C.amber,border:`1px solid ${pr.paid?C.greenBorder:C.amberBorder}`,padding:"1px 6px",borderRadius:2,letterSpacing:"0.06em"}}>{pr.paid?"Paid":"Invoiced"}</span>
                      </div>
                    </div>
                    <span style={{fontFamily:SERIF,fontSize:13,color:C.black,flexShrink:0}}>{fmt(pr.amount)}</span>
                    <button onClick={e=>{e.stopPropagation();openPreview(r);}} style={{fontSize:9,padding:"4px 9px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",color:C.muted,fontFamily:SANS,letterSpacing:"0.06em",flexShrink:0,whiteSpace:"nowrap"}}>Save PDF</button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────
const initClients=[
  {id:"c1",name:"Sephora",contact:"Anna Müller",email:"anna@sephora.de",agency:"Direct",country:"Germany",tags:["Beauty","Fashion"],notes:"Easy approvals. Fast payer. Potential retainer.",
    projects:[{id:"p1",name:"Spring Campaign 2026",status:"paid",amount:2363,paid:true,date:"2026-04-01",deliveryDate:"2026-05-01",amendments:[],renewals:[],
      qd:{qNo:"QUO-2026-001",brand:"Sephora",contact:"Anna Müller",date:"2026-04-01",validUntil:"2026-04-15",ctype:"Content Creator",rev:0,mo:3,ctab:"influencer",
        lines:[{name:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",qty:3,up:450,amt:1350},{name:"Usage rights — paid ads, 3 months",note:"",qty:1,up:0,amt:675},{name:"Rush delivery",note:"Under 5 business days",qty:1,up:0,amt:338}],total:2363}}]},
  {id:"c2",name:"Vogue Germany",contact:"Sarah Klein",email:"sarah@vogue.de",agency:"Direct",country:"Germany",tags:["Editorial","Fashion"],notes:"Luxury aesthetic. Needs detailed briefs.",
    projects:[{id:"p2",name:"Editorial Shoot S/S 2026",status:"quoted",amount:2700,paid:false,date:"2026-03-15",deliveryDate:"",amendments:[],renewals:[],
      qd:{qNo:"QUO-2026-002",brand:"Vogue Germany",contact:"Sarah Klein",date:"2026-03-15",validUntil:"2026-03-29",ctype:"Editorial Content Creator",rev:0,mo:3,ctab:"editorial",
        lines:[{name:"Full photo story",note:"6–10 images",qty:1,up:1800,amt:1800},{name:"Hero video",note:"Up to 30 sec · cinematic",qty:1,up:1200,amt:900}],total:2700}}]},
];

function AppInner({initialClients,initialRc,initialSettings}: {initialClients: any[], initialRc: any, initialSettings: any}) {
  const [authed,setAuthed]=useState(()=>sessionStorage.getItem("lh_authed")==="1");
  const doAuth=(r: string)=>{sessionStorage.setItem("lh_authed","1");sessionStorage.setItem("lh_role",r);setRole(r as "manager"|"creator");setAuthed(true);};
  const doLogout=()=>{sessionStorage.removeItem("lh_authed");sessionStorage.removeItem("lh_role");setAuthed(false);setNav(0);setMenuOpen(false);};
  const [role,setRole]=useState<"manager"|"creator">(()=>(sessionStorage.getItem("lh_role")||"manager") as "manager"|"creator");
  const [nav,setNav]=useState(0);
  const [dashReset,setDashReset]=useState(0);
  const goToDash=()=>{setNav(0);setDashReset(p=>p+1);setDashDrill(null);};
  const [prefill,setPrefill]=useState<any>(null);
  const [clientSelReset,setClientSelReset]=useState(0);
  const [clientSel,setClientSel]=useState<string|null>(null);
  const [pendingClientName,setPendingClientName]=useState<string|null>(null);
  const [pendingProjectQNo,setPendingProjectQNo]=useState<string|null>(null);
  const [fromDrill,setFromDrill]=useState<string|null>(null);
  const [dashDrill,setDashDrill]=useState<null|"revenue"|"month"|"license"|"projects"|"invoices"|"quotes"|"contracts">(null);
  const [rc,setRc]=useState(initialRc);
  const [clients,setClients]=useState(initialClients);
  const [settings,setSettings]=useState({...SETTINGS_DEFAULT,...initialSettings});
  const [menuOpen,setMenuOpen]=useState(false);
  const [appWinW,setAppWinW]=useState(()=>window.innerWidth);
  useEffect(()=>{const fn=()=>setAppWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const appMobile=appWinW<700;
  const saveData=useSaveData();
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isFirst=useRef(true);

  useEffect(()=>{
    if(isFirst.current){isFirst.current=false;return;}
    if(timerRef.current)clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{
      saveData.mutate({data:{clients,rc,settings}});
    },800);
    return()=>{if(timerRef.current)clearTimeout(timerRef.current);};
  },[rc,clients,settings]);

  if(!authed)return<Auth onAuth={(r)=>doAuth(r)} currentPass={settings.password||PASS}/>;
  if(role==="creator")return<CreatorPage settings={settings} logout={()=>{doLogout();}} clients={clients} setClients={setClients}/>;

  const handleSave=(q: any,brand: string,contact: string,isRev: boolean,revN: number,projName?: string,isAmend?: boolean,amendN?: number,origLines?: any[])=>{
    const ex=clients.find((c: any)=>c.name.toLowerCase()===brand.toLowerCase());
    if(isAmend&&ex){
      const aNo=`Amend ${amendN||1}`;
      const amendTotal=(q.lines||[]).reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);
      setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:c.projects.map((pr: any)=>pr.qd?.qNo===prefill?.qNo?{...pr,amendments:[...(pr.amendments||[]),{id:uid(),aNo,lines:q.lines||[],amendTotal,origTotal:pr.amount,signed:false,doc:q}],amount:pr.amount+amendTotal}:pr)}));
    } else if(isRev&&ex){
      setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:c.projects.map((pr: any)=>pr.qd?.qNo===q.qNo?{...pr,qd:q,status:"revised",amount:q.total}:pr)}));
    } else {
      const existPr=ex?.projects?.find((pr: any)=>pr.qd?.qNo===q.qNo);
      if(existPr&&ex){
        setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:c.projects.map((pr: any)=>pr.id===existPr.id?{...pr,qd:q,amount:q.total}:pr)}));
      } else {
        const name=projName&&projName.trim()?projName.trim():brand||"Untitled Project";
        const pr={id:uid(),name,status:"quoted",amount:q.total,paid:false,date:q.date,deliveryDate:"",notes:"",qd:q,amendments:[],renewals:[]};
        if(ex) setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:[pr,...c.projects]}));
        else setClients((p: any[])=>[{id:uid(),name:brand||"New Client",contact:contact||"",email:"",agency:"Direct",country:"Germany",tags:[],notes:"",projects:[pr]},...p]);
      }
    }
    setPrefill(null);
  };
  const handleAfterSave=(brand: string,qNo?: string)=>{
    setPendingClientName(brand);
    setPendingProjectQNo(qNo||null);
    setTimeout(()=>setNav(1),100);
  };

  const handleGoToCalc=(clientName: string)=>{
    setPrefill({brand:clientName,contact:""});
    setNav(2);
  };

  const handleRevise=(pr: any,cl: any)=>{
    const q=pr.qd;
    const card=rc[q?.ctab||"influencer"]||rc.influencer;
    const items=card.sections.filter((s: any)=>isSingle(s.t)).flatMap((s: any)=>s.items);
    const prefillLines=(q?.lines||[]).map((ln: any)=>({
      id:uid(),ck:q?.ctab==="complete"?"influencer":(q?.ctab||"influencer"),
      ii:Math.max(0,items.findIndex((it: any)=>it.id===ln.id)),
      qty:ln.qty||1,neg:ln.up?String(ln.up):"",vol:false,ui:1,ei:0,ao:[],cLabel:"",cAmt:""
    }));
    setPrefill({brand:q?.brand,contact:q?.contact,qNo:q?.qNo,isRev:true,revN:(q?.rev||0)+1,ctab:q?.ctab||"influencer",lines:prefillLines,origLines:q?.lines||[]});
    setNav(2);
  };

  const handleAmend=(pr: any)=>{
    const q=pr.qd;
    const amendN=(pr.amendments||[]).length+1;
    setPrefill({brand:q?.brand,contact:q?.contact,qNo:q?.qNo,isAmend:true,amendN,origLines:q?.lines||[]});
    setNav(2);
  };

  const logout=()=>doLogout();
  const NAV=["Dashboard","Clients","Calculator","Rate Card"];
  const initials=(()=>{const n=(settings.name||settings.company||"Lynn Hoa").trim();const p=n.split(/\s+/);return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase();})();
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:SANS,color:C.black}}>
      <div style={{borderBottom:`1px solid ${C.rule}`,position:"sticky",top:0,background:C.bg,zIndex:100}}>
        {appMobile?(
          <>
            <div style={{textAlign:"center",padding:"10px 20px 7px",cursor:"pointer"}} onClick={goToDash}>
              <AppLogo/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px",borderTop:`1px solid ${C.rule}`,position:"relative"}}>
              <div style={{display:"flex"}}>
                {NAV.map((n,i)=><button key={i} onClick={()=>{if(i===1)setClientSelReset(p=>p+1);setNav(i===3?7:i);}} style={{padding:"0 10px",height:40,background:"none",border:"none",borderBottom:(i===3?nav===7:nav===i)?`2px solid ${C.black}`:"2px solid transparent",color:(i===3?nav===7:nav===i)?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>)}
              </div>
              <div style={{position:"absolute",right:6,display:"flex",alignItems:"center"}}>
                {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
                <button onClick={()=>setMenuOpen(m=>!m)} title="Account" style={{width:30,height:30,borderRadius:"50%",background:C.black,color:C.white,border:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:200,flexShrink:0}}>{initials}</button>
                {menuOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:172,zIndex:200}}>
                  <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.rule}`}}>
                    <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontFamily:SERIF}}>{settings.name||settings.company||"Lynn Hoa"}</p>
                    <p style={{fontSize:7.5,color:C.light,margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>{role==="creator"?"Creator":"Manager"} · Private</p>
                  </div>
                  {([["Creator Profile",4],["Change Password",5],["Service Catalog",3]] as [string,number][]).map(([label,idx])=>(
                    <button key={idx} onClick={()=>{setNav(idx);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:nav===idx?"rgba(0,0,0,0.03)":"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:nav===idx?C.black:C.muted,letterSpacing:"0.04em",boxSizing:"border-box"}}>{label}</button>
                  ))}
                  <div style={{borderTop:`1px solid ${C.rule}`}}/>
                  <button onClick={logout} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.red,letterSpacing:"0.04em",boxSizing:"border-box"}}>Log Out</button>
                </div>}
              </div>
            </div>
          </>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"0 28px",height:56}}>
            <div style={{display:"flex",alignItems:"center",position:"relative"}}>
              {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
              <button onClick={()=>setMenuOpen(m=>!m)} title="Account" style={{width:30,height:30,borderRadius:"50%",background:C.black,color:C.white,border:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:200,flexShrink:0}}>{initials}</button>
              {menuOpen&&<div style={{position:"absolute",left:0,top:"calc(100% + 13px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:172,zIndex:200}}>
                <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.rule}`}}>
                  <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontFamily:SERIF}}>{settings.name||settings.company||"Lynn Hoa"}</p>
                  <p style={{fontSize:7.5,color:C.light,margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>{role==="creator"?"Creator":"Manager"} · Private</p>
                </div>
                {([["Creator Profile",4],["Change Password",5],["Service Catalog",3]] as [string,number][]).map(([label,idx])=>(
                  <button key={idx} onClick={()=>{setNav(idx);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:nav===idx?"rgba(0,0,0,0.03)":"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:nav===idx?C.black:C.muted,letterSpacing:"0.04em",boxSizing:"border-box"}}>{label}</button>
                ))}
                <div style={{borderTop:`1px solid ${C.rule}`}}/>
                <button onClick={logout} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.red,letterSpacing:"0.04em",boxSizing:"border-box"}}>Log Out</button>
              </div>}
            </div>
            <div style={{textAlign:"center",cursor:"pointer"}} onClick={goToDash}><AppLogo size="web"/></div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              {NAV.map((n,i)=><button key={i} onClick={()=>{if(i===1)setClientSelReset(p=>p+1);setNav(i===3?7:i);}} style={{padding:"0 14px",height:56,background:"none",border:"none",borderBottom:(i===3?nav===7:nav===i)?`2px solid ${C.black}`:"2px solid transparent",color:(i===3?nav===7:nav===i)?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>)}
            </div>
          </div>
        )}
      </div>
      <div style={{maxWidth:nav===1&&clientSel&&!appMobile?1200:840,margin:"0 auto",padding:appMobile?"20px 12px":"28px 20px",transition:"max-width 0.25s ease"}}>
        {nav===0&&<Dashboard clients={clients} goTo={setNav} isMobile={appMobile} setPendingClientName={setPendingClientName} setPendingProjectQNo={setPendingProjectQNo} setFromDrill={setFromDrill} settings={settings} resetKey={dashReset} drill={dashDrill} setDrill={setDashDrill}/>}
        {nav===1&&<Clients clients={clients} setClients={setClients} onRevise={handleRevise} onAmend={handleAmend} goTo={(n: number)=>{if(n!==1)setFromDrill(null);setNav(n);}} settings={settings} onGoToCalc={handleGoToCalc} isMobile={appMobile} rc={rc} selReset={clientSelReset} onSelChange={setClientSel} pendingClientName={pendingClientName} onPendingClear={()=>{setPendingClientName(null);setPendingProjectQNo(null);}} pendingProjectQNo={pendingProjectQNo}/>}
        {nav===1&&fromDrill&&<button onClick={()=>{setFromDrill(null);setNav(0);}} style={{position:"fixed",bottom:24,right:24,zIndex:999,background:C.bg,border:`1px solid ${C.rule}`,borderRadius:20,padding:"7px 18px",fontFamily:SANS,fontSize:10,color:C.muted,letterSpacing:"0.06em",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.10)",whiteSpace:"nowrap"}}>← Active Projects</button>}
        {nav===2&&<Calculator onSave={handleSave} prefill={prefill} clearPrefill={()=>setPrefill(null)} rc={rc} settings={settings} isMobile={appMobile} onAfterSave={handleAfterSave}/>}
        {nav===3&&<ServiceCatalog rc={rc} setRc={setRc}/>}
        {nav===7&&<RateCard rc={rc} setRc={setRc} settings={settings}/>}
        {nav===4&&<Settings settings={settings} setSettings={setSettings} isMobile={appMobile}/>}
        {nav===5&&<ChangePassword settings={settings} setSettings={setSettings}/>}
        {nav===6&&<Invoices clients={clients} settings={settings} isMobile={appMobile}/>}
      </div>
    </div>
  );
}

// ─── CREATOR WORKSPACE ────────────────────────────────────
const WS_STATUSES=["Not Started","In Production","In Review","Done"];

function getWsCategory(lineName: string): string {
  const n=(lineName||"").toLowerCase();
  if(n.includes("hero")||n.includes("editorial")||n.includes("photo story")||n.includes("mini set")||n.includes("hero image"))return"Editorial";
  if(n.includes("ugc")||n.includes("campaign video"))return"UGC";
  return"Influencer";
}

function wsStatusIcon(st: string){
  if(st==="Not Started")return{icon:"○",color:C.light};
  if(st==="In Production")return{icon:"▶",color:C.amber};
  if(st==="In Review")return{icon:"⚙",color:C.black};
  return{icon:"✓",color:C.green};
}

function wsCatPill(cat: string){
  if(cat==="UGC")return{bg:"#fdf5ee",border:"#e8d8c8",color:C.amber};
  if(cat==="Editorial")return{bg:"#f0f5f0",border:"#b8d4b8",color:C.green};
  return{bg:"#f0f0f5",border:"#c8c8e0",color:"#6a6aaa"};
}

function getWsItems(clients: any[]): any[] {
  const skip=["usage","excl","rush","revision","whitelisting","aspect","raw footage","kill","pinned","link in bio"];
  const items: any[]=[];
  clients.forEach((c: any)=>{
    c.projects.filter((pr: any)=>pr.status==="production").forEach((pr: any)=>{
      (pr.qd?.lines||[]).forEach((ln: any,li: number)=>{
        if(!ln.name)return;
        if(skip.some(s=>ln.name.toLowerCase().includes(s)))return;
        const qty=parseInt(ln.qty)||1;
        for(let q=0;q<qty;q++){
          const id=`${pr.id}_ln${li}_q${q}`;
          items.push({
            id,
            name:(pr.workspaceNames||{})[id]||ln.name+(qty>1?` ${q+1}`:""),
            defaultName:ln.name+(qty>1?` ${q+1}`:""),
            lineNote:ln.note||"",
            clientId:c.id,
            clientName:c.name,
            projectId:pr.id,
            projectName:pr.name,
            deadline:pr.deliveryDate||null,
            category:getWsCategory(ln.name),
            status:(pr.workspaceStatus||{})[id]||"Not Started",
            plannerDate:(pr.workspacePlanner||{})[id]||null,
            notes:(pr.workspaceNotes||{})[id]||"",
          });
        }
      });
    });
  });
  return items;
}

function isThisWeek(d: string|null): boolean {
  if(!d)return false;
  const now=new Date(); now.setHours(0,0,0,0);
  const day=now.getDay();
  const mon=new Date(now); mon.setDate(now.getDate()-(day===0?6:day-1));
  const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  const dt=new Date(d); dt.setHours(0,0,0,0);
  return dt>=mon&&dt<=sun;
}

function isOverdue(d: string|null): boolean {
  if(!d)return false;
  const now=new Date(); now.setHours(0,0,0,0);
  return new Date(d)<now;
}

function fmtDeadline(d: string|null): string {
  if(!d)return"No deadline";
  return fmtD(d);
}

function plannerDayLabel(d: string|null): string|null {
  if(!d)return null;
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return days[new Date(d).getDay()];
}

function CreatorWorkspace({isMobile,clients,setClients}: {isMobile:boolean,clients:any[],setClients:any}) {
  const [group,setGroup]=useState<"Urgency"|"Client"|"Category"|"Status">("Urgency");
  const [search,setSearch]=useState("");
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  const [editingId,setEditingId]=useState<string|null>(null);
  const [editingVal,setEditingVal]=useState("");
  const [noteId,setNoteId]=useState<string|null>(null);
  const [noteVal,setNoteVal]=useState("");
  const [confirmInvoice,setConfirmInvoice]=useState<{cid:string,pid:string,pname:string,cname:string}|null>(null);
  const [confirmDelete,setConfirmDelete]=useState<{id:string,clientId:string,projectId:string}|null>(null);

  const allItems=getWsItems(clients);

  const filtered=search
    ?allItems.filter(it=>it.name.toLowerCase().includes(search.toLowerCase())||it.clientName.toLowerCase().includes(search.toLowerCase()))
    :allItems;

  // ── mutators ──
  const advanceStatus=(item: any)=>{
    if(item.status==="Done")return;
    const next=WS_STATUSES[WS_STATUSES.indexOf(item.status)+1];
    setClients((prev: any[])=>prev.map(c=>c.id!==item.clientId?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==item.projectId?pr:{...pr,
      workspaceStatus:{...(pr.workspaceStatus||{}),[item.id]:next},
      workspaceStatusHistory:{...(pr.workspaceStatusHistory||{}),[item.id]:[...((pr.workspaceStatusHistory||{})[item.id]||[]),{status:next,date:today()}]}
    })}));
  };

  const saveName=(item: any,val: string)=>{
    const trimmed=val.trim();
    setClients((prev: any[])=>prev.map(c=>c.id!==item.clientId?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==item.projectId?pr:{...pr,
      workspaceNames:{...(pr.workspaceNames||{}),[item.id]:trimmed||item.defaultName}
    })}));
    setEditingId(null);
  };

  const saveNote=(item: any,val: string)=>{
    setClients((prev: any[])=>prev.map(c=>c.id!==item.clientId?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==item.projectId?pr:{...pr,
      workspaceNotes:{...(pr.workspaceNotes||{}),[item.id]:val.trim()}
    })}));
    setNoteId(null);
  };

  const deleteItem=(item: any)=>{
    setClients((prev: any[])=>prev.map(c=>c.id!==item.clientId?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==item.projectId?pr:{...pr,
      workspaceDeleted:[...((pr.workspaceDeleted||[])),item.id]
    })}));
    setConfirmDelete(null);
  };

  const confirmReadyToInvoice=(cid: string,pid: string)=>{
    setClients((prev: any[])=>prev.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,readyToInvoice:true,readyToInvoiceAt:new Date().toISOString()})}));
    setConfirmInvoice(null);
  };

  // Filter out deleted items
  const activeItems=filtered.filter(it=>{
    const cl=clients.find((c: any)=>c.id===it.clientId);
    const pr=cl?.projects.find((p: any)=>p.id===it.projectId);
    return!(pr?.workspaceDeleted||[]).includes(it.id);
  });

  // ── grouping ──
  type GroupDef={key:string,label:string,items:any[]};
  let groups: GroupDef[]=[];

  if(group==="Urgency"){
    const overdue=activeItems.filter(it=>it.status!=="Done"&&isOverdue(it.deadline));
    const week=activeItems.filter(it=>it.status!=="Done"&&!isOverdue(it.deadline)&&isThisWeek(it.deadline));
    const later=activeItems.filter(it=>it.status!=="Done"&&!isOverdue(it.deadline)&&!isThisWeek(it.deadline));
    const done=activeItems.filter(it=>it.status==="Done");
    groups=[
      {key:"overdue",label:`OVERDUE`,items:overdue},
      {key:"week",label:`DUE THIS WEEK`,items:week},
      {key:"later",label:`LATER`,items:later},
      {key:"done",label:`DONE`,items:done},
    ];
  } else if(group==="Client"){
    const byClient: Record<string,any[]>={};
    activeItems.forEach(it=>{
      const k=`${it.clientName}|${it.projectId}|${it.projectName}`;
      if(!byClient[k])byClient[k]=[];
      byClient[k].push(it);
    });
    groups=Object.entries(byClient).map(([k,items])=>{
      const [cn,,pn]=k.split("|");
      return{key:k,label:`${cn.toUpperCase()} — ${pn}`,items};
    });
  } else if(group==="Category"){
    ["Influencer","UGC","Editorial"].forEach(cat=>{
      const items=activeItems.filter(it=>it.category===cat);
      groups.push({key:cat,label:cat.toUpperCase(),items});
    });
  } else {
    WS_STATUSES.forEach(st=>{
      const items=activeItems.filter(it=>it.status===st);
      groups.push({key:st,label:st.toUpperCase(),items});
    });
  }

  const toggleGroup=(key: string)=>setCollapsed(p=>({...p,[key]:!p[key]}));

  // Ready to Invoice — per project, only in Client group or always show at bottom
  const readyProjects: {cid:string,pid:string,pname:string,cname:string}[]=[];
  clients.forEach((c: any)=>c.projects.filter((pr: any)=>pr.status==="production"&&!pr.readyToInvoice).forEach((pr: any)=>{
    const items=getWsItems([{...c,projects:[pr]}]);
    if(items.length>0&&items.every(it=>it.status==="Done"))readyProjects.push({cid:c.id,pid:pr.id,pname:pr.name,cname:c.name});
  }));

  const deadlineColor=(item: any)=>{
    if(isOverdue(item.deadline))return C.red;
    if(isThisWeek(item.deadline))return C.amber;
    return C.muted;
  };

  return(
    <div>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 14px"}}>Workspace</h2>
        {/* Group toggles */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginBottom:12}}>
          {(["Urgency","Client","Category","Status"] as const).map(g=>(
            <button key={g} onClick={()=>setGroup(g)}
              style={{padding:"5px 14px",border:`1px solid ${group===g?C.black:C.rule}`,borderRadius:2,background:group===g?C.black:"none",color:group===g?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:10,letterSpacing:"0.08em"}}>
              {g}
            </button>
          ))}
        </div>
        {/* Search */}
        <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box" as const}}/>
      </div>

      {/* Empty state */}
      {allItems.length===0&&(
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"40px 20px",textAlign:"center" as const,marginTop:20}}>
          <p style={{fontSize:12,color:C.muted,margin:"0 0 6px"}}>No active deliverables.</p>
          <p style={{fontSize:11,color:C.light,margin:0}}>Projects appear here once a contract is signed.</p>
        </div>
      )}

      {/* Groups */}
      {groups.filter(g=>g.items.length>0||(g.key==="overdue"&&group==="Urgency")).map(g=>{
        const isOpen=!collapsed[g.key];
        const isOverdueGroup=g.key==="overdue";
        const isDoneGroup=g.key==="done";
        return(
          <div key={g.key} style={{marginBottom:20}}>
            {/* Group header */}
            <div onClick={()=>toggleGroup(g.key)}
              style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",userSelect:"none" as const}}>
              <span style={{fontSize:11,letterSpacing:"0.12em",color:isOverdueGroup&&g.items.length>0?C.red:C.muted,fontWeight:"600"}}>{g.label}</span>
              <span style={{fontSize:11,color:isOverdueGroup&&g.items.length>0?C.red:C.light}}>{g.items.length}</span>
              <span style={{fontSize:11,color:C.light,marginLeft:"auto"}}>{isOpen?"▾":"▸"}</span>
            </div>
            <div style={{borderTop:`1px solid ${C.rule}`,marginBottom:4}}/>

            {isOpen&&g.items.map(item=>{
              const {icon,color:stColor}=wsStatusIcon(item.status);
              const catStyle=wsCatPill(item.category);
              const isEditing=editingId===item.id;
              const isNoting=noteId===item.id;
              const dlColor=deadlineColor(item);
              const dayTag=plannerDayLabel(item.plannerDate);
              const isDone=item.status==="Done";

              const descriptor=[item.defaultName,item.lineNote].filter(Boolean).join(" · ");

              return(
                <div key={item.id}
                  style={{display:"flex",alignItems:"flex-start",gap:isMobile?6:10,padding:"9px 0",borderBottom:`1px solid ${C.rule}`,opacity:isDone?0.55:1}}>

                  {/* Status icon */}
                  <button onClick={()=>advanceStatus(item)}
                    style={{width:22,height:22,flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:isDone?"default":"pointer",color:stColor,fontSize:14,padding:0,lineHeight:1}}>
                    {icon}
                  </button>

                  {/* Category pill */}
                  <span style={{fontSize:10,padding:"2px 7px",border:`1px solid ${catStyle.border}`,borderRadius:10,color:catStyle.color,background:catStyle.bg,flexShrink:0,letterSpacing:"0.04em",marginTop:2}}>
                    {item.category}
                  </span>

                  {/* Name + descriptor */}
                  <div style={{flex:1,minWidth:0}}>
                    {isEditing?(
                      <input autoFocus value={editingVal} onChange={e=>setEditingVal(e.target.value)}
                        onBlur={()=>saveName(item,editingVal)}
                        onKeyDown={e=>{if(e.key==="Enter")saveName(item,editingVal);if(e.key==="Escape"){setEditingId(null);}}}
                        placeholder={item.defaultName}
                        style={{width:"100%",fontFamily:SANS,fontSize:13,color:C.black,border:"none",borderBottom:`1px solid ${C.black}`,background:"transparent",outline:"none",padding:"0 0 1px",marginBottom:3}}/>
                    ):(
                      <span onClick={()=>{if(!isDone){setEditingId(item.id);setEditingVal(item.name);}}}
                        style={{fontSize:13,color:C.black,cursor:isDone?"default":"text",textDecoration:isDone?"line-through":"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>
                        {item.name}
                      </span>
                    )}
                    <span style={{fontSize:11,color:C.light,display:"block",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>
                      {descriptor}
                    </span>
                  </div>

                  {/* Right side */}
                  <div style={{display:"flex",alignItems:"flex-start",gap:isMobile?4:8,flexShrink:0,marginTop:2}}>
                    {/* Client */}
                    {!isMobile&&<span style={{fontSize:11,color:C.muted,letterSpacing:"0.04em"}}>{item.clientName.toUpperCase()}</span>}

                    {/* Deadline */}
                    <span style={{fontSize:11,color:dlColor,fontWeight:dlColor===C.red?"600":"400",minWidth:isMobile?undefined:54,textAlign:"right" as const}}>
                      {isDone?`Done ${fmtD(item.deadline)||""}`:`${fmtDeadline(item.deadline)}`}
                    </span>

                    {/* Planned day tag */}
                    {dayTag&&<span style={{fontSize:11,padding:"1px 5px",border:`1px solid ${C.rule}`,borderRadius:2,color:C.muted,background:C.white}}>{dayTag}</span>}

                    {/* Notes icon */}
                    {!isNoting&&(
                      <button onClick={()=>{setNoteId(item.id);setNoteVal(item.notes);}}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:item.notes?C.amber:C.light,padding:0,lineHeight:1,flexShrink:0}}>
                        {item.notes?"💬":"○"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Note inline input */}
            {isOpen&&g.items.map(item=>noteId===item.id&&(
              <div key={`note-${item.id}`} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0 8px 32px",borderBottom:`1px solid ${C.rule}`}}>
                <input autoFocus placeholder="Add a note…" value={noteVal} onChange={e=>setNoteVal(e.target.value)}
                  onBlur={()=>saveNote(item,noteVal)}
                  onKeyDown={e=>{if(e.key==="Enter")saveNote(item,noteVal);if(e.key==="Escape"){setNoteId(null);}}}
                  maxLength={120}
                  style={{flex:1,fontFamily:SANS,fontSize:11,color:C.black,border:"none",borderBottom:`1px solid ${C.rule}`,background:"transparent",outline:"none",padding:"0 0 1px"}}/>
                <button onClick={()=>saveNote(item,noteVal)} style={{fontSize:9,color:C.muted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.06em",padding:0}}>Save</button>
                <button onClick={()=>setNoteId(null)} style={{fontSize:9,color:C.light,background:"none",border:"none",cursor:"pointer",padding:0}}>✕</button>
              </div>
            ))}

          </div>
        );
      })}

      {/* Ready to Invoice banners */}
      {readyProjects.map(rp=>(
        <div key={rp.pid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${C.greenBorder}`,background:C.greenBg,borderRadius:2,padding:"12px 16px",marginTop:12}}>
          <span style={{fontSize:11,color:C.green}}>✓ {rp.cname} — {rp.pname} · all done</span>
          <button onClick={()=>setConfirmInvoice(rp)}
            style={{padding:"6px 16px",border:`1px solid ${C.green}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,color:C.green,letterSpacing:"0.1em",textTransform:"uppercase" as const,fontWeight:"600"}}>
            Ready to Invoice
          </button>
        </div>
      ))}

      {/* Confirm Invoice Dialog */}
      {confirmInvoice&&createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setConfirmInvoice(null)}>
          <div style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"24px 28px",maxWidth:340,width:"90%",boxShadow:"0 4px 24px rgba(0,0,0,0.15)"}}
            onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:13,color:C.black,margin:"0 0 8px",fontFamily:SERIF}}>Signal ready to invoice?</p>
            <p style={{fontSize:11,color:C.muted,margin:"0 0 20px"}}>This will mark {confirmInvoice.cname} — {confirmInvoice.pname} as production complete and lock it read-only.</p>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmInvoice(null)} style={{padding:"6px 16px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:10,color:C.muted}}>Cancel</button>
              <button onClick={()=>confirmReadyToInvoice(confirmInvoice.cid,confirmInvoice.pid)}
                style={{padding:"6px 16px",border:`1px solid ${C.green}`,borderRadius:2,background:C.green,cursor:"pointer",fontFamily:SANS,fontSize:10,color:C.white,letterSpacing:"0.06em"}}>Confirm</button>
            </div>
          </div>
        </div>,document.body
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete&&createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setConfirmDelete(null)}>
          <div style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"24px 28px",maxWidth:320,width:"90%",boxShadow:"0 4px 24px rgba(0,0,0,0.15)"}}
            onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:13,color:C.black,margin:"0 0 8px",fontFamily:SERIF}}>Delete this deliverable?</p>
            <p style={{fontSize:11,color:C.muted,margin:"0 0 20px"}}>Use only if this item was dropped from the contract informally. This cannot be undone.</p>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmDelete(null)} style={{padding:"6px 16px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:10,color:C.muted}}>Cancel</button>
              <button onClick={()=>deleteItem(confirmDelete)}
                style={{padding:"6px 16px",border:`1px solid ${C.red}`,borderRadius:2,background:C.red,cursor:"pointer",fontFamily:SANS,fontSize:10,color:C.white}}>Delete</button>
            </div>
          </div>
        </div>,document.body
      )}
    </div>
  );
}

// ─── CREATOR PLANNER ──────────────────────────────────────
function CreatorPlanner({isMobile}: {isMobile:boolean}) {
  const [weekOffset,setWeekOffset]=useState(0);

  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Get Monday of current week + offset
  const getMonday=(offset: number)=>{
    const d=new Date();
    const day=d.getDay();
    const diff=d.getDate()-day+(day===0?-6:1);
    d.setDate(diff+offset*7);
    d.setHours(0,0,0,0);
    return d;
  };

  const monday=getMonday(weekOffset);
  const weekDays=Array.from({length:7},(_,i)=>{
    const d=new Date(monday);
    d.setDate(monday.getDate()+i);
    return d;
  });

  const isToday=(d: Date)=>{
    const t=new Date();
    return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear();
  };

  const fmtDay=(d: Date)=>d.getDate();
  const fmtMonth=(d: Date)=>d.toLocaleDateString("en-GB",{month:"short"});

  const weekLabel=(()=>{
    const s=weekDays[0];
    const e=weekDays[6];
    if(s.getMonth()===e.getMonth())return`${s.getDate()}–${e.getDate()} ${fmtMonth(e)} ${e.getFullYear()}`;
    return`${s.getDate()} ${fmtMonth(s)} – ${e.getDate()} ${fmtMonth(e)} ${e.getFullYear()}`;
  })();

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Planner</h2>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setWeekOffset(0)} style={{padding:"4px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase" as const}}>Today</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setWeekOffset(w=>w-1)} style={{width:26,height:26,border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",color:C.muted,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <span style={{fontSize:11,color:C.muted,minWidth:160,textAlign:"center" as const}}>{weekLabel}</span>
            <button onClick={()=>setWeekOffset(w=>w+1)} style={{width:26,height:26,border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",color:C.muted,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          </div>
        </div>
      </div>

      {/* Calendar grid — desktop */}
      {!isMobile&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:C.rule,border:`1px solid ${C.rule}`,borderRadius:2,overflow:"hidden"}}>
          {weekDays.map((d,i)=>(
            <div key={i} style={{background:C.bg,minHeight:520}}>
              {/* Day header */}
              <div style={{padding:"10px 10px 8px",borderBottom:`1px solid ${C.rule}`,textAlign:"center" as const}}>
                <p style={{fontSize:9,color:isToday(d)?C.black:C.muted,letterSpacing:"0.1em",textTransform:"uppercase" as const,margin:"0 0 3px",fontWeight:isToday(d)?"600":"400"}}>{DAYS[i]}</p>
                <p style={{fontFamily:isToday(d)?SERIF:SANS,fontSize:isToday(d)?18:13,color:isToday(d)?C.black:C.muted,margin:0,fontWeight:"normal",lineHeight:1}}>{fmtDay(d)}</p>
              </div>
              {/* Drop zone — empty for now */}
              <div style={{padding:"8px 6px",minHeight:460}}/>
            </div>
          ))}
        </div>
      )}

      {/* Calendar — mobile: stacked rows */}
      {isMobile&&(
        <div style={{display:"flex",flexDirection:"column" as const,gap:1,background:C.rule,border:`1px solid ${C.rule}`,borderRadius:2,overflow:"hidden"}}>
          {weekDays.map((d,i)=>(
            <div key={i} style={{background:C.bg}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderBottom:`1px solid ${C.rule}`}}>
                <div style={{minWidth:36,textAlign:"center" as const}}>
                  <p style={{fontSize:9,color:isToday(d)?C.black:C.muted,letterSpacing:"0.1em",textTransform:"uppercase" as const,margin:"0 0 1px",fontWeight:isToday(d)?"600":"400"}}>{DAYS[i]}</p>
                  <p style={{fontFamily:isToday(d)?SERIF:SANS,fontSize:isToday(d)?18:13,color:isToday(d)?C.black:C.muted,margin:0,fontWeight:"normal",lineHeight:1}}>{fmtDay(d)}</p>
                </div>
                {/* Drop zone — empty for now */}
                <div style={{flex:1,minHeight:40}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CREATOR CLIENTS ──────────────────────────────────────
const PROD_STATUSES=["production","invoiced","paid"];
const DEL_STATUSES=["Not Started","Filming","Editing","Review","Done"];
const DEL_COL: Record<string,string>={"Not Started":C.light,"Filming":C.amber,"Editing":C.amber,"Review":C.black,"Done":C.green};

function getDelivItems(pr: any):{id:string,name:string,note:string}[] {
  const skip=["usage","excl","rush","revision","whitelisting","aspect","raw footage","kill","pinned","link in bio"];
  const items: {id:string,name:string,note:string}[]=[];
  (pr.qd?.lines||[]).forEach((ln: any,li: number)=>{
    if(!ln.name)return;
    if(skip.some(s=>ln.name.toLowerCase().includes(s)))return;
    const qty=parseInt(ln.qty)||1;
    for(let q=0;q<qty;q++)items.push({id:`${pr.id}_ln${li}_q${q}`,name:ln.name,note:ln.note||""});
  });
  return items;
}

function CreatorClients({clients,setClients,isMobile}: {clients:any[],setClients:any,isMobile:boolean}) {
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState<string|null>(null);

  const qualified=clients.filter((c: any)=>c.projects.some((pr: any)=>PROD_STATUSES.includes(pr.status)));
  const filtered=qualified.filter((c: any)=>!search||c.name.toLowerCase().includes(search.toLowerCase()));
  const sorted=[...filtered].sort((a: any,b: any)=>{
    const aA=a.projects.some((pr: any)=>pr.status==="production");
    const bA=b.projects.some((pr: any)=>pr.status==="production");
    return aA===bA?0:aA?-1:1;
  });

  const cl=sel?clients.find((c: any)=>c.id===sel):null;

  const getDelSt=(pr: any,id: string)=>(pr.deliverableStatus||{})[id]||"Not Started";
  const cycleSt=(cid: string,pid: string,id: string,cur: string)=>{
    const next=DEL_STATUSES[Math.min(DEL_STATUSES.indexOf(cur)+1,DEL_STATUSES.length-1)];
    setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,deliverableStatus:{...(pr.deliverableStatus||{}),[id]:next}})}));
  };
  const setReady=(cid: string,pid: string)=>{
    setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,readyToInvoice:true,readyToInvoiceAt:new Date().toISOString()})}));
  };
  const progOf=(pr: any)=>{
    const items=getDelivItems(pr);
    if(!items.length)return null;
    return{done:items.filter(it=>getDelSt(pr,it.id)==="Done").length,total:items.length};
  };

  const showList=isMobile?!sel:true;
  const showDetail=isMobile?!!sel:true;

  return(
    <div style={{display:isMobile?"block":"grid",gridTemplateColumns:isMobile?undefined:"320px 1fr",gap:isMobile?0:20,alignItems:"start"}}>

      {/* ── LEFT ── */}
      {showList&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Clients</h2>
        </div>
        <input placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box" as const,marginBottom:10}}/>
        {sorted.length===0&&<p style={{fontSize:11,color:C.muted}}>No active projects yet.</p>}
        {sorted.map((c: any)=>{
          const active=c.projects.filter((pr: any)=>pr.status==="production");
          const archived=c.projects.filter((pr: any)=>pr.status==="invoiced"||pr.status==="paid");
          const isArchived=active.length===0;
          const topPr=active[0]||archived[0];
          const prog=topPr?progOf(topPr):null;
          return(
            <div key={c.id} onClick={()=>setSel(c.id===sel?null:c.id)}
              style={{border:`1px solid ${sel===c.id?C.light:C.rule}`,borderRadius:2,padding:"11px 13px",marginBottom:8,cursor:"pointer",background:sel===c.id?"rgba(26,26,26,0.03)":undefined,opacity:isArchived?0.6:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{fontSize:13,color:C.black,margin:"0 0 2px",fontWeight:"500"}}>{c.name}</p>
                  <p style={{fontSize:10.5,color:C.muted,margin:0}}>{c.contact}</p>
                  {topPr&&<p style={{fontSize:10.5,color:C.muted,margin:"4px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{topPr.name}</p>}
                </div>
                <div style={{textAlign:"right" as const,flexShrink:0,marginLeft:12}}>
                  {prog&&<span style={{fontSize:11,color:prog.done===prog.total?C.green:C.black,fontWeight:"500"}}>{prog.done}/{prog.total}</span>}
                  {topPr?.deliveryDate&&<p style={{fontSize:9.5,color:C.muted,margin:"3px 0 0"}}>{fmtD(topPr.deliveryDate)}</p>}
                  {isArchived&&<span style={{fontSize:9,color:C.light,letterSpacing:"0.07em",textTransform:"uppercase" as const,display:"block",marginTop:3}}>Delivered</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>}

      {/* ── RIGHT ── */}
      {showDetail&&cl&&(
        <div>
          {isMobile&&<button onClick={()=>setSel(null)} style={{fontSize:12,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase" as const,background:"none",border:"none",cursor:"pointer",padding:"0 0 16px",fontFamily:SANS}}>← Clients</button>}
          <div style={{marginBottom:20}}>
            <h2 style={{fontFamily:SERIF,fontSize:22,fontWeight:"normal",margin:"0 0 2px"}}>{cl.name}</h2>
            <p style={{fontSize:10.5,color:C.muted,margin:0}}>{cl.contact}</p>
          </div>
          {cl.projects.filter((pr: any)=>PROD_STATUSES.includes(pr.status)).map((pr: any)=>{
            const isArchived=pr.status==="invoiced"||pr.status==="paid";
            const items=getDelivItems(pr);
            const allDone=items.length>0&&items.every(it=>getDelSt(pr,it.id)==="Done");
            const prog=progOf(pr);
            return(
              <div key={pr.id} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"14px 15px",marginBottom:12}}>
                {/* header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${C.rule}`}}>
                  <div>
                    <p style={{fontSize:13,color:C.black,margin:"0 0 3px",fontWeight:"500"}}>{pr.name}</p>
                    {pr.deliveryDate&&<p style={{fontSize:10,color:C.muted,margin:0}}>Deadline · <span style={{color:C.black,fontWeight:"500"}}>{fmtD(pr.deliveryDate)}</span></p>}
                  </div>
                  <div style={{textAlign:"right" as const,flexShrink:0,marginLeft:12}}>
                    {prog&&<span style={{fontSize:11,color:prog.done===prog.total?C.green:C.black}}>{prog.done}/{prog.total} done</span>}
                    {isArchived&&<span style={{display:"block",fontSize:9,color:C.green,border:`1px solid ${C.greenBorder}`,background:C.greenBg,padding:"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase" as const,marginTop:4}}>Delivered</span>}
                    {pr.readyToInvoice&&!isArchived&&<span style={{display:"block",fontSize:9,color:C.amber,border:`1px solid ${C.amberBorder}`,background:C.amberBg,padding:"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase" as const,marginTop:4}}>Submitted</span>}
                  </div>
                </div>
                {/* deliverables */}
                {items.length===0&&<p style={{fontSize:11,color:C.muted}}>No deliverables found on quote.</p>}
                {items.map((it,i)=>{
                  const st=getDelSt(pr,it.id);
                  const col=DEL_COL[st]||C.light;
                  return(
                    <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<items.length-1?`1px solid ${C.rule}`:"none"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:11,color:C.black,margin:"0 0 1px"}}>{it.name}</p>
                        {it.note&&<p style={{fontSize:10,color:C.muted,margin:0}}>{it.note}</p>}
                      </div>
                      <button disabled={isArchived} onClick={()=>!isArchived&&cycleSt(cl.id,pr.id,it.id,st)}
                        style={{flexShrink:0,marginLeft:12,padding:"3px 10px",fontSize:9.5,color:col,border:`1px solid ${col}`,background:"transparent",borderRadius:2,cursor:isArchived?"default":"pointer",fontFamily:SANS,letterSpacing:"0.07em",textTransform:"uppercase" as const,whiteSpace:"nowrap" as const}}>
                        {st}
                      </button>
                    </div>
                  );
                })}
                {/* ready to invoice */}
                {!isArchived&&!pr.readyToInvoice&&allDone&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.rule}`}}>
                    <button onClick={()=>setReady(cl.id,pr.id)}
                      style={{padding:"7px 14px",border:"none",background:C.black,color:C.white,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase" as const}}>
                      Ready to Invoice
                    </button>
                    <p style={{fontSize:10,color:C.muted,margin:"6px 0 0"}}>Signals the manager that production is complete.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!isMobile&&!cl&&sorted.length>0&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200}}>
          <p style={{fontSize:11,color:C.muted}}>Select a client to view projects.</p>
        </div>
      )}
    </div>
  );
}

// ─── CREATOR DASHBOARD ────────────────────────────────────
function CreatorDashboard({isMobile}: {isMobile:boolean}) {
  const today=new Date();

  // ── Daily Creation List
  const dailyList=[
    {label:"Film unboxing reel · Sephora",done:false},
    {label:"Edit BTS clip · Vogue shoot",done:true},
    {label:"Caption review · ŌURA campaign",done:false},
    {label:"Upload story set · Zalando",done:false},
  ];
  const dailyDone=dailyList.filter(t=>t.done).length;

  // ── Editing Queue
  const editingQueue=[
    {title:"Spring Reel",client:"Sephora",format:"Reel",due:"2026-05-15"},
    {title:"Hero video v2",client:"Vogue",format:"Hero Video",due:"2026-05-18"},
    {title:"BTS cutdown",client:"Vogue",format:"Short Video",due:"2026-05-20"},
  ];

  // ── Production Category Split
  const catSplit=[
    {cat:"UGC",count:4},
    {cat:"Brand Collab",count:3},
    {cat:"Editorial",count:2},
  ];
  const catTotal=catSplit.reduce((s,c)=>s+c.count,0);

  // ── Format Count
  const formats=[
    {fmt:"Reel / TikTok",count:5},
    {fmt:"Story Set",count:3},
    {fmt:"Photo Set",count:2},
    {fmt:"Hero Video",count:2},
  ];
  const fmtTotal=formats.reduce((s,f)=>s+f.count,0);

  // ── Deadlines
  const deadlines=[
    {title:"Spring Reel",client:"Sephora",due:"2026-05-15"},
    {title:"Hero video v2",client:"Vogue",due:"2026-05-18"},
    {title:"Campaign photo set",client:"ŌURA",due:"2026-05-22"},
  ];
  const daysUntil=(d:string)=>Math.ceil((new Date(d).getTime()-Date.now())/864e5);
  const dueCol=(d:number)=>d<=3?C.red:d<=7?C.amber:C.black;
  const dueBg=(d:number)=>d<=3?C.redBg:d<=7?C.amberBg:"transparent";
  const dueBd=(d:number)=>d<=3?C.redBorder:d<=7?C.amberBorder:C.rule;

  // ── Production Velocity
  const velocity=[
    {week:"Wk 1",count:2},
    {week:"Wk 2",count:4},
    {week:"Wk 3",count:3},
    {week:"Wk 4",count:5},
  ];
  const velTotal=velocity.reduce((s,v)=>s+v.count,0);
  const velMax=Math.max(...velocity.map(v=>v.count));

  const Card=({label,children}: {label:string,children:any})=>(
    <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px"}}>
      <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase" as const,margin:"0 0 10px"}}>{label}</p>
      {children}
    </div>
  );

  const cols=isMobile?"1fr":"1fr 1fr";

  return(
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Dashboard</h2>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase" as const,margin:0}}>{today.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:cols,gap:10}}>

        {/* 1 — Daily Creation List */}
        <Card label="Daily Creation List">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <span style={{fontFamily:SERIF,fontSize:20,color:dailyDone===dailyList.length?C.green:C.black}}>{dailyDone}/{dailyList.length}</span>
            <span style={{fontSize:10,color:C.muted}}>completed today</span>
          </div>
          {dailyList.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<dailyList.length-1?`1px solid ${C.rule}`:"none"}}>
              <div style={{width:10,height:10,borderRadius:"50%",border:`1px solid ${t.done?C.green:C.light}`,background:t.done?C.green:"transparent",flexShrink:0}}/>
              <span style={{fontSize:11,color:t.done?C.light:C.black,textDecoration:t.done?"line-through":"none"}}>{t.label}</span>
            </div>
          ))}
        </Card>

        {/* 2 — Editing Queue */}
        <Card label="Editing Queue">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <span style={{fontFamily:SERIF,fontSize:20,color:editingQueue.length>0?C.amber:C.light}}>{editingQueue.length}</span>
            <span style={{fontSize:10,color:C.muted}}>pieces to edit</span>
          </div>
          {editingQueue.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<editingQueue.length-1?`1px solid ${C.rule}`:"none"}}>
              <div>
                <span style={{fontSize:11,color:C.black}}>{item.title}</span>
                <span style={{fontSize:10,color:C.muted,display:"block"}}>{item.client} · {item.format}</span>
              </div>
              <span style={{fontSize:10,color:dueCol(daysUntil(item.due)),flexShrink:0,marginLeft:8}}>{daysUntil(item.due)}d</span>
            </div>
          ))}
        </Card>

        {/* 3 — Production Category Split */}
        <Card label="Production Category Split">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <span style={{fontFamily:SERIF,fontSize:20,color:C.black}}>{catTotal}</span>
            <span style={{fontSize:10,color:C.muted}}>active pieces</span>
          </div>
          {catSplit.map((c,i)=>(
            <div key={i} style={{marginBottom:i<catSplit.length-1?6:0}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11,color:C.black}}>{c.cat}</span>
                <span style={{fontSize:11,color:C.muted}}>{c.count}</span>
              </div>
              <div style={{height:3,background:C.rule,borderRadius:2}}>
                <div style={{height:3,width:`${(c.count/catTotal)*100}%`,background:C.black,borderRadius:2}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* 4 — Format Count */}
        <Card label="Format Count">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <span style={{fontFamily:SERIF,fontSize:20,color:C.black}}>{fmtTotal}</span>
            <span style={{fontSize:10,color:C.muted}}>total formats</span>
          </div>
          {formats.map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<formats.length-1?`1px solid ${C.rule}`:"none"}}>
              <span style={{fontSize:11,color:C.black}}>{f.fmt}</span>
              <span style={{fontFamily:SERIF,fontSize:13,color:C.black}}>{f.count}</span>
            </div>
          ))}
        </Card>

        {/* 5 — Deadlines */}
        <Card label="Deadlines">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <span style={{fontFamily:SERIF,fontSize:20,color:deadlines.some(d=>daysUntil(d.due)<=3)?C.red:C.black}}>{deadlines.length}</span>
            <span style={{fontSize:10,color:C.muted}}>upcoming</span>
          </div>
          {deadlines.map((d,i)=>{
            const days=daysUntil(d.due);
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 7px",marginBottom:4,background:dueBg(days),border:`1px solid ${dueBd(days)}`,borderRadius:2}}>
                <div>
                  <span style={{fontSize:11,color:dueCol(days),fontWeight:"500"}}>{d.title}</span>
                  <span style={{fontSize:10,color:dueCol(days),display:"block",opacity:0.8}}>{d.client}</span>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                  <span style={{fontSize:11,color:dueCol(days),fontWeight:"600"}}>{days}d</span>
                  <span style={{fontSize:9,color:dueCol(days),display:"block",opacity:0.7}}>{fmtD(d.due)}</span>
                </div>
              </div>
            );
          })}
        </Card>

        {/* 6 — Production Velocity */}
        <Card label="Production Velocity">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
            <span style={{fontFamily:SERIF,fontSize:20,color:C.black}}>{velTotal}</span>
            <span style={{fontSize:10,color:C.muted}}>pieces · last 30 days</span>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:48}}>
            {velocity.map((v,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column" as const,alignItems:"center",gap:4}}>
                <span style={{fontSize:9,color:C.muted}}>{v.count}</span>
                <div style={{width:"100%",background:C.black,borderRadius:2,height:`${Math.round((v.count/velMax)*36)}px`}}/>
                <span style={{fontSize:9,color:C.light,letterSpacing:"0.04em"}}>{v.week}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}

// ─── CREATOR PAGE ─────────────────────────────────────────
function CreatorPage({settings,logout,clients,setClients}: {settings: any,logout:()=>void,clients:any[],setClients:any}) {
  const [menuOpen,setMenuOpen]=useState(false);
  const [nav,setNav]=useState(0);
  const [winW,setWinW]=useState(()=>window.innerWidth);
  useEffect(()=>{const fn=()=>setWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const isMobile=winW<700;
  const goToDash=()=>setNav(0);
  const NAV=["Dashboard","Clients","Workspace","Planner"];
  const initials=(()=>{const n=(settings.name||settings.company||"Lynn Hoa").trim();const p=n.split(/\s+/);return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase();})();

  const AvatarBtn=({dropLeft=false}:{dropLeft?:boolean})=>(
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
      <button onClick={()=>setMenuOpen(m=>!m)} title="Account" style={{width:30,height:30,borderRadius:"50%",background:C.black,color:C.white,border:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:200,flexShrink:0}}>{initials}</button>
      {menuOpen&&<div style={{position:"absolute",...(dropLeft?{left:0}:{right:0}),top:"calc(100% + 13px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:172,zIndex:200}}>
        <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.rule}`}}>
          <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontFamily:SERIF}}>{settings.name||settings.company||"Lynn Hoa"}</p>
          <p style={{fontSize:7.5,color:C.light,margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>Creator · Private</p>
        </div>
        <div style={{borderTop:`1px solid ${C.rule}`}}/>
        <button onClick={()=>{setMenuOpen(false);logout();}} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.red,letterSpacing:"0.04em",boxSizing:"border-box"}}>Log Out</button>
      </div>}
    </div>
  );

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:SANS,color:C.black}}>
      {/* ── NAV ── */}
      <div style={{borderBottom:`1px solid ${C.rule}`,position:"sticky",top:0,background:C.bg,zIndex:100}}>
        {isMobile?(
          <>
            <div style={{textAlign:"center",padding:"10px 20px 7px",cursor:"pointer"}} onClick={goToDash}>
              <AppLogo/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px",borderTop:`1px solid ${C.rule}`,position:"relative"}}>
              <div style={{display:"flex"}}>
                {NAV.map((n,i)=><button key={i} onClick={()=>setNav(i)} style={{padding:"0 10px",height:40,background:"none",border:"none",borderBottom:nav===i?`2px solid ${C.black}`:"2px solid transparent",color:nav===i?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>)}
              </div>
              <div style={{position:"absolute",right:6,display:"flex",alignItems:"center"}}>
                <AvatarBtn dropLeft={false}/>
              </div>
            </div>
          </>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"0 28px",height:56}}>
            <div style={{display:"flex",alignItems:"center"}}>
              <AvatarBtn dropLeft={true}/>
            </div>
            <div style={{textAlign:"center",cursor:"pointer"}} onClick={goToDash}>
              <AppLogo size="web"/>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              {NAV.map((n,i)=><button key={i} onClick={()=>setNav(i)} style={{padding:"0 14px",height:56,background:"none",border:"none",borderBottom:nav===i?`2px solid ${C.black}`:"2px solid transparent",color:nav===i?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>)}
            </div>
          </div>
        )}
      </div>
      {/* ── CONTENT ── */}
      <div style={{maxWidth:(nav===1||nav===2||nav===3)&&!isMobile?1200:840,margin:"0 auto",padding:isMobile?"20px 12px":"28px 20px",transition:"max-width 0.25s ease"}}>
        {nav===0&&<CreatorDashboard isMobile={isMobile}/>}
        {nav===1&&<CreatorClients clients={clients} setClients={setClients} isMobile={isMobile}/>}
        {nav===2&&<CreatorWorkspace isMobile={isMobile} clients={clients} setClients={setClients}/>}
        {nav===3&&<CreatorPlanner isMobile={isMobile}/>}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────
export default function App() {
  const {data,isLoading}=useGetData();
  const saveData=useSaveData();
  const seeded=useRef(false);

  useEffect(()=>{
    if(!data||seeded.current)return;
    const hasClients=Array.isArray(data.clients)&&data.clients.length>0;
    const hasRc=data.rc&&Object.keys(data.rc).length>0;
    if(!hasClients||!hasRc){
      seeded.current=true;
      saveData.mutate({data:{clients:initClients as any[],rc:RC0,settings:SETTINGS_DEFAULT}});
    }
  },[data]);

  if(isLoading) return(
    <div style={{minHeight:"100vh",background:"#faf9f7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>
      <p style={{fontSize:9,color:"#999",letterSpacing:"0.14em",textTransform:"uppercase"}}>Loading…</p>
    </div>
  );

  const loadedClients=Array.isArray(data?.clients)&&data.clients.length>0
    ?(data.clients as any[])
    :initClients;
  const loadedRc=data?.rc&&Object.keys(data.rc as any).length>0
    ?(data.rc as any)
    :RC0;
  const loadedSettings=data?.settings&&Object.keys(data.settings as any).length>0
    ?(data.settings as any)
    :SETTINGS_DEFAULT;

  return <AppInner initialClients={loadedClients} initialRc={loadedRc} initialSettings={loadedSettings}/>;
}
