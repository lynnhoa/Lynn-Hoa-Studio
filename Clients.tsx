import { useState, useEffect } from "react";
import { C, SERIF, SANS, fmt, fmtD, today, addM, uid, STATUS } from "./constants";
import { I, S, B, Lbl, Tag, IR, UBadge, scol } from "./atoms";
import { PDFModal } from "./PDFEngine";

// ─── CLIENT DETAIL PANEL ─────────────────────────────────
function ClientDetail({cl,fin,editMode,ed,setEd,upCl,setEditMode,delCl,tagI,setTagI,uEnd,showAddP,setShowAddP,newPN,setNewPN,addP,onGoToCalc,upP,setClients,openPDF,openReviseContract,setPdf,onRevise,setAmendT,setRenewT,setStatus,nxt,prv,editPrName,setEditPrName,editPrNameVal,setEditPrNameVal,delConfirm,setDelConfirm,setSel,highlightedProjectQNo,onClearHighlight}: any) {
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
        const end=uEnd(pr); const ps=prv(pr.status);
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
              <div key={r.id||ri} style={{background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:2,padding:"7px 10px",marginBottom:6}}>
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
              {["quoted","revised"].includes(pr.status)&&<>
                <B v="sec" s={{fontSize:8}} onClick={()=>onRevise(pr,cl)}>Revise Quote</B>
                <B s={{fontSize:8}} onClick={()=>{setStatus(cl.id,pr.id,"contracted");openPDF({...pr,status:"contracted"},"contract","en",cl.id);}}>→ Contract</B>
              </>}
              {pr.status==="contracted"&&<>
                <B v="sec" s={{fontSize:8}} onClick={()=>openReviseContract(pr,cl.id)}>Revise Contract</B>
                <B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Mark Signed</B>
              </>}
              {pr.status==="production"&&<>
                <B s={{fontSize:8}} onClick={()=>{setStatus(cl.id,pr.id,"invoiced");openPDF({...pr,status:"invoiced"},"invoice","en",cl.id);}}>Create Invoice</B>
              </>}
              {pr.status==="invoiced"&&!pr.paid&&<>
                <B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"paid")}>Mark Paid</B>
              </>}
              {pr.paid&&<>
                <B v="sec" s={{fontSize:8,color:C.amber}} onClick={()=>upP(cl.id,pr.id,{paid:false,status:"invoiced"})}>Undo Paid</B>
              </>}
              {!pr.paid&&pr.status!=="quoted"&&<B v="sec" s={{fontSize:8,color:C.muted}} onClick={()=>setStatus(cl.id,pr.id,ps)}>Undo</B>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CLIENTS ──────────────────────────────────────────────
export function Clients({clients,setClients,onRevise,goTo,settings,onGoToCalc,isMobile,selReset,onSelChange,pendingClientName,onPendingClear,pendingProjectQNo}: any) {
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
        const match=statusFilter==="paid"?c.projects.some((pr: any)=>pr.paid):c.projects.some((pr: any)=>pr.status===statusFilter&&!pr.paid);
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
    const data={brand:q?.brand,contact:q?.contact,date:pr.date||today(),validUntil:q?.validUntil,qNo:q?.qNo,rev:q?.rev||0,contractRev:q?.contractRev||0,clauses:q?.clauses||[],iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:type==="invoice"?"Thank you for the pleasure of working together.":"Looking forward to working together."};
    setPdf({cid,pid:pr.id,data,type,lang});
  };

  const openReviseContract=(pr: any,cid: string)=>{
    const q=pr.qd;
    const iNo=`INV-${(q?.qNo||"").replace("QUO","").trim()||"001"}`;
    const nextRev=(q?.contractRev||0)+1;
    const data={brand:q?.brand,contact:q?.contact,date:today(),validUntil:q?.validUntil,qNo:q?.qNo,rev:q?.rev||0,contractRev:nextRev,clauses:q?.clauses||[],iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Looking forward to working together."};
    setPdf({cid,pid:pr.id,data,type:"contract",lang:"en",isRevision:true,nextContractRev:nextRev});
  };

  if(pdf)return<PDFModal data={pdf.data} type={pdf.type} onClose={()=>{setPdf(null);setRevInvT(null);}} settings={settings}
    onSave={revInvT
      ?(doc: any)=>{const tot=(doc.lines||[]).reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);upP(revInvT.cid,revInvT.pid,{qd:{...revInvT.p.qd,lines:doc.lines},amount:tot});}
      :(pdf.cid&&pdf.pid&&pdf.isRevision)
        ?(doc: any)=>upP(pdf.cid,pdf.pid,{qd:{...doc,contractRev:pdf.nextContractRev,clauses:doc.clauses||[]}})
        :(pdf.cid&&pdf.pid)
          ?(doc: any)=>{const tot=doc.total||(doc.lines||[]).reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);upP(pdf.cid,pdf.pid,{qd:{...doc,clauses:doc.clauses||[]},amount:tot});}
          :undefined}/>;

  // ── Mobile: client detail view ──
  if(cl&&isMobile){
    const f=fin(cl); const edt=editMode?ed:cl;
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:8,flexWrap:"wrap"}}>
          <div style={{minWidth:0}}>
            {editMode?<I value={edt.name} onChange={(e: any)=>setEd((p: any)=>({...p,name:e.target.value}))} s={{fontSize:18,fontFamily:SERIF,marginBottom:4}}/>:<h2 style={{fontFamily:SERIF,fontSize:22,fontWeight:"normal",margin:"0 0 6px"}}>{cl.name}</h2>}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{cl.tags?.map((t: string)=><Tag key={t}>{t}</Tag>)}</div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"flex-start"}}>
            {editMode?<><B onClick={()=>{upCl(cl.id,ed);setEditMode(false);}}>Save</B><B v="sec" onClick={()=>setEditMode(false)}>Cancel</B></>:<><B v="sec" onClick={()=>{setEd({...cl});setEditMode(true);}}>Edit Info</B><button onClick={()=>delCl(cl.id)} style={{fontSize:9.5,color:C.red,border:`1px solid ${C.redBorder}`,padding:"5px 10px",borderRadius:2,cursor:"pointer",background:"none",fontFamily:SANS,letterSpacing:"0.08em",textTransform:"uppercase"}}>Delete</button></>}
            <button onClick={()=>{setSel(null);setEditMode(false);}} style={{background:"none",border:"none",cursor:"pointer",color:C.light,fontSize:18,lineHeight:1,padding:"2px 0 0 4px",marginLeft:2}}>✕</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10,marginBottom:10}}>
          <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px"}}>
            <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 10px"}}>Brand Info</p>
            {editMode?<>
              <Lbl>Contact</Lbl><I value={edt.contact||""} onChange={(e: any)=>setEd((p: any)=>({...p,contact:e.target.value}))}/>
              <Lbl>Email</Lbl><I value={edt.email||""} onChange={(e: any)=>setEd((p: any)=>({...p,email:e.target.value}))} type="email"/>
              <Lbl>Tags</Lbl>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>{(edt.tags||[]).map((t: string)=><Tag key={t} onRemove={()=>setEd((p: any)=>({...p,tags:p.tags.filter((x: string)=>x!==t)}))}>{t}</Tag>)}</div>
              <div style={{display:"flex",gap:5}}><I value={tagI} onChange={(e: any)=>setTagI(e.target.value)} placeholder="Add tag" onKeyDown={(e: any)=>{if(e.key==="Enter"&&tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} /><B v="sec" onClick={()=>{if(tagI.trim()){setEd((p: any)=>({...p,tags:[...(p.tags||[]),tagI.trim()]}));setTagI("");}}} s={{fontSize:9}}>+</B></div>
            </>:<><IR label="Contact" value={cl.contact}/><IR label="Email" value={cl.email}/><IR label="Type" value={cl.agency}/></>}
          </div>
        </div>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:"0 0 9px"}}>Relationship Notes</p>
          {editMode?<textarea value={edt.notes||""} onChange={(e: any)=>setEd((p: any)=>({...p,notes:e.target.value}))} style={{width:"100%",minHeight:50,padding:"7px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:11,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>:<p style={{fontSize:11,color:cl.notes?C.black:C.light,margin:0,lineHeight:1.6}}>{cl.notes||"No notes yet…"}</p>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 0 9px"}}>
          <p style={{fontSize:10,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",margin:0}}>Collaboration History</p>
          <B v="sec" s={{fontSize:8}} onClick={()=>{setShowAddP((s: boolean)=>!s);setNewPN("");}}>+ Add Project</B>
        </div>
        {showAddP&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 11px",marginBottom:9}}>
          <B s={{width:"100%",textAlign:"center",marginBottom:8}} onClick={()=>{onGoToCalc(cl.name);setShowAddP(false);}}>Build Quote in Calculator</B>
          <p style={{fontSize:10,color:C.muted,textAlign:"center",margin:"0 0 8px"}}>— or add manually —</p>
          <div style={{display:"flex",gap:7}}>
            <I placeholder="Project name" value={newPN} onChange={(e: any)=>setNewPN(e.target.value)} onKeyDown={(e: any)=>e.key==="Enter"&&addP(cl.id)}/>
            <B v="sec" onClick={()=>addP(cl.id)}>Add</B>
            <B v="sec" onClick={()=>{setShowAddP(false);setNewPN("");}}>Cancel</B>
          </div>
        </div>}
        {cl.projects.map((pr: any,i: number)=>{
          const end=uEnd(pr); const ps=prv(pr.status);
          const isHighlighted=highlightedProjectQNo&&pr.qd?.qNo===highlightedProjectQNo;
          return(
            <div key={pr.id} style={{border:`1px solid ${isHighlighted?C.light:C.rule}`,borderRadius:2,padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  {editPrName===pr.id
                    ?<input autoFocus value={editPrNameVal} onChange={e=>setEditPrNameVal(e.target.value)} onBlur={()=>{upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}} onKeyDown={e=>{if(e.key==="Enter"){upP(cl.id,pr.id,{name:editPrNameVal||pr.name});setEditPrName(null);}if(e.key==="Escape")setEditPrName(null);}} style={{fontSize:12,fontFamily:SANS,border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 6px",background:C.bg,color:C.black,outline:"none",width:"100%",marginBottom:3}}/>
                    :<p onClick={()=>{setEditPrName(pr.id);setEditPrNameVal(pr.name);setDelConfirm(null);}} style={{fontSize:12,color:C.black,margin:"0 0 3px",cursor:"text"}}>{pr.name} <span style={{fontSize:9,color:C.light}}>✎</span></p>}
                  <p style={{fontSize:10.5,color:C.muted,margin:"0 0 6px"}}>{fmtD(pr.date)}</p>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:9.5,color:scol(pr.paid?"paid":pr.status),border:`1px solid ${scol(pr.paid?"paid":pr.status)}`,padding:"2px 8px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{pr.paid?"Paid":pr.status}</span>
                    {end&&<UBadge end={end}/>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                  <p style={{fontFamily:SERIF,fontSize:14,color:C.black,margin:"0 0 3px"}}>{fmt(pr.amount)}</p>
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
              {pr.notes&&<p style={{fontSize:9,color:C.muted,margin:"0 0 7px",lineHeight:1.6}}>{pr.notes}</p>}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                {!pr.qd&&<B s={{fontSize:8}} onClick={()=>onGoToCalc(cl.name)}>+ Create Quote</B>}
                {pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"quote","en",cl.id)}>{pr.qd.rev>0?`Quote R${pr.qd.rev}`:"Quote"}</B>}
                {["contracted","production","invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"contract","en",cl.id)}>Contract</B>}
                {["invoiced","paid"].includes(pr.status)&&pr.qd&&<B v="sec" s={{fontSize:8}} onClick={()=>openPDF(pr,"invoice","en",cl.id)}>Invoice</B>}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",paddingTop:7,borderTop:`1px solid ${C.rule}`}}>
                {["quoted","revised"].includes(pr.status)&&<><B v="sec" s={{fontSize:8}} onClick={()=>onRevise(pr,cl)}>Revise Quote</B><B s={{fontSize:8}} onClick={()=>{setStatus(cl.id,pr.id,"contracted");openPDF({...pr,status:"contracted"},"contract","en",cl.id);}}>→ Contract</B></>}
                {pr.status==="contracted"&&<><B v="sec" s={{fontSize:8}} onClick={()=>openReviseContract(pr,cl.id)}>Revise Contract</B><B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"production")}>Mark Signed</B></>}
                {pr.status==="production"&&<B s={{fontSize:8}} onClick={()=>{setStatus(cl.id,pr.id,"invoiced");openPDF({...pr,status:"invoiced"},"invoice","en",cl.id);}}>Create Invoice</B>}
                {pr.status==="invoiced"&&!pr.paid&&<B s={{fontSize:8}} onClick={()=>setStatus(cl.id,pr.id,"paid")}>Mark Paid</B>}
                {pr.paid&&<B v="sec" s={{fontSize:8,color:C.amber}} onClick={()=>upP(cl.id,pr.id,{paid:false,status:"invoiced"})}>Undo Paid</B>}
                {!pr.paid&&pr.status!=="quoted"&&<B v="sec" s={{fontSize:8,color:C.muted}} onClick={()=>setStatus(cl.id,pr.id,ps)}>Undo</B>}
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
          <select value={typeFilter!=="all"?typeFilter.toLowerCase():statusFilter} onChange={(e: any)=>{const v=e.target.value;if(v==="direct"||v==="agency"){setTypeFilter(v==="direct"?"Direct":"Agency");setStatusFilter("all");}else{setStatusFilter(v);setTypeFilter("all");}}} style={{fontSize:9,fontFamily:SANS,color:C.muted,background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"4px 8px",cursor:"pointer",outline:"none"}}>
            <option value="all">Filter: All</option>
            <optgroup label="Status">
              <option value="quoted">Quoted</option><option value="revised">Revised</option><option value="contracted">Contracted</option><option value="production">Production</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option>
            </optgroup>
            <optgroup label="Type"><option value="direct">Direct</option><option value="agency">Agency</option></optgroup>
          </select>
          <select value={sortOrder} onChange={(e: any)=>setSortOrder(e.target.value)} style={{fontSize:9,fontFamily:SANS,color:C.muted,background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"4px 8px",cursor:"pointer",outline:"none"}}>
            <option value="recent">Sort: Most Recent</option><option value="status">Sort: Status Priority</option><option value="name_az">Sort: Name A → Z</option><option value="revenue_hi">Sort: Revenue ↓</option><option value="revenue_lo">Sort: Revenue ↑</option>
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
      </div>
      {cl&&!isMobile&&<ClientDetail cl={cl} fin={fin} editMode={editMode} ed={ed} setEd={setEd} upCl={upCl} setEditMode={setEditMode} delCl={delCl} tagI={tagI} setTagI={setTagI} uEnd={uEnd} showAddP={showAddP} setShowAddP={setShowAddP} newPN={newPN} setNewPN={setNewPN} addP={addP} onGoToCalc={onGoToCalc} upP={upP} setClients={setClients} openPDF={openPDF} openReviseContract={openReviseContract} setPdf={setPdf} onRevise={onRevise} setAmendT={setAmendT} setRenewT={setRenewT} setStatus={setStatus} nxt={nxt} prv={prv} editPrName={editPrName} setEditPrName={setEditPrName} editPrNameVal={editPrNameVal} setEditPrNameVal={setEditPrNameVal} delConfirm={delConfirm} setDelConfirm={setDelConfirm} setSel={setSel} highlightedProjectQNo={highlightedProjectQNo} onClearHighlight={()=>setHighlightedProjectQNo(null)}/>}
    </div>
  );
}
