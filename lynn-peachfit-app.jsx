import { useState, useEffect, useRef } from "react";

const T = {
  pk500:"#E8607A",pk400:"#F0849A",pk300:"#F5B0C0",pk200:"#FAD8E2",
  pk100:"#FFF0F4",pkBg:"#FFF7F9",txtDk:"#2A1A1E",txtMd:"#7A4E58",
  txtLt:"#C0929E",white:"#ffffff",
  serif:"'DM Serif Display',serif",sans:"'DM Sans',sans-serif"
};

const PLAN_3 = [
  {
    day:1,name:"Glute Build",focus:"Primary glute loading",
    exercises:[
      {id:1,name:"Hip Thrust",de:"Hüftstoß",muscle:"Glutes",sets:4,reps:"10–12",weight:35,rest:60,flag:"core",tip:"Drive through heels, squeeze glutes hard at top.",feel:"Feel it: full glute. Not here: lower back.",swaps:["Smith Machine Hip Thrust","Glute Bridge","Dumbbell Hip Thrust"]},
      {id:2,name:"Romanian Deadlift",de:"Rumän. Kreuzheben",muscle:"Glutes + Hamstrings",sets:4,reps:"10",weight:20,rest:60,flag:"core",tip:"Hinge at hips, keep bar close, soft knee.",feel:"Feel it: hamstrings and glutes. Not here: lower back rounding.",swaps:["Single-Leg RDL","Cable Pull Through"]},
      {id:3,name:"Bulgarian Split Squat",de:"Bulgar. Kniebeuge",muscle:"Glutes",sets:3,reps:"10 each",weight:8,rest:60,flag:"core",tip:"Lean slightly forward, drive through front heel.",feel:"Feel it: glute of front leg. Not here: front knee pain.",swaps:["Step-Ups","Cable Kickback"]},
      {id:4,name:"Cable Kickback",de:"Kabel Kickback",muscle:"Glutes",sets:3,reps:"15",weight:10,rest:30,flag:"core",tip:"Slow and controlled, squeeze at full extension.",feel:"Feel it: glute squeeze. Not here: lower back arching.",swaps:["Donkey Kicks","Band Kickback"]},
      {id:5,name:"Abductor Machine",de:"Abduktorenmaschine",muscle:"Outer Glutes",sets:3,reps:"20",weight:30,rest:30,flag:"core",tip:"Full range, controlled tempo.",feel:"Feel it: outer glute/hip. Not here: lower back.",swaps:["Banded Side Walk","Cable Hip Abduction"]},
      {id:6,name:"Core Circuit",de:"Rumpfkreislauf",muscle:"Core",sets:3,reps:"3 rounds",weight:0,rest:20,flag:"core",tip:"Plank 45s → Dead Bug 12 each → Reverse Crunch 15 → Vacuum 30s",feel:"Feel it: deep core tightening. Not here: neck strain.",swaps:[]}
    ]
  },
  {
    day:2,name:"Core + Conditioning",focus:"Flat belly + fat burn",
    exercises:[
      {id:7,name:"Plank",de:"Unterarmstütz",muscle:"Core",sets:3,reps:"45s",weight:0,rest:30,flag:"core",tip:"Neutral spine, squeeze core and glutes.",feel:"Feel it: deep core. Not here: shoulders collapsing.",swaps:["Bear Crawl Hold","Hollow Body Hold"]},
      {id:8,name:"Dead Bug",de:"Dead Bug",muscle:"Core",sets:3,reps:"12 each",weight:0,rest:30,flag:"core",tip:"Lower back pressed to floor throughout.",feel:"Feel it: deep abdominals. Not here: back lifting.",swaps:["Plank","Reverse Crunch"]},
      {id:9,name:"Reverse Crunch",de:"Umgekehrtes Crunch",muscle:"Core",sets:3,reps:"15",weight:0,rest:30,flag:"core",tip:"Curl hips toward chest, slow on way down.",feel:"Feel it: lower abs. Not here: neck strain.",swaps:["Dead Bug","Hollow Body Hold"]},
      {id:10,name:"Stomach Vacuum",de:"Bauchvakuum",muscle:"Waist",sets:3,reps:"30s",weight:0,rest:20,flag:"core",tip:"Exhale fully, draw belly button toward spine, hold.",feel:"Feel it: deep abs pulling in. Not here: holding breath.",swaps:["Dead Bug"]},
      {id:11,name:"Jump Rope",de:"Seilspringen",muscle:"Conditioning",sets:3,reps:"45s",weight:0,rest:30,flag:"safe",tip:"Light bounce, relaxed shoulders.",feel:"Feel it: light and rhythmic. Not here: heavy calves.",swaps:["Jumping Jacks","High Knees"]},
      {id:12,name:"Stairmaster",de:"Stufensteiger",muscle:"Conditioning",sets:1,reps:"25 min",weight:0,rest:0,flag:"safe",tip:"Moderate pace, upright posture.",feel:"Feel it: glutes stepping. Not here: leaning on handles.",swaps:["Treadmill Walk incline","Bike light resistance"]}
    ]
  },
  {
    day:3,name:"Glute Pump + Burn",focus:"Glute pump + fat burn",
    exercises:[
      {id:13,name:"Smith Machine Hip Thrust",de:"Smith Hüftstoß",muscle:"Glutes",sets:4,reps:"12",weight:35,rest:60,flag:"core",tip:"Bar at hip crease, same movement as hip thrust.",feel:"Feel it: full glute squeeze. Not here: lower back.",swaps:["Hip Thrust","Glute Bridge"]},
      {id:14,name:"Step-Ups",de:"Step-Ups",muscle:"Glutes",sets:3,reps:"12 each",weight:8,rest:45,flag:"core",tip:"Push through heel, moderate height bench.",feel:"Feel it: glute of working leg. Not here: knee caving.",swaps:["Bulgarian Split Squat","Reverse Lunge"]},
      {id:15,name:"Single-Leg RDL",de:"Einbein. Kreuzheben",muscle:"Glutes + Hamstrings",sets:3,reps:"10",weight:10,rest:45,flag:"core",tip:"Hinge forward, keep hips square.",feel:"Feel it: hamstring stretch + glute. Not here: twisting hips.",swaps:["Romanian Deadlift","Cable Pull Through"]},
      {id:16,name:"Frog Pumps",de:"Froschpumpen",muscle:"Glutes",sets:3,reps:"25",weight:0,rest:30,flag:"core",tip:"Feet together, knees out, pulse hips up.",feel:"Feel it: inner + lower glutes. Not here: thighs.",swaps:["Glute Bridge","Hip Thrust"]},
      {id:17,name:"Cable Pull Through",de:"Kabel Durchzug",muscle:"Glutes + Hamstrings",sets:3,reps:"15",weight:15,rest:45,flag:"core",tip:"Hinge at hips, glutes drive the pull.",feel:"Feel it: glutes at lockout. Not here: arms pulling.",swaps:["Romanian Deadlift","Kettlebell Swing"]},
      {id:18,name:"Conditioning Circuit",de:"Konditionskreis",muscle:"Full Body Burn",sets:3,reps:"3 rounds",weight:0,rest:30,flag:"safe",tip:"KB Swing 15 (8kg) → Walking Lunges 12 → Jump Rope 45s → BW Squat 15",feel:"Feel it: heart rate up, glutes working. Not here: stopping early.",swaps:[]}
    ]
  }
];

