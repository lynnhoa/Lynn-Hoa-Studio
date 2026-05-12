import { useState, useEffect, useRef } from "react";
import { C, SANS, SERIF, SETTINGS_DEFAULT, PASS, uid } from "./constants";
import { POOL_DEFAULT } from "./pool";
import { RC0, initClients } from "./rateCards";
import { AppLogo, Auth } from "./atoms";
import { Dashboard } from "./Dashboard";
import { Clients } from "./Clients";
import { Calculator } from "./Calculator";
import { RateCardBuilder } from "./RateCardBuilder";
import { ItemPool } from "./ItemPool";
import { Settings, ChangePassword } from "./Settings";

// ─── PERSISTENCE ──────────────────────────────────────────
function useGetData() {
  const [data,setData]=useState<any>(null);
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{
    try{const stored=localStorage.getItem("lynnhoa_data");setData(stored?JSON.parse(stored):{});}
    catch{setData({});}
    setIsLoading(false);
  },[]);
  return{data,isLoading};
}
function useSaveData() {
  return{mutate:({data}: {data: any})=>{
    try{localStorage.setItem("lynnhoa_data",JSON.stringify(data));}
    catch(e){console.error("Save failed",e);}
  }};
}

// ─── NAV INDICES ──────────────────────────────────────────
// 0=Dashboard  1=Clients  2=Calculator  3=Rate Cards
// Profile icon: 4=Creator Profile  5=Change Password  6=Item Pool

