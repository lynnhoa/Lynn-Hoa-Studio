import { useState } from "react";
import { C, SERIF, SANS, fmt, fmtD, dLeft, today, addM } from "./constants";
import { UBadge, scol } from "./atoms";
import { PDFModal } from "./PDFEngine";

// ─── INVOICE HELPERS ──────────────────────────────────────
const MO_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MO_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CTYPE_LABEL: Record<string,string> = {
  influencer:"Collab (Influencer)", ugc:"UGC", editorial:"Editorial"
};

function getTypeOfWork(pr: any): string {
  if(!pr.amount||pr.amount===0) return "Unpaid";
  const ctab=pr.qd?.ctab||"";
  return CTYPE_LABEL[ctab]||"Unpaid";
}

export function buildInvoiceRows(clients: any[]) {
  const rows: any[]=[];
  clients.forEach((c: any)=>{
    (c.projects||[]).forEach((pr: any)=>{
      if(!["invoiced","paid"].includes(pr.status)&&!pr.paid) return;
      const q=pr.qd; if(!q) return;
      const iNo=`INV-${(q.qNo||"").replace(/QUO-?/i,"").trim()||"001"}`;
      const dateStr=pr.date||q.date||"";
      rows.push({cid:c.id,cName:c.name,pr,iNo,dateStr,
        year:dateStr?parseInt(dateStr.slice(0,4)):0,
        month:dateStr?parseInt(dateStr.slice(5,7))-1:0});
    });
  });
  rows.sort((a,b)=>b.dateStr.localeCompare(a.dateStr));
  return rows;
}

