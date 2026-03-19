import{s as h}from"./supabase-DQconiKD.js";function $(t,s){const r=e=>s.find(n=>n.id===e)?.name??e,i=["Dato","Titel","Kategori","Beløb (DKK)","Betalt af","Status","Beskrivelse"],l={institution:"Institution",medical:"Medicin/Sundhed",clothing:"Tøj",activities:"Aktiviteter",school:"Skole",food:"Mad",transport:"Transport",other:"Andet"},c={pending:"Afventer",approved:"Godkendt",paid:"Betalt",disputed:"Anfægtet"},a=t.map(e=>[e.date,e.title,l[e.category]??e.category,e.amount.toFixed(2).replace(".",","),r(e.paidBy),c[e.status]??e.status,e.description??""]),o=e=>`"${e.replace(/"/g,'""').replace(/\n/g," ")}"`,d=[i,...a].map(e=>e.map(o).join(";")).join(`\r
`),m=new Blob(["\uFEFF"+d],{type:"text/csv;charset=utf-8"}),f=URL.createObjectURL(m),p=document.createElement("a");p.href=f,p.download=`udgifter-${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(p),p.click(),document.body.removeChild(p),URL.revokeObjectURL(f)}function w(t,s){const r=o=>s.find(d=>d.id===o)?.name??o,i=t.reduce((o,d)=>o+d.amount,0),l=t.map(o=>`
    <tr>
      <td>${o.date}</td>
      <td>${o.title}</td>
      <td>${o.amount.toFixed(2).replace(".",",")} kr.</td>
      <td>${r(o.paidBy)}</td>
      <td>${o.status}</td>
    </tr>`).join(""),c=`
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <title>Udgiftoversigt</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; color: #222; margin: 2cm; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.meta { color: #666; font-size: 11px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 2px solid #333; padding: 6px 8px; font-size: 11px; }
    td { border-bottom: 1px solid #ddd; padding: 6px 8px; }
    tfoot td { font-weight: bold; border-top: 2px solid #333; }
    @media print { body { margin: 1cm; } }
  </style>
</head>
<body>
  <h1>Udgiftoversigt</h1>
  <p class="meta">Eksporteret ${new Date().toLocaleDateString("da-DK")} · ${t.length} udgifter</p>
  <table>
    <thead>
      <tr>
        <th>Dato</th>
        <th>Titel</th>
        <th>Beløb</th>
        <th>Betalt af</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${l}</tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total</td>
        <td>${i.toFixed(2).replace(".",",")} kr.</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`,a=window.open("","_blank");a&&(a.document.write(c),a.document.close(),a.focus(),a.print())}function k(t,s,r){const i=n=>r.find(g=>g.id===n)?.name??"Ukendt",l=["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"],c={"7/7":"7/7-ordning","10/4":"10/4-ordning","14/0":"14/0-ordning",custom:"Brugerdefineret",alternating:"Skiftende uger","weekday-weekend":"Hverdag/weekend",supervised:"Overvåget samvær",supervised_limited:"Begrænset overvåget samvær"},a=i(s.parent1Id),o=i(s.parent2Id),d=l.map((n,g)=>{const u=t.parent1Days.includes(g),v=t.parent2Days.includes(g),x=u?a:v?o:"—",b=t.swapDay===g;return`<tr${b?' style="background:#fff8f0"':""}>
        <td>${n}${b?" ↔":""}</td>
        <td>${x}</td>
      </tr>`}).join(""),m=(t.holidays??[]).map(n=>`<tr>
        <td>${n.name}</td>
        <td>${n.startDate} — ${n.endDate}</td>
        <td>${i(n.parentId)}</td>
        <td>${n.alternateYears?"Ja":"Nej"}</td>
      </tr>`).join(""),f=t.supervisedConfig?`<h2>Overvåget samvær</h2>
       <table>
         <tr><td><strong>Frekvens</strong></td><td>Hver ${t.supervisedConfig.frequencyWeeks}. uge</td></tr>
         <tr><td><strong>Varighed</strong></td><td>${t.supervisedConfig.durationHours} timer</td></tr>
         <tr><td><strong>Sted</strong></td><td>${t.supervisedConfig.location}</td></tr>
         ${t.supervisedConfig.supervisorRequired?`<tr><td><strong>Tilsynsførende</strong></td><td>${t.supervisedConfig.supervisorName??"Påkrævet"}</td></tr>`:""}
         ${t.supervisedConfig.startTime?`<tr><td><strong>Tidspunkt</strong></td><td>${t.supervisedConfig.startTime}</td></tr>`:""}
       </table>`:"",p=`
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <title>Samværsplan — ${s.name}</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; color: #222; margin: 2cm; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    p.meta { color: #666; font-size: 11px; margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .info-item { font-size: 12px; }
    .info-label { font-weight: bold; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; border-bottom: 2px solid #333; padding: 6px 8px; font-size: 11px; }
    td { border-bottom: 1px solid #ddd; padding: 6px 8px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #999; }
    @media print { body { margin: 1cm; } }
  </style>
</head>
<body>
  <h1>Samværsplan</h1>
  <p class="meta">Eksporteret ${new Date().toLocaleDateString("da-DK")}</p>

  <div class="info-grid">
    <div class="info-item"><span class="info-label">Barn:</span> ${s.name}</div>
    <div class="info-item"><span class="info-label">Fødselsdato:</span> ${s.birthDate}</div>
    <div class="info-item"><span class="info-label">Forælder 1:</span> ${a}</div>
    <div class="info-item"><span class="info-label">Forælder 2:</span> ${o}</div>
    <div class="info-item"><span class="info-label">Samværsmodel:</span> ${c[t.pattern]??t.pattern}</div>
    <div class="info-item"><span class="info-label">Startdato:</span> ${t.startDate}</div>
    ${t.swapTime?`<div class="info-item"><span class="info-label">Skiftetidspunkt:</span> ${t.swapTime}</div>`:""}
    ${t.swapDay!==void 0?`<div class="info-item"><span class="info-label">Skiftedag:</span> ${l[t.swapDay]}</div>`:""}
  </div>

  <h2>Ugentlig fordeling</h2>
  <table>
    <thead>
      <tr><th>Dag</th><th>Hos</th></tr>
    </thead>
    <tbody>${d}</tbody>
  </table>

  ${m?`
  <h2>Ferieaftaler</h2>
  <table>
    <thead>
      <tr><th>Ferie</th><th>Periode</th><th>Hos</th><th>Skifter årligt</th></tr>
    </thead>
    <tbody>${m}</tbody>
  </table>
  `:""}

  ${f}

  ${t.agreementDate?`
  <h2>Aftale</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Aftaledato:</span> ${t.agreementDate}</div>
    ${t.agreementValidUntil?`<div class="info-item"><span class="info-label">Gyldig til:</span> ${t.agreementValidUntil}</div>`:""}
  </div>
  ${t.agreementText?`<p>${t.agreementText}</p>`:""}
  `:""}

  <div class="footer">
    Genereret fra Huska · ${new Date().toLocaleDateString("da-DK")}
  </div>
</body>
</html>`,e=window.open("","_blank");e&&(e.document.write(p),e.document.close(),e.focus(),e.print())}async function D(){const{data:{user:t}}=await h.auth.getUser();if(!t)throw new Error("Ikke logget ind");const s=["profiles","children","calendar_events","tasks","expenses","documents","meal_plans","messages","message_threads","decision_logs","key_dates","diary_entries","milestones","household_members"],r={};await Promise.all(s.map(async d=>{const{data:m}=await h.from(d).select("*");r[d]=m||[]}));const i={exported_at:new Date().toISOString(),user_id:t.id,email:t.email,data:r},l=JSON.stringify(i,null,2),c=new Blob([l],{type:"application/json;charset=utf-8"}),a=URL.createObjectURL(c),o=document.createElement("a");o.href=a,o.download=`mine-data-${new Date().toISOString().slice(0,10)}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(a)}export{D as exportAllData,k as exportCustodyPlanPDF,$ as exportExpensesCSV,w as printExpenses};