const PLAN_5 = [
  {day:1,name:"Glute Heavy Load",focus:"Primary glute loading",exercises:[PLAN_3[0].exercises[0],PLAN_3[0].exercises[1],PLAN_3[0].exercises[3],PLAN_3[0].exercises[4],PLAN_3[0].exercises[5]]},
  {
    day:2,name:"Lean Arms + Upper Tone",focus:"Tone only — no bulk",
    exercises:[
      {id:19,name:"Tricep Pushdown",de:"Trizep Drücken",muscle:"Triceps",sets:3,reps:"15",weight:10,rest:30,flag:"safe",tip:"Elbows pinned to sides, full extension.",feel:"Feel it: tricep squeeze. Not here: shoulders taking over.",swaps:["Overhead Tricep Extension"]},
      {id:20,name:"Bicep Curl (light)",de:"Bizeps Curl",muscle:"Biceps",sets:3,reps:"15",weight:6,rest:30,flag:"safe",tip:"Controlled tempo, no swinging.",feel:"Feel it: bicep peak. Not here: back swinging.",swaps:["Hammer Curl"]},
      {id:21,name:"Face Pull",de:"Face Pull",muscle:"Rear Delt",sets:3,reps:"15",weight:8,rest:30,flag:"safe",tip:"Pull toward face, elbows high.",feel:"Feel it: rear shoulder. Not here: traps hunching.",swaps:["Band Pull-Apart"]},
      {id:22,name:"Band Pull-Apart",de:"Band Auseinanderziehen",muscle:"Upper Back",sets:3,reps:"20",weight:0,rest:20,flag:"safe",tip:"Keep arms straight, squeeze shoulder blades.",feel:"Feel it: upper back opening. Not here: neck tension.",swaps:["Face Pull"]}
    ]
  },
  {day:3,name:"Glute Pump + Conditioning",focus:"Glute pump + fat burn",exercises:PLAN_3[2].exercises},
  {
    day:4,name:"Flat Belly + Waist",focus:"Core + cardio fat burn",
    exercises:[PLAN_3[1].exercises[0],PLAN_3[1].exercises[1],PLAN_3[1].exercises[2],PLAN_3[1].exercises[3],PLAN_3[1].exercises[4],PLAN_3[1].exercises[5]]
  },
  {
    day:5,name:"Posterior Burnout",focus:"Full posterior chain",
    exercises:[PLAN_3[0].exercises[2],PLAN_3[2].exercises[2],PLAN_3[2].exercises[1],PLAN_3[0].exercises[3],PLAN_3[0].exercises[4],PLAN_3[2].exercises[3]]
  }
];

const BANK_EXTRA = [
  {id:30,name:"Donkey Kicks",de:"Donkey Kicks",muscle:"Glutes",sets:3,reps:"15 each",weight:0,rest:30,flag:"core",tip:"Keep hips square, kick back and up.",feel:"Feel it: glute squeeze. Not here: lower back arching.",swaps:["Cable Kickback"]},
  {id:31,name:"Glute Bridge",de:"Gesäßbrücke",muscle:"Glutes",sets:3,reps:"20",weight:0,rest:30,flag:"core",tip:"Floor version of hip thrust, great warm-up.",feel:"Feel it: glutes. Not here: lower back.",swaps:["Hip Thrust","Frog Pumps"]},
  {id:32,name:"Barbell Squat",de:"Kniebeuge",muscle:"Quads + Legs",sets:0,reps:"—",weight:0,rest:0,flag:"avoid",tip:"Builds quad mass — avoid for Wonyoung goal.",feel:"",swaps:["Hip Thrust","Step-Ups"]},
  {id:33,name:"Leg Press",de:"Beinpresse",muscle:"Quads",sets:0,reps:"—",weight:0,rest:0,flag:"avoid",tip:"Builds leg mass — not for this goal.",feel:"",swaps:["Abductor Machine","Cable Kickback"]},
  {id:34,name:"Shoulder Press",de:"Schulterdrücken",muscle:"Shoulders",sets:0,reps:"—",weight:0,rest:0,flag:"avoid",tip:"Builds shoulder width — avoid.",feel:"",swaps:["Face Pull","Band Pull-Apart"]},
  {id:35,name:"Hollow Body Hold",de:"Hollow Body",muscle:"Core",sets:3,reps:"30s",weight:0,rest:30,flag:"core",tip:"Lower back pressed flat, arms and legs extended.",feel:"Feel it: full core. Not here: lower back lifting.",swaps:["Plank","Dead Bug"]}
];

// ─── EXERCISE ILLUSTRATION (CSS animated SVG figures) ─────────────────────────
function ExerciseAnimation({name}) {
  const animations = {
    "Hip Thrust": <HipThrustAnim/>,
    "Romanian Deadlift": <RDLAnim/>,
    "Cable Kickback": <KickbackAnim/>,
    "Plank": <PlankAnim/>,
    "Dead Bug": <DeadBugAnim/>,
    "Frog Pumps": <FrogPumpAnim/>,
    default: <GenericAnim name={name}/>
  };
  return animations[name] || animations.default;
}

const figStyle = {width:"100%",height:140,display:"flex",alignItems:"center",justifyContent:"center",background:T.pk100,borderRadius:12,marginBottom:12,overflow:"hidden"};

function HipThrustAnim() {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),900);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 200 120" width="180">
    <style>{`@keyframes none{}`}</style>
    {f===0?<>
      <ellipse cx="100" cy="40" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="50" x2="100" y2="75" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="75" x2="75" y2="95" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="75" x2="125" y2="95" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="75" y1="95" x2="75" y2="110" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="125" y1="95" x2="125" y2="110" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="95" y1="58" x2="75" y2="65" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="105" y1="58" x2="125" y2="65" stroke={T.txtMd} strokeWidth="2"/>
      <text x="100" y="118" textAnchor="middle" fontSize="9" fill={T.txtLt}>start</text>
    </>:<>
      <ellipse cx="100" cy="25" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="35" x2="100" y2="60" stroke={T.txtMd} strokeWidth="2"/>
      <ellipse cx="100" cy="60" rx="18" ry="10" fill={T.pk300} stroke={T.pk500} strokeWidth="1.5"/>
      <line x1="100" y1="60" x2="75" y2="90" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="60" x2="125" y2="90" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="75" y1="90" x2="75" y2="110" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="125" y1="90" x2="125" y2="110" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="95" y1="45" x2="72" y2="55" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="105" y1="45" x2="128" y2="55" stroke={T.txtMd} strokeWidth="2"/>
      <text x="100" y="118" textAnchor="middle" fontSize="9" fill={T.pk500}>squeeze ↑</text>
    </>}
  </svg></div>;
}

function RDLAnim() {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),1000);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 200 130" width="180">
    {f===0?<>
      <ellipse cx="100" cy="20" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="30" x2="100" y2="75" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="75" x2="80" y2="105" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="75" x2="120" y2="105" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="80" y1="105" x2="80" y2="120" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="120" y1="105" x2="120" y2="120" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="45" x2="65" y2="55" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="115" y1="45" x2="135" y2="55" stroke={T.txtMd} strokeWidth="2"/>
    </>:<>
      <ellipse cx="75" cy="45" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="75" y1="55" x2="95" y2="80" stroke={T.txtMd} strokeWidth="2"/>
      <ellipse cx="103" cy="85" rx="20" ry="9" fill={T.pk300} stroke={T.pk500} strokeWidth="1.5"/>
      <line x1="95" y1="80" x2="85" y2="108" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="95" y1="80" x2="115" y2="105" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="108" x2="85" y2="120" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="115" y1="105" x2="115" y2="120" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="78" y1="62" x2="55" y2="70" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="92" y1="68" x2="115" y2="72" stroke={T.txtMd} strokeWidth="2"/>
      <text x="100" y="128" textAnchor="middle" fontSize="9" fill={T.pk500}>hinge ↓</text>
    </>}
  </svg></div>;
}

function KickbackAnim() {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),900);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 200 130" width="180">
    {f===0?<>
      <ellipse cx="70" cy="40" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="70" y1="50" x2="85" y2="75" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="75" x2="75" y2="100" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="75" x2="100" y2="100" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="75" y1="100" x2="75" y2="115" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="100" y1="100" x2="100" y2="115" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="72" y1="58" x2="55" y2="68" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="78" y1="60" x2="95" y2="68" stroke={T.txtMd} strokeWidth="2"/>
    </>:<>
      <ellipse cx="70" cy="40" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="70" y1="50" x2="85" y2="75" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="75" x2="75" y2="100" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="75" x2="130" y2="65" stroke={T.txtMd} strokeWidth="2"/>
      <ellipse cx="130" cy="63" rx="14" ry="8" fill={T.pk300} stroke={T.pk500} strokeWidth="1.5"/>
      <line x1="75" y1="100" x2="75" y2="115" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="72" y1="58" x2="55" y2="68" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="78" y1="60" x2="95" y2="68" stroke={T.txtMd} strokeWidth="2"/>
      <text x="100" y="125" textAnchor="middle" fontSize="9" fill={T.pk500}>kick + squeeze →</text>
    </>}
  </svg></div>;
}