export function exportExcel(rows: any[]) {
  const headers=["Month","Invoice No.","Client","Project","Type of Work","Income","Delivery Date","Payment Status"];
  const lines=[headers];
  rows.forEach(r=>{
    const pr=r.pr;
    const mo=r.dateStr?`${MO_SHORT[r.month]} ${String(r.year).slice(2)}`:"";
    lines.push([mo,r.iNo,r.cName,pr.name,getTypeOfWork(pr),
      pr.amount?`€ ${Number(pr.amount).toFixed(2).replace(".",",")}`: "€ 0,00",
      pr.deliveryDate?pr.deliveryDate.split("-").reverse().join("."):"",
      pr.paid?"paid":"invoiced"]);
  });
  const csv=lines.map(row=>row.map((v:string)=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="invoices.csv";a.click();
  URL.revokeObjectURL(url);
}

// ─── DASHBOARD ────────────────────────────────────────────
type Drill = null|"pipeline"|"outstanding"|"revenue_year"|"revenue_month"|"licenses"|"invoices_paid";

export function Dashboard({clients,goTo,isMobile,settings}: any) {
  const [drill,setDrill]=useState<Drill>(null);
  const [pdfData,setPdfData]=useState<any>(null);

  const all=clients.flatMap((c: any)=>c.projects.map((pr: any)=>({...pr,cName:c.name,cId:c.id})));
  const paid=all.filter((pr: any)=>pr.paid&&pr.date);
  const unpaid=all.filter((pr: any)=>pr.status==="invoiced"&&!pr.paid);
  const pipeline=all.filter((pr: any)=>["quoted","revised","contracted","production"].includes(pr.status)&&!pr.paid);
  const openQ=all.filter((pr: any)=>["quoted","revised"].includes(pr.status)&&!pr.paid);
  const awaitingSig=all.filter((pr: any)=>pr.status==="contracted"&&!pr.paid);
  const inProd=all.filter((pr: any)=>pr.status==="production"&&!pr.paid);

  const uEnd=(pr: any)=>{if(pr.usageEndOverride)return pr.usageEndOverride;if(!pr.deliveryDate||!pr.qd?.mo)return null;return addM(pr.deliveryDate,pr.qd.mo);};
  const allLicenses=clients.flatMap((c: any)=>c.projects.flatMap((pr: any)=>{
    const items: any[]=[];
    const ue=uEnd(pr);
    if(ue)items.push({cName:c.name,cId:c.id,prName:pr.name,end:ue,label:"Usage"});
    (pr.renewals||[]).filter((r: any)=>r.type==="excl"&&r.endDate).forEach((r: any)=>{items.push({cName:c.name,cId:c.id,prName:pr.name,end:r.endDate,label:"Excl."});});
    return items;
  })).sort((a: any,b: any)=>(dLeft(a.end)??999999)-(dLeft(b.end)??999999));

  const expiring=allLicenses.filter((r: any)=>{const d=dLeft(r.end);return d!==null&&d>=0&&d<=30;});

  const nowY=new Date().getFullYear();
  const nowM=new Date().getMonth();
  const yearOf=(pr: any)=>new Date(pr.date).getFullYear();
  const monthOf=(pr: any)=>new Date(pr.date).getMonth();
  const thisYearPaid=paid.filter((pr: any)=>yearOf(pr)===nowY);
  const thisYearRev=thisYearPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const thisMonthPaid=paid.filter((pr: any)=>yearOf(pr)===nowY&&monthOf(pr)===nowM);
  const thisMonthRev=thisMonthPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
  const allYears=Array.from(new Set(paid.map((pr: any)=>yearOf(pr)))).sort((a: any,b: any)=>b-a) as number[];
  const monthsToShow=Array.from({length:nowM+1},(_,i)=>i);
  const out=unpaid.reduce((s: number,pr: any)=>s+pr.amount,0);

  // Invoice helpers
  const invoiceRows=buildInvoiceRows(clients);
  const paidRows=invoiceRows.filter(r=>r.pr.paid);
  const unpaidRows=invoiceRows.filter(r=>!r.pr.paid);

  const openInvoicePDF=(r: any)=>{
    const pr=r.pr; const q=pr.qd;
    setPdfData({data:{brand:q?.brand,contact:q?.contact,date:pr.date||today(),qNo:q?.qNo,iNo:r.iNo,delivery:pr.deliveryDate,ctype:q?.ctype||"Content Creator",lines:q?.lines||[],amendments:pr.amendments||[],total:pr.amount,footer:"Thank you for the pleasure of working together."},type:"invoice",lang:"en"});
  };

  if(pdfData) return <PDFModal data={pdfData.data} type={pdfData.type} onClose={()=>setPdfData(null)} settings={settings}/>;

  // ── Shared sub-components ──────────────────────────────
  const Back=()=><button onClick={()=>setDrill(null)} style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16}}>← Dashboard</button>;

  const PrRow=({pr}: {pr: any})=>(
    <div onClick={()=>goTo(1)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.rule}`,cursor:"pointer"}}>
      <div>
        <p style={{fontSize:11,color:C.black,margin:"0 0 2px",fontWeight:"500"}}>{pr.cName}</p>
        <p style={{fontSize:10,color:C.muted,margin:0}}>{pr.name}</p>
      </div>
      <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
        <p style={{fontFamily:SERIF,fontSize:12,color:C.black,margin:"0 0 3px"}}>{fmt(pr.amount)}</p>
        <span style={{fontSize:9,color:scol(pr.status),border:`1px solid ${scol(pr.status)}`,padding:"1px 6px",borderRadius:2,letterSpacing:"0.07em",textTransform:"uppercase"}}>{pr.status}</span>
      </div>
    </div>
  );

  const InvRow=({r}: {r: any})=>(
    <div onClick={()=>openInvoicePDF(r)} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.rule}`,gap:8,cursor:"pointer"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"baseline",gap:7,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.black,fontWeight:"500"}}>{r.iNo}</span>
          <span style={{fontSize:10,color:C.muted}}>{r.cName}</span>
          <span style={{fontSize:10,color:C.light}}>·</span>
          <span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?100:200}}>{r.pr.name}</span>
        </div>
        <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,color:C.light}}>{fmtD(r.pr.date)}</span>
          <span style={{fontSize:9,color:r.pr.paid?C.green:C.amber,border:`1px solid ${r.pr.paid?C.greenBorder:C.amberBorder}`,padding:"1px 6px",borderRadius:2,letterSpacing:"0.06em"}}>{r.pr.paid?"Paid":"Invoiced"}</span>
        </div>
      </div>
      <span style={{fontFamily:SERIF,fontSize:13,color:C.black,flexShrink:0}}>{fmt(r.pr.amount)}</span>
    </div>
  );

  // ── Drill-down views ───────────────────────────────────
  if(drill==="pipeline") return(
    <div>
      <Back/>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Active Projects</h2>
      <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{pipeline.length} project{pipeline.length!==1?"s":""} in progress</p>
      {[
        {label:"Open Quotes",items:openQ,statusColor:C.light},
        {label:"Awaiting Signature",items:awaitingSig,statusColor:C.muted},
        {label:"In Production",items:inProd,statusColor:"#8fa89a"},
        {label:"Invoiced — Unpaid",items:unpaid,statusColor:C.amber},
      ].map(({label,items})=>(
        items.length>0&&<div key={label} style={{marginBottom:18}}>
          <p style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 6px",paddingBottom:5,borderBottom:`1px solid ${C.rule}`}}>{label} · {items.length}</p>
          {items.map((pr: any,i: number)=><PrRow key={i} pr={pr}/>)}
        </div>
      ))}
      {pipeline.length===0&&<p style={{fontSize:11,color:C.muted}}>No active projects.</p>}
    </div>
  );

  if(drill==="outstanding") return(
    <div>
      <Back/>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Outstanding Invoices</h2>
      <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{unpaidRows.length} unpaid · {fmt(out)}</p>
      {unpaidRows.length===0&&<p style={{fontSize:11,color:C.muted}}>All invoices paid.</p>}
      {unpaidRows.map((r,i)=><InvRow key={i} r={r}/>)}
    </div>
  );

  if(drill==="invoices_paid") return(
    <div>
      <Back/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:0}}>Paid Invoices</h2>
        <button onClick={()=>exportExcel(paidRows)} title="Export CSV" style={{fontSize:9,padding:"5px 10px",border:`1px solid ${C.rule}`,borderRadius:2,background:"none",cursor:"pointer",color:C.muted,fontFamily:SANS,letterSpacing:"0.06em"}}>Export CSV</button>
      </div>
      <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{paidRows.length} paid invoice{paidRows.length!==1?"s":""}</p>
      {paidRows.length===0&&<p style={{fontSize:11,color:C.muted}}>No paid invoices yet.</p>}
      {paidRows.map((r,i)=><InvRow key={i} r={r}/>)}
    </div>
  );

  if(drill==="revenue_year") return(
    <div>
      <Back/>
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

  if(drill==="revenue_month") return(
    <div>
      <Back/>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 4px"}}>Revenue by Month</h2>
      <p style={{fontSize:10.5,color:C.muted,margin:"0 0 18px"}}>{nowY} · Jan — {MO_SHORT[nowM]}</p>
      {[...monthsToShow].reverse().map((m: number)=>{
        const mPaid=paid.filter((pr: any)=>yearOf(pr)===nowY&&monthOf(pr)===m);
        const mRev=mPaid.reduce((s: number,pr: any)=>s+pr.amount,0);
        return(
          <div key={m} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"13px 15px",marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:mPaid.length?8:0}}>
              <span style={{fontSize:11,color:m===nowM?C.black:C.muted,fontWeight:m===nowM?"500":"normal"}}>{MO_SHORT[m]} {nowY}{m===nowM?" · This month":""}</span>
              <span style={{fontFamily:SERIF,fontSize:20,color:mRev>0?C.black:C.light}}>{mRev>0?fmt(mRev):"—"}</span>
            </div>
            {mPaid.map((pr: any,i: number)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
                <span style={{fontSize:10.5,color:C.muted}}>{pr.cName} · {pr.name}</span>
                <span style={{fontSize:10.5}}>{fmt(pr.amount)}</span>
              </div>
            ))}
            {mPaid.length===0&&<p style={{fontSize:10.5,color:C.light,margin:0}}>No paid projects</p>}
          </div>
        );
      })}
    </div>
  );

  if(drill==="licenses") return(
    <div>
      <Back/>
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

  // ── Main dashboard ─────────────────────────────────────
  const Card=({label,count,warm,urgent,sub,items,onClick,drillKey}: any)=>(
    <div onClick={onClick||(drillKey?(()=>setDrill(drillKey)):undefined)} style={{border:`1px solid ${urgent?C.redBorder:C.rule}`,borderRadius:2,padding:"13px 15px",cursor:(onClick||drillKey)?"pointer":"default",background:urgent?C.redBg:undefined}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:sub||items?.length?7:0}}>
        <span style={{fontSize:11,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:SERIF,fontSize:16,color:typeof count==="string"?C.black:count>0&&warm?C.amber:count>0&&urgent?C.red:count>0?C.black:C.light}}>{count}</span>
      </div>
      {sub&&<p style={{fontSize:10,color:C.muted,margin:"0 0 6px"}}>{sub}</p>}
      {items?.slice(0,3).map((pr: any,i: number)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:`1px solid ${C.rule}`}}>
          <span style={{fontSize:10,color:C.muted}}>{pr.cName||pr.name}</span>
          <span style={{fontSize:10}}>{pr.amount?fmt(pr.amount):""}</span>
        </div>
      ))}
      {items?.length>3&&<p style={{fontSize:9,color:C.light,margin:"4px 0 0"}}>+{items.length-3} more</p>}
      {items?.length===0&&<p style={{fontSize:10,color:C.light,margin:0}}>—</p>}
    </div>
  );

  return(
    <div>
      <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 20px"}}>Dashboard</h2>

      {/* Section: Action Required */}
      <p style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 9px",paddingBottom:5,borderBottom:`1px solid ${C.rule}`}}>Action Required</p>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:18}}>
        <Card label="Open Quotes" count={openQ.length} warm items={openQ} drillKey="pipeline"
          sub={openQ.length?`${openQ.length} quote${openQ.length!==1?"s":""} awaiting decision`:"Nothing open"}/>
        <Card label="Awaiting Signature" count={awaitingSig.length} items={awaitingSig} drillKey="pipeline"
          sub={awaitingSig.length?`${awaitingSig.length} contract${awaitingSig.length!==1?"s":""} sent to client`:"Nothing pending"}/>
        <Card label="In Production" count={inProd.length} items={inProd} drillKey="pipeline"
          sub={inProd.length?`${inProd.length} active project${inProd.length!==1?"s":""}`:"Nothing in production"}/>
        <Card label="Unpaid Invoices" count={unpaid.length} warm urgent={unpaid.length>0} items={unpaid} drillKey="outstanding"
          sub={unpaid.length?`${fmt(out)} outstanding`:"All invoices paid"}/>
      </div>

      {/* Section: Licenses */}
      <p style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 9px",paddingBottom:5,borderBottom:`1px solid ${C.rule}`}}>License Watch</p>
      <div style={{marginBottom:18}}>
        <Card label="Expiring Licenses" count={expiring.length>0?expiring.length:allLicenses.length}
          warm={expiring.length>0} urgent={expiring.filter((r: any)=>{const d=dLeft(r.end);return d!==null&&d<=14;}).length>0}
          drillKey="licenses"
          sub={expiring.length>0?`${expiring.length} expiring within 30 days`:`${allLicenses.length} active license${allLicenses.length!==1?"s":""}`}
          items={expiring.slice(0,3).map((r: any)=>({cName:r.cName,name:r.prName,amount:null}))}/>
      </div>

      {/* Section: Financials */}
      <p style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 9px",paddingBottom:5,borderBottom:`1px solid ${C.rule}`}}>Financials</p>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9}}>
        <Card label={`${MO_SHORT[nowM]} Revenue`} count={fmt(thisMonthRev)}
          sub={`${thisMonthPaid.length} paid project${thisMonthPaid.length!==1?"s":""}`}
          drillKey="revenue_month"/>
        <Card label={`${nowY} Revenue`} count={fmt(thisYearRev)}
          sub={`${thisYearPaid.length} paid project${thisYearPaid.length!==1?"s":""}`}
          drillKey="revenue_year"/>
        <Card label="Total Revenue" count={fmt(paid.reduce((s: number,pr: any)=>s+pr.amount,0))}
          sub={`${clients.filter((c: any)=>c.projects.some((pr: any)=>pr.paid)).length} paying client${clients.filter((c: any)=>c.projects.some((pr: any)=>pr.paid)).length!==1?"s":""}`}
          drillKey="invoices_paid"/>
        <Card label="Outstanding" count={fmt(out)}
          warm={out>0} sub={`${unpaid.length} unpaid invoice${unpaid.length!==1?"s":""}`}
          drillKey="outstanding"/>
      </div>
    </div>
  );
}
