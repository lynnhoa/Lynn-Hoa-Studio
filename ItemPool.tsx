import { useState } from "react";
import { C, SERIF, SANS, uid } from "./constants";
import { I, B, Lbl, Pill } from "./atoms";

const CAT_LABELS: Record<string,string> = {
  influencer: "Brand Collaboration",
  ugc:        "UGC",
  editorial:  "Editorial",
};
const CATS = ["influencer","ugc","editorial"] as const;

// ─── ITEM POOL ────────────────────────────────────────────
// Master database of single deliverable items.
// Edit prices here → calculator picks them up immediately.
// Rate cards reference these IDs and sync prices on load.
export function ItemPool({pool,setPool}: {pool: any[], setPool: (fn: any)=>void}) {
  const [tab,setTab]=useState<"influencer"|"ugc"|"editorial">("influencer");
  const [editId,setEditId]=useState<string|null>(null);
  const [draft,setDraft]=useState<any>(null);

  const items=pool.filter((it: any)=>it.cat===tab);

  const startEdit=(it: any)=>{setEditId(it.id);setDraft({...it});};
  const cancelEdit=()=>{setEditId(null);setDraft(null);};
  const saveEdit=()=>{
    if(!draft)return;
    setPool((prev: any[])=>prev.map((it: any)=>it.id===draft.id?{...it,...draft}:it));
    setEditId(null);setDraft(null);
  };
  const deleteItem=(id: string)=>{
    if(!window.confirm("Remove this item from the pool? This cannot be undone."))return;
    setPool((prev: any[])=>prev.filter((it: any)=>it.id!==id));
  };
  const addItem=()=>{
    const newItem={id:uid(),cat:tab,kind:"single",n:"New item",note:"",p:0};
    setPool((prev: any[])=>[...prev,newItem]);
    setEditId(newItem.id);setDraft({...newItem});
  };

  return(
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{fontFamily:SERIF,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>Item Pool</h2>
        <p style={{fontSize:10,color:C.muted,letterSpacing:"0.06em",textTransform:"uppercase",margin:0}}>Master database · singles only · edit price here = updates everywhere</p>
      </div>

      {/* Category tabs */}
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {CATS.map(k=><Pill key={k} on={tab===k} onClick={()=>{setTab(k);setEditId(null);setDraft(null);}}>{CAT_LABELS[k]}</Pill>)}
      </div>

      {/* Item list */}
      <div style={{border:`1px solid ${C.rule}`,borderRadius:2,marginBottom:12}}>
        {/* Header */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 60px",gap:8,padding:"7px 12px",borderBottom:`1px solid ${C.rule}`,background:"rgba(0,0,0,0.02)"}}>
          {["Name","Note","Price",""].map((h,i)=><span key={i} style={{fontSize:9,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</span>)}
        </div>

        {items.length===0&&(
          <p style={{fontSize:11,color:C.light,padding:"16px 12px",margin:0}}>No items yet. Add one below.</p>
        )}

        {items.map((it: any)=>(
          <div key={it.id} style={{borderBottom:`1px solid ${C.rule}`}}>
            {editId===it.id&&draft?(
              /* Edit row */
              <div style={{padding:"10px 12px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:8,marginBottom:8}}>
                  <div><Lbl>Name</Lbl><I value={draft.n} onChange={(e: any)=>setDraft((p: any)=>({...p,n:e.target.value}))}/></div>
                  <div><Lbl>Note</Lbl><I value={draft.note||""} onChange={(e: any)=>setDraft((p: any)=>({...p,note:e.target.value}))}/></div>
                  <div><Lbl>Price (€)</Lbl><I type="number" value={draft.p!==null&&draft.p!==undefined?String(draft.p):""} onChange={(e: any)=>setDraft((p: any)=>({...p,p:e.target.value====""?null:parseFloat(e.target.value)||0}))}/></div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <B onClick={saveEdit} s={{fontSize:8}}>Save</B>
                  <B v="sec" onClick={cancelEdit} s={{fontSize:8}}>Cancel</B>
                </div>
              </div>
            ):(
              /* Display row */
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 60px",gap:8,padding:"9px 12px",alignItems:"center"}}>
                <span style={{fontSize:11,color:C.black}}>{it.n}</span>
                <span style={{fontSize:10.5,color:C.muted}}>{it.note||"—"}</span>
                <span style={{fontSize:11,fontFamily:SERIF,color:C.black}}>€ {(it.p||0).toLocaleString("de-DE")}</span>
                <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                  <button onClick={()=>startEdit(it)} style={{fontSize:9,color:C.muted,background:"none",border:`1px solid ${C.rule}`,borderRadius:2,padding:"2px 7px",cursor:"pointer",fontFamily:SANS}}>Edit</button>
                  <button onClick={()=>deleteItem(it.id)} style={{fontSize:9,color:C.red,background:"none",border:"none",cursor:"pointer",fontFamily:SANS,padding:"2px 4px"}}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <B v="sec" onClick={addItem} s={{fontSize:9}}>+ Add {CAT_LABELS[tab]} item</B>

      <div style={{marginTop:20,padding:"11px 14px",background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:2}}>
        <p style={{fontSize:10.5,color:C.amber,margin:0}}>
          Changes here update the calculator instantly. Rate cards built from this pool reflect price changes automatically.
        </p>
      </div>
    </div>
  );
}