// ─── APP INNER ────────────────────────────────────────────
function AppInner({initialClients,initialRc,initialSettings,initialPool}: any) {
  const [authed,setAuthed]=useState(false);
  const [role,setRole]=useState<"manager"|"creator">("manager");
  const [nav,setNav]=useState(0);
  const [prefill,setPrefill]=useState<any>(null);
  const [clientSelReset,setClientSelReset]=useState(0);
  const [clientSel,setClientSel]=useState<string|null>(null);
  const [pendingClientName,setPendingClientName]=useState<string|null>(null);
  const [pendingProjectQNo,setPendingProjectQNo]=useState<string|null>(null);
  const [rc,setRc]=useState(initialRc);
  const [clients,setClients]=useState(initialClients);
  const [settings,setSettings]=useState({...SETTINGS_DEFAULT,...initialSettings});
  const [pool,setPool]=useState<any[]>(initialPool);
  const [menuOpen,setMenuOpen]=useState(false);
  const [appWinW,setAppWinW]=useState(()=>window.innerWidth);
  useEffect(()=>{const fn=()=>setAppWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const appMobile=appWinW<700;
  const saveData=useSaveData();
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isFirst=useRef(true);

  // Auto-save on any data change (debounced 800ms)
  useEffect(()=>{
    if(isFirst.current){isFirst.current=false;return;}
    if(timerRef.current)clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{
      saveData.mutate({data:{clients,rc,settings,pool}});
    },800);
    return()=>{if(timerRef.current)clearTimeout(timerRef.current);};
  },[rc,clients,settings,pool]);

  if(!authed)return<Auth onAuth={(r)=>{setRole(r);setAuthed(true);}} currentPass={settings.password||PASS}/>;

  // ── Save handler (from Calculator) ────────────────────
  const handleSave=(q: any,brand: string,contact: string,isRev: boolean,revN: number,projName?: string,isAmend?: boolean,amendN?: number,origLines?: any[])=>{
    const ex=clients.find((c: any)=>c.name.toLowerCase()===brand.toLowerCase());
    if(isAmend&&ex){
      const aNo=`Amend ${amendN||1}`;
      const amendTotal=(q.lines||[]).reduce((s: number,l: any)=>s+(parseFloat(l.amt)||0),0);
      setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:c.projects.map((pr: any)=>pr.qd?.qNo===prefill?.qNo?{...pr,amendments:[...(pr.amendments||[]),{id:uid(),aNo,lines:q.lines||[],amendTotal,origTotal:pr.amount,signed:false,doc:q}],amount:pr.amount+amendTotal}:pr)}));
    } else if(isRev&&ex){
      setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:c.projects.map((pr: any)=>pr.qd?.qNo===q.qNo?{...pr,qd:q,status:"revised",amount:q.total}:pr)}));
    } else {
      const existPr=ex?.projects?.find((pr: any)=>pr.qd?.qNo===q.qNo);
      if(existPr&&ex){
        setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:c.projects.map((pr: any)=>pr.id===existPr.id?{...pr,qd:q,amount:q.total}:pr)}));
      } else {
        const name=projName&&projName.trim()?projName.trim():brand||"Untitled Project";
        const pr={id:uid(),name,status:"quoted",amount:q.total,paid:false,date:q.date,deliveryDate:"",notes:"",qd:q,amendments:[],renewals:[]};
        if(ex)setClients((p: any[])=>p.map(c=>c.id!==ex.id?c:{...c,projects:[pr,...c.projects]}));
        else setClients((p: any[])=>[{id:uid(),name:brand||"New Client",contact:contact||"",email:"",agency:"Direct",country:"Germany",tags:[],notes:"",projects:[pr]},...p]);
      }
    }
    setPrefill(null);
  };

  const handleAfterSave=(brand: string,qNo?: string)=>{setPendingClientName(brand);setPendingProjectQNo(qNo||null);setNav(1);};
  const handleGoToCalc=(clientName: string)=>{setPrefill({brand:clientName,contact:""});setNav(2);};
  const handleRevise=(pr: any,_cl: any)=>{
    const q=pr.qd;
    setPrefill({brand:q?.brand,contact:q?.contact,qNo:q?.qNo,isRev:true,revN:(q?.rev||0)+1,ctab:q?.ctab||"influencer",origLines:q?.lines||[]});
    setNav(2);
  };

  const logout=()=>{setAuthed(false);setNav(0);setMenuOpen(false);};
  const NAV=["Dashboard","Clients","Calculator","Rate Cards"];
  const initials=(()=>{const n=(settings.name||settings.company||"Lynn Hoa").trim();const p=n.split(/\s+/);return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase();})();

  // Profile icon dropdown — order: Creator Profile, Change Password, Item Pool, Log Out
  const menuItems: [string,number][]=[["Creator Profile",4],["Change Password",5],["Item Pool",6]];

  const MenuDropdown=({alignLeft}: {alignLeft?: boolean})=>(
    <div style={{position:"absolute",[alignLeft?"left":"right"]:0,top:"calc(100% + 8px)",background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:172,zIndex:200}}>
      <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.rule}`}}>
        <p style={{fontSize:11,color:C.black,margin:"0 0 1px",fontFamily:SERIF}}>{settings.name||settings.company||"Lynn Hoa"}</p>
        <p style={{fontSize:7.5,color:C.light,margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>Manager · Private</p>
      </div>
      {menuItems.map(([label,idx])=>(
        <button key={idx} onClick={()=>{setNav(idx);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:nav===idx?"rgba(0,0,0,0.03)":"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:nav===idx?C.black:C.muted,letterSpacing:"0.04em",boxSizing:"border-box"}}>{label}</button>
      ))}
      <div style={{borderTop:`1px solid ${C.rule}`}}/>
      <button onClick={logout} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:10,color:C.red,letterSpacing:"0.04em",boxSizing:"border-box"}}>Log Out</button>
    </div>
  );

  const AvatarBtn=()=>(
    <button onClick={()=>setMenuOpen(m=>!m)} title="Account" style={{width:30,height:30,borderRadius:"50%",background:C.black,color:C.white,border:"none",cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:200,flexShrink:0}}>{initials}</button>
  );

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:SANS,color:C.black}}>
      {/* ── NAVIGATION ── */}
      <div style={{borderBottom:`1px solid ${C.rule}`,position:"sticky",top:0,background:C.bg,zIndex:100}}>
        {appMobile?(
          <>
            <div style={{textAlign:"center",padding:"10px 20px 7px"}}><AppLogo/></div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px",borderTop:`1px solid ${C.rule}`,position:"relative"}}>
              <div style={{display:"flex"}}>
                {NAV.map((n,i)=>(
                  <button key={i} onClick={()=>{if(i===1)setClientSelReset(p=>p+1);setNav(i);}} style={{padding:"0 9px",height:40,background:"none",border:"none",borderBottom:nav===i?`2px solid ${C.black}`:"2px solid transparent",color:nav===i?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:8.5,letterSpacing:"0.1em",textTransform:"uppercase"}}>{n}</button>
                ))}
              </div>
              <div style={{position:"absolute",right:6,display:"flex",alignItems:"center"}}>
                {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
                <AvatarBtn/>
                {menuOpen&&<MenuDropdown/>}
              </div>
            </div>
          </>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"0 28px",height:56}}>
            <div style={{display:"flex",alignItems:"center",position:"relative"}}>
              {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setMenuOpen(false)}/>}
              <AvatarBtn/>
              {menuOpen&&<MenuDropdown alignLeft/>}
            </div>
            <div style={{textAlign:"center"}}><AppLogo size="web"/></div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              {NAV.map((n,i)=>(
                <button key={i} onClick={()=>{if(i===1)setClientSelReset(p=>p+1);setNav(i);}} style={{padding:"0 14px",height:56,background:"none",border:"none",borderBottom:nav===i?`2px solid ${C.black}`:"2px solid transparent",color:nav===i?C.black:C.muted,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{maxWidth:nav===1&&clientSel&&!appMobile?1200:840,margin:"0 auto",padding:appMobile?"20px 12px":"28px 20px",transition:"max-width 0.25s ease"}}>
        {nav===0&&<Dashboard clients={clients} goTo={setNav} isMobile={appMobile} settings={settings}/>}
        {nav===1&&<Clients clients={clients} setClients={setClients} onRevise={handleRevise} goTo={setNav} settings={settings} onGoToCalc={handleGoToCalc} isMobile={appMobile} selReset={clientSelReset} onSelChange={setClientSel} pendingClientName={pendingClientName} onPendingClear={()=>{setPendingClientName(null);setPendingProjectQNo(null);}} pendingProjectQNo={pendingProjectQNo}/>}
        {nav===2&&<Calculator onSave={handleSave} prefill={prefill} clearPrefill={()=>setPrefill(null)} pool={pool} settings={settings} isMobile={appMobile} onAfterSave={handleAfterSave}/>}
        {nav===3&&<RateCardBuilder rc={rc} setRc={setRc} pool={pool} settings={settings}/>}
        {nav===4&&<Settings settings={settings} setSettings={setSettings} isMobile={appMobile}/>}
        {nav===5&&<ChangePassword settings={settings} setSettings={setSettings}/>}
        {nav===6&&<ItemPool pool={pool} setPool={setPool}/>}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────
export default function App() {
  const {data,isLoading}=useGetData();
  const saveData=useSaveData();
  const seeded=useRef(false);

  useEffect(()=>{
    if(!data||seeded.current)return;
    const hasClients=Array.isArray(data.clients)&&data.clients.length>0;
    const hasRc=data.rc&&Object.keys(data.rc).length>0;
    const hasPool=Array.isArray(data.pool)&&data.pool.length>0;
    // Only seed what's missing — never wipe existing client/rc data
    if(!hasClients||!hasRc||!hasPool){
      seeded.current=true;
      saveData.mutate({data:{
        clients:hasClients?data.clients:initClients,
        rc:hasRc?data.rc:RC0,
        settings:data.settings||SETTINGS_DEFAULT,
        pool:hasPool?data.pool:POOL_DEFAULT,
      }});
    }
  },[data]);

  if(isLoading)return(
    <div style={{minHeight:"100vh",background:"#faf9f7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>
      <p style={{fontSize:9,color:"#999",letterSpacing:"0.14em",textTransform:"uppercase"}}>Loading…</p>
    </div>
  );

  const loadedClients=Array.isArray(data?.clients)&&data.clients.length>0?(data.clients as any[]):initClients;
  const loadedRc=data?.rc&&Object.keys(data.rc as any).length>0?(data.rc as any):RC0;
  const loadedSettings=data?.settings&&Object.keys(data.settings as any).length>0?(data.settings as any):SETTINGS_DEFAULT;
  const loadedPool=Array.isArray(data?.pool)&&data.pool.length>0?(data.pool as any[]):POOL_DEFAULT;

  return<AppInner initialClients={loadedClients} initialRc={loadedRc} initialSettings={loadedSettings} initialPool={loadedPool}/>;
}
