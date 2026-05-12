import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { C, SERIF, SANS, fmt, uid, isSingle, USAGE_BY_CAT, EXCL_BY_CAT, AO_SHARED, DISCOUNT_RULES, SETTINGS_DEFAULT } from "./constants";
import { I, S, B, Pill, Lbl } from "./atoms";
import { PDFModal } from "./PDFEngine";

const MAX_CATEGORIES = 10;

const DEFAULT_CATS = [
  {key:"influencer", label:"Brand Collaboration"},
  {key:"ugc",        label:"UGC"},
  {key:"editorial",  label:"Editorial"},
];

// ─── RATE CARD CONTENT (PDF layout) ───────────────────────
export function RCContent({card,lang,cleanSecT,rcSecGuards}: any) {
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
              <div>
                <span style={{fontSize:8.5}}>{it.n}</span>
                {it.note&&<span style={{fontSize:7,color:C.light,display:"block"}}>{it.note}</span>}
              </div>
              <span style={{fontFamily:SERIF,fontSize:8.5,whiteSpace:"nowrap",marginLeft:12}}>
                {it.p!=null?`€ ${it.p.toLocaleString("de-DE")}`:it.m||""}
              </span>
            </div>
          ))}
        </div>
      ))}
      {card.fine&&<p style={{fontSize:7.5,color:C.muted,lineHeight:1.7,marginTop:14}}>{card.fine}</p>}
    </div>
  );
}

// ─── RATE CARD BUILDER ────────────────────────────────────
// Categories: 3 fixed (influencer/ugc/editorial) + up to 7 custom = max 10.
// Each category stores versions (array of rate card objects).
// Builder composes a rate card from: pool singles + custom packages + rules.