function PlankAnim() {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),1200);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 220 100" width="200">
    <ellipse cx="50" cy="45" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="55" y1="52" x2="90" y2="60" stroke={T.txtMd} strokeWidth="2.5"/>
    <line x1="90" y1="60" x2="160" y2="60" stroke={T.txtMd} strokeWidth="2.5"/>
    <line x1="90" y1="60" x2="88" y2="82" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="88" y1="82" x2="88" y2="90" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="125" y1="60" x2="125" y2="82" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="125" y1="82" x2="125" y2="90" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="160" y1="60" x2="180" y2="75" stroke={T.txtMd} strokeWidth="2"/>
    <rect x="85" y="58" width="45" height="6" rx="3" fill={f===1?T.pk400:T.pk200} stroke={T.pk500} strokeWidth="1"/>
    <text x="108" y="98" textAnchor="middle" fontSize="9" fill={f===1?T.pk500:T.txtLt}>{f===1?"core tight ✓":"hold position"}</text>
  </svg></div>;
}

function DeadBugAnim() {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),1000);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 220 110" width="200">
    <ellipse cx="110" cy="25" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="110" y1="35" x2="110" y2="65" stroke={T.txtMd} strokeWidth="2.5"/>
    <rect x="92" y="62" width="36" height="8" rx="4" fill={T.pk300} stroke={T.pk500} strokeWidth="1.5"/>
    {f===0?<>
      <line x1="110" y1="40" x2="80" y2="30" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="80" y1="30" x2="60" y2="40" stroke={T.txtMd} strokeWidth="1.5"/>
      <line x1="110" y1="65" x2="90" y2="85" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="90" y1="85" x2="75" y2="100" stroke={T.txtMd} strokeWidth="1.5"/>
      <line x1="110" y1="40" x2="140" y2="50" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="110" y1="65" x2="130" y2="82" stroke={T.txtMd} strokeWidth="2"/>
    </>:<>
      <line x1="110" y1="40" x2="80" y2="50" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="110" y1="65" x2="130" y2="55" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="130" y1="55" x2="155" y2="45" stroke={T.pk500} strokeWidth="2"/>
      <line x1="110" y1="40" x2="140" y2="30" stroke={T.pk500} strokeWidth="2"/>
      <line x1="140" y1="30" x2="162" y2="22" stroke={T.pk500} strokeWidth="2"/>
      <line x1="110" y1="65" x2="90" y2="82" stroke={T.txtMd} strokeWidth="2"/>
    </>}
    <text x="110" y="108" textAnchor="middle" fontSize="9" fill={T.pk500}>extend opposite arm + leg</text>
  </svg></div>;
}

function FrogPumpAnim() {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),700);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 220 110" width="200">
    <ellipse cx="110" cy="30" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
    {f===0?<>
      <line x1="110" y1="40" x2="110" y2="70" stroke={T.txtMd} strokeWidth="2.5"/>
      <line x1="110" y1="70" x2="85" y2="90" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="110" y1="70" x2="135" y2="90" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="90" x2="80" y2="100" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="135" y1="90" x2="140" y2="100" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="80" y1="100" x2="70" y2="90" stroke={T.txtMd} strokeWidth="1.5"/>
      <line x1="140" y1="100" x2="150" y2="90" stroke={T.txtMd} strokeWidth="1.5"/>
    </>:<>
      <line x1="110" y1="40" x2="110" y2="60" stroke={T.txtMd} strokeWidth="2.5"/>
      <ellipse cx="110" cy="60" rx="20" ry="10" fill={T.pk300} stroke={T.pk500} strokeWidth="1.5"/>
      <line x1="110" y1="65" x2="85" y2="88" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="110" y1="65" x2="135" y2="88" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="85" y1="88" x2="78" y2="98" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="135" y1="88" x2="142" y2="98" stroke={T.txtMd} strokeWidth="2"/>
      <line x1="78" y1="98" x2="65" y2="88" stroke={T.txtMd} strokeWidth="1.5"/>
      <line x1="142" y1="98" x2="155" y2="88" stroke={T.txtMd} strokeWidth="1.5"/>
      <text x="110" y="108" textAnchor="middle" fontSize="9" fill={T.pk500}>pulse up ↑</text>
    </>}
  </svg></div>;
}

