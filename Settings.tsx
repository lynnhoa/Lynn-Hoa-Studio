import { useState } from "react";
import { C, SERIF, SANS, PASS, SETTINGS_DEFAULT } from "./constants";
import { I, S, B, Lbl } from "./atoms";

// ─── SETTINGS ─────────────────────────────────────────────
export function Settings({settings,setSettings,isMobile}: any) {
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
export function ChangePassword({settings,setSettings}: any) {
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
        <Lbl>New Password</Lbl><I type="number" value={newPw} onChange={(e: any)=>setNewPw(e.target.value)} placeholder="Min. 6 characters" s={{marginBottom:9}}/>
        <Lbl>Confirm New Password</Lbl><I type="password" value={confPw} onChange={(e: any)=>setConfPw(e.target.value)} onKeyDown={(e: any)=>e.key==="Enter"&&changePass()} placeholder="Repeat" s={{marginBottom:12}}/>
        <B v="sec" onClick={changePass}>Change Password</B>
        {pwMsg&&<p style={{fontSize:10.5,color:pwMsg.ok?C.green:C.red,margin:"10px 0 0"}}>{pwMsg.text}</p>}
      </div>
    </div>
  );
}
