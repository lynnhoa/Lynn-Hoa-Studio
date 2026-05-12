import { useState } from "react";
import { C, SERIF, SANS, fmt, today, uid, isSingle, AO_SHARED, USAGE_BY_CAT, EXCL_BY_CAT, DISCOUNT_RULES } from "./constants";
import { I, S, B, Pill, Lbl, Tag } from "./atoms";
import { PDFModal } from "./PDFEngine";

// ─── CALCULATOR ───────────────────────────────────────────
// Reads single items from pool directly (not from rate card).
// Usage/excl from per-category constants. Add-ons from AO_SHARED.

export function Calculator({onSave,prefill,clearPrefill,pool,settings,isMobile,onAfterSave}: any) {
  const isRev=prefill?.isRev||false;
  const isAmend=prefill?.isAmend||false;
  const revN=prefill?.revN||1;
  const amendN=prefill?.amendN||1;

  const [brand,setBrand]=useState(prefill?.brand||"");
  const [contact,setContact]=useState(prefill?.contact||"");
  const [projName,setProjName]=useState("");
  const [qDate,setQDate]=useState(today());
  const [vDays,setVDays]=useState(14);

  const [bCat,setBCat]=useState<"influencer"|"ugc"|"editorial">("influencer");
  const [bDel,setBDel]=useState("");        // item id, "" = none selected
  const [bQty,setBQty]=useState(1);
  const [bUsage,setBUsage]=useState(0);     // index into usage array, 0 = sentinel
  const [bExcl,setBExcl]=useState(0);       // index into excl array, 0 = sentinel
  const [bNeg,setBNeg]=useState("");
  const [bVol,setBVol]=useState(false);
  const [bAddons,setBAddons]=useState<string[]>([]);
  const [bAoSel,setBaAoSel]=useState("");
  const [bCLabel,setBCLabel]=useState("");
  const [bCAmt,setBCAmt]=useState("");
  const [bPlatforms,setBPlatforms]=useState<string[]>([]);

  const [items,setItems]=useState<any[]>(()=>{
    if(prefill?.isRev&&prefill?.origLines?.length){
      return prefill.origLines.map((ln: any)=>({
        id:uid(),cat:prefill.ctab||"influencer",
        name:ln.name||"",note:ln.note||"",
        qty:ln.qty||1,up:ln.up||0,amt:ln.amt||0,
        usageLabel:undefined,exclLabel:undefined,addons:[],
      }));
    }
    return [];
  });
  const [retOn,setRetOn]=useState(false);
  const [retMo,setRetMo]=useState(6);
  const [pdf,setPdf]=useState<any>(null);

  // Reads from pool, not rate card
  const deliverables=(pool||[]).filter((it: any)=>isSingle(it)&&it.cat===bCat);
  const usageOpts=USAGE_BY_CAT[bCat]||USAGE_BY_CAT.influencer;
  const exclOpts=EXCL_BY_CAT[bCat]||EXCL_BY_CAT.influencer;
  const addonList=AO_SHARED;

  const computePrice=()=>{
    const item=bDel?deliverables.find((it: any)=>it.id===bDel):null;
    const base=bNeg!==""?parseFloat(bNeg)||0:(item?.p||0);
    const lb=base*(bQty||1);
    // Volume discount from reference card rules
    let vp=0;
    if(bVol){
      if(bCat==="editorial") vp=DISCOUNT_RULES.editorialPackage;
      else if(bQty>=10) vp=DISCOUNT_RULES.volUgcInfluencer10;
      else if(bQty>=3)  vp=DISCOUNT_RULES.volUgcInfluencer3;
    }
    const av=lb*(1-vp/100);
    const usagePct=usageOpts[bUsage]?.sentinel?0:(usageOpts[bUsage]?.pct||0);
    const exclPct=exclOpts[bExcl]?.sentinel?0:(exclOpts[bExcl]?.pct||0);
    const am=av*(1+(usagePct+exclPct)/100);
    let at=0;
    bAddons.forEach(aid=>{
      const a=addonList.find((x: any)=>x.id===aid);
      if(!a)return;
      if(a.flat) at+=a.flat;
      else if(a.pct) at+=am*a.pct/100;
    });
    return Math.round(am+at+(parseFloat(bCAmt)||0));
  };

  const canAdd=!!bDel;

  const addItem=()=>{
    if(!canAdd)return;
    const item=deliverables.find((it: any)=>it.id===bDel);
    const price=computePrice();
    const usageSel=usageOpts[bUsage];
    const exclSel=exclOpts[bExcl];
    setItems(prev=>[...prev,{
      id:uid(),cat:bCat,
      name:item?.n||"",note:item?.note||"",
      qty:bQty,up:item?.p||parseFloat(bNeg)||0,amt:price,
      usageLabel:usageSel?.sentinel?undefined:usageSel?.l,
      exclLabel:exclSel?.sentinel?undefined:exclSel?.l,
      addons:bAddons.map(aid=>addonList.find((x: any)=>x.id===aid)?.n).filter(Boolean),
      platforms:bPlatforms,
    }]);
    setBDel("");setBQty(1);setBUsage(0);setBExcl(0);setBNeg("");setBAddons([]);setBVol(false);setBCLabel("");setBCAmt("");setBPlatforms([]);
  };

  const subtotal=items.reduce((s,it)=>s+it.amt,0);
  const grand=Math.round(subtotal*(1-(retOn?DISCOUNT_RULES.retainer:0)/100));
  const vu=new Date(qDate);vu.setDate(vu.getDate()+(parseInt(String(vDays))||14));
  const validUntil=vu.toISOString().split("T")[0];
  const qNo=isAmend
    ?`AMD-${(prefill?.qNo||"").replace(/QUO-?/i,"").trim()||new Date().getFullYear()}-${String(amendN).padStart(2,"0")}`
    :isRev
      ?(prefill?.qNo||`QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`)
      :`QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;

  const openPreview=()=>{
    const cats=[...new Set(items.map(it=>it.cat))];
    const ctype=cats.length>1?"Content Creator":cats[0]==="ugc"?"UGC Creator":cats[0]==="editorial"?"Editorial Content Creator":"Content Creator (Influencer)";
    setPdf({brand,contact,date:qDate,validUntil,qNo,rev:isRev?revN:0,
      lines:items.map(it=>({name:it.name,note:it.note,qty:it.qty,up:it.up,amt:it.amt,cat:it.cat,platforms:it.platforms||[],usageLabel:it.usageLabel,exclLabel:it.exclLabel,addons:it.addons||[]})),
      total:grand,ctype,footer:"Looking forward to working together."});
  };

  const reset=()=>{setItems([]);setBrand("");setContact("");setProjName("");setRetOn(false);if(clearPrefill)clearPrefill();};
  const catLabel: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC",editorial:"Editorial"};

  return(
    <div>
      {pdf&&<PDFModal data={pdf} type={isRev?"revised":isAmend?"amendment":"quote"} onClose={()=>setPdf(null)} settings={settings} isNew={true}
        onSave={(doc: any)=>{onSave({...doc,id:uid(),status:isAmend?"production":"quoted"},doc.brand,doc.contact,isRev,revN,projName,isAmend,amendN,prefill?.origLines||[]);if(onAfterSave)onAfterSave(doc.brand||brand,isAmend?null:doc.qNo);}}/>}

      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>Calculator</h2>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",margin:0}}>
          {isAmend?`Amendment ${amendN} — ${prefill?.qNo||""}`:isRev?`Revising ${prefill?.qNo} — R${revN}`:"Build a Quote"}
        </p>
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
          {(["influencer","ugc","editorial"] as const).map(k=>(
            <Pill key={k} on={bCat===k} onClick={()=>{setBCat(k);setBDel("");setBAddons([]);setBUsage(0);setBExcl(0);}}>{catLabel[k]}</Pill>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:9}}>
          <div><Lbl>Deliverable</Lbl>
            <S value={bDel} onChange={(e: any)=>setBDel(e.target.value)}>
              <option value="">— Select deliverable —</option>
              {deliverables.map((it: any)=>(
                <option key={it.id} value={it.id}>{it.n}{it.p?` — € ${it.p}`:""}</option>
              ))}
            </S>
          </div>
          <div><Lbl>Qty</Lbl><I type="number" min={1} value={bQty} onChange={(e: any)=>setBQty(parseInt(e.target.value)||1)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:9}}>
          <div>
            <Lbl>Usage Rights</Lbl>
            <S value={bUsage} onChange={(e: any)=>setBUsage(parseInt(e.target.value))}>
              {usageOpts.map((u: any,i: number)=>(
                <option key={i} value={i}>{u.l}{!u.sentinel&&u.pct>0?` (+${u.pct}%)`:""}</option>
              ))}
            </S>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:5}}>
              {(["Instagram","TikTok","YouTube","Other"] as const).map(p=>{
                const on=bPlatforms.includes(p);
                return<button key={p} type="button" onClick={()=>setBPlatforms(pr=>on?pr.filter(x=>x!==p):[...pr,p])} style={{padding:"3px 8px",border:`1px solid ${on?C.black:C.rule}`,background:on?C.black:C.bg,color:on?C.white:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:8.5,letterSpacing:"0.05em",borderRadius:2}}>{p}</button>;
              })}
            </div>
          </div>
          <div><Lbl>Exclusivity</Lbl>
            <S value={bExcl} onChange={(e: any)=>setBExcl(parseInt(e.target.value))}>
              {exclOpts.map((e: any,i: number)=>(
                <option key={i} value={i}>{e.l}{!e.sentinel&&e.pct>0?` (+${e.pct}%)`:""}</option>
              ))}
            </S>
          </div>
        </div>
        <div style={{marginBottom:9}}>
          <Lbl>Add-ons</Lbl>
          <S value={bAoSel} onChange={(e: any)=>{const v=e.target.value;if(v&&!bAddons.includes(v))setBAddons(p=>[...p,v]);setBaAoSel("");}} s={{marginBottom:5}}>
            <option value="">— Select add-on —</option>
            {addonList.filter((a: any)=>!bAddons.includes(a.id)).map((a: any)=>(
              <option key={a.id} value={a.id}>{a.n}{a.flat?` +€${a.flat}`:a.pct?` +${a.pct}%`:""}</option>
            ))}
          </S>
          {bAddons.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {bAddons.map(aid=>{const a=addonList.find((x: any)=>x.id===aid);if(!a)return null;return<Tag key={aid} onRemove={()=>setBAddons(p=>p.filter(x=>x!==aid))}>{a.n}</Tag>;})}
          </div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"flex-end",marginBottom:12}}>
          <div><Lbl>Negotiated Rate <span style={{fontWeight:"normal",color:C.light}}>(overrides card)</span></Lbl>
            <I type="number" placeholder="€" value={bNeg} onChange={(e: any)=>setBNeg(e.target.value)}/>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:5,fontSize:9,cursor:"pointer",paddingBottom:8,whiteSpace:"nowrap"}}>
            <input type="checkbox" checked={bVol} onChange={(e: any)=>setBVol(e.target.checked)}/>Vol. disc.
          </label>
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
                    <span style={{fontSize:9,color:C.white,background:C.muted,padding:"2px 8px",borderRadius:2,textTransform:"uppercase",letterSpacing:"0.07em",flexShrink:0}}>{catLabel[it.cat]||it.cat}</span>
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
            <label htmlFor="ret" style={{fontSize:10,cursor:"pointer"}}>Retainer{retOn?` (−${DISCOUNT_RULES.retainer}%)`:""}</label>
            {retOn&&<><I type="number" min={1} value={retMo} onChange={(e: any)=>setRetMo(parseInt(e.target.value)||6)} s={{width:50}}/><span style={{fontSize:9,color:C.muted}}>months</span></>}
          </div>

          <div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"12px 16px",marginBottom:14}}>
            {retOn&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${C.rule}`}}>
              <span style={{fontSize:9,color:C.muted}}>Subtotal</span>
              <span style={{fontSize:10,color:C.muted}}>{fmt(subtotal)}</span>
            </div>}
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
