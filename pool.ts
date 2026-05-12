// ─── ITEM POOL — master database ──────────────────────────
// Only single deliverable items live here.
// Packages, usage, exclusivity, addons are NOT in the pool.
// Rate cards and calculator both read from this pool.
// Edit a price here → updates everywhere.
//
// Structure: { id, cat, kind:"single", n, note, p }
//   id   — permanent, never changes
//   cat  — "influencer" | "ugc" | "editorial"
//   kind — always "single" in this file
//   n    — display name
//   note — subtitle shown on rate card and calculator
//   p    — price in EUR

export const POOL_DEFAULT: any[] = [

  // ── Brand Collaboration ───────────────────────────────
  {id:"i1", cat:"influencer", kind:"single", n:"Photo",                      note:"Feed post",                               p:200},
  {id:"i2", cat:"influencer", kind:"single", n:"Photo Set",                  note:"Carousel · 3–5 images",                   p:300},
  {id:"i3", cat:"influencer", kind:"single", n:"Short-form video",           note:"Reels / TikTok / YouTube Shorts",         p:350},
  {id:"i4", cat:"influencer", kind:"single", n:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",         p:450},
  {id:"i5", cat:"influencer", kind:"single", n:"Story Set",                  note:"3 frames",                                p:180},

  // ── UGC ──────────────────────────────────────────────
  {id:"u1", cat:"ugc",        kind:"single", n:"Photo",                      note:"Static post",                             p:200},
  {id:"u2", cat:"ugc",        kind:"single", n:"UGC Photo Set",              note:"Carousel · 3–5 images",                   p:300},
  {id:"u3", cat:"ugc",        kind:"single", n:"Short-form video",           note:"Reels / TikTok / YouTube Shorts",         p:350},
  {id:"u4", cat:"ugc",        kind:"single", n:"Short-form video, voiceover",note:"Reels / TikTok / YouTube Shorts",         p:450},
  {id:"u5", cat:"ugc",        kind:"single", n:"Campaign video",             note:"9:16 · structured for conversion",        p:500},
  {id:"u6", cat:"ugc",        kind:"single", n:"Campaign video, voiceover",  note:"9:16 · structured for conversion",        p:700},
  {id:"u7", cat:"ugc",        kind:"single", n:"Short hero video",           note:"Up to 15 sec · creative direction · 9:16 or 16:9", p:800},
  {id:"u8", cat:"ugc",        kind:"single", n:"Hero video",                 note:"Up to 30 sec · cinematic · 9:16 or 16:9", p:1200},

  // ── Editorial ─────────────────────────────────────────
  {id:"e1", cat:"editorial",  kind:"single", n:"1 hero image",               note:"Retouched · full resolution",             p:400},
  {id:"e2", cat:"editorial",  kind:"single", n:"Mini set",                   note:"3 images · single concept",               p:900},
  {id:"e3", cat:"editorial",  kind:"single", n:"Full photo story",           note:"6–10 images · complete visual narrative", p:1800},
  {id:"e4", cat:"editorial",  kind:"single", n:"Short hero video",           note:"Up to 15 sec · 9:16",                     p:800},
  {id:"e5", cat:"editorial",  kind:"single", n:"Hero video",                 note:"Up to 30 sec · cinematic · 9:16 or 16:9", p:1200},
  {id:"e6", cat:"editorial",  kind:"single", n:"Long hero video",            note:"Up to 60 sec · cinematic · 9:16 or 16:9", p:1800},
  {id:"e7", cat:"editorial",  kind:"single", n:"Hero video + BTS",           note:"30 sec hero + BTS cutdown",               p:1500},
];
