// ─── RATE CARD TEMPLATES ──────────────────────────────────
// RC0 is the default seed for rate card structure (sections, packages, fine print).
// Single item prices come from the pool at runtime — these are display templates.
// Usage/excl arrays reference constants from constants.ts.

import {
  USAGE_INFLUENCER, EXCL_INFLUENCER,
  USAGE_UGC,        EXCL_UGC,
  USAGE_EDITORIAL,  EXCL_EDITORIAL,
} from "./constants";

export const RC0: Record<string, any> = {
  influencer:{
    label:"Content Creator", sub:"Content Creator · Based in Germany",
    sections:[
      {t:"01 — Brand Collaboration", items:[
        {id:"i1",cat:"influencer",kind:"single",n:"Photo",note:"Feed post",p:200},
        {id:"i2",cat:"influencer",kind:"single",n:"Photo Set",note:"Carousel · 3–5 images",p:300},
        {id:"i3",cat:"influencer",kind:"single",n:"Short-form video",note:"Reels / TikTok / YouTube Shorts",p:350},
        {id:"i4",cat:"influencer",kind:"single",n:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",p:450},
        {id:"i5",cat:"influencer",kind:"single",n:"Story Set",note:"3 frames",p:180}]},
      {t:"Packages", items:[
        {id:"ip1",cat:"influencer",kind:"package",n:"Starter",note:"3 short-form videos · instead of € 1,050",p:890},
        {id:"ip2",cat:"influencer",kind:"package",n:"Full launch",note:"2 short-form videos + Story set · instead of € 880",p:750},
        {id:"ip3",cat:"influencer",kind:"package",n:"Campaign",note:"4 short-form videos + 2 Story sets · instead of € 1,760",p:1500}]},
      {t:"Brand Ambassador", items:[
        {id:"iba",cat:"influencer",kind:"other",n:"Brand Ambassador",note:"6 months · min. 3 pieces/month · 20% off/month",p:null}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"iu1",cat:"influencer",kind:"usage",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"iu2",cat:"influencer",kind:"usage",n:"Paid ads — 1 month",note:"",p:null,m:"+30%"},
        {id:"iu3",cat:"influencer",kind:"usage",n:"Paid ads — 3 months",note:"",p:null,m:"+60%"},
        {id:"iu4",cat:"influencer",kind:"usage",n:"Paid ads — 6 months",note:"",p:null,m:"+100%"},
        {id:"iu5",cat:"influencer",kind:"usage",n:"Paid ads — 12 months",note:"",p:null,m:"+150%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"ie1",cat:"influencer",kind:"excl",n:"Category exclusivity — 1 month",note:"",p:null,m:"+30%"},
        {id:"ie2",cat:"influencer",kind:"excl",n:"Category exclusivity — 3 months",note:"",p:null,m:"+60%"},
        {id:"ie3",cat:"influencer",kind:"excl",n:"Full exclusivity — 1 month",note:"",p:null,m:"+75%"},
        {id:"ie4",cat:"influencer",kind:"excl",n:"Full exclusivity — 3 months",note:"",p:null,m:"+125%"}]},
      {t:"Add-ons", items:[
        {id:"ia1",cat:"influencer",kind:"addon",n:"Additional Story frame",note:"per frame",p:50},
        {id:"ia2",cat:"influencer",kind:"addon",n:"Link in bio",note:"per week",p:100},
        {id:"ia3",cat:"influencer",kind:"addon",n:"Whitelisting / boosting",note:"Ads through Lynn's account",p:null,m:"+30%/mo"},
        {id:"ia4",cat:"influencer",kind:"addon",n:"Rush delivery",note:"Under 5 business days",p:null,m:"+25%"},
        {id:"ia5",cat:"influencer",kind:"addon",n:"Pinned post",note:"Post kept pinned",p:100},
        {id:"ia6",cat:"influencer",kind:"addon",n:"Additional revision",note:"per round · 1 included",p:50},
        {id:"ia7",cat:"influencer",kind:"addon",n:"Aspect ratio adaptation",note:"per format",p:65},
        {id:"ia8",cat:"influencer",kind:"addon",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"},
        {id:"ia9",cat:"influencer",kind:"addon",n:"Kill fee",note:"If cancelled after production",p:null,m:"50%"}]}
    ],
    fine:"All collaborations paid. 1 revision included per deliverable. Product provided by brand, not part of fee. Travel expenses billed separately if applicable.",
    usage:USAGE_INFLUENCER,
    excl:EXCL_INFLUENCER,
  },
  ugc:{
    label:"UGC Creator", sub:"UGC Creator · Based in Germany",
    sections:[
      {t:"01 — Organic Social Media Content", items:[
        {id:"u1",cat:"ugc",kind:"single",n:"Photo",note:"Static post",p:200},
        {id:"u2",cat:"ugc",kind:"single",n:"UGC Photo Set",note:"Carousel · 3–5 images",p:300},
        {id:"u3",cat:"ugc",kind:"single",n:"Short-form video",note:"Reels / TikTok / YouTube Shorts",p:350},
        {id:"u4",cat:"ugc",kind:"single",n:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",p:450}]},
      {t:"02 — Ad / Campaign Content", items:[
        {id:"u5",cat:"ugc",kind:"single",n:"Campaign video",note:"9:16 · structured for conversion",p:500},
        {id:"u6",cat:"ugc",kind:"single",n:"Campaign video, voiceover",note:"9:16 · structured for conversion",p:700}]},
      {t:"03 — Editorial", items:[
        {id:"u7",cat:"ugc",kind:"single",n:"Short hero video",note:"Up to 15 sec · creative direction · 9:16 or 16:9",p:800},
        {id:"u8",cat:"ugc",kind:"single",n:"Hero video",note:"Up to 30 sec · cinematic · 9:16 or 16:9",p:1200}]},
      {t:"Packages", items:[
        {id:"up1",cat:"ugc",kind:"package",n:"Starter",note:"3 organic social videos · instead of € 1,050",p:890},
        {id:"up2",cat:"ugc",kind:"package",n:"Growth",note:"5 organic social videos · instead of € 1,750",p:1490},
        {id:"up3",cat:"ugc",kind:"package",n:"Campaign",note:"3 campaign videos · instead of € 1,500",p:1280},
        {id:"up4",cat:"ugc",kind:"package",n:"Video + Photo Set",note:"3 organic videos + photo set · instead of € 1,550",p:1320}]},
      {t:"Retainer", items:[
        {id:"uvd1",cat:"ugc",kind:"other",n:"3+ pieces (same deliverable)",note:"",p:null,m:"−15%"},
        {id:"uvd2",cat:"ugc",kind:"other",n:"Retainer — 6 months",note:"Min. 3 pieces/month · same deliverables",p:null,m:"−20%/mo"}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"uu1",cat:"ugc",kind:"usage",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"uu2",cat:"ugc",kind:"usage",n:"Paid ads — 1 month",note:"",p:null,m:"+20%"},
        {id:"uu3",cat:"ugc",kind:"usage",n:"Paid ads — 3 months",note:"",p:null,m:"+50%"},
        {id:"uu4",cat:"ugc",kind:"usage",n:"Paid ads — 6 months",note:"",p:null,m:"+80%"},
        {id:"uu5",cat:"ugc",kind:"usage",n:"Paid ads — 12 months",note:"",p:null,m:"+120%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"ue1",cat:"ugc",kind:"excl",n:"Category exclusivity — 1 month",note:"",p:null,m:"+25%"},
        {id:"ue2",cat:"ugc",kind:"excl",n:"Category exclusivity — 3 months",note:"",p:null,m:"+50%"},
        {id:"ue3",cat:"ugc",kind:"excl",n:"Full exclusivity — 1 month",note:"",p:null,m:"+50%"},
        {id:"ue4",cat:"ugc",kind:"excl",n:"Full exclusivity — 3 months",note:"",p:null,m:"+100%"}]},
      {t:"Add-ons", items:[
        {id:"ua1",cat:"ugc",kind:"addon",n:"Hook / CTA variation",note:"Additional version of same video",p:80},
        {id:"ua2",cat:"ugc",kind:"addon",n:"Whitelisting / boosting",note:"Ads through Lynn's account",p:null,m:"+30%/mo"},
        {id:"ua3",cat:"ugc",kind:"addon",n:"Rush delivery",note:"Under 5 business days",p:null,m:"+25%"},
        {id:"ua4",cat:"ugc",kind:"addon",n:"Additional revision",note:"per round · 1 included",p:80},
        {id:"ua5",cat:"ugc",kind:"addon",n:"Aspect ratio adaptation",note:"per format",p:65},
        {id:"ua6",cat:"ugc",kind:"addon",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"},
        {id:"ua7",cat:"ugc",kind:"addon",n:"Kill fee",note:"If cancelled after production",p:null,m:"50%"}]}
    ],
    fine:"Organic usage included for 3 months. Usage rights always time-limited. 1 revision included per deliverable. Product provided by brand, not part of fee. Music license fee not included.",
    usage:USAGE_UGC,
    excl:EXCL_UGC,
  },
  editorial:{
    label:"Editorial Content Creator", sub:"Editorial Content Creator · Based in Germany",
    sections:[
      {t:"Photography", items:[
        {id:"e1",cat:"editorial",kind:"single",n:"1 hero image",note:"Retouched · full resolution",p:400},
        {id:"e2",cat:"editorial",kind:"single",n:"Mini set",note:"3 images · single concept",p:900},
        {id:"e3",cat:"editorial",kind:"single",n:"Full photo story",note:"6–10 images · complete visual narrative",p:1800}]},
      {t:"Editorial Video", items:[
        {id:"e4",cat:"editorial",kind:"single",n:"Short hero video",note:"Up to 15 sec · 9:16",p:800},
        {id:"e5",cat:"editorial",kind:"single",n:"Hero video",note:"Up to 30 sec · cinematic · 9:16 or 16:9",p:1200},
        {id:"e6",cat:"editorial",kind:"single",n:"Long hero video",note:"Up to 60 sec · cinematic · 9:16 or 16:9",p:1800},
        {id:"e7",cat:"editorial",kind:"single",n:"Hero video + BTS",note:"30 sec hero + BTS cutdown",p:1500}]},
      {t:"Packages", items:[
        {id:"ep1",cat:"editorial",kind:"package",n:"Essentials",note:"1 hero video (30 sec) + 3 images · instead of € 2,100",p:1890},
        {id:"ep2",cat:"editorial",kind:"package",n:"Campaign",note:"1 hero video (30 sec) + 6 images · instead of € 3,000",p:2700},
        {id:"ep3",cat:"editorial",kind:"package",n:"Premium",note:"1 long hero + 1 hero + 10 images · instead of € 4,800",p:4320}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"eu1",cat:"editorial",kind:"usage",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"eu2",cat:"editorial",kind:"usage",n:"Paid ads — 1 month",note:"",p:null,m:"+30%"},
        {id:"eu3",cat:"editorial",kind:"usage",n:"Paid ads — 3 months",note:"",p:null,m:"+60%"},
        {id:"eu4",cat:"editorial",kind:"usage",n:"Paid ads — 6 months",note:"",p:null,m:"+100%"},
        {id:"eu5",cat:"editorial",kind:"usage",n:"Paid ads — 12 months",note:"",p:null,m:"+150%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"ee1",cat:"editorial",kind:"excl",n:"Category exclusivity — 1 month",note:"",p:null,m:"+30%"},
        {id:"ee2",cat:"editorial",kind:"excl",n:"Category exclusivity — 3 months",note:"",p:null,m:"+60%"},
        {id:"ee3",cat:"editorial",kind:"excl",n:"Full exclusivity — 1 month",note:"",p:null,m:"+75%"},
        {id:"ee4",cat:"editorial",kind:"excl",n:"Full exclusivity — 3 months",note:"",p:null,m:"+125%"}]},
      {t:"Add-ons", items:[
        {id:"ea1",cat:"editorial",kind:"addon",n:"Additional image",note:"Same concept and set",p:200},
        {id:"ea2",cat:"editorial",kind:"addon",n:"Additional video cut",note:"",p:300},
        {id:"ea3",cat:"editorial",kind:"addon",n:"Whitelisting / boosting",note:"",p:300},
        {id:"ea4",cat:"editorial",kind:"addon",n:"Rush delivery",note:"Under 7 business days",p:null,m:"+30%"},
        {id:"ea5",cat:"editorial",kind:"addon",n:"Additional revision",note:"per round · 1 included per project",p:150},
        {id:"ea6",cat:"editorial",kind:"addon",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"},
        {id:"ea7",cat:"editorial",kind:"addon",n:"Aspect ratio adaptation",note:"per format",p:65},
        {id:"ea8",cat:"editorial",kind:"addon",n:"Kill fee",note:"If cancelled after production",p:null,m:"50%"}]}
    ],
    fine:"Product provided by brand, not part of fee. Usage rights always time-limited. 1 revision included per deliverable. Concept approved before production. Min. 2 weeks from brief to delivery.",
    usage:USAGE_EDITORIAL,
    excl:EXCL_EDITORIAL,
  },
  hotels:{
    label:"Hotels & Hospitality", sub:"Content Creator · Based in Germany",
    sections:[
      {t:"Hosted Collaboration", items:[
        {id:"h1",cat:"hotels",kind:"other",n:"Carousel",note:"In exchange for hosting",p:null,m:"hosted"},
        {id:"h2",cat:"hotels",kind:"other",n:"Short-form video",note:"In exchange for hosting",p:null,m:"hosted"},
        {id:"h3",cat:"hotels",kind:"other",n:"Story set",note:"3 frames · in exchange for hosting",p:null,m:"hosted"}]},
      {t:"Editorial Content", items:[
        {id:"h4",cat:"hotels",kind:"single",n:"1 hero image",note:"Retouched · full resolution",p:400},
        {id:"h5",cat:"hotels",kind:"single",n:"Mini set",note:"3 images · single concept",p:900},
        {id:"h6",cat:"hotels",kind:"single",n:"Full photo story",note:"6–10 images",p:1800},
        {id:"h7",cat:"hotels",kind:"single",n:"Short hero video",note:"Up to 15 sec · 9:16",p:800},
        {id:"h8",cat:"hotels",kind:"single",n:"Hero video",note:"Up to 30 sec · cinematic",p:1200},
        {id:"h9",cat:"hotels",kind:"single",n:"Long hero video",note:"Up to 60 sec · cinematic",p:1800}]},
      {t:"UGC Content", items:[
        {id:"h10",cat:"hotels",kind:"single",n:"Photo",note:"Static post",p:200},
        {id:"h11",cat:"hotels",kind:"single",n:"UGC Photo Set",note:"Carousel · 3–5 images",p:300},
        {id:"h12",cat:"hotels",kind:"single",n:"Short-form video",note:"Reels / TikTok / YouTube Shorts",p:350},
        {id:"h13",cat:"hotels",kind:"single",n:"Story set",note:"3 frames",p:180}]},
      {t:"Usage Rights — added to base rate", items:[
        {id:"hu1",cat:"hotels",kind:"usage",n:"Organic social — 3 months",note:"included",p:null,m:"+0%"},
        {id:"hu2",cat:"hotels",kind:"usage",n:"Paid ads — 1 month",note:"",p:null,m:"+20%"},
        {id:"hu3",cat:"hotels",kind:"usage",n:"Paid ads — 3 months",note:"",p:null,m:"+50%"},
        {id:"hu4",cat:"hotels",kind:"usage",n:"Paid ads — 6 months",note:"",p:null,m:"+80%"}]},
      {t:"Exclusivity — added to base rate", items:[
        {id:"he1",cat:"hotels",kind:"excl",n:"Category exclusivity — 1 month",note:"",p:null,m:"+25%"},
        {id:"he2",cat:"hotels",kind:"excl",n:"Category exclusivity — 3 months",note:"",p:null,m:"+50%"},
        {id:"he3",cat:"hotels",kind:"excl",n:"Full exclusivity — 1 month",note:"",p:null,m:"+50%"},
        {id:"he4",cat:"hotels",kind:"excl",n:"Full exclusivity — 3 months",note:"",p:null,m:"+100%"}]},
      {t:"Add-ons", items:[
        {id:"ha1",cat:"hotels",kind:"addon",n:"Additional image",note:"Same concept and set",p:200},
        {id:"ha2",cat:"hotels",kind:"addon",n:"Additional location",note:"Additional venue or setting",p:150},
        {id:"ha3",cat:"hotels",kind:"addon",n:"Whitelisting / boosting",note:"Ads through Lynn's account",p:null,m:"+30%/mo"},
        {id:"ha4",cat:"hotels",kind:"addon",n:"Rush delivery",note:"Under 5 business days",p:null,m:"+25%"},
        {id:"ha5",cat:"hotels",kind:"addon",n:"Additional revision",note:"per round · 1 included",p:80},
        {id:"ha6",cat:"hotels",kind:"addon",n:"Raw footage",note:"Unedited files",p:null,m:"+30%"}]}
    ],
    fine:"Scope of hosted collaboration to be agreed per project. All content production invoiced separately. Organic usage included for 3 months. Usage rights always time-limited.",
    usage:USAGE_INFLUENCER,
    excl:EXCL_INFLUENCER,
  }
};

// ─── SEED CLIENTS ─────────────────────────────────────────
export const initClients = [
  {id:"c1",name:"Sephora",contact:"Anna Müller",email:"anna@sephora.de",agency:"Direct",country:"Germany",tags:["Beauty","Fashion"],notes:"Easy approvals. Fast payer. Potential retainer.",
    projects:[{id:"p1",name:"Spring Campaign 2026",status:"paid",amount:2363,paid:true,date:"2026-04-01",deliveryDate:"2026-05-01",amendments:[],renewals:[],
      qd:{qNo:"QUO-2026-001",brand:"Sephora",contact:"Anna Müller",date:"2026-04-01",validUntil:"2026-04-15",ctype:"Content Creator",rev:0,mo:3,ctab:"influencer",
        lines:[{name:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",qty:3,up:450,amt:1350},{name:"Usage rights — paid ads, 3 months",note:"",qty:1,up:0,amt:675},{name:"Rush delivery",note:"Under 5 business days",qty:1,up:0,amt:338}],total:2363}}]},
  {id:"c2",name:"Vogue Germany",contact:"Sarah Klein",email:"sarah@vogue.de",agency:"Direct",country:"Germany",tags:["Editorial","Fashion"],notes:"Luxury aesthetic. Needs detailed briefs.",
    projects:[{id:"p2",name:"Editorial Shoot S/S 2026",status:"quoted",amount:2700,paid:false,date:"2026-03-15",deliveryDate:"",amendments:[],renewals:[],
      qd:{qNo:"QUO-2026-002",brand:"Vogue Germany",contact:"Sarah Klein",date:"2026-03-15",validUntil:"2026-03-29",ctype:"Editorial Content Creator",rev:0,mo:3,ctab:"editorial",
        lines:[{name:"Full photo story",note:"6–10 images",qty:1,up:1800,amt:1800},{name:"Hero video",note:"Up to 30 sec · cinematic",qty:1,up:1200,amt:900}],total:2700}}]},
];