function GenericAnim({name}) {
  const [f,setF]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setF(p=>1-p),900);return()=>clearInterval(i);},[]);
  return <div style={figStyle}><svg viewBox="0 0 200 120" width="180">
    <ellipse cx="100" cy="25" rx="10" ry="10" fill="none" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="100" y1="35" x2="100" y2="70" stroke={T.txtMd} strokeWidth="2.5"/>
    <line x1="100" y1="70" x2="80" y2="95" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="100" y1="70" x2="120" y2="95" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="80" y1="95" x2="80" y2="110" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="120" y1="95" x2="120" y2="110" stroke={T.txtMd} strokeWidth="2"/>
    <line x1="95" y1="48" x2={f===0?75:65} y2={f===0?60:45} stroke={f===1?T.pk500:T.txtMd} strokeWidth="2"/>
    <line x1="105" y1="48" x2={f===0?125:135} y2={f===0?60:45} stroke={f===1?T.pk500:T.txtMd} strokeWidth="2"/>
    <ellipse cx="100" cy="72" rx="14" ry="7" fill={f===1?T.pk300:T.pk100} stroke={T.pk500} strokeWidth="1"/>
  </svg></div>;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Header({title,sub,back,onBack,right}) {
  return <div style={{background:T.pk500,padding:"calc(env(safe-area-inset-top, 44px) + 16px) 20px 20px",color:"#fff",position:"relative"}}>
    {back&&<div onClick={onBack} style={{fontSize:14,color:"rgba(255,255,255,0.85)",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
      <span style={{fontSize:18}}>←</span> {back}
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <div style={{fontFamily:T.serif,fontSize:26,color:"#fff",margin:0,lineHeight:1.15}}>{title}</div>
        {sub&&<div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>{sub}</div>}
      </div>
      {right}
    </div>
  </div>;
}

function Card({children,style={},onClick}) {
  return <div onClick={onClick} style={{background:T.white,borderRadius:18,border:`0.5px solid ${T.pk200}`,padding:"20px",marginBottom:14,...style}}>{children}</div>;
}

function SectionLabel({children}) {
  return <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:T.txtLt,margin:"20px 0 10px"}}>{children}</div>;
}

function PrimaryBtn({children,onClick,style={}}) {
  return <button onClick={onClick} style={{background:T.pk500,color:"#fff",border:"none",borderRadius:14,padding:"16px 20px",fontSize:15,fontWeight:600,width:"100%",cursor:"pointer",fontFamily:T.sans,...style}}>{children}</button>;
}

function OutlineBtn({children,onClick,style={}}) {
  return <button onClick={onClick} style={{background:"transparent",color:T.pk500,border:`1.5px solid ${T.pk500}`,borderRadius:14,padding:"15px 20px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:T.sans,...style}}>{children}</button>;
}

function FlagBadge({flag}) {
  const map={core:{bg:T.pk100,color:T.pk500,label:"✓ Goal exercise"},safe:{bg:"#f0faf5",color:"#2d7a4f",label:"✓ Safe to add"},avoid:{bg:"#fff0f0",color:"#c0392b",label:"✗ Avoid — bulks legs"},caution:{bg:"#fffbea",color:"#b7791f",label:"⚠ Use with caution"}};
  const s=map[flag]||map.safe;
  return <span style={{background:s.bg,color:s.color,borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:600}}>{s.label}</span>;
}

function SetCircle({done,onTap,num}) {
  return <div onClick={onTap} style={{width:44,height:44,borderRadius:"50%",border:`2px solid ${done?T.pk500:T.pk300}`,background:done?T.pk500:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:done?"#fff":T.txtLt,fontSize:14,fontWeight:600,transition:"all 0.2s"}}>
    {done?"✓":num}
  </div>;
}

function NutritionRing({value,max,label,color=T.pk500}) {
  const pct=Math.min(value/max,1);
  const r=26,circ=2*Math.PI*r,dash=pct*circ;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
    <svg width="64" height="64"><circle cx="32" cy="32" r={r} fill="none" stroke={T.pk200} strokeWidth="4.5"/><circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4.5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 32 32)"/><text x="32" y="37" textAnchor="middle" fontSize="11" fontWeight="600" fill={T.txtDk}>{value}</text></svg>
    <div style={{fontSize:11,color:T.txtLt,textAlign:"center"}}>{label}<br/><span style={{color:T.txtDk,fontWeight:600}}>{max}</span></div>
  </div>;
}

// ─── EXERCISE MODAL ───────────────────────────────────────────────────────────
function ExerciseModal({ex,onClose,onSwap}) {
  if(!ex)return null;
  return <div style={{position:"fixed",inset:0,background:"rgba(42,26,30,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:`20px 20px calc(env(safe-area-inset-bottom, 16px) + 28px)`,maxHeight:"85vh",overflowY:"auto"}}>
      <div style={{width:40,height:4,background:T.pk200,borderRadius:2,margin:"0 auto 16px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div>
          <div style={{fontFamily:T.serif,fontSize:22,color:T.txtDk}}>{ex.name}</div>
          <div style={{fontSize:13,color:T.txtLt}}>{ex.de}</div>
        </div>
        <FlagBadge flag={ex.flag}/>
      </div>
      <div style={{fontSize:13,color:T.txtLt,marginBottom:14}}>{ex.muscle}</div>
      <ExerciseAnimation name={ex.name}/>
      {ex.tip&&<Card style={{marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:600,color:T.pk500,marginBottom:4}}>Form</div>
        <div style={{fontSize:13,color:T.txtDk,lineHeight:1.5}}>{ex.tip}</div>
      </Card>}
      {ex.feel&&<Card style={{marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:600,color:T.pk500,marginBottom:4}}>Feel</div>
        <div style={{fontSize:13,color:T.txtDk,lineHeight:1.5}}>{ex.feel}</div>
      </Card>}
      {ex.weight>0&&<Card style={{marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:600,color:T.pk500,marginBottom:2}}>Suggested weight</div>
        <div style={{fontSize:20,fontFamily:T.serif,color:T.txtDk}}>{ex.weight} kg <span style={{fontSize:13,color:T.txtLt}}>Empfohlenes Gewicht</span></div>
      </Card>}
      {ex.swaps&&ex.swaps.length>0&&<>
        <SectionLabel>Equipment taken? Swap with:</SectionLabel>
        {ex.swaps.map(s=><div key={s} onClick={()=>onSwap&&onSwap(s)} style={{background:T.pk100,borderRadius:12,padding:"12px 16px",marginBottom:8,fontSize:14,color:T.pk500,fontWeight:500,cursor:"pointer"}}>{s} →</div>)}
      </>}
      <div style={{height:10}}/>
      <OutlineBtn onClick={onClose} style={{width:"100%"}}>Close</OutlineBtn>
    </div>
  </div>;
}

// ─── TAB: HOME ────────────────────────────────────────────────────────────────
function HomeTab({profile,sessions,nutrition,onStartWorkout,onViewProgress,milestones}) {
  const today=new Date();
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weekDays=[-3,-2,-1,0,1,2,3].map(d=>{const dt=new Date(today);dt.setDate(today.getDate()+d);return{label:days[dt.getDay()],key:dt.toDateString(),isToday:d===0};});
  const nextSession=sessions.length<3?sessions.length+1:1;
  const planDay=PLAN_3[nextSession-1];
  const burned=sessions.filter(s=>{const d=new Date(s.date);const now=new Date();return d.toDateString()===now.toDateString();}).reduce((a,b)=>a+(b.burned||0),0);

  return <div style={{paddingBottom:90}}>
    <div style={{background:T.pk500,padding:"calc(env(safe-area-inset-top, 44px) + 16px) 20px 24px",color:"#fff"}}>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.8)",marginBottom:4}}>Hey Lynn 👋</div>
      <div style={{fontFamily:T.serif,fontSize:28,color:"#fff",lineHeight:1.15,marginBottom:16}}>
        {planDay?`Day ${planDay.day} — ${planDay.name}`:"Rest Day"}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {planDay&&<span style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#fff"}}>{planDay.exercises.length} exercises</span>}
        <span style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#fff"}}>🔥 {profile.streak||0} day streak</span>
        {burned>0&&<span style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#fff"}}>~{burned} kcal burned today</span>}
      </div>
    </div>

    <div style={{padding:"0 20px"}}>
      {milestones&&milestones.length>0&&<div style={{marginTop:16}}>
        {milestones.map((m,i)=><div key={i} style={{background:T.pk100,border:`0.5px solid ${T.pk300}`,borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,color:T.pk500,fontWeight:600}}>{m}</span>
          <span style={{fontSize:11,color:T.txtLt}}>✕</span>
        </div>)}
      </div>}

      <SectionLabel>This week</SectionLabel>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {weekDays.map(d=><div key={d.key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{fontSize:10,color:T.txtLt}}>{d.label}</div>
            <div style={{width:34,height:34,borderRadius:"50%",background:sessions.some(s=>new Date(s.date).toDateString()===d.key)?T.pk500:d.isToday?T.pk100:"transparent",border:d.isToday?`1.5px solid ${T.pk500}`:`1.5px solid ${T.pk200}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:sessions.some(s=>new Date(s.date).toDateString()===d.key)?"#fff":d.isToday?T.pk500:T.txtLt}}>
              {sessions.some(s=>new Date(s.date).toDateString()===d.key)?"✓":d.isToday?"·":""}
            </div>
          </div>)}
        </div>
      </Card>

      <SectionLabel>Nutrition today</SectionLabel>
      <Card>
        <div style={{display:"flex",justifyContent:"space-around"}}>
          <NutritionRing value={nutrition.calories} max={1400} label="Calories"/>
          <NutritionRing value={nutrition.protein} max={100} label="Protein g" color={T.pk400}/>
          <NutritionRing value={nutrition.water*10|0} max={25} label="Water (L)" color={T.pk300}/>
        </div>
      </Card>

      {planDay&&<div style={{marginTop:12}}>
        <PrimaryBtn onClick={onStartWorkout}>Start Day {planDay.day} — {planDay.name} →</PrimaryBtn>
      </div>}
    </div>
  </div>;
}

// ─── TAB: WORKOUT (session flow) ──────────────────────────────────────────────
function WorkoutTab({onComplete}) {
  const [phase,setPhase]=useState("overview"); // overview | active | done
  const [dayIdx,setDayIdx]=useState(0);
  const [exIdx,setExIdx]=useState(0);
  const [sets,setSets]=useState({});
  const [weights,setWeights]=useState({});
  const [modalEx,setModalEx]=useState(null);
  const [restTimer,setRestTimer]=useState(0);
  const [restRunning,setRestRunning]=useState(false);
  const [swapEx,setSwapEx]=useState(null);
  const timerRef=useRef(null);

  const plan=PLAN_3;
  const day=plan[dayIdx];
  const ex=day?.exercises[exIdx];

  useEffect(()=>{
    if(restRunning&&restTimer>0){timerRef.current=setTimeout(()=>setRestTimer(t=>t-1),1000);}
    else if(restTimer===0){setRestRunning(false);}
    return()=>clearTimeout(timerRef.current);
  },[restRunning,restTimer]);

  const initSets=()=>{
    const s={};
    day.exercises.forEach(e=>{s[e.id]=Array(e.sets).fill(false);});
    setSets(s);
    const w={};
    day.exercises.forEach(e=>{w[e.id]=e.weight;});
    setWeights(w);
  };

  const tapSet=(exId,setI,restTime)=>{
    setSets(prev=>{
      const arr=[...( prev[exId]||[])];
      arr[setI]=!arr[setI];
      if(arr[setI]&&restTime>0){setRestTimer(restTime);setRestRunning(true);}
      return {...prev,[exId]:arr};
    });
  };

  const allSetsDone=(exId,numSets)=>(sets[exId]||[]).filter(Boolean).length===numSets;

  const calcBurned=()=>{
    const mins=day.exercises.length*7;
    return Math.round((50*3.5*mins)/200*profile_base);
  };

  const profile_base=3.8;

  const totalSets=day?.exercises.reduce((a,e)=>a+e.sets,0)||0;
  const doneSets=Object.values(sets).flat().filter(Boolean).length;

  if(phase==="overview") return <div style={{paddingBottom:90}}>
    <Header title={`Day ${day.day}`} sub={`${day.name} · ${day.focus}`}/>
    <div style={{padding:"0 20px"}}>
      <SectionLabel>Today's exercises</SectionLabel>
      {day.exercises.map((e,i)=><Card key={e.id} style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:36,height:36,borderRadius:10,background:T.pk100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:T.pk500,flexShrink:0}}>{i+1}</div>
        <div style={{flex:1}} onClick={()=>setModalEx(e)}>
          <div style={{fontSize:14,fontWeight:600,color:T.txtDk}}>{e.name}</div>
          <div style={{fontSize:12,color:T.txtLt}}>{e.de} · {e.sets>0?`${e.sets} × ${e.reps}`:`${e.reps}`}{e.weight>0?` · ${e.weight} kg`:""}</div>
        </div>
        <div style={{fontSize:13,color:T.txtLt}}>→</div>
      </Card>)}
      <div style={{height:12}}/>
      <div style={{display:"flex",gap:10}}>
        {dayIdx>0&&<OutlineBtn onClick={()=>setDayIdx(d=>d-1)} style={{flex:1}}>← Day {day.day-1}</OutlineBtn>}
        {dayIdx<plan.length-1&&<OutlineBtn onClick={()=>setDayIdx(d=>d+1)} style={{flex:1}}>Day {day.day+1} →</OutlineBtn>}
      </div>
      <div style={{height:10}}/>
      <PrimaryBtn onClick={()=>{initSets();setExIdx(0);setPhase("active");}}>Begin Day {day.day} →</PrimaryBtn>
    </div>
    <ExerciseModal ex={modalEx} onClose={()=>setModalEx(null)}/>
  </div>;

  if(phase==="active"&&ex) {
    const exSets=sets[ex.id]||Array(ex.sets).fill(false);
    const curWeight=weights[ex.id]??ex.weight;
    const lastDone=allSetsDone(ex.id,ex.sets);
    return <div style={{paddingBottom:90}}>
      <div style={{background:T.pk500,padding:"calc(env(safe-area-inset-top, 44px) + 16px) 20px 20px",color:"#fff"}}>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:4}}>{exIdx+1} of {day.exercises.length} · Day {day.day}</div>
        <div style={{fontFamily:T.serif,fontSize:24,color:"#fff",cursor:"pointer"}} onClick={()=>setModalEx(ex)}>{ex.name} ↗</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginTop:2}}>{ex.de}</div>
        <div style={{marginTop:10,background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"5px 14px",display:"inline-block",fontSize:12,color:"#fff"}}>{doneSets}/{totalSets} sets done</div>
      </div>
      <div style={{padding:"16px 20px"}}>
        {restRunning&&<Card style={{background:T.pk100,border:`1px solid ${T.pk300}`,textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:11,color:T.txtLt,marginBottom:4}}>Rest</div>
          <div style={{fontFamily:T.serif,fontSize:32,color:T.pk500}}>{restTimer}s</div>
          <div style={{background:T.pk200,borderRadius:4,height:4,marginTop:8}}><div style={{background:T.pk500,height:4,borderRadius:4,width:`${(restTimer/ex.rest)*100}%`,transition:"width 1s linear"}}/></div>
        </Card>}

        <Card>
          <div style={{fontSize:11,color:T.txtLt,marginBottom:4}}>Empfohlenes Gewicht</div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <button onClick={()=>setWeights(w=>({...w,[ex.id]:Math.max(0,(w[ex.id]??ex.weight)-2.5)}))} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${T.pk300}`,background:"transparent",fontSize:18,color:T.pk500,cursor:"pointer",fontFamily:T.sans}}>−</button>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontFamily:T.serif,fontSize:28,color:T.txtDk}}>{ex.weight===0?"BW":`${curWeight} kg`}</div>
              {ex.weight>0&&<div style={{fontSize:10,color:T.txtLt}}>Kilogramm</div>}
            </div>
            <button onClick={()=>setWeights(w=>({...w,[ex.id]:(w[ex.id]??ex.weight)+2.5}))} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${T.pk300}`,background:"transparent",fontSize:18,color:T.pk500,cursor:"pointer",fontFamily:T.sans}}>+</button>
          </div>
          <div style={{fontSize:12,color:T.txtMd,marginBottom:12}}>{ex.reps} reps · {ex.sets} sets</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {exSets.map((done,i)=><SetCircle key={i} done={done} num={i+1} onTap={()=>tapSet(ex.id,i,ex.rest)}/>)}
          </div>
        </Card>

        <div style={{display:"flex",gap:8,marginTop:4}}>
          <OutlineBtn onClick={()=>setModalEx(ex)} style={{flex:1}}>Form tip</OutlineBtn>
          {ex.swaps&&ex.swaps.length>0&&<OutlineBtn onClick={()=>setSwapEx(ex)} style={{flex:1}}>Swap ↔</OutlineBtn>}
        </div>

        <div style={{height:12}}/>
        {exIdx<day.exercises.length-1
          ?<PrimaryBtn onClick={()=>{setExIdx(i=>i+1);setRestRunning(false);}} style={{opacity:lastDone?1:0.5}}>Next Exercise →</PrimaryBtn>
          :<PrimaryBtn onClick={()=>{const burned=Math.round(day.exercises.length*7*3.5*50/200);onComplete({day:day.day,name:day.name,sets:doneSets,burned,date:new Date().toISOString()});setPhase("done");}} style={{opacity:lastDone?1:0.85}}>Finish Session ✓</PrimaryBtn>
        }
      </div>
      <ExerciseModal ex={modalEx} onClose={()=>setModalEx(null)}/>
      {swapEx&&<ExerciseModal ex={swapEx} onClose={()=>setSwapEx(null)} onSwap={(name)=>{setSwapEx(null);}}/>}
    </div>;
  }

  if(phase==="done") {
    const lastSession=day;
    const burned=Math.round(lastSession.exercises.length*7*3.5*50/200);
    return <div style={{paddingBottom:90}}>
      <div style={{background:T.pk500,padding:"calc(env(safe-area-inset-top, 44px) + 24px) 20px 32px",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:8}}>✓</div>
        <div style={{fontFamily:T.serif,fontSize:28,color:"#fff"}}>Day {day.day} done!</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.8)",marginTop:4}}>{day.name}</div>
      </div>
      <div style={{padding:"0 20px"}}>
        <Card style={{marginTop:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
            <div><div style={{fontFamily:T.serif,fontSize:24,color:T.txtDk}}>{doneSets}</div><div style={{fontSize:11,color:T.txtLt}}>Sets done</div></div>
            <div><div style={{fontFamily:T.serif,fontSize:24,color:T.pk500}}>~{burned}</div><div style={{fontSize:11,color:T.txtLt}}>kcal burned</div></div>
            <div><div style={{fontFamily:T.serif,fontSize:24,color:T.txtDk}}>{lastSession.exercises.length*7}m</div><div style={{fontSize:11,color:T.txtLt}}>Est. time</div></div>
          </div>
        </Card>
        <Card style={{background:T.pk100,border:`0.5px solid ${T.pk300}`}}>
          <div style={{fontSize:13,color:T.pk500,fontWeight:600}}>🥩 Eat protein now</div>
          <div style={{fontSize:12,color:T.txtMd,marginTop:4}}>Your muscles need it in the next 30 min.</div>
        </Card>
        <div style={{height:8}}/>
        <PrimaryBtn onClick={()=>setPhase("overview")}>Back to plan</PrimaryBtn>
      </div>
    </div>;
  }
  return null;
}

// ─── TAB: PLANS ──────────────────────────────────────────────────────────────
function PlanCard({plan,label,sub,onView}) {
  return <Card style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
      <div>
        <div style={{fontFamily:T.serif,fontSize:20,color:T.txtDk}}>{label}</div>
        <div style={{fontSize:12,color:T.txtLt,marginTop:2}}>{sub}</div>
      </div>
      <span style={{background:T.pk100,color:T.pk500,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>Preset</span>
    </div>
    {plan.map(d=><div key={d.day} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderTop:`0.5px solid ${T.pk200}`}}>
      <div style={{width:34,height:34,borderRadius:10,background:T.pk500,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:600,flexShrink:0}}>D{d.day}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:T.txtDk}}>{d.name}</div>
        <div style={{fontSize:12,color:T.txtLt}}>{d.exercises.length} exercises · {d.focus}</div>
      </div>
    </div>)}
    <div style={{marginTop:14}}>
      <PrimaryBtn onClick={onView}>View full plan →</PrimaryBtn>
    </div>
  </Card>;
}

function PlansTab({onStartDay}) {
  const [view,setView]=useState("list");
  const [modalEx,setModalEx]=useState(null);
  const [activeDay,setActiveDay]=useState(null);

  if(view==="list") return <div style={{paddingBottom:90}}>
    <Header title="Plans" sub="Your Wonyoung shape programs"/>
    <div style={{padding:"0 20px"}}>
      <SectionLabel>Your preset plans</SectionLabel>
      <PlanCard plan={PLAN_3} label="3-Day Plan" sub="Glute · Core · Conditioning" onView={()=>setView("day3")}/>
      <PlanCard plan={PLAN_5} label="5-Day Plan" sub="Full Wonyoung split" onView={()=>setView("day5")}/>
    </div>
  </div>;

  const plan=view==="day3"?PLAN_3:PLAN_5;
  const label=view==="day3"?"3-Day Plan":"5-Day Plan";

  if(activeDay!==null) {
    const d=plan[activeDay];
    return <div style={{paddingBottom:90}}>
      <Header title={`Day ${d.day} — ${d.name}`} sub={d.focus} back={label} onBack={()=>setActiveDay(null)}/>
      <div style={{padding:"0 20px"}}>
        {d.exercises.map((e,i)=><Card key={e.id} style={{display:"flex",alignItems:"center",gap:14}} onClick={()=>setModalEx(e)}>
          <div style={{width:36,height:36,borderRadius:10,background:T.pk100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:T.pk500,flexShrink:0}}>{i+1}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:T.txtDk}}>{e.name}</div>
            <div style={{fontSize:12,color:T.txtLt}}>{e.de} · {e.sets>0?`${e.sets}×${e.reps}`:e.reps}{e.weight>0?` · ${e.weight} kg`:""}</div>
          </div>
          <FlagBadge flag={e.flag}/>
        </Card>)}
        <div style={{height:12}}/>
        <PrimaryBtn onClick={onStartDay}>Begin Day {d.day} — {d.name} →</PrimaryBtn>
        <div style={{height:8}}/>
      </div>
      <ExerciseModal ex={modalEx} onClose={()=>setModalEx(null)}/>
    </div>;
  }

  return <div style={{paddingBottom:90}}>
    <Header title={label} back="Plans" onBack={()=>setView("list")}/>
    <div style={{padding:"0 20px"}}>
      {plan.map((d,i)=><Card key={d.day} style={{cursor:"pointer"}} onClick={()=>setActiveDay(i)}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:12,background:T.pk500,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:600,flexShrink:0}}>D{d.day}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600,color:T.txtDk}}>{d.name}</div>
            <div style={{fontSize:12,color:T.txtLt}}>{d.exercises.length} exercises · {d.focus}</div>
          </div>
          <div style={{color:T.txtLt,fontSize:18}}>→</div>
        </div>
      </Card>)}
    </div>
  </div>;
}

// ─── TAB: EXERCISE BANK ───────────────────────────────────────────────────────
function BankTab() {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [modalEx,setModalEx]=useState(null);

  const allEx=[...new Map([...PLAN_3.flatMap(d=>d.exercises),...PLAN_5.flatMap(d=>d.exercises),...BANK_EXTRA].map(e=>[e.id,e])).values()];
  const filters=["all","core","safe","avoid"];
  const filterLabel={all:"All",core:"✓ Goal",safe:"Safe",avoid:"✗ Avoid"};

  const filtered=allEx.filter(e=>{
    const matchSearch=e.name.toLowerCase().includes(search.toLowerCase())||e.de.toLowerCase().includes(search.toLowerCase())||e.muscle.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==="all"||e.flag===filter;
    return matchSearch&&matchFilter;
  });

  return <div style={{paddingBottom:90}}>
    <Header title="Exercise Bank" sub={`${allEx.length} exercises · tap to see form`}/>
    <div style={{padding:"12px 20px 0"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exercises..." style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`0.5px solid ${T.pk200}`,fontSize:14,fontFamily:T.sans,background:T.white,color:T.txtDk,boxSizing:"border-box",outline:"none"}}/>
      <div style={{display:"flex",gap:8,marginTop:12,marginBottom:4,overflowX:"auto",paddingBottom:4}}>
        {filters.map(f=><button key={f} onClick={()=>setFilter(f)} style={{flexShrink:0,padding:"7px 16px",borderRadius:20,border:`1px solid ${filter===f?T.pk500:T.pk200}`,background:filter===f?T.pk500:"transparent",color:filter===f?"#fff":T.txtMd,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.sans}}>{filterLabel[f]}</button>)}
      </div>
      {filtered.map(e=><Card key={e.id} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14}} onClick={()=>setModalEx(e)}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{fontSize:14,fontWeight:600,color:e.flag==="avoid"?T.txtLt:T.txtDk}}>{e.name}</div>
            <FlagBadge flag={e.flag}/>
          </div>
          <div style={{fontSize:12,color:T.txtLt}}>{e.de} · {e.muscle}</div>
          {e.weight>0&&<div style={{fontSize:12,color:T.pk500,marginTop:2,fontWeight:600}}>{e.weight} kg</div>}
        </div>
        <div style={{color:T.txtLt,fontSize:16}}>→</div>
      </Card>)}
    </div>
    <ExerciseModal ex={modalEx} onClose={()=>setModalEx(null)}/>
  </div>;
}

// ─── TAB: NUTRITION ───────────────────────────────────────────────────────────
function NutritionTab({nutrition,onLog,sessions}) {
  const [showLog,setShowLog]=useState(false);
  const [meal,setMeal]=useState("Breakfast");
  const [cal,setCal]=useState("");
  const [prot,setProt]=useState("");
  const [view,setView]=useState("day");

  const todayBurned=sessions.filter(s=>new Date(s.date).toDateString()===new Date().toDateString()).reduce((a,b)=>a+(b.burned||0),0);

  const saveMeal=()=>{
    if(!cal&&!prot)return;
    onLog({meal,calories:Number(cal)||0,protein:Number(prot)||0});
    setCal("");setProt("");setShowLog(false);
  };

  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return <div style={{paddingBottom:90}}>
    <Header title="Nutrition" sub="Lynn · 1,400 kcal · 100g protein"/>
    <div style={{padding:"0 20px"}}>
      <div style={{display:"flex",background:T.pk100,borderRadius:12,padding:4,marginTop:16,marginBottom:4}}>
        {["day","week"].map(v=><button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:view===v?T.pk500:"transparent",color:view===v?"#fff":T.txtLt,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.sans,textTransform:"capitalize"}}>{v==="day"?"Today":"This Week"}</button>)}
      </div>

      {view==="day"&&<>
        <SectionLabel>Today's intake</SectionLabel>
        <Card>
          <div style={{display:"flex",justifyContent:"space-around",marginBottom:12}}>
            <NutritionRing value={nutrition.calories} max={1400} label="Calories"/>
            <NutritionRing value={nutrition.protein} max={100} label="Protein g" color={T.pk400}/>
            <NutritionRing value={nutrition.water} max={2.5} label="Water (L)" color={T.pk300}/>
          </div>
          {todayBurned>0&&<div style={{background:T.pk100,borderRadius:8,padding:"9px 14px",fontSize:12,color:T.pk500,fontWeight:600,textAlign:"center"}}>Workout: −{todayBurned} kcal burned today</div>}
        </Card>
        <SectionLabel>Meals logged</SectionLabel>
        {(nutrition.meals||[]).length===0&&<div style={{fontSize:13,color:T.txtLt,textAlign:"center",padding:"20px 0"}}>No meals logged yet today</div>}
        {(nutrition.meals||[]).map((m,i)=><Card key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.txtDk}}>{m.meal}</div>
            <div style={{fontSize:12,color:T.txtLt}}>{m.calories} kcal · {m.protein}g protein</div>
          </div>
          <div style={{width:8,height:8,borderRadius:"50%",background:T.pk500}}/>
        </Card>)}
        <div style={{height:8}}/>
        <PrimaryBtn onClick={()=>setShowLog(true)}>+ Log Meal</PrimaryBtn>
      </>}

      {view==="week"&&<>
        <SectionLabel>Protein goal this week</SectionLabel>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {days.map(d=><div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{fontSize:10,color:T.txtLt}}>{d}</div>
              <div style={{width:32,height:32,borderRadius:"50%",background:Math.random()>0.3?T.pk500:T.pk200,border:`1px solid ${T.pk300}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:Math.random()>0.3?"#fff":T.txtLt}}>
                {Math.random()>0.3?"✓":"—"}
              </div>
            </div>)}
          </div>
          <div style={{marginTop:14,fontSize:13,color:T.txtMd,textAlign:"center"}}>Avg this week: <span style={{fontWeight:600,color:T.txtDk}}>91g protein · 1,360 kcal</span></div>
        </Card>
      </>}
    </div>

    {showLog&&<div style={{position:"fixed",inset:0,background:"rgba(42,26,30,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowLog(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:`20px 20px calc(env(safe-area-inset-bottom, 16px) + 32px)`}}>
        <div style={{width:40,height:4,background:T.pk200,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontFamily:T.serif,fontSize:22,color:T.txtDk,marginBottom:16}}>Log a meal</div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["Breakfast","Lunch","Dinner","Snack"].map(m=><button key={m} onClick={()=>setMeal(m)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${meal===m?T.pk500:T.pk200}`,background:meal===m?T.pk500:"transparent",color:meal===m?"#fff":T.txtMd,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.sans}}>{m}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <div style={{fontSize:12,color:T.txtLt,marginBottom:6}}>Calories (kcal)</div>
            <input value={cal} onChange={e=>setCal(e.target.value)} type="number" placeholder="e.g. 450" style={{width:"100%",padding:"12px",borderRadius:12,border:`0.5px solid ${T.pk200}`,fontSize:14,fontFamily:T.sans,boxSizing:"border-box",outline:"none"}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:T.txtLt,marginBottom:6}}>Protein (g)</div>
            <input value={prot} onChange={e=>setProt(e.target.value)} type="number" placeholder="e.g. 32" style={{width:"100%",padding:"12px",borderRadius:12,border:`0.5px solid ${T.pk200}`,fontSize:14,fontFamily:T.sans,boxSizing:"border-box",outline:"none"}}/>
          </div>
        </div>
        <PrimaryBtn onClick={saveMeal}>Save meal</PrimaryBtn>
      </div>
    </div>}
  </div>;
}

// ─── TAB: PROGRESS ───────────────────────────────────────────────────────────
function ProgressTab({sessions,measurements,onLogMeasurement}) {
  const [showLog,setShowLog]=useState(false);
  const [waist,setWaist]=useState("");
  const [hips,setHips]=useState("");
  const [weight,setWeight]=useState("");

  const save=()=>{
    onLogMeasurement({waist:Number(waist)||0,hips:Number(hips)||0,weight:Number(weight)||0,date:new Date().toISOString()});
    setWaist("");setHips("");setWeight("");setShowLog(false);
  };

  const thisWeekSessions=sessions.filter(s=>{const d=new Date(s.date);const now=new Date();const weekAgo=new Date();weekAgo.setDate(now.getDate()-7);return d>=weekAgo;});
  const last=measurements[measurements.length-1];
  const prev=measurements[measurements.length-2];

  const arrow=(cur,p,goal)=>{
    if(!p)return"—";
    if(goal==="down")return cur<p?"↓ ✓":cur>p?"↑":"→";
    if(goal==="up")return cur>p?"↑ ✓":cur<p?"↓":"→";
    if(cur===p)return "→"; if(cur<p)return "↓"; return "↑";
  };

  const strengthData=[
    {name:"Hip Thrust",start:35,current:sessions.length>2?40:35},
    {name:"RDL",start:20,current:sessions.length>2?22.5:20},
    {name:"Cable Kickback",start:10,current:sessions.length>1?12.5:10},
  ];

  const milestones=[];
  if(sessions.length>=5)milestones.push(`${sessions.length} sessions completed ✓`);
  if(last&&prev&&last.waist<prev.waist)milestones.push(`Waist down ${(prev.waist-last.waist).toFixed(1)} cm ↓`);
  if(last&&prev&&last.hips>prev.hips)milestones.push(`Hips up ${(last.hips-prev.hips).toFixed(1)} cm ↑`);

  return <div style={{paddingBottom:90}}>
    <Header title="Progress" sub="Wonyoung shape — waist ↓ hips ↑"/>
    <div style={{padding:"0 20px"}}>

      <SectionLabel>This week</SectionLabel>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{
            const done=thisWeekSessions.some(s=>{const sd=new Date(s.date);return sd.getDay()===(i+1)%7;});
            const isToday=new Date().getDay()===(i+1)%7;
            return <div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{fontSize:10,color:T.txtLt}}>{d}</div>
              <div style={{width:34,height:34,borderRadius:"50%",background:done?T.pk500:isToday?T.pk100:"transparent",border:`1.5px solid ${done?T.pk500:isToday?T.pk500:T.pk200}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:done?"#fff":isToday?T.pk500:T.txtLt}}>{done?"✓":isToday?"·":"—"}</div>
            </div>;
          })}
        </div>
        <div style={{fontSize:13,color:T.txtMd,textAlign:"center"}}>{thisWeekSessions.length} of 3 sessions this week</div>
      </Card>

      <SectionLabel>Getting stronger</SectionLabel>
      <Card>
        {strengthData.map(s=><div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`0.5px solid ${T.pk200}`}}>
          <div style={{fontSize:13,color:T.txtDk,fontWeight:500}}>{s.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:T.txtLt}}>{s.start} kg</span>
            <span style={{fontSize:12,color:T.txtLt}}>→</span>
            <span style={{fontSize:14,fontWeight:600,color:s.current>s.start?T.pk500:T.txtDk}}>{s.current} kg {s.current>s.start?"↑":"→"}</span>
          </div>
        </div>)}
      </Card>

      <SectionLabel>Body measurements</SectionLabel>
      <Card>
        {measurements.length===0&&<div style={{fontSize:13,color:T.txtLt,textAlign:"center",padding:"12px 0"}}>No measurements yet — log your first one</div>}
        {last&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center",marginBottom:12}}>
            <div>
              <div style={{fontFamily:T.serif,fontSize:22,color:T.txtDk}}>{last.waist}<span style={{fontSize:12}}>cm</span></div>
              <div style={{fontSize:11,color:T.txtLt}}>Waist</div>
              <div style={{fontSize:12,fontWeight:600,color:T.pk500}}>{arrow(last.waist,prev?.waist,"down")}</div>
            </div>
            <div>
              <div style={{fontFamily:T.serif,fontSize:22,color:T.txtDk}}>{last.hips}<span style={{fontSize:12}}>cm</span></div>
              <div style={{fontSize:11,color:T.txtLt}}>Hips</div>
              <div style={{fontSize:12,fontWeight:600,color:T.pk500}}>{arrow(last.hips,prev?.hips,"up")}</div>
            </div>
            <div>
              <div style={{fontFamily:T.serif,fontSize:22,color:T.txtDk}}>{last.weight}<span style={{fontSize:12}}>kg</span></div>
              <div style={{fontSize:11,color:T.txtLt}}>Weight</div>
              <div style={{fontSize:12,color:T.txtLt}}>{arrow(last.weight,prev?.weight,"down")}</div>
            </div>
          </div>
        </>}
        <OutlineBtn onClick={()=>setShowLog(true)} style={{width:"100%"}}>+ Log this month</OutlineBtn>
      </Card>

      {milestones.length>0&&<>
        <SectionLabel>Milestones</SectionLabel>
        {milestones.map((m,i)=><Card key={i} style={{background:T.pk100,border:`0.5px solid ${T.pk300}`}}>
          <div style={{fontSize:13,fontWeight:600,color:T.pk500}}>{m}</div>
        </Card>)}
      </>}

      <Card>
        <div style={{fontSize:12,fontWeight:600,color:T.txtMd,marginBottom:4}}>Streak</div>
        <div style={{fontFamily:T.serif,fontSize:30,color:T.pk500}}>🔥 {Math.max(sessions.length,0)} days</div>
        {sessions.length===0&&<div style={{fontSize:12,color:T.txtLt,marginTop:4}}>Complete your first session to start your streak</div>}
      </Card>
    </div>

    {showLog&&<div style={{position:"fixed",inset:0,background:"rgba(42,26,30,0.5)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowLog(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:`20px 20px calc(env(safe-area-inset-bottom, 16px) + 32px)`}}>
        <div style={{width:40,height:4,background:T.pk200,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontFamily:T.serif,fontSize:22,color:T.txtDk,marginBottom:16}}>Monthly check-in</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          {[["Waist","cm",waist,setWaist],["Hips","cm",hips,setHips],["Weight","kg",weight,setWeight]].map(([label,unit,val,setVal])=><div key={label}>
            <div style={{fontSize:12,color:T.txtLt,marginBottom:6}}>{label} ({unit})</div>
            <input value={val} onChange={e=>setVal(e.target.value)} type="number" placeholder="—" style={{width:"100%",padding:"12px",borderRadius:12,border:`0.5px solid ${T.pk200}`,fontSize:14,fontFamily:T.sans,boxSizing:"border-box",outline:"none",textAlign:"center"}}/>
          </div>)}
        </div>
        <PrimaryBtn onClick={save}>Save measurements</PrimaryBtn>
      </div>
    </div>}
  </div>;
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileSheet({profile,onSave,onClose}) {
  const [p,setP]=useState({...profile});
  return <div style={{position:"fixed",inset:0,background:"rgba(42,26,30,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:`20px 20px calc(env(safe-area-inset-bottom, 16px) + 32px)`,maxHeight:"85vh",overflowY:"auto"}}>
      <div style={{width:40,height:4,background:T.pk200,borderRadius:2,margin:"0 auto 16px"}}/>
      <div style={{fontFamily:T.serif,fontSize:24,color:T.txtDk,marginBottom:4}}>My Profile</div>
      <div style={{fontSize:13,color:T.txtLt,marginBottom:20}}>Goal: Wonyoung Shape — lean + lifted</div>
      {[["Name","name","text"],["Age","age","number"],["Weight (kg)","weight","number"],["Height (cm)","height","number"],["Body fat (%)","bodyfat","number"]].map(([label,key,type])=><div key={key} style={{marginBottom:14}}>
        <div style={{fontSize:12,color:T.txtLt,marginBottom:6}}>{label}</div>
        <input value={p[key]} onChange={e=>setP({...p,[key]:e.target.value})} type={type} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`0.5px solid ${T.pk200}`,fontSize:15,fontFamily:T.sans,boxSizing:"border-box",outline:"none",color:T.txtDk}}/>
      </div>)}
      <Card style={{background:T.pk100,border:`0.5px solid ${T.pk300}`,marginBottom:16}}>
        <div style={{fontSize:12,color:T.pk500,fontWeight:600,marginBottom:2}}>Goal: Wonyoung Shape</div>
        <div style={{fontSize:12,color:T.txtMd}}>Build: Glutes + Core · Shrink: Waist, arms, legs · Protect: No shoulder bulk</div>
      </Card>
      <div style={{display:"flex",gap:10}}>
        <OutlineBtn onClick={onClose} style={{flex:1}}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={()=>{onSave(p);onClose();}} style={{flex:2}}>Save changes</PrimaryBtn>
      </div>
      <div style={{fontSize:12,color:T.txtLt,textAlign:"center",marginTop:12}}>Saving updates all suggested weights + nutrition targets</div>
    </div>
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PeachFitApp() {
  const [tab,setTab]=useState("home");
  const [showProfile,setShowProfile]=useState(false);
  const [profile,setProfile]=useState({name:"Lynn",age:34,weight:50,height:157,bodyfat:26});
  const [sessions,setSessions]=useState([]);
  const [measurements,setMeasurements]=useState([]);
  const [nutrition,setNutrition]=useState({calories:0,protein:0,water:0,meals:[]});

  const milestones=[];
  if(sessions.length===10)milestones.push("10 sessions completed ✓");
  if(sessions.length===1)milestones.push("First session done ✓");

  const NavIcons={
    home: (c)=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
    workout: (c)=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/></svg>,
    plans: (c)=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="8" cy="15" r="1" fill={c}/><circle cx="12" cy="15" r="1" fill={c}/><circle cx="16" cy="15" r="1" fill={c}/></svg>,
    bank: (c)=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1.2" fill={c}/><circle cx="5" cy="12" r="1.2" fill={c}/><circle cx="5" cy="18" r="1.2" fill={c}/></svg>,
    nutrition: (c)=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 6 5 10c0 5 4 10 7 12 3-2 7-7 7-12 0-4-3-8-7-8z"/><path d="M12 2c0 0 2 3 2 6" strokeDasharray="2 2"/></svg>,
    progress: (c)=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 18 8 12 12 15 16 9 20 6"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
  };

  const tabs=[
    {id:"home",icon:"home",label:"Home"},
    {id:"workout",icon:"workout",label:"Workout"},
    {id:"plans",icon:"plans",label:"Plans"},
    {id:"bank",icon:"bank",label:"Exercises"},
    {id:"nutrition",icon:"nutrition",label:"Nutrition"},
    {id:"progress",icon:"progress",label:"Progress"},
  ];

  return <div style={{fontFamily:T.sans,background:T.pkBg,minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative"}}>

    {/* Profile button overlay */}
    {tab==="home"&&<div onClick={()=>setShowProfile(true)} style={{position:"fixed",top:"calc(env(safe-area-inset-top, 44px) + 12px)",right:20,zIndex:150,width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.25)",border:"1.5px solid rgba(255,255,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    </div>}

    <div style={{paddingBottom:0,overflowY:"auto",height:"calc(100dvh - 96px)",overflowX:"hidden"}}>
      {tab==="home"&&<HomeTab profile={profile} sessions={sessions} nutrition={nutrition} onStartWorkout={()=>setTab("workout")} milestones={milestones}/>}
      {tab==="workout"&&<WorkoutTab onComplete={s=>{setSessions(prev=>[...prev,s]);}}/>}
      {tab==="plans"&&<PlansTab onStartDay={()=>setTab("workout")}/>}
      {tab==="bank"&&<BankTab/>}
      {tab==="nutrition"&&<NutritionTab nutrition={nutrition} sessions={sessions} onLog={meal=>setNutrition(n=>({...n,calories:n.calories+meal.calories,protein:n.protein+meal.protein,meals:[...n.meals,meal]}))}/>}
      {tab==="progress"&&<ProgressTab sessions={sessions} measurements={measurements} onLogMeasurement={m=>setMeasurements(prev=>[...prev,m])}/>}
    </div>

    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.white,borderTop:`0.5px solid ${T.pk200}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom, 16px)"}}>
      {tabs.map(t=>{const c=tab===t.id?T.pk500:T.txtLt;return<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0 14px",cursor:"pointer",color:c,fontSize:11,fontWeight:tab===t.id?600:400,gap:5,background:"none",border:"none",fontFamily:T.sans}}>
        {NavIcons[t.icon](c)}
        {t.label}
      </button>;})}
    </div>

    {showProfile&&<ProfileSheet profile={profile} onSave={setProfile} onClose={()=>setShowProfile(false)}/>}
  </div>;
}