export function RateCardBuilder({rc,setRc,pool,settings}: any) {
  const [catKey,setCatKey]=useState("influencer");
  const [showAddCat,setShowAddCat]=useState(false);
  const [newCatLabel,setNewCatLabel]=useState("");

  // Categories = fixed + any custom keys in rc beyond the 3 defaults
  const fixedKeys=["influencer","ugc","editorial"];
  const allKeys=[...fixedKeys,...Object.keys(rc).filter(k=>!fixedKeys.includes(k)&&k!=="hotels")];
  const catLabel=(k: string)=>({influencer:"Brand Collaboration",ugc:"UGC",editorial:"Editorial"}[k]||rc[k]?.label||k);

  const addCategory=()=>{
    if(!newCatLabel.trim())return;
    if(allKeys.length>=MAX_CATEGORIES){alert(`Maximum ${MAX_CATEGORIES} categories reached.`);return;}
    const key=newCatLabel.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    if(rc[key]){alert("Category key already exists.");return;}
    const newCard={
      label:newCatLabel.trim(),
      sub:`${newCatLabel.trim()} · Based in Germany`,
      sections:[],fine:"",
      usage:USAGE_BY_CAT.influencer,
      excl:EXCL_BY_CAT.influencer,
      versions:[],
    };
    setRc((prev: any)=>({...prev,[key]:newCard}));
    setCatKey(key);
    setShowAddCat(false);setNewCatLabel("");
  };

  const card=rc[catKey]||rc.influencer;

  return(
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>Rate Cards</h2>
        <p style={{fontSize:8,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>Fashion · Beauty · Lifestyle</p>
      </div>

      {/* Category tabs */}
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        {allKeys.map(k=><Pill key={k} on={catKey===k} onClick={()=>setCatKey(k)}>{catLabel(k)}</Pill>)}
        {allKeys.length<MAX_CATEGORIES&&(
          showAddCat
            ?<div style={{display:"flex",gap:5,alignItems:"center"}}>
               <I value={newCatLabel} onChange={(e: any)=>setNewCatLabel(e.target.value)} placeholder="Category name" s={{width:160}}
                 onKeyDown={(e: any)=>{if(e.key==="Enter")addCategory();if(e.key==="Escape"){setShowAddCat(false);setNewCatLabel("");}}}/>
               <B onClick={addCategory} s={{fontSize:8}}>Add</B>
               <B v="sec" onClick={()=>{setShowAddCat(false);setNewCatLabel("");}} s={{fontSize:8}}>Cancel</B>
             </div>
            :<button onClick={()=>setShowAddCat(true)} style={{fontSize:9,color:C.muted,background:"none",border:`1px solid ${C.rule}`,borderRadius:2,padding:"5px 10px",cursor:"pointer",fontFamily:SANS,letterSpacing:"0.06em"}}>+ Category</button>
        )}
      </div>

      {/* Rate card editor for selected category */}
      <RateCardEditor
        catKey={catKey}
        card={card}
        setRc={setRc}
        pool={pool}
        settings={settings}
      />
    </div>
  );
}

// ─── RATE CARD EDITOR (per category) ─────────────────────
function RateCardEditor({catKey,card,setRc,pool,settings}: any) {
  const [edit,setEdit]=useState(false);
  const [pdfLang,setPdfLang]=useState("en");
  const [showPreview,setShowPreview]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const [docHeight,setDocHeight]=useState(841);
  const [winW,setWinW]=useState(()=>window.innerWidth);
  const [rcSecGuards,setRcSecGuards]=useState<number[]>([]);
  const measureRef=useRef<HTMLDivElement>(null);
  const PAGE_H=841;
  const numPages=Math.max(1,Math.ceil(docHeight/PAGE_H));
  const pageScale=winW<700?Math.min(1,(winW-32)/595):1;
  const sett={...SETTINGS_DEFAULT,...(settings||{})};

  // Sync pool prices into card single items
  const syncedCard=syncPoolPrices(card,pool);

  useEffect(()=>{const fn=()=>setWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  useEffect(()=>{
    setRcSecGuards([]);
    const el=measureRef.current; if(!el)return;
    const calc=()=>{
      const h=el.offsetHeight; if(h>100)setDocHeight(h);
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
  },[showPreview,catKey,pdfLang]);

  const cleanSecT=(t: string)=>t.replace(/\s*[—–-]\s*\d+%[^"<]*/g,"").replace(/^Volume Discount\s*[&]\s*/i,"").trim();

  const upI=(si: number,id: string,f: string,v: string)=>setRc((prev: any)=>({...prev,[catKey]:{...prev[catKey],sections:prev[catKey].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:sc.items.map((it: any)=>it.id!==id?it:{...it,[f]:f==="p"?(v===""?null:parseFloat(v)||0):v})})}}));
  const remI=(si: number,id: string)=>setRc((prev: any)=>({...prev,[catKey]:{...prev[catKey],sections:prev[catKey].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:sc.items.filter((it: any)=>it.id!==id)})}}));
  const addI=(si: number)=>setRc((prev: any)=>({...prev,[catKey]:{...prev[catKey],sections:prev[catKey].sections.map((sc: any,i: number)=>i!==si?sc:{...sc,items:[...sc.items,{id:uid(),cat:catKey,kind:"single",n:"New item",note:"",p:0}]})}}));

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
      const fname=`rate-card-${(syncedCard.label||catKey).toLowerCase().replace(/\s+/g,"-")}`;
      if(mw){mw.location.href=pdf.output("bloburl") as string;}
      else{pdf.save(`${fname}.pdf`);}
    }finally{pages.forEach((p,i)=>{p.style.transform=savedT[i];});setDownloading(false);}
  };

  const previewPortal=showPreview?createPortal(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:9999,display:"flex",flexDirection:"column",fontFamily:SANS}}>
      <div style={{height:46,borderBottom:`1px solid ${C.rule}`,display:"flex",alignItems:"center",padding:"0 14px",gap:8,flexShrink:0}}>
        <span style={{fontFamily:SERIF,fontSize:15,color:C.black,flex:1,textAlign:"center",paddingLeft:40}}>{syncedCard.label} — Rate Card</span>
        <B onClick={download} s={{minWidth:80,textAlign:"center"}}>{downloading?"Saving…":"Save PDF"}</B>
        <button onClick={()=>setShowPreview(false)} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22}}>✕</button>
      </div>
      <div style={{flex:1,background:"#888",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:winW<700?"16px 0":"32px 28px",gap:winW<700?16:28}}>
        {Array.from({length:numPages},(_,i)=>(
          <div key={i} style={{width:595*pageScale,height:PAGE_H*pageScale,overflow:"hidden",flexShrink:0,boxShadow:"0 4px 24px rgba(0,0,0,0.32)"}}>
            <div data-pdf-page="true" style={{width:595,height:PAGE_H,overflow:"hidden",background:C.bg,position:"relative",transform:pageScale<1?`scale(${pageScale})`:"none",transformOrigin:"top left"}}>
              <div style={{position:"absolute",top:-i*PAGE_H,left:0,width:595}}>
                <RCContent card={syncedCard} lang={pdfLang} cleanSecT={cleanSecT} rcSecGuards={rcSecGuards}/>
              </div>
              <div style={{position:"absolute",bottom:59,left:0,right:0,height:28,background:C.bg,zIndex:2,pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,background:C.bg,zIndex:3,borderBottom:`1px solid ${C.rule}`}}>
                <div style={{padding:"13px 62px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{sett.company||sett.name||"Lynn Hoa"}</span>
                  <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{syncedCard.label||"Content Creator"}</span>
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
      {/* Hidden measure element */}
      <div ref={measureRef} style={{position:"fixed",top:0,left:-9999,width:595,visibility:"hidden",pointerEvents:"none",zIndex:-1}}>
        <RCContent card={syncedCard} lang={pdfLang} cleanSecT={cleanSecT} rcSecGuards={rcSecGuards}/>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",gap:4}}>
          <Pill on={pdfLang==="en"} onClick={()=>setPdfLang("en")}>EN</Pill>
          <Pill on={pdfLang==="de"} onClick={()=>setPdfLang("de")}>DE</Pill>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <B v="sec" onClick={()=>setEdit((e: boolean)=>!e)}>{edit?"Done":"Edit"}</B>
          <B onClick={()=>setShowPreview(true)}>Preview</B>
        </div>
      </div>

      {syncedCard.sections.map((sec: any,si: number)=>(
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
                   <I type="number" value={(it.p??"")} onChange={(e: any)=>upI(si,it.id,"p",e.target.value)} s={{width:60}}/>
                   {it.m!==undefined&&<I value={it.m||""} onChange={(e: any)=>upI(si,it.id,"m",e.target.value)} s={{width:52}}/>}
                   <button onClick={()=>remI(si,it.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13}}>✕</button>
                 </div>
                :<>
                   <div>
                     <p style={{fontSize:12,color:C.black,margin:"0 0 3px"}}>{it.n}</p>
                     {it.note&&<p style={{fontSize:10.5,color:C.muted,margin:0}}>{it.note}</p>}
                   </div>
                   <span style={{fontSize:11,fontFamily:SERIF,color:C.black,whiteSpace:"nowrap",marginLeft:12}}>
                     {it.m&&<span style={{fontSize:9,color:C.muted,marginRight:5}}>{it.m}</span>}
                     {it.p!=null?`€ ${it.p.toLocaleString("de-DE")}`:it.poolSynced?<span style={{color:C.amber}}>pool</span>:""}
                   </span>
                 </>}
            </div>
          ))}
        </div>
      ))}
      <p style={{fontSize:10.5,color:C.muted,lineHeight:1.75,marginTop:10}}>{syncedCard.fine}</p>
    </div>
  );
}

// ─── SYNC POOL PRICES INTO RATE CARD ──────────────────────
// Single items in the rate card whose id exists in the pool
// get their price updated from the pool automatically.
function syncPoolPrices(card: any, pool: any[]): any {
  if(!card||!pool?.length) return card;
  const poolMap=Object.fromEntries((pool||[]).map((it: any)=>[it.id,it]));
  return{
    ...card,
    sections:card.sections.map((sec: any)=>({
      ...sec,
      items:sec.items.map((it: any)=>{
        const poolItem=poolMap[it.id];
        if(poolItem&&isSingle(it)){
          return{...it,p:poolItem.p,n:poolItem.n,note:poolItem.note,poolSynced:true};
        }
        return it;
      })
    }))
  };
}
