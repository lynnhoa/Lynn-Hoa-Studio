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
  const catBadgeLabel: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC",editorial:"Editorial"};
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
    <div style={{padding:"120px 62px 90px",fontSize:9.5,lineHeight:1.5,position:"relative",minHeight:841,fontFamily:SANS,color:C.black,background:C.bg}}>
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
        {d.origContent.map((c: any,i: number)=><p key={i} style={{fontSize:8.5,margin:"0 0 2px"}}>{c.qty?`${c.qty}× `:""}{c.name}{c.note?` — ${c.note}`:""}</p>)}
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

function PDFModal({data,type,onClose,onSave,settings,isNew}: any) {
  const init=()=>JSON.parse(JSON.stringify(data));
  const [hs,setHs]=useState({hist:[init()],idx:0});
  const staged=hs.hist[hs.idx];
  const setStaged=(fn: any)=>setHs(prev=>{
    const curr=prev.hist[prev.idx];
    const newD=typeof fn==="function"?fn(curr):fn;
    const next=[...prev.hist.slice(0,prev.idx+1),JSON.parse(JSON.stringify(newD))];
    return{hist:next,idx:next.length-1};
  });
  const [preview,setPreview]=useState<any>(init);
  const [lang,setLang]=useState("en");
  const [panelW,setPanelW]=useState(380);
  const [flash,setFlash]=useState<string|null>(null);
  const [confirmClose,setConfirmClose]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const canUndo=hs.idx>0,canRedo=hs.idx<hs.hist.length-1;
  const docRef=useRef<HTMLDivElement>(null);
  const [docHeight,setDocHeight]=useState(841);
  const PAGE_H=841;
  const numPages=Math.max(1,Math.ceil(docHeight/PAGE_H));
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
    setFlash("saved");
    setTimeout(()=>setFlash(null),3000);
  };
  const undo=()=>{
    const ni=Math.max(0,hs.idx-1);
    if(ni===hs.idx)return;
    setHs(p=>({...p,idx:ni}));
    commit(JSON.parse(JSON.stringify(hs.hist[ni])));
  };
  const redo=()=>{
    const ni=Math.min(hs.hist.length-1,hs.idx+1);
    if(ni===hs.idx)return;
    setHs(p=>({...p,idx:ni}));
    commit(JSON.parse(JSON.stringify(hs.hist[ni])));
  };
  const handleUpdate=()=>commit(JSON.parse(JSON.stringify(staged)));
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
        <button onClick={()=>{const isDirty=JSON.stringify(staged)!==JSON.stringify(data);(onSave&&(isNew||isDirty))?setConfirmClose(true):onClose();}} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22,marginLeft:4}}>✕</button>
      </div>
      {confirmClose&&createPortal(<div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(250,249,247,0.88)"}}>
        <div style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"24px 28px",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",textAlign:"center",minWidth:220}}>
          <p style={{fontFamily:SERIF,fontSize:15,fontWeight:"normal",color:C.black,margin:"0 0 6px"}}>Save this {type==="revised"?"revised quote":type==="amendment"?"amendment":type==="renewal"?"renewal":type==="invoice"?"invoice":"quote"}?</p>
          <p style={{fontSize:10,color:C.muted,margin:"0 0 18px"}}>Changes will be lost if you don't save.</p>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <B onClick={()=>{onSave(staged);setConfirmClose(false);onClose();}}>Yes</B>
            <B v="sec" onClick={()=>{setConfirmClose(false);onClose();}}>No</B>
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
            <B onClick={handleUpdate} s={{width:"100%",textAlign:"center"}}>Update Preview</B>
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
    <div style={{padding:"90px 62px 130px",fontSize:9.5,lineHeight:1.5,fontFamily:SANS,color:C.black,background:C.bg,minHeight:841}}>
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
function RateCards({rc,setRc,settings}: any) {
  const [tab,setTab]=useState("influencer");
  const [edit,setEdit]=useState(false);
  const [pdfLang,setPdfLang]=useState("en");
  const [showPreview,setShowPreview]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const [docHeight,setDocHeight]=useState(841);
  const [winW,setWinW]=useState(()=>window.innerWidth);
  const [rcSecGuards,setRcSecGuards]=useState<number[]>([]);
  const docRef=useRef<HTMLDivElement>(null);
  const measureRef=useRef<HTMLDivElement>(null);
  const PAGE_H=841;
  const numPages=Math.max(1,Math.ceil(docHeight/PAGE_H));
  const pageScale=winW<700?Math.min(1,(winW-32)/595):1;
  const sett={...SETTINGS_DEFAULT,...(settings||{})};
  const card=rc[tab];
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
        secEls.forEach((secEl)=>{
          const idx=parseInt(secEl.getAttribute("data-rcsec")||"0",10);
          const bottom=secEl.offsetTop+secEl.offsetHeight;
          const pageNum=Math.floor(secEl.offsetTop/PAGE_H);
          const bottomInPage=bottom-pageNum*PAGE_H;
          if(bottomInPage>(PAGE_H-80)&&!guardedPages.has(pageNum)){
            newGuards[idx]=Math.max(0,PAGE_H+52-secEl.offsetTop);
            guardedPages.add(pageNum);
          }
        });
        setRcSecGuards(prev=>{
          if(newGuards.length!==prev.length)return newGuards;
          const next=newGuards.map((v,i)=>Math.max(v,prev[i]));
          return next.some((v,i)=>v!==prev[i])?next:prev;
        });
      }
    };
    calc();const ro=new ResizeObserver(calc);ro.observe(el);return()=>ro.disconnect();
  },[showPreview,tab,pdfLang]);
  const upI=(si: number,id: string,f: string,v: string)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:sc.items.map((it: any)=>it.id!==id?it:{...it,[f]:f==="p"?(v===""?null:parseFloat(v)||0):v})})}}));
  const remI=(si: number,id: string)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:sc.items.filter((it: any)=>it.id!==id)})}}));
  const addI=(si: number)=>setRc((prev: any)=>({...prev,[tab]:{...prev[tab],sections:prev[tab].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:[...sc.items,{id:uid(),n:"New item",note:"",p:0}]})}}));
  const cleanSecT=(t: string)=>t.replace(/\s*[—–-]\s*\d+%[^"<]*/g,"").replace(/^Volume Discount\s*[&]\s*/i,"").trim();
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
      const fname=`rate-card-${(card.label||tab).toLowerCase().replace(/\s+/g,"-")}`;
      if(mw){mw.location.href=pdf.output("bloburl") as string;}
      else{pdf.save(`${fname}.pdf`);}
    }finally{pages.forEach((p,i)=>{p.style.transform=savedT[i];});setDownloading(false);}
  };
  const previewPortal=showPreview?createPortal(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:9999,display:"flex",flexDirection:"column",fontFamily:SANS}}>
      <div style={{height:46,borderBottom:`1px solid ${C.rule}`,display:"flex",alignItems:"center",padding:"0 14px",gap:8,flexShrink:0}}>
        <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flex:1,textAlign:"center",paddingLeft:40}}>{card.label} — Rate Card</span>
        <B onClick={download} s={{minWidth:80,textAlign:"center"}}>{downloading?"Saving…":"Save PDF"}</B>
        <button onClick={()=>setShowPreview(false)} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22}}>✕</button>
      </div>
      <div style={{flex:1,background:"#888",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:winW<700?"16px 0":"32px 28px",gap:winW<700?16:28}}>
        {Array.from({length:numPages},(_,i)=>(
          <div key={i} style={{width:595*pageScale,height:PAGE_H*pageScale,overflow:"hidden",flexShrink:0,boxShadow:"0 4px 24px rgba(0,0,0,0.32)"}}>
            <div data-pdf-page="true" style={{width:595,height:PAGE_H,overflow:"hidden",background:C.bg,position:"relative",transform:pageScale<1?`scale(${pageScale})`:"none",transformOrigin:"top left"}}>
              <div style={{position:"absolute",top:-i*PAGE_H,left:0,width:595}}>
                <RCContent card={card} lang={pdfLang} cleanSecT={cleanSecT} rcSecGuards={rcSecGuards}/>
              </div>
              <div style={{position:"absolute",bottom:59,left:0,right:0,height:28,background:C.bg,zIndex:2,pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,background:C.bg,zIndex:3,borderBottom:`1px solid ${C.rule}`}}>
                <div style={{padding:"13px 62px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{sett.company||sett.name||"Lynn Hoa"}</span>
                  <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{card.label||"Content Creator"}</span>
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
    </div>,
    document.body
  ):null;
  return(
    <div>
      {previewPortal}
      {/* hidden off-screen element to measure full content height */}
      <div ref={measureRef} style={{position:"fixed",top:0,left:-9999,width:595,visibility:"hidden",pointerEvents:"none",zIndex:-1}}>
        <RCContent card={card} lang={pdfLang} cleanSecT={cleanSecT} rcSecGuards={rcSecGuards}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
        <div><h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Rate Cards</h2><p style={{fontSize:8,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>Fashion · Beauty · Lifestyle</p></div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:4}}><Pill on={pdfLang==="en"} onClick={()=>setPdfLang("en")}>EN</Pill><Pill on={pdfLang==="de"} onClick={()=>setPdfLang("de")}>DE</Pill></div>
          <B v="sec" onClick={()=>setEdit((e: boolean)=>!e)}>{edit?"Done":"Edit"}</B>
          <B onClick={()=>setShowPreview(true)}>Preview</B>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {["influencer","ugc","editorial","hotels"].map(k=><Pill key={k} on={tab===k} onClick={()=>setTab(k)}>{{influencer:"Influencer",ugc:"UGC",editorial:"Editorial",hotels:"Hotels"}[k as keyof object]}</Pill>)}
      </div>
      {card.sections.map((sec: any,si: number)=>(
        <div key={si} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.rule}`}}>
            <span style={{fontSize:9.5,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase",border:`1px solid ${C.rule}`,padding:"3px 9px",borderRadius:2}}>{sec.t}</span>
            {edit&&<B v="sec" onClick={()=>addI(si)} s={{fontSize:8}}>+ Add</B>}
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
      <p style={{fontSize:10.5,color:C.muted,lineHeight:1.75,marginTop:10}}>{card.fine}</p>
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
    const ctype=cats.includes("ugc")?"UGC Creator":cats.includes("editorial")?"Editorial Content Creator":"Content Creator";
    setPdf({brand,contact,date:qDate,validUntil,qNo,rev:isRev?revN:0,
      lines:items.map(it=>({name:it.name,note:it.note,qty:it.qty,up:it.up,amt:it.amt,cat:it.cat,platforms:it.platforms||[],usageLabel:it.usageLabel,exclLabel:it.exclLabel,addons:it.addons||[]})),
      total:grand,ctype,footer:"Looking forward to working together."});
  };

  const reset=()=>{setItems([]);setBrand("");setContact("");setProjName("");setRetOn(false);if(clearPrefill)clearPrefill();};
  const catLabel: Record<string,string>={influencer:"Influencer",ugc:"UGC",editorial:"Editorial"};

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
            <span style={{fontSize:10,color:C.black}}>{ln.qty>1?`${ln.qty}× `:""}{ln.name}</span>
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
              {card.usage.map((u: any,i: number)=><option key={i} value={i}>{u.l}{!u.sentinel&&u.pct>0?` (+${u.pct}%)`:""}</option>)}
            </S>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:5}}>
              {(["Instagram","TikTok","YouTube","Other"] as const).map(p=>{const on=bPlatforms.includes(p);return<button key={p} type="button" onClick={()=>setBPlatforms(pr=>on?pr.filter(x=>x!==p):[...pr,p])} style={{padding:"3px 8px",border:`1px solid ${on?C.black:C.rule}`,background:on?C.black:C.bg,color:on?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:8.5,letterSpacing:"0.05em",borderRadius:2}}>{p}</button>;})}
            </div>
          </div>
          <div><Lbl>Exclusivity</Lbl><S value={bExcl} onChange={(e: any)=>setBExcl(parseInt(e.target.value))}>
            {card.excl.map((e: any,i: number)=><option key={i} value={i}>{e.l}{!e.sentinel&&e.pct>0?` (+${e.pct}%)`:""}</option>)}
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

// ─── AMENDMENT MODAL ──────────────────────────────────────
function AmendModal({p,onSave,onClose,settings,rc}: any) {
  const q=p.qd;
  const origLines=q?.lines||[];
  const origTotal=origLines.reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);
  const defCat=(q?.ctab&&["influencer","ugc","editorial"].includes(q.ctab)?q.ctab:"influencer") as "influencer"|"ugc"|"editorial";
  const [lines,setLines]=useState<any[]>([]);
  const [pdf,setPdf]=useState<any>(null);

  // ── Section 1: Extra deliverables ──
  const [aCat,setACat]=useState(defCat);
  const [aDel,setADel]=useState(-1);
  const [aQty,setAQty]=useState(1);
  const [aNeg,setANeg]=useState("");
  const [showMan,setShowMan]=useState(false);
  const [manName,setManName]=useState("");
  const [manQty,setManQty]=useState(1);
  const [manUp,setManUp]=useState("");
  const card=rc?.[aCat]||rc?.influencer;
  const deliverables=card?card.sections.filter((s: any)=>isSingle(s.t)).flatMap((s: any)=>s.items):[];
  const selDel=aDel>=0?deliverables[aDel]:null;
  const addDeliverable=()=>{
    if(!selDel&&!aNeg)return;
    const up=aNeg!==""?parseFloat(aNeg)||0:(selDel?.p||0);
    if(!up)return;
    setLines(prev=>[...prev,{id:uid(),name:selDel?.n||"Custom deliverable",note:selDel?.note||"",qty:aQty,up,amt:Math.round(up*aQty),kind:"deliverable"}]);
    setADel(-1);setAQty(1);setANeg("");
  };
  const addManual=()=>{
    if(!manName.trim())return;
    const up=parseFloat(manUp)||0;
    setLines(prev=>[...prev,{id:uid(),name:manName,note:"",qty:manQty,up,amt:Math.round(up*manQty),kind:"deliverable"}]);
    setManName("");setManQty(1);setManUp("");
  };

  // ── Section 2: Usage rights ──
  const [uBase,setUBase]=useState<"total"|"selected">("total");
  const [uSel,setUSel]=useState<string[]>([]);
  const [uIdx,setUIdx]=useState(0);
  const usageOpts=card?.usage||[];
  const uOpt=usageOpts[uIdx];
  const uBase$=uBase==="total"?origTotal:uSel.reduce((s,id)=>{const l=origLines.find((x: any)=>x.id===id||x.name===id);return s+(parseFloat(l?.amt)||0);},0);
  const uAmt=uOpt&&!uOpt.sentinel?Math.round(uBase$*(uOpt.pct/100)):0;
  const addUsage=()=>{
    if(!uOpt||uOpt.sentinel||uAmt===0)return;
    const ref=uBase==="total"?"Whole quote":uSel.map(id=>origLines.find((x: any)=>x.name===id)?.name||id).join(", ");
    setLines(prev=>[...prev,{id:uid(),name:`Usage Rights — ${uOpt.l}`,note:`Applies to: ${ref}`,qty:1,up:uAmt,amt:uAmt,kind:"usage"}]);
    setUIdx(0);setUSel([]);
  };

  // ── Section 3: Add-ons ──
  const [aoBase,setAoBase]=useState<"total"|"selected">("total");
  const [aoSel,setAoSel]=useState<string[]>([]);
  const addonList=AO[aCat]||[];
  const [aoId,setAoId]=useState("");
  const [aoCustom,setAoCustom]=useState("");
  const selAo=addonList.find((x: any)=>x.id===aoId);
  const aoBase$=aoBase==="total"?origTotal:aoSel.reduce((s,id)=>{const l=origLines.find((x: any)=>x.name===id);return s+(parseFloat(l?.amt)||0);},0);
  const aoAmt=aoCustom!==""?parseFloat(aoCustom)||0:selAo?.flat||Math.round(aoBase$*(selAo?.pct||0)/100);
  const addAddon=()=>{
    if(!selAo||!aoAmt)return;
    const ref=aoBase==="total"?"Whole quote":aoSel.map(id=>origLines.find((x: any)=>x.name===id)?.name||id).join(", ");
    setLines(prev=>[...prev,{id:uid(),name:selAo.n,note:`Applies to: ${ref}`,qty:1,up:aoAmt,amt:aoAmt,kind:"addon"}]);
    setAoId("");setAoCustom("");setAoSel([]);
  };

  const aTotal=lines.reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);
  const aNo=`AMD-${(q?.qNo||"").replace("QUO","").trim()||"001"}-${String((p.amendments?.length||0)+1).padStart(2,"0")}`;

  if(pdf)return<PDFModal data={pdf} type="amendment" onClose={()=>setPdf(null)} settings={settings}
    onSave={(doc: any)=>{onSave({id:uid(),aNo:doc.aNo||aNo,lines:doc.lines||lines,amendTotal:doc.lines?.reduce((s: number,l: any)=>s+(l.amt||0),0)||Math.round(aTotal),signed:false});}}/>;

  const SectionHead=({n,title}: any)=><p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>{n} — {title}</p>;
  const BaseToggle=({val,set}: any)=><div style={{display:"flex",gap:4,marginBottom:8}}>
    <Pill on={val==="total"} onClick={()=>set("total")}>Whole quote ({fmt(origTotal)})</Pill>
    <Pill on={val==="selected"} onClick={()=>set("selected")}>Selected items</Pill>
  </div>;
  const ItemCheckboxes=({sel,setSel}: any)=><>{origLines.map((l: any,i: number)=>{
    const on=sel.includes(l.name);
    return<label key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:10,cursor:"pointer",marginBottom:4}}>
      <input type="checkbox" checked={on} onChange={()=>setSel((p: string[])=>on?p.filter(x=>x!==l.name):[...p,l.name])} style={{accentColor:C.black}}/>
      <span>{l.name}</span><span style={{color:C.muted,marginLeft:"auto"}}>{fmt(l.amt)}</span>
    </label>;
  })}</>;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.bg,width:"100%",maxWidth:560,borderRadius:2,padding:20,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <h3 style={{fontFamily:SERIF,fontSize:17,fontWeight:"normal",margin:0}}>Add Amendment</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
        </div>
        <p style={{fontSize:10.5,color:C.muted,margin:"0 0 16px"}}>Project: <strong style={{color:C.black}}>{p.name}</strong> · Original: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(origTotal)}</strong></p>

        {/* ── 1. Extra deliverables ── */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="01" title="Extra Deliverables"/>
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
            {(["influencer","ugc","editorial"] as const).map(k=><Pill key={k} on={aCat===k} onClick={()=>{setACat(k);setADel(-1);setAoId("");}}>{({influencer:"Influencer",ugc:"UGC",editorial:"Editorial"})[k]}</Pill>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 60px",gap:7,marginBottom:7}}>
            <div><Lbl>Deliverable</Lbl>
              <S value={aDel} onChange={(e: any)=>{setADel(parseInt(e.target.value));setANeg("");}}>
                <option value={-1}>— Select deliverable —</option>
                {deliverables.map((it: any,i: number)=><option key={i} value={i}>{it.n}{it.p?` — € ${it.p}`:""}</option>)}
              </S>
            </div>
            <div><Lbl>Qty</Lbl><I type="number" min={1} value={aQty} onChange={(e: any)=>setAQty(parseInt(e.target.value)||1)}/></div>
          </div>
          <div style={{marginBottom:8}}>
            <Lbl>Negotiated rate <span style={{fontWeight:"normal",color:C.light}}>(leave blank for card price)</span></Lbl>
            <I type="number" placeholder={selDel?`Card: € ${selDel.p||0}`:"—"} value={aNeg} onChange={(e: any)=>setANeg(e.target.value)}/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
            <B onClick={addDeliverable} s={{opacity:(selDel||aNeg)?1:0.4}}>+ Add Deliverable</B>
          </div>
          {!showMan
            ?<button onClick={()=>setShowMan(true)} style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:SANS,textDecoration:"underline",textDecorationColor:C.rule}}>+ Add manual line</button>
            :<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"10px 11px",background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <span style={{fontSize:9,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>Manual</span>
                <button onClick={()=>setShowMan(false)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12,padding:0}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 50px 80px",gap:7,marginBottom:7}}>
                <div><Lbl>Description</Lbl><I placeholder="e.g. Extra BTS video" value={manName} onChange={(e: any)=>setManName(e.target.value)}/></div>
                <div><Lbl>Qty</Lbl><I type="number" min={1} value={manQty} onChange={(e: any)=>setManQty(parseInt(e.target.value)||1)}/></div>
                <div><Lbl>Price (€)</Lbl><I type="number" placeholder="0" value={manUp} onChange={(e: any)=>setManUp(e.target.value)}/></div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end"}}><B onClick={addManual} s={{opacity:manName.trim()?1:0.4}}>+ Add</B></div>
            </div>}
        </div>

        {/* ── 2. Usage rights ── */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="02" title="Usage Rights"/>
          <Lbl>Apply % to</Lbl>
          <BaseToggle val={uBase} set={setUBase}/>
          {uBase==="selected"&&<div style={{marginBottom:10,padding:"8px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.bg}}><ItemCheckboxes sel={uSel} setSel={setUSel}/></div>}
          <Lbl>Usage Rights</Lbl>
          <S value={uIdx} onChange={(e: any)=>setUIdx(parseInt(e.target.value))} s={{marginBottom:8}}>
            {usageOpts.map((u: any,i: number)=><option key={i} value={i}>{u.l}{!u.sentinel&&u.pct>0?` (+${u.pct}%)`:""}</option>)}
          </S>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10.5,color:C.muted}}>Fee: <strong style={{color:C.black,fontFamily:SERIF}}>{uOpt&&!uOpt.sentinel&&uAmt>0?fmt(uAmt):"—"}</strong></span>
            <B onClick={addUsage} s={{opacity:uOpt&&!uOpt.sentinel&&uAmt>0?1:0.4}}>+ Add Usage Rights</B>
          </div>
        </div>

        {/* ── 3. Add-ons ── */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <SectionHead n="03" title="Add-ons"/>
          <Lbl>Apply % to</Lbl>
          <BaseToggle val={aoBase} set={setAoBase}/>
          {aoBase==="selected"&&<div style={{marginBottom:10,padding:"8px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.bg}}><ItemCheckboxes sel={aoSel} setSel={setAoSel}/></div>}
          <Lbl>Add-on</Lbl>
          <S value={aoId} onChange={(e: any)=>{setAoId(e.target.value);setAoCustom("");}} s={{marginBottom:7}}>
            <option value="">— Select add-on —</option>
            {addonList.map((a: any)=><option key={a.id} value={a.id}>{a.n}{a.flat?` — € ${a.flat}`:a.pct?` — ${a.pct}%`:""}</option>)}
          </S>
          {selAo&&<>
            <Lbl>Amount (€) <span style={{fontWeight:"normal",color:C.light}}>{selAo.flat?`card: € ${selAo.flat}`:selAo.pct?`suggested: € ${Math.round(aoBase$*selAo.pct/100)}`:""}</span></Lbl>
            <I type="number" placeholder={selAo.flat?`${selAo.flat}`:selAo.pct?`${Math.round(aoBase$*selAo.pct/100)}`:"0"} value={aoCustom} onChange={(e: any)=>setAoCustom(e.target.value)} s={{marginBottom:8}}/>
          </>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10.5,color:C.muted}}>Fee: <strong style={{color:C.black,fontFamily:SERIF}}>{selAo&&aoAmt>0?fmt(aoAmt):"—"}</strong></span>
            <B onClick={addAddon} s={{opacity:selAo&&aoAmt>0?1:0.4}}>+ Add Add-on</B>
          </div>
        </div>

        {/* ── Lines summary ── */}
        {lines.length>0&&<>
          <div style={{marginBottom:10}}>
            {lines.map((l: any)=>(
              <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"7px 0",borderBottom:`1px solid ${C.rule}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:11,color:C.black,margin:"0 0 1px"}}>{l.qty>1?`${l.qty}× `:""}{l.name}</p>
                  {l.note&&<p style={{fontSize:9.5,color:C.muted,margin:0}}>{l.note}</p>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:12}}>
                  <span style={{fontSize:12,fontFamily:SERIF,color:C.black}}>{fmt(l.amt)}</span>
                  <button onClick={()=>setLines(prev=>prev.filter((x: any)=>x.id!==l.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:14,padding:0}}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"9px 12px",border:`1px solid ${C.rule}`,borderRadius:2,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>Amendment Total</span>
            <span style={{fontFamily:SERIF,fontSize:18}}>{fmt(Math.round(aTotal))}</span>
          </div>
        </>}
        {lines.length===0&&<div style={{borderTop:`1px solid ${C.rule}`,marginBottom:14}}/>}

        <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
          <B v="sec" onClick={onClose}>Cancel</B>
          <B s={{opacity:lines.length===0?0.4:1}} onClick={()=>{if(!lines.length)return;setPdf({brand:q?.brand,contact:q?.contact,date:today(),ctype:q?.ctype||"Content Creator",qNo:q?.qNo,aNo,lines,amendTotal:Math.round(aTotal),origTotal:p.amount});}}>Preview & Generate PDF</B>
        </div>
      </div>
    </div>
  );
}

// ─── RENEWAL MODAL ────────────────────────────────────────
function RenewalModal({p,onSave,onClose,settings,rc}: any) {
  const q=p.qd;
  const origLines=q?.lines||[];
  const origTotal=origLines.reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);
  const defCat=(q?.ctab&&["influencer","ugc","editorial"].includes(q.ctab)?q.ctab:"influencer") as "influencer"|"ugc"|"editorial";
  const card=(rc?.[defCat]||rc?.influencer)||{usage:[],excl:[]};

  // Content scope
  const [rBase,setRBase]=useState<"total"|"selected">("total");
  const [rSel,setRSel]=useState<string[]>([]);
  const base$=rBase==="total"?origTotal:rSel.reduce((s,id)=>{const l=origLines.find((x: any)=>x.name===id);return s+(parseFloat(l?.amt)||0);},0);

  // Usage rights
  const [uIdx,setUIdx]=useState(0);
  const uOpt=card.usage[uIdx];
  const uAmt=uOpt&&!uOpt.sentinel?Math.round(base$*(uOpt.pct/100)):0;

  // Exclusivity
  const [eIdx,setEIdx]=useState(0);
  const eOpt=card.excl[eIdx];
  const eAmt=eOpt&&!eOpt.sentinel?Math.round(base$*(eOpt.pct/100)):0;

  // Dates
  const [startD,setStartD]=useState(today());
  const maxMo=Math.max(uOpt?.sentinel?0:(uOpt?.mo||0),eOpt?.sentinel?0:(eOpt?.mo||0));
  const endD=maxMo>0?addM(startD,maxMo):null;

  // Custom fee override
  const [custFee,setCustFee]=useState("");
  const suggestedFee=uAmt+eAmt;
  const fee=custFee!==""?parseFloat(custFee)||0:suggestedFee;

  const [pdf,setPdf]=useState<any>(null);

  const rNo=`INV-${new Date().getFullYear()}-RN${String((p.renewals||[]).length+1).padStart(2,"0")}`;
  const iNo=`INV-${(q?.qNo||"").replace("QUO","").trim()||"001"}`;
  const refContent=rBase==="total"?origLines:origLines.filter((l: any)=>rSel.includes(l.name));
  const termParts=[uOpt&&!uOpt.sentinel?uOpt.l:null,eOpt&&!eOpt.sentinel?eOpt.l:null].filter(Boolean).join(" + ");

  const buildDoc=()=>{
    const lines=[];
    if(uOpt&&!uOpt.sentinel&&uAmt>0)lines.push({name:`Usage Rights — ${uOpt.l}`,note:`${fmtD(startD)}${endD?` – ${fmtD(endD)}`:""}`,qty:1,up:uAmt,amt:uAmt});
    if(eOpt&&!eOpt.sentinel&&eAmt>0)lines.push({name:`Exclusivity — ${eOpt.l}`,note:`${fmtD(startD)}${endD?` – ${fmtD(endD)}`:""}`,qty:1,up:eAmt,amt:eAmt});
    // if custom fee differs from suggested, use a single line
    const finalLines=custFee!==""?[{name:`License Renewal — ${termParts||"Custom"}`,note:`${fmtD(startD)}${endD?` – ${fmtD(endD)}`:""}`,qty:1,up:fee,amt:fee}]:lines;
    return{
      brand:q?.brand,contact:q?.contact,date:today(),rNo,iNo,delivery:startD,
      ctype:q?.ctype||"Content Creator",projName:p.name,rType:termParts,
      origContent:refContent,footer:"Thank you for the pleasure of working together.",
      lines:finalLines,total:fee,endDate:endD,startDate:startD,
      optLabel:termParts||"Custom",mo:maxMo
    };
  };

  const canPreview=(uOpt&&!uOpt.sentinel)||(eOpt&&!eOpt.sentinel)||custFee!=="";

  if(pdf)return<PDFModal data={pdf} type="renewal" onClose={()=>setPdf(null)} settings={settings}
    onSave={(doc: any)=>{onSave({id:uid(),optLabel:termParts||"Custom",mo:maxMo,startDate:startD,endDate:endD,fee,invoiceNo:rNo,signed:false,paid:false,doc});}}/>;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.bg,width:"100%",maxWidth:480,borderRadius:2,padding:20,boxShadow:"0 8px 40px rgba(0,0,0,0.15)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <h3 style={{fontFamily:SERIF,fontSize:16,fontWeight:"normal",margin:0}}>Add Renewal</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
        </div>
        <p style={{fontSize:10.5,color:C.muted,margin:"0 0 14px",lineHeight:1.6}}>Project: <strong style={{color:C.black}}>{p.name}</strong><br/>Original total: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(origTotal)}</strong></p>

        {/* ── Content scope ── */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>01 — Which Content</p>
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            <Pill on={rBase==="total"} onClick={()=>setRBase("total")}>Whole quote ({fmt(origTotal)})</Pill>
            <Pill on={rBase==="selected"} onClick={()=>setRBase("selected")}>Selected items</Pill>
          </div>
          {rBase==="selected"&&<div style={{padding:"8px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:C.bg}}>
            {origLines.map((l: any,i: number)=>{
              const on=rSel.includes(l.name);
              return<label key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:10,cursor:"pointer",marginBottom:4}}>
                <input type="checkbox" checked={on} onChange={()=>setRSel(p=>on?p.filter(x=>x!==l.name):[...p,l.name])} style={{accentColor:C.black}}/>
                <span>{l.name}</span><span style={{color:C.muted,marginLeft:"auto"}}>{fmt(l.amt)}</span>
              </label>;
            })}
            {rSel.length>0&&<p style={{fontSize:9.5,color:C.muted,margin:"6px 0 0"}}>Selected base: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(base$)}</strong></p>}
          </div>}
        </div>

        {/* ── Usage rights ── */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>02 — Usage Rights</p>
          <S value={uIdx} onChange={(e: any)=>setUIdx(parseInt(e.target.value))}>
            {card.usage.map((u: any,i: number)=><option key={i} value={i}>{u.l}{!u.sentinel&&u.pct>0?` (+${u.pct}%)`:""}</option>)}
          </S>
          {uOpt&&!uOpt.sentinel&&<p style={{fontSize:10,color:C.muted,margin:"5px 0 0"}}>Fee contribution: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(uAmt)}</strong></p>}
        </div>

        {/* ── Exclusivity ── */}
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 14px",marginBottom:12,background:C.white}}>
          <p style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px",paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>03 — Exclusivity</p>
          <S value={eIdx} onChange={(e: any)=>setEIdx(parseInt(e.target.value))}>
            {card.excl.map((e: any,i: number)=><option key={i} value={i}>{e.l}{!e.sentinel&&e.pct>0?` (+${e.pct}%)`:""}</option>)}
          </S>
          {eOpt&&!eOpt.sentinel&&<p style={{fontSize:10,color:C.muted,margin:"5px 0 0"}}>Fee contribution: <strong style={{color:C.black,fontFamily:SERIF}}>{fmt(eAmt)}</strong></p>}
        </div>

        {/* ── Dates + fee ── */}
        <Lbl>Start Date</Lbl>
        <I type="date" value={startD} onChange={(e: any)=>setStartD(e.target.value)} s={{marginBottom:4}}/>
        {endD&&<p style={{fontSize:10.5,color:C.muted,margin:"0 0 10px"}}>End date: <strong style={{color:C.black}}>{fmtD(endD)}</strong></p>}
        <Lbl>Custom Fee Override <span style={{fontWeight:"normal",color:C.light}}>(leave blank to use calculated)</span></Lbl>
        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3}}>
          <I type="number" placeholder={suggestedFee>0?`Suggested: € ${suggestedFee}`:"Enter fee"} value={custFee} onChange={(e: any)=>setCustFee(e.target.value)}/>
          {custFee!==""&&<B v="sec" s={{fontSize:8}} onClick={()=>setCustFee("")}>Reset</B>}
        </div>

        <div style={{padding:"9px 12px",border:`1px solid ${C.rule}`,borderRadius:2,margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>Renewal Total</span>
          <span style={{fontFamily:SERIF,fontSize:18}}>{fmt(fee)}</span>
        </div>

        <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
          <B v="sec" onClick={onClose}>Cancel</B>
          <B s={{opacity:canPreview?1:0.4}} onClick={()=>{if(!canPreview)return;setPdf(buildDoc());}}>Preview & Save</B>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT DETAIL PANEL ─────────────────────────────────
function ClientDetail({cl,fin,editMode,ed,setEd,upCl,setEditMode,delCl,tagI,setTagI,uEnd,showAddP,setShowAddP,newPN,setNewPN,addP,onGoToCalc,upP,setClients,openPDF,openReviseContract,setPdf,onRevise,onAmend,setAmendT,setRenewT,setStatus,nxt,prv,editPrName,setEditPrName,editPrNameVal,setEditPrNameVal,delConfirm,setDelConfirm,setSel,highlightedProjectQNo,onClearHighlight}: any) {
  const f=fin(cl);
  const edt=editMode?ed:cl;
  return(
    <div style={{flex:"0 0 56%",minWidth:0,overflowY:"auto",maxHeight:"calc(100vh - 80px)",paddingLeft:4}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:8,flexWrap:"wrap"}}>
        <div style={{minWidth:0}}>
          {editMode?<I value={edt.name} onChange={(e: any)=>setEd((p: any)=>({...p,name:e.target.value}))} s={{fontSize:18,fontFamily:SERIF,marginBottom:4}}/>:<h2 style={{fontFamily:SERIF,fontSize:22,fontWeight:"normal",margin:"0 0 6px"}}>{cl.name}</h2>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{cl.tags?.map((t: string)=><Tag key={t}>{t}</Tag>)}</div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"flex-start"}}>
          {editMode
            ?<><B onClick={()=>{upCl(cl.id,ed);setEditMode(false);}}>Save</B><B v="sec" onClick={()=>setEditMode(false)}>Cancel</B></>
            :<><B v="sec" onClick={()=>{setEd({...cl});setEditMode(true);}}>Edit Info</B><button onClick={()=>delCl(cl.id)} style={{fontSize:9.5,color:C.red,border:`1px solid ${C.redBorder}`,padding:"5px 10px",borderRadius:2,cursor:"pointer",background:"none",fontFamily:SANS,letterSpacing:"0.08em",textTransform:"uppercase"}}>Delete</button></>}
          <button onClick={()=>{setSel(null);setEditMode(false);}} title="Close" style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:18,lineHeight:1,padding:"2px 0 0 4px",marginLeft:2}}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px"}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Brand Info</p>
          {editMode?<>
            <Lbl>Contact</Lbl><I value={edt.contact||""} onChange={(e: any)=>setEd((p: any)=>({...p,contact:e.target.value}))}/>
            <Lbl>Email</Lbl><I value={edt.email||""} onChange={(e: any)=>setEd((p: any)=>({...p,email:e.target.value}))} type="email"/>
            <Lbl>Agency / Direct</Lbl><S value={edt.agency||"Direct"} onChange={(e: any)=>setEd((p: any)=>({...p,agency:e.target.value}))}><option>Direct</option><option>Agency</option></S>
            <Lbl>Country</Lbl><I value={edt.country||""} onChange={(e: any)=>setEd((p: any)=>({...p,country:e.target.value}))}/>
            <Lbl>Tags</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>{(edt.tags||[]).map((t: string)=><Tag key={t} onRemove={()=>setEd((p: any)=>({...p,tags:p.tags.filter((x: string)=>x!==t)}))}>{t}</Tag>)}</div>
            <div style={{display:"flex",gap:5}}><I value={tagI} onChange={(e: any)=>setTagI(e.target.value)} placeholder="Add tag" onKeyDown={(e: any)=>{if(e.key==="Enter"&&tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} /><B v="sec" onClick={()=>{if(tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} s={{fontSize:9}}>+</B></div>
          </>:<><IR label="Contact" value={cl.contact}/><IR label="Email" value={cl.email}/><IR label="Type" value={cl.agency}/><IR label="Country" value={cl.country}/></>}
        </div>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px"}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Financial Snapshot</p>
          <IR label="Total Revenue" value={fmt(f.total)}/>
          <IR label="Paid Projects" value={`${f.count}`}/>
          <IR label="Last Invoice" value={f.lastDate?`${fmt(f.last)} \u00b7 ${fmtD(f.lastDate)}`:"—"}/>
          <IR label="Avg. Deal" value={f.avg?fmt(f.avg):"—"}/>
          <IR label="Outstanding" value={fmt(f.out)}/>
        </div>
      </div>
      <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10}}>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 9px"}}>Relationship Notes</p>
        {editMode?<textarea value={edt.notes||""} onChange={(e: any)=>setEd((p: any)=>({...p,notes:e.target.value}))} style={{width:"100%",minHeight:50,padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:11,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>:<p style={{fontSize:11,color:cl.notes?C.black:C.light,margin:0,lineHeight:1.6}}>{cl.notes||"No notes yet\u2026"}</p>}
      </div>
      {cl.projects.some((pr: any)=>uEnd(pr))&&(
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Usage Rights Tracker</p>
          {cl.projects.filter((pr: any)=>uEnd(pr)).map((pr: any)=>(
            <div key={pr.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.rule}`}}>
              <span style={{fontSize:11}}>{pr.name}</span>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                <UBadge end={uEnd(pr)}/>
                {(pr.renewals||[]).length>0&&<span style={{fontSize:9.5,color:C.green,border:`1px solid ${C.greenBorder}`,padding:"2px 7px",borderRadius:2}}>{pr.renewals.length} renewal{pr.renewals.length>1?"s":""}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 0 9px"}}>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:0}}>Collaboration History</p>
        <B v="sec" s={{fontSize:8}} onClick={()=>{setShowAddP((s: boolean)=>!s);setNewPN("");}}>+ Add Project</B>
      </div>
      {showAddP&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 11px",marginBottom:9}}>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 9px"}}>Add Project</p>
        <B s={{width:"100%",textAlign:"center",marginBottom:8}} onClick={()=>{onGoToCalc(cl.name);setShowAddP(false);}}>Build Quote in Calculator</B>
        <p style={{fontSize:10,color:C.muted,textAlign:"center",margin:"0 0 8px"}}>\u2014 or add manually \u2014</p>
        <div style={{display:"flex",gap:7}}>
          <I placeholder="Project name" value={newPN} onChange={(e: any)=>setNewPN(e.target.value)} onKeyDown={(e: any)=>e.key==="Enter"&&addP(cl.id)}/>
          <B v="sec" onClick={()=>addP(cl.id)}>Add</B>
          <B v="sec" onClick={()=>{setShowAddP(false);setNewPN("");}}>Cancel</B>
        </div>
      </div>}
      {cl.projects.map((pr: any,i: number)=>{
        const end=uEnd(pr);const ns=nxt(pr.status);const ps=prv(pr.status);
        const isHighlighted=highlightedProjectQNo&&pr.qd?.qNo===highlightedProjectQNo;
        return(
          <div key={pr.id} onClick={()=>{if(isHighlighted&&onClearHighlight)onClearHighlight();}} style={{border:`1px solid ${isHighlighted?C.light:C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10,background:isHighlighted?"rgba(26,26,26,0.03)":undefined}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                {editPrName===pr.id
                  ?<input autoFocus value={editPrNameVal} onChange={e=>setEditPrNameVal(e.target.value)} onBlur={()=>{upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}} onKeyDown={e=>{if(e.key==="Enter"){upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}if(e.key==="Escape")setEditPrName(null);}} style={{fontSize:12,fontFamily:SANS,border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 6px",background:C.bg,color:C.black,outline:"none",width:"100%",marginBottom:3}}/>
                  :<p onClick={()=>{setEditPrName(pr.id);setEditPrNameVal(pr.name);setDelConfirm(null);}} style={{fontSize:12,color:C.black,margin:"0 0 3px",fontWeight:i===0?"500":"normal",cursor:"text"}} title="Click to rename">{pr.name} <span style={{fontSize:9,color:C.light}}>✎</span></p>}
                <p style={{fontSize:10.5,color:C.muted,margin:"0 0 6px"}}>{fmtD(pr.date)}</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:9.5,color:scol(pr.paid?"paid":pr.status),border:`1px solid ${scol(pr.paid?"paid":pr.status)}`,padding:"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{pr.paid?"Paid":pr.status}</span>
                  {end&&<UBadge end={end}/>}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                <p style={{fontFamily:SERIF,fontSize:14,color:C.black,margin:"0 0 3px"}}>{fmt(pr.amount)}</p>
                {(pr.amendments||[]).length>0&&<p style={{fontSize:10,color:C.muted,margin:"0 0 2px"}}>incl. {pr.amendments.length} amend.</p>}
                {(pr.renewals||[]).length>0&&<p style={{fontSize:10,color:C.green,margin:0}}>{pr.renewals.length} renewal{pr.renewals.length>1?"s":""}</p>}
                <div style={{marginTop:4}}>
                  {delConfirm===pr.id
                    ?<span style={{fontSize:8,color:C.red}}>Delete? <button onClick={()=>{setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.filter((proj: any)=>proj.id!==pr.id)}));setDelConfirm(null);}} style={{color:C.red,background:"none",border:"none",cursor:"pointer",fontSize:8,padding:"0 2px"}}>Yes</button> <button onClick={()=>setDelConfirm(null)} style={{color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:8,padding:"0 2px"}}>No</button></span>
                    :<button onClick={()=>{setDelConfirm(pr.id);setEditPrName(null);}} style={{fontSize:9.5,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:SANS}}>delete</button>}
                </div>
              </div>
            </div>
            {["production","invoiced","paid"].includes(pr.status)&&<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
              <span style={{fontSize:10,color:C.muted,whiteSpace:"nowrap",letterSpacing:"0.07em",textTransform:"uppercase"}}>Delivery Date</span>
              <I type="date" value={pr.deliveryDate||""} onChange={(e: any)=>upP(cl.id,pr.id,{deliveryDate:e.target.value})} s={{width:138,fontSize:10}}/>
            </div>}
            {(pr.renewals||[]).map((r: any,ri: number)=>(
              <div key={r.id} style={{background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:2,padding:"7px 10px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontWeight:"500"}}>Renewal {ri+1} — {r.optLabel}</p>
                    <p style={{fontSize:10,color:C.muted,margin:"0 0 5px"}}>{fmtD(r.startDate)} → {fmtD(r.endDate)}</p>
                  </div>
                  <p style={{fontSize:11,fontFamily:SERIF,margin:0,flexShrink:0,marginLeft:8}}>{fmt(r.fee)}</p>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:9,color:r.paid?C.green:r.signed?C.muted:C.amber,border:`1px solid ${r.paid?C.greenBorder:r.signed?C.rule:C.amberBorder}`,padding:"2px 7px",borderRadius:2,letterSpacing:"0.06em",textTransform:"uppercase"}}>{r.paid?"Renewal Paid":r.signed?"Signed — awaiting payment":"Unsigned"}</span>
                  {r.doc&&<button onClick={()=>setPdf({data:r.doc,type:"renewal",lang:"en"})} style={{fontSize:9,background:"none",border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 7px",cursor:"pointer",color:C.muted,fontFamily:SANS}}>PDF</button>}
                  {!r.signed&&<button onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any,rni: number)=>rni!==ri?rn:{...rn,signed:true})})}))} style={{fontSize:9,background:C.black,color:C.white,border:"none",borderRadius:2,padding:"2px 8px",cursor:"pointer",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase"}}>Mark Signed</button>}
                  {r.signed&&!r.paid&&<button onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any,rni: number)=>rni!==ri?rn:{...rn,paid:true})})}))} style={{fontSize:9,background:C.black,color:C.white,border:"none",borderRadius:2,padding:"2px 8px",cursor:"pointer",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase"}}>Mark Renewal Paid</button>}
                  {r.paid&&<button onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any,rni: number)=>rni!==ri?rn:{...rn,paid:false})})}))} style={{fontSize:9,background:"none",border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 7px",cursor:"pointer",color:C.amber,fontFamily:SANS}}>Undo</button>}
                </div>
              </div>
            ))}
            {pr.notes&&<p style={{fontSize:9,color:C.muted,margin:"0 0 7px",lineHeight:1.6}}>{pr.notes}</p>}

            {/* ── DOCUMENTS ── */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
              {!pr.qd&&<B s={{fontSize:8}} onClick={()=>onGoToCalc(cl.name)}>+ Create Quote in Calculator</B>}
              {pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"quote","en",cl.id)}>{pr.qd.rev>0?`Quote R${pr.qd.rev}`:"Quote"}</B>}
              {["contracted","production","invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"contract","en",cl.id)}>{pr.qd.contractRev>0?`Contract R${pr.qd.contractRev}`:"Contract"}</B>}
              {(pr.amendments||[]).map((a: any,ai: number)=>(
                <B key={ai} v="sec" s={{fontSize:8,color:a.signed?C.black:C.amber,borderColor:a.signed?C.rule:C.amberBorder}} onClick={()=>setPdf({data:{brand:pr.qd?.brand,contact:pr.qd?.contact,date:today(),ctype:pr.qd?.ctype||"Content Creator",qNo:pr.qd?.qNo,aNo:a.aNo,lines:a.lines||[],amendTotal:a.amendTotal,origTotal:pr.amount-a.amendTotal},type:"amendment",lang:"en"})}>Amend {ai+1}{!a.signed?" ·  unsigned":""}</B>
              ))}
              {["invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"invoice","en",cl.id)}>Invoice</B>}
            </div>

            {/* ── ACTIONS ── */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",paddingTop:7,borderTop:`1px solid ${C.rule}`}}>

              {/* lead: no actions — create quote is in docs row */}

              {/* quoted / revised: revise or move to contract */}
              {["quoted","revised"].includes(pr.status)&&<>
                <B v="sec" s={{fontSize:8}} onClick={()=>onRevise(pr,cl)}>Revise Quote</B>
                {pr.qd&&<B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"contracted")}>→ Create Contract</B>}
              </>}

              {/* contracted: revise contract text or mark signed */}
              {pr.status==="contracted"&&<>
                <B v="sec" s={{fontSize:8}} onClick={()=>openReviseContract(pr,cl.id)}>Revise Contract</B>
                <B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Mark Signed</B>
              </>}

              {/* production: amendments cycle + create invoice */}
              {pr.status==="production"&&<>
                <B v="sec" s={{fontSize:8}} onClick={()=>setAmendT({p:pr,cid:cl.id,pid:pr.id})}>Add Amendment</B>
                {(pr.amendments||[]).filter((a: any)=>!a.signed).map((a: any,ai: number)=>(
                  <B key={ai} v="sec" s={{fontSize:8,color:C.amber,borderColor:C.amberBorder}} onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,amendments:proj.amendments.map((am: any)=>am.aNo===a.aNo?{...am,signed:true}:am)})}))}>Mark Amend {a.aNo} Signed</B>
                ))}
                {pr.qd&&<B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"invoiced")}>Create Invoice</B>}
              </>}

              {/* invoiced: mark paid + undo + add renewal */}
              {pr.status==="invoiced"&&!pr.paid&&<>
                <B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"paid")}>Mark Paid</B>
                <B v="sec" s={{fontSize:8,color:C.green,borderColor:C.greenBorder}} onClick={()=>setRenewT({p:pr,cid:cl.id,pid:pr.id})}>Add Renewal</B>
                <B v="sec" s={{fontSize:8,color:C.muted}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Undo</B>
              </>}

              {/* paid: undo paid + add renewal */}
              {pr.paid&&<>
                <B v="sec" s={{fontSize:8,color:C.green,borderColor:C.greenBorder}} onClick={()=>setRenewT({p:pr,cid:cl.id,pid:pr.id})}>Add Renewal</B>
                <B v="sec" s={{fontSize:8,color:C.amber}} onClick={()=>upP(cl.id,pr.id,{paid:false,status:"invoiced"})}>Undo Paid</B>
              </>}

              {/* undo step — contracted and production only */}
              {["contracted","production"].includes(pr.status)&&!pr.paid&&<B v="sec" s={{fontSize:8,color:C.muted}} onClick={()=>setStatus(cl.id,pr.id,ps)}>Undo</B>}

            </div>
          </div>
        );
      })}
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
  useEffect(()=>{
    if(!pendingClientName)return;
    const c=clients.find((x: any)=>x.name.toLowerCase()===pendingClientName.toLowerCase());
    if(c)setSel(c.id);
    if(pendingProjectQNo)setHighlightedProjectQNo(pendingProjectQNo);
    if(onPendingClear)onPendingClear();
  },[pendingClientName]);
  const [showAdd,setShowAdd]=useState(false);
  const [nb,setNb]=useState({name:"",contact:"",email:"",agency:"Direct",country:"Germany",tags:[] as string[],notes:""});
  const [tagI,setTagI]=useState("");
  const [editMode,setEditMode]=useState(false);
  const [ed,setEd]=useState<any>(null);
  const [amendT,setAmendT]=useState<any>(null);
  const [renewT,setRenewT]=useState<any>(null);
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
  const addP=(cid: string)=>{if(!newPN.trim())return;const pr={id:uid(),name:newPN,status:"lead",amount:0,paid:false,date:today(),deliveryDate:"",notes:"",qd:null,amendments:[],renewals:[]};setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:[pr,...c.projects]}));setNewPN("");setShowAddP(false);};
  const saveAmend=(cid: string,pid: string,amend: any)=>{setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,amendments:[...(pr.amendments||[]),amend],amount:pr.amount+amend.amendTotal})}));setAmendT(null);};
  const saveRenewal=(cid: string,pid: string,renewal: any)=>{setClients((p: any[])=>p.map(c=>c.id!==cid?c:{...c,projects:c.projects.map((pr: any)=>pr.id!==pid?pr:{...pr,renewals:[...(pr.renewals||[]),renewal],usageEndOverride:renewal.endDate})}));setRenewT(null);};
  const setStatus=(cid: string,pid: string,st: string)=>upP(cid,pid,{status:st,paid:st==="paid"});
  const nxt=(s: string)=>{const i=STATUS.indexOf(s);return i<STATUS.length-1?STATUS[i+1]:null;};
  const prv=(s: string)=>{const i=STATUS.indexOf(s);return i>0?STATUS[i-1]:null;};
  const uEnd=(pr: any)=>{if(pr.usageEndOverride)return pr.usageEndOverride;if(!pr.deliveryDate||!pr.qd?.mo)return null;return addM(pr.deliveryDate,pr.qd.mo);};
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
  if(amendT)return<AmendModal p={amendT.p} onSave={(a: any)=>saveAmend(amendT.cid,amendT.pid,a)} onClose={()=>setAmendT(null)} settings={settings} rc={rc}/>;
  if(renewT)return<RenewalModal p={renewT.p} onSave={(r: any)=>saveRenewal(renewT.cid,renewT.pid,r)} onClose={()=>setRenewT(null)} settings={settings} rc={rc}/>;

  if(cl&&isMobile){
    const f=fin(cl);
    const edt=editMode?ed:cl;
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:8,flexWrap:"wrap"}}>
          <div style={{minWidth:0}}>
            {editMode?<I value={edt.name} onChange={(e: any)=>setEd((p: any)=>({...p,name:e.target.value}))} s={{fontSize:18,fontFamily:SERIF,marginBottom:4}}/>:<h2 style={{fontFamily:SERIF,fontSize:22,fontWeight:"normal",margin:"0 0 6px"}}>{cl.name}</h2>}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{cl.tags?.map((t: string)=><Tag key={t}>{t}</Tag>)}</div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"flex-start"}}>
            {editMode
              ?<><B onClick={()=>{upCl(cl.id,ed);setEditMode(false);}}>Save</B><B v="sec" onClick={()=>setEditMode(false)}>Cancel</B></>
              :<><B v="sec" onClick={()=>{setEd({...cl});setEditMode(true);}}>Edit Info</B><button onClick={()=>delCl(cl.id)} style={{fontSize:9.5,color:C.red,border:`1px solid ${C.redBorder}`,padding:"5px 10px",borderRadius:2,cursor:"pointer",background:"none",fontFamily:SANS,letterSpacing:"0.08em",textTransform:"uppercase"}}>Delete</button></>}
            <button onClick={()=>{setSel(null);setEditMode(false);}} title="Close" style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:18,lineHeight:1,padding:"2px 0 0 4px",marginLeft:2}}>✕</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px"}}>
            <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Brand Info</p>
            {editMode?<>
              <Lbl>Contact</Lbl><I value={edt.contact||""} onChange={(e: any)=>setEd((p: any)=>({...p,contact:e.target.value}))}/>
              <Lbl>Email</Lbl><I value={edt.email||""} onChange={(e: any)=>setEd((p: any)=>({...p,email:e.target.value}))} type="email"/>
              <Lbl>Agency / Direct</Lbl><S value={edt.agency||"Direct"} onChange={(e: any)=>setEd((p: any)=>({...p,agency:e.target.value}))}><option>Direct</option><option>Agency</option></S>
              <Lbl>Country</Lbl><I value={edt.country||""} onChange={(e: any)=>setEd((p: any)=>({...p,country:e.target.value}))}/>
              <Lbl>Tags</Lbl>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>{(edt.tags||[]).map((t: string)=><Tag key={t} onRemove={()=>setEd((p: any)=>({...p,tags:p.tags.filter((x: string)=>x!==t)}))}>{t}</Tag>)}</div>
              <div style={{display:"flex",gap:5}}><I value={tagI} onChange={(e: any)=>setTagI(e.target.value)} placeholder="Add tag" onKeyDown={(e: any)=>{if(e.key==="Enter"&&tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} /><B v="sec" onClick={()=>{if(tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} s={{fontSize:9}}>+</B></div>
            </>:<><IR label="Contact" value={cl.contact}/><IR label="Email" value={cl.email}/><IR label="Type" value={cl.agency}/><IR label="Country" value={cl.country}/></>}
          </div>
          <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px"}}>
            <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Financial Snapshot</p>
            <IR label="Total Revenue" value={fmt(f.total)}/>
            <IR label="Paid Projects" value={`${f.count}`}/>
            <IR label="Last Invoice" value={f.lastDate?`${fmt(f.last)} · ${fmtD(f.lastDate)}`:"—"}/>
            <IR label="Avg. Deal" value={f.avg?fmt(f.avg):"—"}/>
            <IR label="Outstanding" value={fmt(f.out)}/>
          </div>
        </div>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 9px"}}>Relationship Notes</p>
          {editMode?<textarea value={edt.notes||""} onChange={(e: any)=>setEd((p: any)=>({...p,notes:e.target.value}))} style={{width:"100%",minHeight:50,padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:11,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>:<p style={{fontSize:11,color:cl.notes?C.black:C.light,margin:0,lineHeight:1.6}}>{cl.notes||"No notes yet…"}</p>}
        </div>
        {cl.projects.some((pr: any)=>uEnd(pr))&&(
          <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10}}>
            <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Usage Rights Tracker</p>
            {cl.projects.filter((pr: any)=>uEnd(pr)).map((pr: any)=>(
              <div key={pr.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.rule}`}}>
                <span style={{fontSize:11}}>{pr.name}</span>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <UBadge end={uEnd(pr)}/>
                  {(pr.renewals||[]).length>0&&<span style={{fontSize:9.5,color:C.green,border:`1px solid ${C.greenBorder}`,padding:"2px 7px",borderRadius:2}}>{pr.renewals.length} renewal{pr.renewals.length>1?"s":""}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 0 9px"}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:0}}>Collaboration History</p>
          <B v="sec" s={{fontSize:8}} onClick={()=>{setShowAddP((s: boolean)=>!s);setNewPN("");}}>+ Add Project</B>
        </div>
        {showAddP&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 11px",marginBottom:9}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 9px"}}>Add Project</p>
          <B s={{width:"100%",textAlign:"center",marginBottom:8}} onClick={()=>{onGoToCalc(cl.name);setShowAddP(false);}}>Build Quote in Calculator</B>
          <p style={{fontSize:10,color:C.muted,textAlign:"center",margin:"0 0 8px"}}>— or add manually —</p>
          <div style={{display:"flex",gap:7}}>
            <I placeholder="Project name" value={newPN} onChange={(e: any)=>setNewPN(e.target.value)} onKeyDown={(e: any)=>e.key==="Enter"&&addP(cl.id)}/>
            <B v="sec" onClick={()=>addP(cl.id)}>Add</B>
            <B v="sec" onClick={()=>{setShowAddP(false);setNewPN("");}}>Cancel</B>
          </div>
        </div>}
        {cl.projects.map((pr: any,i: number)=>{
          const end=uEnd(pr);const ns=nxt(pr.status);const ps=prv(pr.status);
          const isHighlighted=highlightedProjectQNo&&pr.qd?.qNo===highlightedProjectQNo;
          return(
            <div key={pr.id} onClick={()=>{if(isHighlighted)setHighlightedProjectQNo(null);}} style={{border:`1px solid ${isHighlighted?C.light:C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10,background:isHighlighted?"rgba(26,26,26,0.03)":undefined}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  {editPrName===pr.id
                    ?<input autoFocus value={editPrNameVal} onChange={e=>setEditPrNameVal(e.target.value)} onBlur={()=>{upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}} onKeyDown={e=>{if(e.key==="Enter"){upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}if(e.key==="Escape")setEditPrName(null);}} style={{fontSize:12,fontFamily:SANS,border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 6px",background:C.bg,color:C.black,outline:"none",width:"100%",marginBottom:3}}/>
                    :<p onClick={()=>{setEditPrName(pr.id);setEditPrNameVal(pr.name);setDelConfirm(null);}} style={{fontSize:12,color:C.black,margin:"0 0 3px",fontWeight:i===0?"500":"normal",cursor:"text"}} title="Click to rename">{pr.name} <span style={{fontSize:9,color:C.light}}>✎</span></p>}
                  <p style={{fontSize:10.5,color:C.muted,margin:"0 0 6px"}}>{fmtD(pr.date)}</p>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:9.5,color:scol(pr.paid?"paid":pr.status),border:`1px solid ${scol(pr.paid?"paid":pr.status)}`,padding:"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{pr.paid?"Paid":pr.status}</span>
                    {end&&<UBadge end={end}/>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                  <p style={{fontFamily:SERIF,fontSize:14,color:C.black,margin:"0 0 3px"}}>{fmt(pr.amount)}</p>
                  {(pr.amendments||[]).length>0&&<p style={{fontSize:10,color:C.muted,margin:"0 0 2px"}}>incl. {pr.amendments.length} amend.</p>}
                  {(pr.renewals||[]).length>0&&<p style={{fontSize:10,color:C.green,margin:0}}>{pr.renewals.length} renewal{pr.renewals.length>1?"s":""}</p>}
                  <div style={{marginTop:4}}>
                    {delConfirm===pr.id
                      ?<span style={{fontSize:8,color:C.red}}>Delete? <button onClick={()=>{setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.filter((proj: any)=>proj.id!==pr.id)}));setDelConfirm(null);}} style={{color:C.red,background:"none",border:"none",cursor:"pointer",fontSize:8,padding:"0 2px"}}>Yes</button> · <button onClick={()=>setDelConfirm(null)} style={{color:C.muted,background:"none",border:"none",cursor:"pointer",fontSize:8,padding:"0 2px"}}>No</button></span>
                      :<button onClick={()=>{setDelConfirm(pr.id);setEditPrName(null);}} style={{fontSize:9.5,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:SANS}}>✕ delete</button>}
                  </div>
                </div>
              </div>
              {["production","invoiced","paid"].includes(pr.status)&&<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                <span style={{fontSize:10,color:C.muted,whiteSpace:"nowrap",letterSpacing:"0.07em",textTransform:"uppercase"}}>Delivery Date</span>
                <I type="date" value={pr.deliveryDate||""} onChange={(e: any)=>upP(cl.id,pr.id,{deliveryDate:e.target.value})} s={{width:138,fontSize:10}}/>
              </div>}
              {(pr.renewals||[]).map((r: any,ri: number)=>(
                <div key={r.id} style={{background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:2,padding:"7px 10px",marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontWeight:"500"}}>Renewal {ri+1} — {r.optLabel}</p>
                      <p style={{fontSize:10,color:C.muted,margin:"0 0 5px"}}>{fmtD(r.startDate)} → {fmtD(r.endDate)}</p>
                    </div>
                    <p style={{fontSize:11,fontFamily:SERIF,margin:0,flexShrink:0,marginLeft:8}}>{fmt(r.fee)}</p>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:9,color:r.paid?C.green:r.signed?C.muted:C.amber,border:`1px solid ${r.paid?C.greenBorder:r.signed?C.rule:C.amberBorder}`,padding:"2px 7px",borderRadius:2,letterSpacing:"0.06em",textTransform:"uppercase"}}>{r.paid?"Renewal Paid":r.signed?"Signed — awaiting payment":"Unsigned"}</span>
                    {r.doc&&<button onClick={()=>setPdf({data:r.doc,type:"renewal",lang:"en"})} style={{fontSize:9,background:"none",border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 7px",cursor:"pointer",color:C.muted,fontFamily:SANS}}>PDF</button>}
                    {!r.signed&&<button onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any,rni: number)=>rni!==ri?rn:{...rn,signed:true})})}))} style={{fontSize:9,background:C.black,color:C.white,border:"none",borderRadius:2,padding:"2px 8px",cursor:"pointer",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase"}}>Mark Signed</button>}
                    {r.signed&&!r.paid&&<button onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any,rni: number)=>rni!==ri?rn:{...rn,paid:true})})}))} style={{fontSize:9,background:C.black,color:C.white,border:"none",borderRadius:2,padding:"2px 8px",cursor:"pointer",fontFamily:SANS,letterSpacing:"0.06em",textTransform:"uppercase"}}>Mark Renewal Paid</button>}
                    {r.paid&&<button onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,renewals:proj.renewals.map((rn: any,rni: number)=>rni!==ri?rn:{...rn,paid:false})})}))} style={{fontSize:9,background:"none",border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 7px",cursor:"pointer",color:C.amber,fontFamily:SANS}}>Undo</button>}
                  </div>
                </div>
              ))}
              {pr.notes&&<p style={{fontSize:9,color:C.muted,margin:"0 0 7px",lineHeight:1.6}}>{pr.notes}</p>}

              {/* ── DOCUMENTS ── */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                {!pr.qd&&<B s={{fontSize:8}} onClick={()=>onGoToCalc(cl.name)}>+ Create Quote in Calculator</B>}
                {pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"quote","en",cl.id)}>{pr.qd.rev>0?`Quote R${pr.qd.rev}`:"Quote"}</B>}
                {["contracted","production","invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"contract","en",cl.id)}>{pr.qd.contractRev>0?`Contract R${pr.qd.contractRev}`:"Contract"}</B>}
                {(pr.amendments||[]).map((a: any,ai: number)=>(
                  <B key={ai} v="sec" s={{fontSize:8,color:a.signed?C.black:C.amber,borderColor:a.signed?C.rule:C.amberBorder}} onClick={()=>setPdf({data:{brand:pr.qd?.brand,contact:pr.qd?.contact,date:today(),ctype:pr.qd?.ctype||"Content Creator",qNo:pr.qd?.qNo,aNo:a.aNo,lines:a.lines||[],amendTotal:a.amendTotal,origTotal:pr.amount-a.amendTotal},type:"amendment",lang:"en"})}>Amend {ai+1}{!a.signed?" · unsigned":""}</B>
                ))}
                {["invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"invoice","en",cl.id)}>Invoice</B>}
              </div>

              {/* ── ACTIONS ── */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",paddingTop:7,borderTop:`1px solid ${C.rule}`}}>

                {/* quoted / revised: revise or move to contract */}
                {["quoted","revised"].includes(pr.status)&&<>
                  <B v="sec" s={{fontSize:8}} onClick={()=>onRevise(pr,cl)}>Revise Quote</B>
                  {pr.qd&&<B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"contracted")}>→ Create Contract</B>}
                </>}

                {/* contracted: revise contract text or mark signed */}
                {pr.status==="contracted"&&<>
                  <B v="sec" s={{fontSize:8}} onClick={()=>openReviseContract(pr,cl.id)}>Revise Contract</B>
                  <B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Mark Signed</B>
                </>}

                {/* production: amendments cycle + create invoice */}
                {pr.status==="production"&&<>
                  <B v="sec" s={{fontSize:8}} onClick={()=>setAmendT({p:pr,cid:cl.id,pid:pr.id})}>Add Amendment</B>
                  {(pr.amendments||[]).filter((a: any)=>!a.signed).map((a: any,ai: number)=>(
                    <B key={ai} v="sec" s={{fontSize:8,color:C.amber,borderColor:C.amberBorder}} onClick={()=>setClients((p: any[])=>p.map(c=>c.id!==cl.id?c:{...c,projects:c.projects.map((proj: any)=>proj.id!==pr.id?proj:{...proj,amendments:proj.amendments.map((am: any)=>am.aNo===a.aNo?{...am,signed:true}:am)})}))}>Mark Amend {a.aNo} Signed</B>
                  ))}
                  {pr.qd&&<B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"invoiced")}>Create Invoice</B>}
                </>}

                {/* invoiced: mark paid + undo + add renewal */}
                {pr.status==="invoiced"&&!pr.paid&&<>
                  <B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"paid")}>Mark Paid</B>
                  <B v="sec" s={{fontSize:8,color:C.green,borderColor:C.greenBorder}} onClick={()=>setRenewT({p:pr,cid:cl.id,pid:pr.id})}>Add Renewal</B>
                  <B v="sec" s={{fontSize:8,color:C.muted}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Undo</B>
                </>}

                {/* paid: undo paid + add renewal */}
                {pr.paid&&<>
                  <B v="sec" s={{fontSize:8,color:C.green,borderColor:C.greenBorder}} onClick={()=>setRenewT({p:pr,cid:cl.id,pid:pr.id})}>Add Renewal</B>
                  <B v="sec" s={{fontSize:8,color:C.amber}} onClick={()=>upP(cl.id,pr.id,{paid:false,status:"invoiced"})}>Undo Paid</B>
                </>}

                {/* undo step — contracted and production only */}
                {["contracted","production"].includes(pr.status)&&!pr.paid&&<B v="sec" s={{fontSize:8,color:C.muted}} onClick={()=>setStatus(cl.id,pr.id,ps)}>Undo</B>}

              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return(
    <div style={{display:cl&&!isMobile?"flex":"block",gap:cl&&!isMobile?28:0,alignItems:"flex-start"}}>
      <div style={{flex:cl&&!isMobile?"0 0 42%":"1 1 100%",minWidth:0,overflowY:cl&&!isMobile?"auto":undefined,maxHeight:cl&&!isMobile?"calc(100vh - 80px)":undefined}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Clients</h2>
        <B onClick={()=>setShowAdd((s: boolean)=>!s)}>+ New Client</B>
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
          <div key={c.id} onClick={()=>setSel(c.id)} style={{border:`1px solid ${sel===c.id?C.light:C.rule}`,borderRadius:2,padding:"11px 13px",marginBottom:8,cursor:"pointer",background:sel===c.id?"rgba(26,26,26,0.03)":undefined}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{fontSize:13,color:C.black,margin:"0 0 2px",fontWeight:"500"}}>{c.name}</p>
                <p style={{fontSize:10.5,color:C.muted,margin:0}}>{c.contact}{c.email?` · ${c.email}`:""}</p>
                {(c.tags||[]).length>0&&<div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>{c.tags.map((t: string)=><Tag key={t}>{t}</Tag>)}</div>}
                {active&&<p style={{fontSize:10.5,color:C.muted,margin:"4px 0 0"}}>{active.name}</p>}
              </div>
              {active&&<div style={{textAlign:"right"}}>
                <p style={{fontFamily:SERIF,fontSize:14,color:C.black,margin:"0 0 3px"}}>{fmt(active.amount)}</p>
                <span style={{fontSize:9.5,color:scol(active.paid?"paid":active.status),border:`1px solid ${scol(active.paid?"paid":active.status)}`,padding:"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{active.paid?"Paid":active.status}</span>
              </div>}
            </div>
            {allRights.length>0&&<div style={{marginTop:7,paddingTop:7,borderTop:`1px solid ${C.rule}`,display:"flex",flexDirection:"column",gap:4}}>
              {allRights.map((r: any,i: number)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {multiProj&&<span style={{fontSize:9,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{r.prName}</span>}
                  <UBadge end={r.end} label={r.label}/>
                </div>
              ))}
            </div>}
          </div>
        );
      })}
      </div>{/* end left col */}
      {cl&&!isMobile&&<ClientDetail cl={cl} fin={fin} editMode={editMode} ed={ed} setEd={setEd} upCl={upCl} setEditMode={setEditMode} delCl={delCl} tagI={tagI} setTagI={setTagI} uEnd={uEnd} showAddP={showAddP} setShowAddP={setShowAddP} newPN={newPN} setNewPN={setNewPN} addP={addP} onGoToCalc={onGoToCalc} upP={upP} setClients={setClients} openPDF={openPDF} openReviseContract={openReviseContract} setPdf={setPdf} onRevise={onRevise} onAmend={onAmend} setAmendT={setAmendT} setRenewT={setRenewT} setStatus={setStatus} nxt={nxt} prv={prv} editPrName={editPrName} setEditPrName={setEditPrName} editPrNameVal={editPrNameVal} setEditPrNameVal={setEditPrNameVal} delConfirm={delConfirm} setDelConfirm={setDelConfirm} setSel={setSel} highlightedProjectQNo={highlightedProjectQNo} onClearHighlight={()=>setHighlightedProjectQNo(null)}/>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────
function Dashboard({clients,goTo,isMobile}: any) {
  const [drill,setDrill]=useState<null|"year"|"month"|"license">(null);
  const all=clients.flatMap((c: any)=>c.projects.map((pr: any)=>({...pr,cName:c.name,cId:c.id})));
  const paid=all.filter((pr: any)=>pr.paid&&pr.date);
  const openQ=all.filter((pr: any)=>pr.status==="quoted"||pr.status==="revised");
  const unsigned=all.filter((pr: any)=>pr.status==="contracted"&&!pr.paid);
  const unpaid=all.filter((pr: any)=>pr.status==="invoiced"&&!pr.paid);
  const rev=paid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const out=unpaid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const uEnd=(pr: any)=>{if(pr.usageEndOverride)return pr.usageEndOverride;if(!pr.deliveryDate||!pr.qd?.mo)return null;return addM(pr.deliveryDate,pr.qd.mo);};
  const expiring=all.filter((pr: any)=>{const e=uEnd(pr);if(!e)return false;const d=dLeft(e);return d!==null&&d>=0&&d<=30;});
  const allLicenses=clients.flatMap((c: any)=>c.projects.flatMap((pr: any)=>{
    const items: {cName:string,cId:string,prName:string,end:string,label:string}[]=[];
    const ue=uEnd(pr);
    if(ue)items.push({cName:c.name,cId:c.id,prName:pr.name,end:ue,label:"Usage"});
    (pr.renewals||[]).filter((r: any)=>r.type==="excl"&&r.endDate).forEach((r: any)=>{items.push({cName:c.name,cId:c.id,prName:pr.name,end:r.endDate,label:"Excl."});});
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
  const Card=({label,count,items,warm,sub,onClick}: any)=>(
    <div onClick={onClick||(()=>items?.length&&goTo(1))} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px",cursor:(onClick||items?.length)?"pointer":"default"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:7}}>
        <span style={{fontSize:12,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:SERIF,fontSize:16,color:typeof count==="string"?C.black:count>0&&warm?C.amber:count>0?C.black:C.light}}>{count}</span>
      </div>
      {sub&&<p style={{fontSize:10.5,color:C.muted,margin:"0 0 8px"}}>{sub}</p>}
      {items?.slice(0,3).map((pr: any,i: number)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}><span style={{fontSize:10.5,color:C.muted}}>{pr.cName}</span><span style={{fontSize:10.5}}>{pr.amount?fmt(pr.amount):""}</span></div>)}
      {items?.length===0&&<p style={{fontSize:10.5,color:C.muted,margin:0}}>—</p>}
    </div>
  );
  if(drill==="year"){
    return(
      <div>
        <button onClick={()=>setDrill(null)} style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16}}>← Dashboard</button>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Revenue by Year</h2>
        <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{allYears.length} year{allYears.length!==1?"s":""} with paid projects</p>
        {allYears.map((y: number)=>{
          const yPaid=paid.filter((pr: any)=>yearOf(pr)===y);
          const yRev=yPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
          return(
            <div key={y} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px",marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:yPaid.length?8:0}}>
                <span style={{fontSize:11,color:y===nowY?C.black:C.muted,fontWeight:y===nowY?"500":"normal"}}>{y}{y===nowY?" · Current":""}</span>
                <span style={{fontFamily:SERIF,fontSize:20,color:C.black}}>{fmt(yRev)}</span>
              </div>
              {yPaid.slice(0,3).map((pr: any,i: number)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                  <span style={{fontSize:10.5,color:C.muted}}>{pr.cName} · {pr.name}</span>
                  <span style={{fontSize:10.5}}>{fmt(pr.amount)}</span>
                </div>
              ))}
              {yPaid.length>3&&<p style={{fontSize:10,color:C.light,margin:"4px 0 0"}}>+{yPaid.length-3} more</p>}
            </div>
          );
        })}
      </div>
    );
  }
  if(drill==="month"){
    return(
      <div>
        <button onClick={()=>setDrill(null)} style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16}}>← Dashboard</button>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Revenue by Month</h2>
        <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{nowY} · Jan — {MO[nowM]}</p>
        {[...monthsToShow].reverse().map((m: number)=>{
          const mPaid=paid.filter((pr: any)=>yearOf(pr)===nowY&&monthOf(pr)===m);
          const mRev=mPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
          return(
            <div key={m} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px",marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:mPaid.length?8:0}}>
                <span style={{fontSize:11,color:m===nowM?C.black:C.muted,fontWeight:m===nowM?"500":"normal"}}>{MO[m]} {nowY}{m===nowM?" · This month":""}</span>
                <span style={{fontFamily:SERIF,fontSize:20,color:mRev>0?C.black:C.light}}>{mRev>0?fmt(mRev):"—"}</span>
              </div>
              {mPaid.slice(0,3).map((pr: any,i: number)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                  <span style={{fontSize:10.5,color:C.muted}}>{pr.cName} · {pr.name}</span>
                  <span style={{fontSize:10.5}}>{fmt(pr.amount)}</span>
                </div>
              ))}
              {mPaid.length===0&&<p style={{fontSize:10.5,color:C.light,margin:0}}>No paid projects</p>}
              {mPaid.length>3&&<p style={{fontSize:10,color:C.light,margin:"4px 0 0"}}>+{mPaid.length-3} more</p>}
            </div>
          );
        })}
      </div>
    );
  }
  if(drill==="license"){
    return(
      <div>
        <button onClick={()=>setDrill(null)} style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16}}>← Dashboard</button>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>License Tracker</h2>
        <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{allLicenses.length} active license{allLicenses.length!==1?"s":""} · sorted by expiry</p>
        {allLicenses.length===0&&<p style={{fontSize:11,color:C.muted}}>No active licenses tracked.</p>}
        {allLicenses.map((r: any,i: number)=>{
          const d=dLeft(r.end);
          const urgent=d!==null&&d<=14;
          const soon=d!==null&&d>14&&d<=30;
          return(
            <div key={i} onClick={()=>goTo(1)} style={{border:`1px solid ${urgent?C.redBorder:soon?C.amberBorder:C.rule}`,borderRadius:2,padding:"13px 15px",marginBottom:9,cursor:"pointer",background:urgent?C.redBg:soon?C.amberBg:undefined}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13,color:C.black,margin:"0 0 2px",fontWeight:"500"}}>{r.cName}</p>
                  <p style={{fontSize:10.5,color:C.muted,margin:0}}>{r.prName}</p>
                </div>
                <UBadge end={r.end} label={r.label}/>
              </div>
              <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${urgent?C.redBorder:soon?C.amberBorder:C.rule}`,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase"}}>{r.label} expires</span>
                <span style={{fontSize:11,color:urgent?C.red:soon?C.amber:C.muted}}>{fmtD(r.end)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return(
    <div>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 16px"}}>Dashboard</h2>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>
        <Card label="Total Revenue" count={fmt(rev)} sub={`${clients.filter((c: any)=>c.projects.some((pr: any)=>pr.paid)).length} paying client${clients.filter((c: any)=>c.projects.some((pr: any)=>pr.paid)).length!==1?"s":""}`}/>
        <Card label="Outstanding" count={fmt(out)} items={unpaid} warm sub={`${unpaid.length} unpaid invoice${unpaid.length!==1?"s":""}`}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>
        <Card label={`${nowY} Revenue`} count={fmt(thisYearRev)} sub={`${thisYearPaid.length} paid project${thisYearPaid.length!==1?"s":""}`} onClick={()=>setDrill("year")}/>
        <Card label={`${MO[nowM]} Revenue`} count={fmt(thisMonthRev)} sub={`${thisMonthPaid.length} paid project${thisMonthPaid.length!==1?"s":""}`} onClick={()=>setDrill("month")}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>
        <Card label="Open Quotes" count={openQ.length} items={openQ} warm/>
        <Card label="Active Contracts" count={unsigned.length} items={unsigned}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:9}}>
        <Card label="Unpaid Invoices" count={unpaid.length} items={unpaid} warm/>
        <Card label="License Tracker" count={allLicenses.length} sub={`${allLicenses.length} active license${allLicenses.length!==1?"s":""} tracked`} onClick={()=>setDrill("license")}/>
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

function Invoices({clients,settings,isMobile}: any) {
  const [pdfData,setPdfData]=useState<any>(null);
  const [dropOpen,setDropOpen]=useState(false);
  const [bulkStatus,setBulkStatus]=useState<string|null>(null);
  const allRows = buildInvoiceRows(clients);

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

  // group by year then month
  const grouped: {year:number,months:{month:number,rows:any[]}[]}[] = [];
  allRows.forEach(r=>{
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
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Invoices</h2>
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
          <button onClick={()=>exportExcel(allRows)} title="Export all as Excel" style={{...btnStyle,padding:"0 8px"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 1v8M7 9l-3-3M7 9l3-3M2 11h10" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      {allRows.length===0&&<p style={{fontSize:11,color:C.muted}}>No invoices yet. Projects move here once invoiced or paid.</p>}
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
  const [authed,setAuthed]=useState(false);
  const [role,setRole]=useState<"manager"|"creator">("manager");
  const [nav,setNav]=useState(0);
  const [prefill,setPrefill]=useState<any>(null);
  const [clientSelReset,setClientSelReset]=useState(0);
  const [clientSel,setClientSel]=useState<string|null>(null);
  const [pendingClientName,setPendingClientName]=useState<string|null>(null);
  const [pendingProjectQNo,setPendingProjectQNo]=useState<string|null>(null);
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

  if(!authed)return<Auth onAuth={(r)=>{setRole(r);setAuthed(true);}} currentPass={settings.password||PASS}/>;
  if(role==="creator")return<CreatorPage settings={settings} logout={()=>{setAuthed(false);setNav(0);}}/>;

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
  const handleAfterSave=(brand: string,qNo?: string)=>{setPendingClientName(brand);setPendingProjectQNo(qNo||null);setNav(1);};

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
      ii:Math.max(0,items.findIndex((it: any)=>it.n===ln.name)),
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

  const logout=()=>{setAuthed(false);setNav(0);setMenuOpen(false);};
  const NAV=["Dashboard","Clients","Calculator"];
  const initials=(()=>{const n=(settings.name||settings.company||"Lynn Hoa").trim();const p=n.split(/\s+/);return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase();})();
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:SANS,color:C.black}}>
      <div style={{borderBottom:`1px solid ${C.rule}`,position:"sticky",top:0,background:C.bg,zIndex:100}}>
        {appMobile?(
          <>
            <div style={{textAlign:"center",padding:"10px 20px 7px"}}>
              <AppLogo/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px",borderTop:`1px solid ${C.rule}`,position:"relative"}}>
              <div style={{display:"flex"}}>
                {NAV.map((n,i)=><button key={i} onClick={()=>{if(i===1)setClientSelReset(p=>p+1);setNav(i);}} style={{padding:"0 10px",height:40,background:"none",border:"none",borderBottom:nav===i?`2px solid ${C.black}`:"2px solid transparent",color:nav===i?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>)}
              </div>
              <div style={{position:"absolute",right:6,display:"flex",alignItems:"center"}}>
                {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
                <button onClick={()=>setMenuOpen(m=>!m)} title="Account" style={{width:30,height:30,borderRadius:"50%",background:C.black,color:C.white,border:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:200,flexShrink:0}}>{initials}</button>
                {menuOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:172,zIndex:200}}>
                  <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.rule}`}}>
                    <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontFamily:SERIF}}>{settings.name||settings.company||"Lynn Hoa"}</p>
                    <p style={{fontSize:7.5,color:C.light,margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>{role==="creator"?"Creator":"Manager"} · Private</p>
                  </div>
                  {([["Creator Profile",4],["Change Password",5],["Rate Cards",3],["Invoices",6]] as [string,number][]).map(([label,idx])=>(
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
                {([["Creator Profile",4],["Change Password",5],["Rate Cards",3],["Invoices",6]] as [string,number][]).map(([label,idx])=>(
                  <button key={idx} onClick={()=>{setNav(idx);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:nav===idx?"rgba(0,0,0,0.03)":"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:nav===idx?C.black:C.muted,letterSpacing:"0.04em",boxSizing:"border-box"}}>{label}</button>
                ))}
                <div style={{borderTop:`1px solid ${C.rule}`}}/>
                <button onClick={logout} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.red,letterSpacing:"0.04em",boxSizing:"border-box"}}>Log Out</button>
              </div>}
            </div>
            <div style={{textAlign:"center"}}><AppLogo size="web"/></div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              {NAV.map((n,i)=><button key={i} onClick={()=>{if(i===1)setClientSelReset(p=>p+1);setNav(i);}} style={{padding:"0 14px",height:56,background:"none",border:"none",borderBottom:nav===i?`2px solid ${C.black}`:"2px solid transparent",color:nav===i?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>)}
            </div>
          </div>
        )}
      </div>
      <div style={{maxWidth:nav===1&&clientSel&&!appMobile?1200:840,margin:"0 auto",padding:appMobile?"20px 12px":"28px 20px",transition:"max-width 0.25s ease"}}>
        {nav===0&&<Dashboard clients={clients} goTo={setNav} isMobile={appMobile}/>}
        {nav===1&&<Clients clients={clients} setClients={setClients} onRevise={handleRevise} onAmend={handleAmend} goTo={setNav} settings={settings} onGoToCalc={handleGoToCalc} isMobile={appMobile} rc={rc} selReset={clientSelReset} onSelChange={setClientSel} pendingClientName={pendingClientName} onPendingClear={()=>{setPendingClientName(null);setPendingProjectQNo(null);}} pendingProjectQNo={pendingProjectQNo}/>}
        {nav===2&&<Calculator onSave={handleSave} prefill={prefill} clearPrefill={()=>setPrefill(null)} rc={rc} settings={settings} isMobile={appMobile} onAfterSave={handleAfterSave}/>}
        {nav===3&&<RateCards rc={rc} setRc={setRc} settings={settings}/>}
        {nav===4&&<Settings settings={settings} setSettings={setSettings} isMobile={appMobile}/>}
        {nav===5&&<ChangePassword settings={settings} setSettings={setSettings}/>}
        {nav===6&&<Invoices clients={clients} settings={settings} isMobile={appMobile}/>}
      </div>
    </div>
  );
}

// ─── CREATOR PAGE (placeholder) ───────────────────────────
function CreatorPage({settings,logout}: {settings: any,logout:()=>void}) {
  const [menuOpen,setMenuOpen]=useState(false);
  const initials=(()=>{const n=(settings.name||settings.company||"Lynn Hoa").trim();const p=n.split(/\s+/);return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase();})();
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:SANS,color:C.black}}>
      <div style={{borderBottom:`1px solid ${C.rule}`,padding:"0 20px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",minHeight:56,position:"sticky",top:0,background:C.bg,zIndex:100}}>
        <div/>
        <AppLogo/>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <div style={{position:"relative",display:"flex",alignItems:"center"}}>
            {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
            <button onClick={()=>setMenuOpen(m=>!m)} title="Account" style={{width:30,height:30,borderRadius:"50%",background:C.black,color:C.white,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS,fontSize:9,letterSpacing:"0.04em",flexShrink:0,position:"relative",zIndex:200}}>{initials}</button>
            {menuOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:172,zIndex:200}}>
              <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.rule}`}}>
                <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontFamily:SERIF}}>{settings.name||settings.company||"Lynn Hoa"}</p>
                <p style={{fontSize:7.5,color:C.light,margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>Creator · Private</p>
              </div>
              <button onClick={()=>{setMenuOpen(false);logout();}} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.red,letterSpacing:"0.04em",boxSizing:"border-box"}}>Log Out</button>
            </div>}
          </div>
        </div>
      </div>
      <div style={{maxWidth:840,margin:"0 auto",padding:"80px 20px",textAlign:"center"}}>
        <p style={{fontFamily:SERIF,fontSize:28,fontWeight:"normal",color:C.black,margin:"0 0 14px"}}>Creator View</p>
        <p style={{fontSize:11,color:C.muted,letterSpacing:"0.03em",lineHeight:1.7}}>This space is being built.<br/>Check back soon.</p>
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
