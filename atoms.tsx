import { useState } from "react";
import { C, SERIF, SANS, PASS, fmt, fmtD, dLeft } from "./constants";

// ─── ATOMS ────────────────────────────────────────────────
export const I = ({s,...p}: any) =>
  <input style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box",...s}} {...p}/>;

export const S = ({s,...p}: any) =>
  <select style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:12,color:C.black,borderRadius:2,outline:"none",boxSizing:"border-box",...s}} {...p}/>;

export const B = ({v="pri",s,...p}: any) =>
  <button style={{padding:"7px 14px",border:v==="pri"?"none":`1px solid ${C.rule}`,background:v==="pri"?C.black:"transparent",color:v==="pri"?C.white:C.muted,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap",...s}} {...p}/>;

export const Pill = ({on,onClick,children}: any) =>
  <button onClick={onClick} style={{padding:"5px 13px",border:`1px solid ${on?C.black:C.rule}`,background:on?C.black:"transparent",color:on?C.white:C.muted,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase"}}>{children}</button>;

export const Lbl = ({children}: any) =>
  <p style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"12px 0 5px"}}>{children}</p>;

export const Tag = ({children,onRemove}: any) =>
  <span style={{display:"inline-flex",alignItems:"center",gap:4,border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 8px",fontSize:10,color:C.muted}}>
    {children}
    {onRemove&&<button onClick={onRemove} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:10,padding:0}}>✕</button>}
  </span>;

export const IR = ({label,value}: any) =>
  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.rule}`}}>
    <span style={{fontSize:10.5,color:C.muted}}>{label}</span>
    <span style={{fontSize:10.5,color:C.black,fontWeight:"500",maxWidth:"60%",textAlign:"right"}}>{value||"—"}</span>
  </div>;

export const scol = (s: string) =>
  ({invoiced:C.amber,contracted:C.muted,quoted:C.light,revised:"#b8a090",production:"#8fa89a",paid:C.green,lead:C.light}[s as keyof typeof C]||C.light);

export function UBadge({end,label="Usage"}: {end: string|null|undefined, label?: string}) {
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

// ─── APP LOGO ─────────────────────────────────────────────
export function AppLogo({size="nav"}: {size?: "nav"|"auth"|"web"}) {
  const big=size==="auth";
  const web=size==="web";
  return(
    <div style={{textAlign:"center",lineHeight:1,display:"inline-block"}}>
      <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:big?26:web?24:18,letterSpacing:"0.02em",color:C.black,display:"block"}}>Lynn Hoa</span>
      <span style={{fontFamily:SANS,fontSize:big?8:web?7:6.5,letterSpacing:"0.26em",textTransform:"uppercase" as const,color:C.muted,display:"block",marginTop:big?4:2}}>Studio</span>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────
export function Auth({onAuth,currentPass}: {onAuth: (role:"manager"|"creator")=>void, currentPass: string}) {
  const [role,setRole]=useState<"manager"|"creator"|null>("manager");
  const [pw,setPw]=useState(""), [err,setErr]=useState(false);
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
