import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { C, SERIF, SANS, SETTINGS_DEFAULT, fmt, fmtD } from "./constants";
import { Pill, Lbl, B, I } from "./atoms";

// ─── A4 DOCUMENT LAYOUT ───────────────────────────────────
export function A4({d,type,lang,settings,extraSigMargin,clauseGuards,tRowGuards}: any) {
  const s={...SETTINGS_DEFAULT,...(settings||{})};
  const l=lang==="de";
  const baseLines=d.lines||[];
  const deliverablesList=baseLines.length>0?baseLines.map((ln: any)=>`${ln.qty?ln.qty+"× ":""}${ln.name}`).join(", "):null;
  const allPlat=[...new Set((d.lines||[]).flatMap((ln: any)=>ln.platforms||[]))];
  const platformsList=allPlat.length>0?allPlat.join(", "):null;
  const amendLines=(type==="invoice")?(d.amendments||[]).flatMap((a: any)=>a.lines||[]):[];
  const allLines=[...baseLines,...amendLines];
  const total=type==="amendment"
    ?(d.amendTotal||0)
    :allLines.reduce((s: number,ln: any)=>s+(parseFloat(ln.amt)||0),0);
  const cNo=`CON-${(d.qNo||"").replace("QUO","").trim()||"001"}`;
  const iNo=d.iNo||`INV-${(d.qNo||"").replace("QUO","").trim()||"001"}`;
  const countryDisplay=l?(s.country==="Germany"?"Deutschland":s.country):(s.country==="Deutschland"?"Germany":s.country);
  const creatorAddrLine=[s.street,[s.plz,s.city].filter(Boolean).join(" "),countryDisplay].filter(Boolean).join(", ");
  const creatorFullLine=[s.company,s.name,s.street,[s.plz,s.city].filter(Boolean).join(" "),countryDisplay].filter(Boolean).join(" · ")||"Company · Your Name · Address";
  const titles: Record<string,string>={
    quote:l?"Angebot":"Quote",
    revised:`${l?"Angebot":"Quote"} — R${d.rev||1}`,
    contract:l?"Vertrag":"Contract",
    amendment:l?"Nachtrag":"Amendment",
    invoice:l?"Rechnung":"Invoice",
    renewal:l?"Lizenzerneuerung":"License Renewal"
  };
  const isDE=lang==="de";
  const MRow=({lb,v}: any)=><div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:8}}><span style={{color:C.muted}}>{lb}</span><span>{v}</span></div>;
  const catBadgeLabel: Record<string,string>={influencer:"Brand Collaboration",ugc:"UGC Creator",editorial:"Editorial"};
  const TRow=({ln,prevLn,idx}: any)=>{
    const showCat=!!(ln.cat&&catBadgeLabel[ln.cat]&&ln.cat!==(prevLn?.cat));
    const subDetails=[ln.usageLabel,ln.exclLabel,...(ln.addons||[]),...(ln.platforms||[])].filter(Boolean);
    return(
      <div data-trow={idx} style={{paddingTop:tRowGuards?.[idx]||0,borderBottom:`1px solid ${C.rule}`}}>
        {showCat&&<div style={{paddingTop:10,paddingBottom:1}}><span style={{fontSize:5.5,letterSpacing:"0.14em",textTransform:"uppercase",color:C.light}}>{catBadgeLabel[ln.cat]}</span></div>}
        <div style={{padding:"4px 0",display:"grid",gridTemplateColumns:"1fr 28px 52px 46px",alignItems:"baseline"}}>
          <div>
            <span style={{fontSize:8.5}}>{ln.name}</span>
            {ln.note&&<span style={{fontSize:7,color:C.light,display:"block"}}>{ln.note}</span>}
            {subDetails.length>0&&<span style={{fontSize:7,color:C.muted,display:"block"}}>{subDetails.join(" · ")}</span>}
          </div>
          <span style={{fontSize:8,textAlign:"right",color:C.muted}}>{ln.qty||""}</span>
          <span style={{fontSize:8,textAlign:"right",color:C.muted}}>{ln.up?`€ ${Number(ln.up).toLocaleString("de-DE")}`:""}</span>
          <span style={{fontSize:8,textAlign:"right"}}>€ {Number(ln.amt||0).toLocaleString("de-DE")}</span>
        </div>
      </div>
    );
  };
  return(
    <div style={{padding:"120px 62px 90px",fontSize:9.5,lineHeight:1.5,position:"relative",minHeight:841,fontFamily:SANS,color:C.black,background:C.bg}}>
      <div style={{margin:"0 0 22px"}}>
        <h1 style={{fontFamily:SERIF,fontSize:19,fontWeight:"normal",margin:"0 0 28px"}}>{titles[type]||type}</h1>
        {type!=="contract"&&<p style={{fontSize:7.5,color:C.muted,margin:0}}>{creatorFullLine}</p>}
      </div>
      <div style={{display:"flex",justifyContent:type==="contract"?"flex-end":"space-between",marginBottom:13}}>
        {type!=="contract"&&<div>
          <p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 4px"}}>{["contract","amendment"].includes(type)?(l?"Auftraggeber":"Client"):(l?"An":"To")}</p>
          <p style={{fontSize:9,fontWeight:"500",margin:"0 0 1px"}}>{d.brand||"[Brand]"}</p>
          <p style={{fontSize:8,color:C.muted,margin:0}}>{d.contact||""}</p>
        </div>}
        <div style={{width:145}}>
          <p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 4px"}}>Details</p>
          {type==="quote"&&<><MRow lb={l?"Angebotsnr.":"Quote No."} v={d.qNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Gültig bis":"Valid Until"} v={fmtD(d.validUntil,l)}/></>}
          {type==="revised"&&<><MRow lb={l?"Angebotsnr.":"Quote No."} v={d.qNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb="Revision" v={`R${d.rev||1}`}/></>}
          {type==="contract"&&<><MRow lb={l?"Vertragsnr.":"Contract No."} v={cNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Angebotsnr.":"Quote Ref."} v={d.qNo}/></>}
          {type==="amendment"&&<><MRow lb={l?"Nachtragsnr.":"Amendment No."} v={d.aNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Vertragsnr.":"Contract Ref."} v={cNo}/></>}
          {type==="invoice"&&<><MRow lb={l?"Rechnungsnr.":"Invoice No."} v={iNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Lieferdatum":"Delivery Date"} v={fmtD(d.delivery,l)}/></>}
          {type==="renewal"&&<><MRow lb={l?"Rechnungsnr.":"Invoice No."} v={d.rNo}/><MRow lb={l?"Datum":"Date"} v={fmtD(d.date,l)}/><MRow lb={l?"Orig. Rechnung":"Orig. Invoice"} v={iNo}/></>}
        </div>
      </div>
      {type==="contract"&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:12,paddingBottom:10}}>
        <div style={{flex:1,paddingRight:16}}><p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 3px"}}>{l?"Zwischen":"Between"}</p><p style={{fontSize:9,fontWeight:"500",margin:0}}>{s.company||s.name||"Lynn Hoa"}</p><p style={{fontSize:8,color:C.muted,margin:"0 0 1px"}}>{s.name&&s.company?s.name:""}</p><p style={{fontSize:8,color:C.muted,margin:0}}>{creatorAddrLine}</p></div>
        <div style={{flex:1}}><p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 3px"}}>{l?"Und":"And"}</p><p style={{fontSize:9,fontWeight:"500",margin:0}}>{d.brand}</p><p style={{fontSize:8,color:C.muted,margin:0}}>{d.contact}</p></div>
      </div>}
      {type==="renewal"&&d.origContent?.length>0&&<div style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 11px",marginBottom:12,background:"#f5f3f0"}}>
        <p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 5px"}}>{l?"Lizenz für folgende Inhalte":"License applies to the following content"}</p>
        {d.origContent.map((c: any,i: number)=><p key={i} style={{fontSize:8.5,margin:"0 0 2px"}}>{c.qty?`${c.qty}× `:""}{c.name}{c.cat?` [${({influencer:"Influencer",ugc:"UGC",editorial:"Editorial"})[c.cat]||c.cat}]`:""}{c.note?` — ${c.note}`:""}</p>)}
        <p style={{fontSize:7.5,color:C.muted,margin:"5px 0 0"}}>{l?"Projekt":"Project"}: {d.projName} · {l?"Typ":"Type"}: {d.rType}</p>
      </div>}
      {(type!=="contract"||(d.quoteRef||"none")==="table")&&<>
        <div style={{borderTop:`1px solid ${C.rule}`,borderBottom:`1px solid ${C.rule}`,padding:"4px 0",display:"grid",gridTemplateColumns:"1fr 28px 52px 46px",marginBottom:0}}>
          {[l?"Leistung":"Description",l?"Anz.":"Qty",l?"Einzelpreis":"Unit Price",l?"Betrag":"Amount"].map((h,i)=><span key={h} style={{fontSize:6,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,textAlign:i>0?"right":"left"}}>{h}</span>)}
        </div>
        {(type==="invoice"?allLines:baseLines).map((ln: any,i: number,arr: any[])=><TRow key={i} idx={i} ln={ln} prevLn={arr[i-1]}/>)}
        {type==="amendment"
          ?<div data-sig-anchor="true" style={{marginTop:22+(extraSigMargin||0)}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <div style={{width:175}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:8}}><span style={{color:C.muted}}>{l?"Ursprünglicher Betrag":"Original Total"}</span><span>{fmt(d.origTotal||0)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:8}}><span style={{color:C.muted}}>{l?"Nachtragsbetrag":"Amendment Total"}</span><span>{fmt(d.amendTotal||0)}</span></div>
                <div style={{borderTop:`1px solid ${C.rule}`,paddingTop:6,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{l?"Neuer Gesamtbetrag":"New Total"}</span>
                  <span style={{fontFamily:SERIF,fontSize:14}}>€ {Number((d.origTotal||0)+(d.amendTotal||0)).toLocaleString("de-DE")}</span>
                </div>
              </div>
            </div>
            <div style={{paddingTop:14,borderTop:`1px solid ${C.rule}`}}>
              <p style={{fontSize:8,color:C.muted,lineHeight:1.75,margin:"0 0 18px"}}>{l?"Dieser Nachtrag ergänzt den genannten Vertrag. Alle übrigen Bedingungen bleiben unverändert.":"This amendment extends the original contract. All other terms remain unchanged and in full effect."}</p>
            </div>
          </div>
          :<div data-sig-anchor="true" style={{marginTop:22+(extraSigMargin||0)}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <div style={{textAlign:"right"}}><p style={{fontSize:6.5,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 3px"}}>{l?"Gesamt (EUR)":"Total (EUR)"}</p><p style={{fontFamily:SERIF,fontSize:15,margin:0}}>€ {Number(total).toLocaleString("de-DE")}</p></div>
            </div>
            {["quote","revised"].includes(type)&&<div style={{paddingTop:14,borderTop:`1px solid ${C.rule}`}}>
              <p style={{fontSize:8,color:C.muted,lineHeight:1.75,margin:"0 0 6px"}}>{l?"Dieses Angebot ist 14 Tage gültig. Preise basieren auf dem vereinbarten Umfang. Produkt von der Marke gestellt. Nutzungsrechte zeitlich begrenzt. 1 Korrektur je Leistung inklusive.":"This quote is valid for 14 days. Prices based on agreed scope. Product provided by brand. Usage rights time-limited. One revision included per deliverable."}</p>
              <p style={{fontSize:9,fontStyle:"italic",margin:"14px 0 0"}}>{d.footer||"Looking forward to working together."}</p>
            </div>}
            {["invoice","renewal"].includes(type)&&<div style={{paddingTop:14,borderTop:`1px solid ${C.rule}`}}>
              <p style={{fontSize:8,color:C.light,lineHeight:1.75,margin:"0 0 8px"}}>{l
                ?`Zahlbar an ${s.bankName||"[Bank Name]"}${s.iban?`, IBAN: ${s.iban}`:""}${s.bic?`, BIC: ${s.bic}`:""}${s.paypalEmail?` oder per PayPal: ${s.paypalEmail}`:""} . Zahlungsziel: 14 Tage. Verwendungszweck: ${(s.name||s.company||"IHRE FIRMA").toUpperCase()} – ${d.brand||"[Marke]"} – ${type==="renewal"?d.rNo:iNo}. ${s.taxNote||"Gemäß §19 UStG wird keine Umsatzsteuer erhoben."}`
                :`Please transfer to ${s.bankName||"[Bank Name]"}${s.iban?`, IBAN: ${s.iban}`:""}${s.bic?`, BIC: ${s.bic}`:""}${s.paypalEmail?` or via PayPal: ${s.paypalEmail}`:""} . Payment due within 14 days. Reference: ${(s.name||s.company||"YOUR COMPANY").toUpperCase()} – ${d.brand||"[Brand]"} – ${type==="renewal"?d.rNo:iNo}. ${s.taxNote||"No VAT charged pursuant to §19 UStG."}`
              }</p>
              <p style={{fontSize:9,fontStyle:"italic",margin:"14px 0 0"}}>{d.footer||(l?"Vielen Dank für die angenehme Zusammenarbeit.":"Thank you for the pleasure of working together.")}</p>
            </div>}
          </div>}
      </>}
      {type==="contract"&&(d.quoteRef||"none")==="ref"&&<div style={{padding:"10px 0",marginBottom:0}}>
        <p style={{fontSize:8.5,color:C.muted,margin:0,fontStyle:"italic"}}>{l?`Bezugnehmend auf Angebot ${d.qNo||""}${d.date?` vom ${fmtD(d.date,l)}`:""}.`:`As per the agreed quote ${d.qNo||""}${d.date?` dated ${fmtD(d.date,l)}`:""}.`}</p>
      </div>}
      {type==="contract"&&<div style={{marginTop:16,paddingTop:12,borderTop:`1px solid ${C.rule}`}}>
        {(d.clauses&&d.clauses.length>0?d.clauses:[
          {title:l?"§ 1 — Vertragsgegenstand":"§ 1 — Subject Matter",text:l?`${s.company||s.name||"Der/Die Auftragnehmer/in"} verpflichtet sich, folgende Leistungen gegen ein vereinbartes Honorar von ${fmt(total)} zu erbringen: ${deliverablesList||"den vereinbarten Content gemäß obiger Übersicht"}. Umfang, Format und Zeitplan werden vor Produktionsbeginn schriftlich von beiden Parteien bestätigt. Das kreative Konzept bedarf der schriftlichen Freigabe beider Parteien vor Beginn der Produktion.`:`${s.company||s.name||"The creator"} agrees to produce and deliver the following for a total agreed fee of ${fmt(total)}: ${deliverablesList||"the content specified above"}. The deliverable scope, format, and timeline shall be confirmed in writing by both parties prior to production. The creative concept is subject to mutual written approval before work begins.`},
          {title:l?"§ 2 — Lieferung":"§ 2 — Delivery",text:l?"Die Lieferung erfolgt innerhalb des schriftlich vereinbarten Zeitrahmens. Stellt der Auftraggeber erforderliche Materialien, Freigaben, Produkte oder Zugänge nicht innerhalb von 5 Werktagen nach vereinbartem Termin zur Verfügung, verlängert sich die Lieferfrist entsprechend. Auftraggeber-seitige Verzögerungen berechtigen nicht zur Minderung des Honorars.":"Delivery follows the project timeline confirmed at commencement. If the client delays providing required materials, approvals, products, or access by more than 5 business days beyond any agreed handover date, the delivery deadline extends by the same period. Client-caused delays do not reduce the agreed fee."},
          {title:l?"§ 3 — Korrekturen":"§ 3 — Revisions",text:l?"Eine (1) Korrektur je Leistung ist im Honorar enthalten. Korrekturwünsche sind innerhalb von 5 Werktagen nach Ablieferung schriftlich einzureichen; später eingereichte Anfragen können als neue Aufträge gewertet werden. Weitere Korrekturen werden nach dem jeweils gültigen Tagessatz berechnet. Kreativstil und redaktionelle Linie bleiben stets beim Auftragnehmer.":"One revision per deliverable is included in the agreed fee. Revision requests must be submitted in writing within 5 business days of each delivery; requests received after this period may be treated as new work. Additional revisions are charged at the creator's current rate. The creator's editorial voice and creative direction remain at the creator's sole discretion throughout."},
          {title:l?"§ 4 — Nutzungsrechte":"§ 4 — Usage Rights",text:l?`${s.company||s.name||"Der/Die Auftragnehmer/in"} räumt dem Auftraggeber ein zeitlich begrenztes, nicht-exklusives, nicht übertragbares Nutzungsrecht an den vereinbarten Inhalten für ${platformsList||"die vereinbarten Plattformen"}, den vereinbarten Zweck, Zeitraum und Geltungsbereich ein. Urheberrecht und Persönlichkeitsrechte verbleiben ausschließlich bei ${s.company||s.name||"dem/der Auftragnehmer/in"}. Es werden weder dauerhafte noch exklusive Rechte gewährt; Unterlizenzierung ist ohne schriftliche Zustimmung unzulässig. Der Auftragnehmer behält das Recht zur Verwendung der Inhalte im eigenen Portfolio. Mit Ablauf des Nutzungszeitraums fallen alle eingeräumten Rechte vollständig zurück.`:`${s.company||s.name||"The creator"} grants the client a time-limited, non-exclusive, non-transferable licence to use the delivered content for ${platformsList||"the agreed platforms"}, purpose, duration, and territory only. All copyright, moral rights, and ownership vest exclusively in ${s.company||s.name||"the creator"}. No perpetual, exclusive, or sub-licensable rights are granted; sub-licensing requires prior written consent. The creator retains the right to display the content in their portfolio and press materials. Upon expiry of the licence period, all granted rights revert in full to the creator.`},
          {title:l?"§ 5 — Zahlung":"§ 5 — Payment",text:l?`Das Honorar in Höhe von ${fmt(total)} ist innerhalb von 14 Tagen nach Rechnungsdatum fällig. Bei Zahlungsverzug ist ${s.company||s.name||"der/die Auftragnehmer/in"} berechtigt, Verzugszinsen gemäß § 288 BGB ab dem ersten Verzugstag geltend zu machen. ${s.taxNote||"Gemäß § 19 UStG wird keine Umsatzsteuer erhoben."}`:`The total fee of ${fmt(total)} is due within 14 days of the invoice date. In the event of late payment, statutory default interest pursuant to § 288 BGB is charged from the first day of delay. ${s.taxNote||"No VAT is charged pursuant to § 19 UStG."}`},
          {title:l?"§ 6 — Stornierung":"§ 6 — Cancellation",text:l?`Stornierungen bedürfen der Schriftform. Bei Stornierung vor Produktionsbeginn sind 25 % des vereinbarten Honorars fällig. Bei Stornierung nach Produktionsbeginn sind 50 % fällig. Ist die Leistung im Wesentlichen erbracht, ist das vollständige Honorar zu entrichten. Als Produktionsbeginn gilt jede Vorarbeit, Recherche, Konzeptentwicklung, Anreise, Produktion oder Beauftragung Dritter durch ${s.company||s.name||"den/die Auftragnehmer/in"} im Zusammenhang mit diesem Vertrag.`:`Cancellation must be submitted in writing. If the client cancels before production begins, 25% of the agreed fee is due. If the client cancels after production has begun, 50% of the agreed fee is due. If the deliverable is substantially complete, the full fee is payable. Production is deemed to have commenced upon any preparatory work, research, concept development, travel, filming, or third-party commitments made by ${s.company||s.name||"the creator"} in connection with this contract.`}
        ]).map((cl: any,ci: number)=>(
          <div data-clause={ci} key={ci} style={{marginBottom:0,paddingTop:10+(clauseGuards?.[ci]||0),paddingBottom:11}}>
            <p style={{fontFamily:SERIF,fontSize:7.5,fontWeight:"normal",color:"#5a5a5a",letterSpacing:"0.01em",margin:"0 0 5px"}}>{cl.title}</p>
            <p style={{fontSize:8.5,lineHeight:1.85,margin:0,color:"#404040"}}>{cl.text}</p>
          </div>
        ))}
      </div>}
      {["contract","amendment"].includes(type)&&<div data-sig-anchor="true" style={{display:"flex",justifyContent:"space-between",marginTop:44+(extraSigMargin||0)}}>
        {[s.company||s.name||"Lynn Hoa",d.brand||"[Brand]"].map((nm: string)=>(
          <div key={nm} style={{width:"44%"}}>
            <p style={{fontSize:8.5,fontWeight:"500",margin:"0 0 2px"}}>{nm}</p>
            <div style={{borderBottom:`1px solid ${C.rule}`,margin:"30px 0 5px"}}/>
            <p style={{fontSize:7.5,color:C.muted,margin:"0 0 26px"}}>{l?"Unterschrift":"Signature"}</p>
            <div style={{borderBottom:`1px solid ${C.rule}`,margin:"0 0 5px"}}/>
            <p style={{fontSize:7.5,color:C.muted,margin:0}}>{l?"Datum, Ort":"Date and Place"}</p>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ─── PDF MODAL ────────────────────────────────────────────
export function PDFModal({data,type,onClose,onSave,settings,isNew}: any) {
  const init=()=>JSON.parse(JSON.stringify(data));
  const [hs,setHs]=useState({hist:[init()],idx:0});
  const staged=hs.hist[hs.idx];
  const setStaged=(fn: any)=>setHs(prev=>{
    const curr=prev.hist[prev.idx];
    const newD=typeof fn==="function"?fn(curr):fn;
    const next=[...prev.hist.slice(0,prev.idx+1),JSON.parse(JSON.stringify(newD))];
    return{hist:next,idx:next.length-1};
  });
  const [preview,setPreview]=useState<any>(init);
  const [lang,setLang]=useState("en");
  const [panelW,setPanelW]=useState(380);
  const [flash,setFlash]=useState<string|null>(null);
  const [confirmClose,setConfirmClose]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const canUndo=hs.idx>0, canRedo=hs.idx<hs.hist.length-1;
  const docRef=useRef<HTMLDivElement>(null);
  const [docHeight,setDocHeight]=useState(841);
  const PAGE_H=841;
  const numPages=Math.max(1,Math.ceil(docHeight/PAGE_H));
  const s={...SETTINGS_DEFAULT,...(settings||{})};
  const isDE=lang==="de";
  const _dc=s.company||s.name||(isDE?"Der/Die Auftragnehmer/in":"The creator");
  const _dd=(staged.lines||[]).length>0?(staged.lines||[]).map((ln: any)=>`${ln.qty?ln.qty+"× ":""}${ln.name}`).join(", "):null;
  const _total=fmt((staged.lines||[]).reduce((a:number,ln:any)=>a+(parseFloat(ln.amt)||0),0));
  const defClauses=type==="contract"?[
    {title:isDE?"§ 1 — Vertragsgegenstand":"§ 1 — Subject Matter",text:isDE?`${_dc} verpflichtet sich, folgende Leistungen gegen ein vereinbartes Honorar von ${_total} zu erbringen: ${_dd||"den vereinbarten Content gemäß Angebot"}. Umfang, Format und Zeitplan werden vor Produktionsbeginn schriftlich von beiden Parteien bestätigt. Das kreative Konzept bedarf der schriftlichen Freigabe beider Parteien vor Beginn der Produktion.`:`${_dc} agrees to produce and deliver the following for a total agreed fee of ${_total}: ${_dd||"the content as per the agreed quote"}. The deliverable scope, format, and timeline shall be confirmed in writing by both parties prior to production. The creative concept is subject to mutual written approval before work begins.`},
    {title:isDE?"§ 2 — Lieferung":"§ 2 — Delivery",text:isDE?"Die Lieferung erfolgt innerhalb des schriftlich vereinbarten Zeitrahmens. Stellt der Auftraggeber erforderliche Materialien, Freigaben, Produkte oder Zugänge nicht innerhalb von 5 Werktagen nach vereinbartem Termin zur Verfügung, verlängert sich die Lieferfrist entsprechend. Auftraggeber-seitige Verzögerungen berechtigen nicht zur Minderung des Honorars.":"Delivery follows the project timeline confirmed at commencement. If the client delays providing required materials, approvals, products, or access by more than 5 business days beyond any agreed handover date, the delivery deadline extends by the same period. Client-caused delays do not reduce the agreed fee."},
    {title:isDE?"§ 3 — Korrekturen":"§ 3 — Revisions",text:isDE?"Eine (1) Korrektur je Leistung ist im Honorar enthalten. Korrekturwünsche sind innerhalb von 5 Werktagen nach Ablieferung schriftlich einzureichen; später eingereichte Anfragen können als neue Aufträge gewertet werden. Weitere Korrekturen werden nach dem jeweils gültigen Tagessatz berechnet. Kreativstil und redaktionelle Linie bleiben stets beim Auftragnehmer.":"One revision per deliverable is included in the agreed fee. Revision requests must be submitted in writing within 5 business days of each delivery; requests received after this period may be treated as new work. Additional revisions are charged at the creator's current rate. The creator's editorial voice and creative direction remain at the creator's sole discretion throughout."},
    {title:isDE?"§ 4 — Nutzungsrechte":"§ 4 — Usage Rights",text:isDE?`${_dc} räumt dem Auftraggeber ein zeitlich begrenztes, nicht-exklusives, nicht übertragbares Nutzungsrecht an den vereinbarten Inhalten für die festgelegten Plattformen, den vereinbarten Zweck, Zeitraum und Geltungsbereich ein. Urheberrecht und Persönlichkeitsrechte verbleiben ausschließlich bei ${_dc}. Es werden weder dauerhafte noch exklusive Rechte gewährt; Unterlizenzierung ist ohne schriftliche Zustimmung unzulässig. ${_dc} behält das Recht zur Verwendung der Inhalte im eigenen Portfolio. Mit Ablauf des Nutzungszeitraums fallen alle eingeräumten Rechte vollständig zurück.`:`${_dc} grants the client a time-limited, non-exclusive, non-transferable licence to use the delivered content for the agreed platforms, purpose, duration, and territory only. All copyright, moral rights, and ownership vest exclusively in ${_dc}. No perpetual, exclusive, or sub-licensable rights are granted; sub-licensing requires prior written consent. ${_dc} retains the right to display the content in their portfolio and press materials. Upon expiry of the licence period, all granted rights revert in full to ${_dc}.`},
    {title:isDE?"§ 5 — Zahlung":"§ 5 — Payment",text:isDE?`Das Honorar in Höhe von ${_total} ist innerhalb von 14 Tagen nach Rechnungsdatum fällig. Bei Zahlungsverzug ist ${_dc} berechtigt, Verzugszinsen gemäß § 288 BGB ab dem ersten Verzugstag geltend zu machen. ${s.taxNote||"Gemäß § 19 UStG wird keine Umsatzsteuer erhoben."}`:`The total fee of ${_total} is due within 14 days of the invoice date. In the event of late payment, statutory default interest pursuant to § 288 BGB is charged from the first day of delay. ${s.taxNote||"No VAT is charged pursuant to § 19 UStG."}`},
    {title:isDE?"§ 6 — Stornierung":"§ 6 — Cancellation",text:isDE?`Stornierungen bedürfen der Schriftform. Bei Stornierung vor Produktionsbeginn sind 25 % des vereinbarten Honorars fällig. Bei Stornierung nach Produktionsbeginn sind 50 % fällig. Ist die Leistung im Wesentlichen erbracht, ist das vollständige Honorar zu entrichten. Als Produktionsbeginn gilt jede Vorarbeit, Recherche, Konzeptentwicklung, Anreise, Produktion oder Beauftragung Dritter durch ${_dc} im Zusammenhang mit diesem Vertrag.`:`Cancellation must be submitted in writing. If the client cancels before production begins, 25% of the agreed fee is due. If the client cancels after production has begun, 50% of the agreed fee is due. If the deliverable is substantially complete, the full fee is payable. Production is deemed to have commenced upon any preparatory work, research, concept development, travel, filming, or third-party commitments made by ${_dc} in connection with this contract.`}
  ]:[];
  const [winW,setWinW]=useState(()=>window.innerWidth);
  const [showEdit,setShowEdit]=useState(false);
  const [extraSigMargin,setExtraSigMargin]=useState(0);
  const [clauseGuards,setClauseGuards]=useState<number[]>(Array(6).fill(0));
  const [tRowGuards,setTRowGuards]=useState<number[]>([]);
  useEffect(()=>{const fn=()=>setWinW(window.innerWidth);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const isMobile=winW<700;
  const pageScale=isMobile?Math.min(1,(winW-32)/595):1;
  useEffect(()=>{
    setClauseGuards(Array(6).fill(0));
    setTRowGuards([]);
    const el=docRef.current; if(!el)return;
    const calc=()=>{
      setDocHeight(el.scrollHeight);
      const sigEl=el.querySelector("[data-sig-anchor]") as HTMLElement|null;
      if(!sigEl){setExtraSigMargin(0);}
      else{
        const sigTop=sigEl.offsetTop;
        const GUARD=200, HEADER_H=49;
        const pageNum=Math.floor(sigTop/PAGE_H);
        const posInPage=sigTop-pageNum*PAGE_H;
        if(posInPage>(PAGE_H-GUARD)){const needed=(PAGE_H-posInPage)+HEADER_H+6;setExtraSigMargin(prev=>Math.abs(needed-prev)>2?needed:prev);}
        else if(pageNum>0&&posInPage>0&&posInPage<HEADER_H+4){const push=(HEADER_H+6)-posInPage;setExtraSigMargin(prev=>Math.abs(push)>2?prev+push:prev);}
        else if(pageNum===0||posInPage>HEADER_H+80){setExtraSigMargin(prev=>prev>0?0:prev);}
      }
      if(type==="contract"){
        const newGuards:number[]=Array(6).fill(0);
        const clauseEls=Array.from(el.querySelectorAll("[data-clause]")) as HTMLElement[];
        const guardedPages=new Set<number>();
        clauseEls.forEach((clauseEl,idx)=>{
          const bottom=clauseEl.offsetTop+clauseEl.offsetHeight;
          const pageNum=Math.floor(clauseEl.offsetTop/PAGE_H);
          const bottomInPage=bottom-pageNum*PAGE_H;
          if(bottomInPage>PAGE_H-100&&!guardedPages.has(pageNum)){newGuards[idx]=Math.max(0,PAGE_H+72-clauseEl.offsetTop-10);guardedPages.add(pageNum);}
        });
        setClauseGuards(prev=>{const next=newGuards.map((v,i)=>Math.max(v,prev[i]));return next.some((v,i)=>v!==prev[i])?next:prev;});
      }
      if(type!=="contract"){
        const rowEls=Array.from(el.querySelectorAll("[data-trow]")) as HTMLElement[];
        if(rowEls.length>0){
          const newGuards:number[]=Array(rowEls.length).fill(0);
          const guardedPages=new Set<number>();
          rowEls.forEach((rowEl)=>{
            const idx=parseInt(rowEl.getAttribute("data-trow")||"0",10);
            const bottom=rowEl.offsetTop+rowEl.offsetHeight;
            const pageNum=Math.floor(rowEl.offsetTop/PAGE_H);
            const bottomInPage=bottom-pageNum*PAGE_H;
            if(bottomInPage>(PAGE_H-80)&&!guardedPages.has(pageNum)){newGuards[idx]=Math.max(0,PAGE_H+72-rowEl.offsetTop);guardedPages.add(pageNum);}
          });
          setTRowGuards(prev=>{if(newGuards.length!==prev.length)return newGuards;const next=newGuards.map((v,i)=>Math.max(v,prev[i]));return next.some((v,i)=>v!==prev[i])?next:prev;});
        }
      }
    };
    calc();const ro=new ResizeObserver(calc);ro.observe(el);return()=>ro.disconnect();
  },[preview,lang]);

  const commit=(snap: any)=>{setPreview(snap);setFlash("saved");setTimeout(()=>setFlash(null),3000);};
  const undo=()=>{const ni=Math.max(0,hs.idx-1);if(ni===hs.idx)return;setHs(p=>({...p,idx:ni}));commit(JSON.parse(JSON.stringify(hs.hist[ni])));};
  const redo=()=>{const ni=Math.min(hs.hist.length-1,hs.idx+1);if(ni===hs.idx)return;setHs(p=>({...p,idx:ni}));commit(JSON.parse(JSON.stringify(hs.hist[ni])));};
  const handleUpdate=()=>commit(JSON.parse(JSON.stringify(staged)));
  const updStagedLine=(i: number,k: string,v: string)=>setStaged((prev: any)=>{
    const lines=[...(prev.lines||[])];
    lines[i]={...lines[i],[k]:v,
      amt:k==="qty"?(parseFloat(lines[i].up)||0)*(parseInt(v)||1)
         :k==="up"?(parseFloat(v)||0)*(parseInt(lines[i].qty)||1)
         :parseFloat(v)||lines[i].amt};
    return{...prev,lines};
  });
  const startDrag=(e: React.MouseEvent)=>{
    e.preventDefault();
    const startX=e.clientX, startW=panelW;
    const onMove=(ev: MouseEvent)=>setPanelW(Math.max(240,Math.min(700,startW+ev.clientX-startX)));
    const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };
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
      const pdfW=pdf.internal.pageSize.getWidth(), pdfH=pdf.internal.pageSize.getHeight();
      for(let i=0;i<pages.length;i++){
        if(i>0)pdf.addPage();
        const canvas=await (html2canvas as any)(pages[i],{scale:2,useCORS:true,backgroundColor:"#faf9f7"});
        pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,pdfW,pdfH);
      }
      const dateStr=(preview.date||new Date().toISOString().slice(0,10)).replace(/-/g,"_");
      const derivedCNo=`CON-${(preview.qNo||"").replace(/QUO-?/i,"").trim()||"001"}`;
      const derivedINo=preview.iNo||`INV-${(preview.qNo||"").replace(/QUO-?/i,"").trim()||"001"}`;
      const docNo=type==="contract"?derivedCNo:type==="invoice"?derivedINo:type==="renewal"?(preview.rNo||derivedINo):type==="amendment"?(preview.aNo||"AMD"):(preview.qNo||type);
      if(mw){mw.location.href=pdf.output("bloburl") as string;}
      else{pdf.save(`${dateStr} ${docNo}.pdf`);}
    }finally{pages.forEach((p,i)=>{p.style.transform=savedT[i];});setDownloading(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,display:"flex",flexDirection:"column",fontFamily:SANS}}>
      <div style={{height:46,borderBottom:`1px solid ${C.rule}`,display:"flex",alignItems:"center",padding:"0 14px",gap:6,flexShrink:0}}>
        <button onClick={undo} disabled={!canUndo} title="Undo" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:`1px solid ${canUndo?C.rule:"transparent"}`,borderRadius:2,cursor:canUndo?"pointer":"default",color:canUndo?C.black:C.light,fontSize:15}}>←</button>
        <button onClick={redo} disabled={!canRedo} title="Redo" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:`1px solid ${canRedo?C.rule:"transparent"}`,borderRadius:2,cursor:canRedo?"pointer":"default",color:canRedo?C.black:C.light,fontSize:15}}>→</button>
        <div style={{width:1,height:20,background:C.rule,margin:"0 4px"}}/>
        <Pill on={lang==="en"} onClick={()=>setLang("en")}>EN</Pill>
        <Pill on={lang==="de"} onClick={()=>setLang("de")}>DE</Pill>
        <div style={{flex:1}}/>
        {isMobile&&<button onClick={()=>setShowEdit(e=>!e)} style={{padding:"5px 12px",background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:"pointer",fontFamily:SANS,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:C.black,marginRight:4}}>{showEdit?"View PDF":"Edit"}</button>}
        <B onClick={download} s={{opacity:downloading?0.5:1,cursor:downloading?"default":"pointer"}}>{downloading?"Saving…":"Save PDF"}</B>
        <button onClick={()=>{const isDirty=JSON.stringify(staged)!==JSON.stringify(data);(onSave&&(isNew||isDirty))?setConfirmClose(true):onClose();}} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22,marginLeft:4}}>✕</button>
      </div>
      {confirmClose&&createPortal(
        <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(250,249,247,0.88)"}}>
          <div style={{background:C.bg,border:`1px solid ${C.rule}`,borderRadius:2,padding:"24px 28px",boxShadow:"0 4px 24px rgba(0,0,0,0.12)",textAlign:"center",minWidth:220}}>
            <p style={{fontFamily:SERIF,fontSize:15,fontWeight:"normal",color:C.black,margin:"0 0 6px"}}>Save this {type==="revised"?"revised quote":type==="amendment"?"amendment":type==="renewal"?"renewal":type==="invoice"?"invoice":"quote"}?</p>
            <p style={{fontSize:10,color:C.muted,margin:"0 0 18px"}}>Changes will be lost if you don't save.</p>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <B onClick={()=>{onSave(staged);setConfirmClose(false);onClose();}}>Yes</B>
              <B v="sec" onClick={()=>{setConfirmClose(false);onClose();}}>No</B>
            </div>
          </div>
        </div>,document.body
      )}
      <div style={{flex:1,display:"flex",overflow:"hidden",flexDirection:isMobile?"column":"row"}}>
        {(!isMobile||showEdit)&&<div style={{width:isMobile?"100%":panelW,flexShrink:0,display:"flex",flexDirection:"column",borderRight:isMobile?"none":`1px solid ${C.rule}`,borderBottom:isMobile?`1px solid ${C.rule}`:"none",maxHeight:isMobile?"50%":undefined}}>
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
            <Lbl>Brand</Lbl><I value={staged.brand||""} onChange={(e: any)=>setStaged((p: any)=>({...p,brand:e.target.value}))} s={{marginBottom:6}}/>
            <Lbl>Contact</Lbl><I value={staged.contact||""} onChange={(e: any)=>setStaged((p: any)=>({...p,contact:e.target.value}))} s={{marginBottom:6}}/>
            <Lbl>Date</Lbl><I type="date" value={staged.date||""} onChange={(e: any)=>setStaged((p: any)=>({...p,date:e.target.value}))} s={{marginBottom:6}}/>
            {["quote","revised"].includes(type)&&<><Lbl>Valid Until</Lbl><I type="date" value={staged.validUntil||""} onChange={(e: any)=>setStaged((p: any)=>({...p,validUntil:e.target.value}))} s={{marginBottom:6}}/></>}
            {["invoice","renewal"].includes(type)&&<><Lbl>Invoice No.</Lbl><I value={staged.iNo||staged.rNo||""} onChange={(e: any)=>setStaged((p: any)=>({...p,iNo:e.target.value,rNo:e.target.value}))} s={{marginBottom:6}}/><Lbl>Delivery Date</Lbl><I type="date" value={staged.delivery||""} onChange={(e: any)=>setStaged((p: any)=>({...p,delivery:e.target.value}))} s={{marginBottom:6}}/></>}
            {type==="contract"&&<>
              <Lbl>Quote Table</Lbl>
              <div style={{display:"flex",gap:4,marginBottom:6}}>
                {([["table","Full table"],["ref","Quote ref."],["none","No table"]] as [string,string][]).map(([v,label])=>(
                  <Pill key={v} on={(staged.quoteRef||"none")===v} onClick={()=>setStaged((p:any)=>({...p,quoteRef:v}))}>{label}</Pill>
                ))}
              </div>
            </>}
            {(type!=="contract"||(staged.quoteRef||"none")==="table")&&<>
              <Lbl>Line Items</Lbl>
              {(staged.lines||[]).map((ln: any,i: number)=>(
                <div key={i} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:10,marginBottom:7}}>
                  <I value={ln.name||""} onChange={(e: any)=>updStagedLine(i,"name",e.target.value)} s={{marginBottom:5}}/>
                  <I value={ln.note||""} onChange={(e: any)=>updStagedLine(i,"note",e.target.value)} s={{marginBottom:5,color:C.muted,fontSize:10}} placeholder="note (optional)"/>
                  <div style={{display:"grid",gridTemplateColumns:"56px 1fr 76px",gap:5}}>
                    <I type="number" value={ln.qty||""} onChange={(e: any)=>updStagedLine(i,"qty",e.target.value)} placeholder="qty" s={{fontSize:10}}/>
                    <I type="number" value={ln.up||""} onChange={(e: any)=>updStagedLine(i,"up",e.target.value)} placeholder="unit €" s={{fontSize:10}}/>
                    <I type="number" value={ln.amt||""} onChange={(e: any)=>updStagedLine(i,"amt",e.target.value)} placeholder="total €" s={{fontSize:10}}/>
                  </div>
                </div>
              ))}
            </>}
            {type==="contract"&&<div style={{marginTop:6}}>
              <Lbl>Contract Clauses</Lbl>
              {(staged.clauses&&staged.clauses.length>0?staged.clauses:defClauses).map((cl: any,ci: number)=>{
                const clauses=staged.clauses&&staged.clauses.length>0?staged.clauses:defClauses;
                const updClause=(field: string,val: string)=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];arr[ci]={...arr[ci],[field]:val};return{...p,clauses:arr};});
                const moveClause=(dir: number)=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];const ni=ci+dir;if(ni<0||ni>=arr.length)return p;[arr[ci],arr[ni]]=[arr[ni],arr[ci]];return{...p,clauses:arr};});
                const delClause=()=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];arr.splice(ci,1);return{...p,clauses:arr};});
                return(
                  <div key={ci} style={{border:`1px solid ${C.rule}`,borderRadius:2,padding:"9px 10px",marginBottom:7,background:C.white}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:9,color:C.muted,letterSpacing:"0.06em"}}>§{ci+1}</span>
                      <div style={{display:"flex",gap:3}}>
                        <button onClick={()=>moveClause(-1)} disabled={ci===0} style={{background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:ci===0?"default":"pointer",color:ci===0?C.light:C.muted,fontSize:10,padding:"1px 6px",lineHeight:1}}>↑</button>
                        <button onClick={()=>moveClause(1)} disabled={ci===clauses.length-1} style={{background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:ci===clauses.length-1?"default":"pointer",color:ci===clauses.length-1?C.light:C.muted,fontSize:10,padding:"1px 6px",lineHeight:1}}>↓</button>
                        <button onClick={delClause} style={{background:"none",border:`1px solid ${C.rule}`,borderRadius:2,cursor:"pointer",color:C.red,fontSize:10,padding:"1px 6px",lineHeight:1}}>✕</button>
                      </div>
                    </div>
                    <I value={cl.title||""} onChange={(e: any)=>updClause("title",e.target.value)} s={{marginBottom:5,fontFamily:SERIF,fontSize:10}} placeholder="Clause title"/>
                    <textarea value={cl.text||""} onChange={(e: any)=>updClause("text",e.target.value)} style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:10,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box",minHeight:72}} placeholder="Clause text"/>
                  </div>
                );
              })}
              <button onClick={()=>setStaged((p: any)=>{const arr=p.clauses&&p.clauses.length>0?[...p.clauses]:[...defClauses];arr.push({title:`§${arr.length+1} — New Clause`,text:""});return{...p,clauses:arr};})} style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:"0 0 10px",fontFamily:SANS,letterSpacing:"0.04em",textDecoration:"underline",textDecorationColor:C.rule}}>+ Add clause</button>
            </div>}
            <Lbl>Closing Note</Lbl>
            <textarea value={staged.footer||""} onChange={(e: any)=>setStaged((p: any)=>({...p,footer:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.rule}`,background:C.bg,fontFamily:SANS,fontSize:10,color:C.black,borderRadius:2,outline:"none",resize:"vertical",boxSizing:"border-box",minHeight:72}}/>
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${C.rule}`,flexShrink:0}}>
            {flash==="saved"&&<p style={{fontSize:9,color:C.green,margin:"0 0 7px",letterSpacing:"0.06em"}}>Saved ✓</p>}
            <B onClick={handleUpdate} s={{width:"100%",textAlign:"center"}}>Update Preview</B>
          </div>
        </div>}
        {!isMobile&&<div onMouseDown={startDrag} style={{width:6,flexShrink:0,cursor:"col-resize",background:C.rule,opacity:0.5,transition:"opacity 0.15s"}} onMouseEnter={(e: any)=>{e.currentTarget.style.opacity="1";}} onMouseLeave={(e: any)=>{e.currentTarget.style.opacity="0.5";}}/>}
        {(!isMobile||!showEdit)&&<div style={{flex:1,background:"#888",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:isMobile?"16px 0":"32px 28px",gap:isMobile?16:28}}>
          {Array.from({length:numPages},(_,i)=>(
            <div key={i} style={{width:595*pageScale,height:PAGE_H*pageScale,overflow:"hidden",flexShrink:0,boxShadow:"0 4px 24px rgba(0,0,0,0.28)"}}>
              <div data-pdf-page="true" style={{width:595,height:PAGE_H,overflow:"hidden",background:C.bg,position:"relative",transform:pageScale<1?`scale(${pageScale})`:"none",transformOrigin:"top left"}}>
                <div ref={i===0?docRef:undefined} style={{position:"absolute",top:-i*PAGE_H,left:0,width:595}}>
                  <A4 d={preview} type={type} lang={lang} settings={settings} extraSigMargin={extraSigMargin} clauseGuards={clauseGuards} tRowGuards={tRowGuards}/>
                </div>
                <div style={{position:"absolute",bottom:type==="invoice"?64:59,left:0,right:0,height:28,background:C.bg,zIndex:2,pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:0,left:0,right:0,background:C.bg,zIndex:3,borderBottom:`1px solid ${C.rule}`}}>
                  <div style={{padding:"13px 62px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{s.company||s.name||"Lynn Hoa"}</span>
                    <span style={{fontSize:6,letterSpacing:"0.2em",color:C.light,textTransform:"uppercase"}}>{preview.ctype||"Content Creator"}</span>
                  </div>
                </div>
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg,zIndex:3,borderTop:`1px solid ${C.rule}`}}>
                  {type==="invoice"
                    ?<div style={{padding:"12px 62px 18px",display:"flex",alignItems:"flex-start",gap:0}}>
                       <div style={{fontSize:7,color:C.muted,lineHeight:1.5,flex:"1 1 0",minWidth:0,overflow:"hidden"}}>
                         <div style={{fontWeight:500,color:C.black}}>{s.company||s.name||"Your Company"}</div>
                         {s.email&&<div>{s.email}</div>}
                         {s.website&&<div>{s.website}</div>}
                         {s.steuernummer&&<div style={{marginTop:4}}>{isDE?"St.-Nr.":"Tax No."} {s.steuernummer}</div>}
                       </div>
                       <div style={{fontSize:7,color:C.muted,lineHeight:1.5,flex:"1 1 0",minWidth:0,overflow:"hidden"}}>
                         <div style={{fontWeight:500,color:C.black}}>{isDE?"Zahlungsdetails":"Payment Details"}</div>
                         {s.bankName&&<div>{s.bankName}</div>}
                         {s.iban&&<div>IBAN {s.iban}</div>}
                         {s.bic&&<div>BIC {s.bic}</div>}
                       </div>
                       <div style={{fontSize:7,color:C.muted,lineHeight:1.5,flex:"1 1 0",minWidth:0,overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"space-between",alignSelf:"stretch"}}>
                         <div>{s.paypalEmail&&<><div style={{fontWeight:500,color:C.black}}>PayPal</div><div>{s.paypalEmail}</div></>}</div>
                         {numPages>1&&<div style={{fontSize:7,color:C.light,letterSpacing:"0.04em",textAlign:"right"}}>{i+1}</div>}
                       </div>
                     </div>
                    :<div style={{padding:"26px 62px 22px",fontSize:7,color:C.muted,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                       <span>{[s.email,s.website].filter(Boolean).join(" · ")||"your@email.com · yourwebsite.com"}</span>
                       {numPages>1&&<span style={{letterSpacing:"0.04em",color:C.light}}>{i+1}</span>}
                     </div>}
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
