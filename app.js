"use strict";

/* ---------------- storage (safe) ---------------- */
var memStore = {};
var store = {
  get: function(k){ try{ return localStorage.getItem(k); }catch(e){ return memStore[k] || null; } },
  set: function(k,v){ try{ localStorage.setItem(k,v); }catch(e){ memStore[k]=v; } }
};

/* ---------------- helpers ---------------- */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function or(v,f){ v=(v==null?"":String(v)).trim(); return v===""?f:v; }
function nl(s){ return esc(s).replace(/\n/g,"<br>"); }
function kr(n){ n=Number(n)||0; return n.toLocaleString("sv-SE").replace(/\u00a0/g," ") + " kr"; }
function num(n){ n=Number(n)||0; return n.toLocaleString("sv-SE").replace(/\u00a0/g," "); }
var ORD = ["noll","en","två","tre","fyra","fem","sex","sju","åtta","nio","tio","elva","tolv"];
function ordman(n){ n=Number(n)||0; return (ORD[n]?ORD[n]:String(n)) + " (" + n + ")"; }
function svDatum(d){ return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ""; }

var LOGO = '<svg viewBox="0 0 320 84" xmlns="http://www.w3.org/2000/svg">'
 + '<circle cx="42" cy="42" r="27" fill="none" stroke="#19C0A6" stroke-width="7" stroke-linecap="round" stroke-dasharray="124 46" transform="rotate(118 42 42)"/>'
 + '<path d="M31 17 L31 65 L42.5 54 L50.5 71 L58.5 67 L50.5 50.5 L65 49 Z" fill="#19C0A6"/>'
 + '<text x="86" y="61" font-family="Helvetica, Arial, sans-serif" font-size="56" fill="#C6CACC" letter-spacing="-1">Click</text>'
 + '<text x="211" y="61" font-family="Helvetica, Arial, sans-serif" font-size="56" fill="#19C0A6" letter-spacing="-1">neT</text>'
 + '</svg>';

/* ---------------- defaults ---------------- */
var DEFAULTS = {
  agNamn:"ABL Invest AB", agOrg:"559552-1435", agAdress:"Viskarhultsvägen 9",
  agPostort:"515 35 Viskafors", agVarumarke:"ClickneT", agEpost:"info@clicknet.se",
  agTecknareVal:"Emina Ajeti|Firmatecknare", agTecknareNamn:"", agTecknareTitel:"", agChef:"",
  atNamn:"", atPnr:"", atAdress:"", atPostort:"", atTel:"", atEpost:"", atAnstNr:"",
  anForm:"prov", anProvMan:"6", anTilltrade:"", anOmfattning:"100 %",
  anBefattning:"Företagssäljare B2B", anBefAnnan:"",
  anTidFran:"08:00", anTidTill:"17:00", anUppsagning:"",
  anArbetsplats:"Stigs Center, Göteborg",
  anFormaner:"Tjänstedator och hörlurar tillhandahålls av Arbetsgivaren.",
  anOvrigt:"",
  grundlonPa:true, grundlonBelopp:25000, grundlonMan:2,
  vKundMan:12, vKundVite:20000, vRekMan:12, vRekVite:10000, vSekVite:30000, vKonkVite:50000,
  tvist:"domstol", signOrt:"Göteborg", signDatum:"", refNr:"",
  paket:[
    {namn:"Paket 995 kr", bind:"12", typ:"fast", varde:1500},
    {namn:"Paket 1 495 kr", bind:"24", typ:"fast", varde:2500},
    {namn:"Paket 1 995 kr", bind:"36", typ:"fast", varde:3500}
  ]
};

var FIELDS = ["agNamn","agOrg","agAdress","agPostort","agVarumarke","agEpost","agTecknareVal","agTecknareNamn",
"agTecknareTitel","agChef","atNamn","atPnr","atAdress","atPostort","atTel","atEpost","atAnstNr","anForm",
"anProvMan","anTilltrade","anOmfattning","anBefattning","anBefAnnan","anTidFran","anTidTill","anUppsagning",
"anArbetsplats","anFormaner","anOvrigt","grundlonBelopp","grundlonMan","vKundMan","vKundVite","vRekMan",
"vRekVite","vSekVite","vKonkVite","tvist","signOrt","signDatum","refNr"];

var paket = JSON.parse(JSON.stringify(DEFAULTS.paket));

/* ---------------- form <-> state ---------------- */
function setForm(d){
  FIELDS.forEach(function(k){ if($(k)) $(k).value = (d[k]==null?"":d[k]); });
  $("grundlonPa").checked = d.grundlonPa !== false;
  paket = (d.paket && d.paket.length) ? JSON.parse(JSON.stringify(d.paket)) : JSON.parse(JSON.stringify(DEFAULTS.paket));
  renderPkg(); syncConditional(); render();
}
function getForm(){
  var d = {};
  FIELDS.forEach(function(k){ if($(k)) d[k] = $(k).value; });
  d.grundlonPa = $("grundlonPa").checked;
  d.paket = JSON.parse(JSON.stringify(paket));
  return d;
}

function syncConditional(){
  $("provManWrap").style.display = $("anForm").value === "prov" ? "" : "none";
  $("befAnnanWrap").style.display = $("anBefattning").value === "__annan__" ? "" : "none";
  $("tecknareAnnanWrap").style.display = $("agTecknareVal").value === "__annan__" ? "grid" : "none";
  $("grundlonWrap").style.opacity = $("grundlonPa").checked ? "1" : ".4";
  if(!or($("anUppsagning").value,"")){
    $("anUppsagning").value = $("anForm").value === "prov" ? "14 dagar" : "1 månad";
  }
}

/* ---------------- provision rows ---------------- */
function renderPkg(){
  var h = "";
  paket.forEach(function(p,i){
    h += '<div class="pkg"><div class="row">'
      + '<div class="field"><label>Paket / tjänst</label><input type="text" data-p="namn" data-i="'+i+'" value="'+esc(p.namn)+'"></div>'
      + '<div class="field"><label>Bindningstid</label><select data-p="bind" data-i="'+i+'">'
        + '<option value="12"'+(p.bind==="12"?" selected":"")+'>12 mån</option>'
        + '<option value="24"'+(p.bind==="24"?" selected":"")+'>24 mån</option>'
        + '<option value="36"'+(p.bind==="36"?" selected":"")+'>36 mån</option>'
      + '</select></div>'
      + '<div class="field"><label>Typ</label><select data-p="typ" data-i="'+i+'">'
        + '<option value="fast"'+(p.typ==="fast"?" selected":"")+'>Fast belopp</option>'
        + '<option value="procent"'+(p.typ==="procent"?" selected":"")+'>Procent</option>'
      + '</select></div>'
      + '<div class="field"><label>'+(p.typ==="procent"?"Procent (%)":"Provision (kr)")+'</label>'
        + '<input type="number" step="'+(p.typ==="procent"?"0.5":"100")+'" data-p="varde" data-i="'+i+'" value="'+esc(p.varde)+'"></div>'
      + '<button class="iconbtn" data-del="'+i+'" title="Ta bort" type="button">×</button>'
      + '</div></div>';
  });
  $("pkgList").innerHTML = h;
}
$("pkgList").addEventListener("input", function(e){
  var t = e.target, i = t.getAttribute("data-i"), p = t.getAttribute("data-p");
  if(i===null || !p) return;
  paket[+i][p] = (p==="varde") ? (t.value==="" ? "" : Number(t.value)) : t.value;
  if(p==="typ") renderPkg();
  render();
});
$("pkgList").addEventListener("change", function(e){
  var t=e.target; if(t.getAttribute("data-p")==="typ"){ renderPkg(); render(); }
});
$("pkgList").addEventListener("click", function(e){
  var d = e.target.getAttribute("data-del");
  if(d!==null){ paket.splice(+d,1); renderPkg(); render(); }
});
$("btnAddPkg").addEventListener("click", function(){
  paket.push({namn:"", bind:"12", typ:"fast", varde:1500}); renderPkg(); render();
});

/* ---------------- contract rendering ---------------- */
function pageWrap(inner, showLogo, meta){
  return '<div class="page"><div class="rail"></div>'
    + (showLogo ? '<div class="logo-block">'+LOGO+'<div class="meta">'+meta+'</div></div>' : "")
    + inner
    + '<div class="foot"><span></span><span></span></div></div>';
}

function render(){
  var d = getForm();
  var prov = d.anForm === "prov";
  var bef = d.anBefattning === "__annan__" ? or(d.anBefAnnan,"—") : d.anBefattning;
  var tecknareNamn, tecknareTitel;
  if(d.agTecknareVal === "__annan__"){
    tecknareNamn = or(d.agTecknareNamn,"—"); tecknareTitel = or(d.agTecknareTitel,"Firmatecknare");
  } else {
    var parts = String(d.agTecknareVal).split("|");
    tecknareNamn = parts[0] || "—"; tecknareTitel = parts[1] || "Firmatecknare";
  }
  var ag = or(d.agNamn,"—"), agOrg = or(d.agOrg,"—"), vm = or(d.agVarumarke,"ClickneT");
  var at = or(d.atNamn,"—"), pnr = or(d.atPnr,"—");
  var uppsag = or(d.anUppsagning, prov ? "14 dagar" : "1 månad");
  var ref = or(d.refNr, "—");
  var metaTop = 'Avtalsreferens ' + esc(ref) + '<br>' + esc(or(ag,"")) + ' &middot; ' + esc(agOrg);

  var kundMan = Number(d.vKundMan)||12, rekMan = Number(d.vRekMan)||12;
  var kundVite = Number(d.vKundVite)||0, rekVite = Number(d.vRekVite)||0;
  var sekVite = Number(d.vSekVite)||0, konkVite = Number(d.vKonkVite)||0;

  var pages = [];

  /* ---------- PAGE 1: datablad ---------- */
  var p1 = '<h1 class="doc"><span class="sub">Anställningsavtal</span>'
    + esc(ag) + '</h1>'
    + '<p class="lede">Detta anställningsavtal reglerar anställningsförhållandet mellan nedanstående parter i enlighet med svensk arbetsrätt. Avtalet omfattar samtliga villkor som framgår av detta dokument jämte de allmänna villkoren i avsnitt 1–' + (or(d.anOvrigt,"") ? 24 : 23) + '.</p>'

    + '<table class="data"><caption>Arbetsgivare</caption><tbody>'
    + '<tr><td colspan="2" style="width:62%"><span class="lbl">Firmanamn</span><span class="val">'+esc(ag)+'</span></td>'
    +     '<td><span class="lbl">Organisationsnummer</span><span class="val">'+esc(agOrg)+'</span></td></tr>'
    + '<tr><td><span class="lbl">Adress</span><span class="val">'+esc(or(d.agAdress,""))+'</span></td>'
    +     '<td><span class="lbl">Postnummer och ort</span><span class="val">'+esc(or(d.agPostort,""))+'</span></td>'
    +     '<td><span class="lbl">Varumärke</span><span class="val">'+esc(vm)+'</span></td></tr>'
    + '<tr><td><span class="lbl">Behörig firmatecknare</span><span class="val">'+esc(tecknareNamn)+'</span></td>'
    +     '<td><span class="lbl">Närmaste chef</span><span class="val">'+esc(or(d.agChef,""))+'</span></td>'
    +     '<td><span class="lbl">E-post</span><span class="val">'+esc(or(d.agEpost,""))+'</span></td></tr>'
    + '</tbody></table>'

    + '<table class="data"><caption>Arbetstagare</caption><tbody>'
    + '<tr><td colspan="2" style="width:62%"><span class="lbl">Fullständigt namn</span><span class="val">'+esc(at)+'</span></td>'
    +     '<td><span class="lbl">Personnummer</span><span class="val">'+esc(pnr)+'</span></td></tr>'
    + '<tr><td><span class="lbl">Adress</span><span class="val">'+esc(or(d.atAdress,""))+'</span></td>'
    +     '<td><span class="lbl">Postnummer och ort</span><span class="val">'+esc(or(d.atPostort,""))+'</span></td>'
    +     '<td><span class="lbl">Telefon</span><span class="val">'+esc(or(d.atTel,""))+'</span></td></tr>'
    + '<tr><td><span class="lbl">E-post</span><span class="val">'+esc(or(d.atEpost,""))+'</span></td>'
    +     '<td><span class="lbl">Anställningsnummer</span><span class="val">'+esc(or(d.atAnstNr,""))+'</span></td>'
    +     '<td><span class="lbl">Tillträdesdag</span><span class="val">'+esc(or(svDatum(d.anTilltrade),""))+'</span></td></tr>'
    + '</tbody></table>'

    + '<table class="data"><caption>Anställningen</caption><tbody>'
    + '<tr><td colspan="2" style="width:62%"><span class="lbl">Anställningsform</span><span class="val">'
        + (prov ? 'Provanställning om '+ordman(d.anProvMan)+' månader enligt 6 § lagen (1982:80) om anställningsskydd, som därefter övergår i en tillsvidareanställning'
                : 'Tillsvidareanställning')
      + '</span></td>'
    +     '<td><span class="lbl">Befattning</span><span class="val">'+esc(bef)+'</span></td></tr>'
    + '<tr><td><span class="lbl">Arbetsplats</span><span class="val">'+esc(or(d.anArbetsplats,""))+'</span></td>'
    +     '<td><span class="lbl">Omfattning</span><span class="val">'+esc(or(d.anOmfattning,"100 %"))+'</span></td>'
    +     '<td><span class="lbl">Ordinarie arbetstid</span><span class="val">'+esc(or(d.anTidFran,"08:00"))+'–'+esc(or(d.anTidTill,"17:00"))+'</span></td></tr>'
    + '<tr><td><span class="lbl">Ersättning</span><span class="val">Provision</span></td>'
    +     '<td><span class="lbl">Utbetalningsdag</span><span class="val">Den 25:e</span></td>'
    +     '<td><span class="lbl">Uppsägningstid</span><span class="val">'+esc(uppsag)+'</span></td></tr>'
    + '<tr><td colspan="3"><span class="lbl">Förmåner</span><span class="val">'+nl(or(d.anFormaner,"—"))+'</span></td></tr>'
    + '<tr><td colspan="3"><span class="lbl">Provision</span><span class="val">Provision utgår enligt provisionsplanen i avsnitt 6.</span></td></tr>'
    + '</tbody></table>'

    + '<div class="callout"><strong>Godkännande.</strong> Genom sina underskrifter på sista sidan bekräftar parterna att de har läst, förstått och godkänt samtliga villkor i detta avtal. Avtalet har upprättats i två likalydande exemplar, varav parterna tagit var sitt.</div>';
  pages.push(pageWrap(p1, true, metaTop));

  /* ---------- PAGE 2: parter + 1–2 ---------- */
  var p2 = '<h1 class="doc"><span class="sub">Anställningsavtal och villkor</span>'+esc(ag)+'</h1>'
    + '<p class="lede">Detta juridiskt bindande anställningsavtal (&rdquo;Avtalet&rdquo;) reglerar anställningsförhållandet mellan nedanstående parter i enlighet med svensk arbetsrätt.</p>'
    + '<h2 class="sec">Avtalsparter</h2>'
    + '<ul>'
      + '<li><strong>Arbetsgivare:</strong> '+esc(ag)+', organisationsnummer '+esc(agOrg)+', '+esc(or(d.agAdress,""))+', '+esc(or(d.agPostort,""))+', som bedriver verksamhet under varumärket '+esc(vm)+' (&rdquo;Arbetsgivaren&rdquo;).</li>'
      + '<li><strong>Arbetstagare:</strong> '+esc(at)+', personnummer '+esc(pnr)+' (&rdquo;Arbetstagaren&rdquo;).</li>'
    + '</ul>'
    + '<h2 class="sec" style="margin-top:6mm">Anställningsform</h2>'
    + '<p>' + (prov
        ? 'Anställningen inleds med en provanställning om '+ordman(d.anProvMan)+' månader enligt 6 § lagen (1982:80) om anställningsskydd. Om provanställningen inte avbryts av någondera parten övergår den vid provanställningstidens utgång automatiskt i en tillsvidareanställning.'
        : 'Anställningen gäller tills vidare enligt lagen (1982:80) om anställningsskydd.')
      + '</p>'
    + '<h2 class="sec" style="margin-top:6mm">Innehåll</h2>'
    + '<div class="toc">'
      + tocRow(1,"Avtalets parter och giltighet") + tocRow(2,"Anställningsform och anställningstid")
      + tocRow(3,"Befattning och ansvarsområde") + tocRow(4,"Arbetsplats och arbetstid")
      + tocRow(5,"Ersättning och semester") + tocRow(6,"Provisionsplan och intjänande")
      + tocRow(7,"Återkrav och kvittning") + tocRow(8,"Förmåner")
      + tocRow(9,"Anställningens upphörande") + tocRow(10,"Sekretess")
      + tocRow(11,"Kundskydd efter anställningen") + tocRow(12,"Förbud mot värvning av personal")
      + tocRow(13,"Bisysslor") + tocRow(14,"Lojalitetsplikt")
      + tocRow(15,"Förbud mot fiktiv försäljning") + tocRow(16,"Ansvar vid otillbörlig försäljning")
      + tocRow(17,"IT-säkerhet och systemanvändning") + tocRow(18,"Inspelning och personuppgifter")
      + tocRow(19,"Avslut och återlämnande") + tocRow(20,"Immateriella rättigheter")
      + tocRow(21,"Sammanställning av viten") + tocRow(22,"Tvistlösning och tillämplig lag")
      + tocRow(23,"Avtalets omfattning och ändringar")
      + (or(d.anOvrigt,"") ? tocRow(24,"Övriga villkor") : "")
    + '</div>';
  pages.push(pageWrap(p2, true, metaTop));

  /* ---------- PAGE 3: 1–4 ---------- */
  var p3 = '<h2 class="sec">Grundläggande villkor</h2>'
    + cl(1,"Avtalets parter och giltighet",
        '<p>1.1 Detta avtal har ingåtts mellan '+esc(ag)+', org.nr '+esc(agOrg)+' (&rdquo;Arbetsgivaren&rdquo;), och '+esc(at)+', personnummer '+esc(pnr)+' (&rdquo;Arbetstagaren&rdquo;).</p>'
      + '<p>1.2 Avtalet träder i kraft vid undertecknandet och gäller från och med tillträdesdagen '+esc(or(svDatum(d.anTilltrade),"—"))+'.</p>'
      + '<p>1.3 Skulle någon bestämmelse i avtalet eller del därav befinnas ogiltig eller oskälig, ska detta inte innebära att avtalet i sin helhet är ogiltigt. Bestämmelsen ska i stället jämkas i den utsträckning som krävs, varvid parternas ursprungliga avsikt så långt möjligt ska tillgodoses.</p>')
    + cl(2,"Anställningsform och anställningstid",
        (prov
        ? '<p>2.1 Anställningen inleds med en provanställning om '+ordman(d.anProvMan)+' månader räknat från tillträdesdagen, i enlighet med 6 § lagen (1982:80) om anställningsskydd.</p>'
        + '<p>2.2 Provanställningen kan avbrytas av båda parter före prövotidens utgång utan att skäl behöver anges. Underrättelse respektive besked ska lämnas senast '+esc(uppsag)+' i förväg.</p>'
        + '<p>2.3 Om provanställningen inte avbryts övergår den automatiskt i en tillsvidareanställning vid prövotidens utgång, varvid uppsägningstiderna i avsnitt 9 blir tillämpliga.</p>'
        : '<p>2.1 Anställningen gäller tills vidare från och med tillträdesdagen.</p>'
        + '<p>2.2 Uppsägning regleras i avsnitt 9.</p>'))
    + cl(3,"Befattning och ansvarsområde",
        '<p>3.1 Arbetstagaren anställs som '+esc(bef)+'.</p>'
      + '<p>3.2 I befattningen ingår att självständigt driva kundanskaffning, marknadsföra och sälja Arbetsgivarens tjänsteutbud, bygga långsiktiga affärsrelationer samt genomföra systematisk uppföljning och dokumentation i Arbetsgivarens CRM-system.</p>'
      + '<p>3.3 Arbetstagaren ansvarar för att försäljning sker till kreditgodkända kunder, att kundavtal upprättas korrekt och fullständigt samt att kundvård bedrivs inom ramen för Arbetsgivarens försäljnings- och företagspolicy.</p>'
      + '<p>3.4 Arbetet utförs enligt Arbetsgivarens fastställda säljstrategi och under ledning av närmaste chef'+(or(d.agChef,"") ? ', '+esc(d.agChef) : '')+'. Arbetsgivaren äger rätt att inom ramen för Arbetstagarens arbetsskyldighet justera arbetsuppgifterna.</p>')
    ;
  pages.push(pageWrap(p3, true, metaTop));

  /* ---------- PAGE 4: 4 ---------- */
  var p3b = '<h2 class="sec">Arbetsplats och arbetstid</h2>'
    + cl(4,"Arbetsplats och arbetstid",
        '<p>4.1 Arbetsplats är '+esc(or(d.anArbetsplats,"—"))+'.</p>'
      + '<p>4.2 Anställningens omfattning är '+esc(or(d.anOmfattning,"100 %"))+'. Ordinarie arbetstid är förlagd måndag till fredag mellan klockan '+esc(or(d.anTidFran,"08:00"))+' och '+esc(or(d.anTidTill,"17:00"))+'.</p>'
      + '<p>4.3 Arbetsgivaren förbehåller sig rätten att fastställa arbetsort samt att vid behov tillfälligt eller permanent förlägga tjänstgöringen till annan plats inom ramen för Arbetstagarens arbetsskyldighet.</p>'
      + '<p>4.4 Frånvaro ska anmälas till närmaste chef i enlighet med Arbetsgivarens rutiner.</p>'
      + '<p>4.5 <strong>Övertid och mertid.</strong> Arbetet utförs inom den ordinarie arbetstid som anges i punkt 4.2. Övertids- och mertidsarbete ingår inte i anställningen och ska inte utföras utan att närmaste chef i förväg skriftligen godkänt det. Eftersom ersättningen utgörs uteslutande av provision enligt avsnitt 5 utgår ingen särskild övertids- eller mertidsersättning. Arbetsgivaren ansvarar för att bestämmelserna om dygnsvila, veckovila och sammanlagd arbetstid i arbetstidslagen (1982:673) iakttas.</p>');
  pages.push(pageWrap(p3b, true, metaTop));

  /* ---------- PAGE 4: 5 ---------- */
  var grundlonTxt = "";
  if(d.grundlonPa){
    var gm = Number(d.grundlonMan)||2, gb = Number(d.grundlonBelopp)||25000;
    grundlonTxt = '<p>5.6 <strong>Kvalificering för grundlön.</strong> Har Arbetstagaren under '+ordman(gm)+' på varandra följande kalendermånader tjänat in provision om lägst '+kr(gb)+' per månad, är Arbetstagaren kvalificerad att begära en ändrad ersättningsmodell med grundlön eller garantilön.</p>'
      + '<p>5.7 En sådan begäran ska framställas skriftligen. Parterna ska därefter inom trettio (30) dagar träffa en skriftlig tilläggsöverenskommelse om den nya ersättningsmodellen, som anger grundlönens storlek, hur den samverkar med provisionen samt från vilken tidpunkt den gäller. Ändringen får verkan först från den tidpunkt som anges i tilläggsöverenskommelsen.</p>';
  }
  var p4 = '<h2 class="sec">Ersättning och semester</h2>'
    + cl(5,"Ersättning och semester",
        '<p>5.1 Ersättning utgår uteslutande i form av provision. Någon garantilön eller grundlön utgår inte, om annat inte uttryckligen och skriftligen överenskommits mellan parterna.</p>'
      + '<p>5.2 Provisionen utgår enligt den provisionsplan som framgår av avsnitt 6 och gäller försäljning av samtliga tjänster i Arbetsgivarens utbud.</p>'
      + '<p>5.3 Utbetalning sker den 25:e i månaden. Infaller den 25:e på en lördag, söndag eller annan helgdag sker utbetalning närmast föregående bankdag.</p>'
      + '<p>5.4 <strong>Semester.</strong> Arbetstagaren har rätt till semester enligt semesterlagen (1977:480). Semesteråret löper från den 1 april till den 31 mars, och motsvarande period närmast dessförinnan utgör intjänandeår. Semesterledigheten uppgår till tjugofem (25) semesterdagar per fullt semesterår. Semesterns förläggning bestäms efter samråd mellan parterna i enlighet med semesterlagens bestämmelser.</p>'
      + '<p>5.5 <strong>Semesterlön och semesterersättning.</strong> Eftersom ersättningen utgörs uteslutande av rörlig lön beräknas semesterlönen enligt procentregeln i 16 b § semesterlagen och uppgår till tolv (12) procent av den semesterlönegrundande provision som Arbetstagaren tjänat in under intjänandeåret. Semesterlönen betalas ut i samband med att Arbetstagaren tar ut sin semester, vid den ordinarie löneutbetalning som infaller närmast efter semesteruttaget. Upphör anställningen utbetalas intjänad men inte uttagen semesterersättning i samband med slutlönen, dock senast en (1) månad efter anställningens upphörande.</p>'
      + grundlonTxt);
  pages.push(pageWrap(p4, true, metaTop));

  /* ---------- PAGE 5: provisionstrappan (forts. avsnitt 5) ---------- */
  var tn = d.grundlonPa ? 8 : 6;
  var p4t = '<h2 class="sec">Provisionstrappa</h2>'
    + cl(5,"Ersättning och semester, forts.",
        '<p>5.'+tn+' <strong>Provisionstrappa.</strong> Utöver provisionen enligt avsnitt 6 utgår ett påslag per affär enligt nedanstående trappa. Antalet affärer räknas per kalendermånad, och räknaren nollställs vid varje månadsskifte.</p>'
      + trappaTable(tn+2)
      + '<p>5.'+(tn+1)+' <strong>Beräkning.</strong> Påslaget beräknas på samtliga affärer som Arbetstagaren genomfört under kalendermånaden, även de affärer som ligger före den nivå som uppnåtts. Endast den högsta uppnådda nivån tillämpas och nivåernas belopp läggs inte samman. En affär räknas in i trappan enligt samma intjänandeprincip som gäller för provisionen enligt punkt 6.2, det vill säga först när kundens första faktura är till fullo betald och betalningen registrerats hos Arbetsgivaren.</p>'
      + '<p>5.'+(tn+2)+' <strong>Trettio affärer eller fler.</strong> Uppnår Arbetstagaren trettio (30) affärer eller fler under en kalendermånad ska Arbetstagaren och närmaste chef hålla ett särskilt möte för att fastställa påslaget för den månaden. Träffad överenskommelse ska dokumenteras skriftligen och undertecknas av båda parter. Träffas ingen sådan överenskommelse utgår påslag enligt nivån tjugo (20) affärer.</p>'
      + '<p>5.'+(tn+3)+' <strong>Utbetalning och återkrav.</strong> Påslaget utbetalas tillsammans med provisionen enligt punkt 6.3. Återgår en affär av skäl som anges i avsnitt 7 räknas kalendermånadens antal affärer om, varvid påslaget justeras till den nivå som därefter gäller och för mycket utbetalt belopp får återkrävas enligt punkt 7.3.</p>');
  pages.push(pageWrap(p4t, true, metaTop));

  /* ---------- PAGE 6: 6 ---------- */
  var p4b = '<h2 class="sec">Provisionsplan</h2>'
    + cl(6,"Provisionsplan och intjänande",
        '<p>6.1 Provision utgår per såld och av kunden betald tjänst enligt följande plan:</p>'
      + pkgTable()
      + '<p>6.2 <strong>Intjänande.</strong> Provisionen är intjänad först när kundens första faktura är till fullo betald och betalningen registrerats hos Arbetsgivaren. Osäkra, obetalda eller bestridda fordringar ger inte rätt till provision. Detta gäller inte vid finansiering med Arbetsgivarens finanspartner.</p>'
      + '<p>6.3 <strong>Utbetalningstidpunkt.</strong> Provision utbetalas den 25:e i kalendermånaden efter den månad då full betalning inkommit från kunden. Inkommer betalningen samma månad som försäljningen genomfördes, utbetalas provisionen månaden därefter.</p>'
      + '<p>6.4 Provisionen beräknas på fakturerat belopp exklusive mervärdesskatt. Vid kreditering samt vid direkta eller indirekta rabatter minskas provisionsunderlaget i motsvarande mån.</p>');
  pages.push(pageWrap(p4b, true, metaTop));

  /* ---------- PAGE 7: slutavräkning (forts. avsnitt 6) ---------- */
  var p4c = '<h2 class="sec">Slutavräkning vid anställningens upphörande</h2>'
    + cl(6,"Provisionsplan och intjänande, forts.",
        '<p>6.5 <strong>Slutavräkning.</strong> Upphör anställningen, oavsett anledning och oavsett vilken part som föranlett upphörandet, beräknas provisionen på faktisk fakturering och betalning avseende affärer som Arbetstagaren genererat till och med sista anställningsdagen.</p>'
      + '<p>6.6 <strong>Granskning av affärerna.</strong> Före slutlig utbetalning har Arbetsgivaren rätt att granska samtliga affärer som Arbetstagaren genererat. Granskningen avser att affären är korrekt registrerad och dokumenterad, att kunden inte har utnyttjat sin ångerrätt eller reklamerat avtalet, att tjänsten är korrekt levererad och driftsatt, att de utfästelser som lämnats till kunden ryms inom Arbetsgivarens utbud, prismodell och leveransförmåga samt att Arbetsgivarens försäljnings-, dokumentations- och kvalitetsrutiner har följts.</p>'
      + '<p>6.7 <strong>Innehållande under granskningen.</strong> Provision och påslag enligt provisionstrappan avseende affärer som omfattas av granskningen innehålls till dess att granskningen av respektive affär är avslutad. Granskningen ska påbörjas utan dröjsmål efter sista anställningsdagen och bedrivas skyndsamt. Utbetalning sker affär för affär vid närmast följande ordinarie utbetalningstillfälle enligt punkt 6.3 efter det att granskningen av affären avslutats utan anmärkning, dock senast nittio (90) dagar efter sista anställningsdagen. Har kundens ångerfrist inte löpt ut eller är en reklamation avseende en viss affär inte slutligt avgjord vid den tidpunkten, innehålls provisionen för den affären till dess fristen löpt ut respektive reklamationen avgjorts. Innehållandet omfattar inte semesterersättning enligt punkt 5.5. För kvittning mot innestående ersättning gäller punkt 7.4.</p>'
      + '<p>6.8 <strong>Ändring av provisionen.</strong> Arbetsgivaren äger rätt att ensidigt ändra provisionsplanen, provisionssatserna och de enskilda paketens provisionsvärden för framtida försäljning genom skriftligt meddelande till Arbetstagaren med minst en (1) månads varsel. Ändringen påverkar inte provision som redan är intjänad.</p>');
  pages.push(pageWrap(p4c, true, metaTop));

  /* ---------- PAGE 8: 7–9 ---------- */
  var p5 = '<h2 class="sec">Återkrav, förmåner och upphörande</h2>'
    + cl(7,"Återkrav och kvittning",
        '<p>7.1 <strong>Ångerrätt.</strong> Utnyttjar kunden sin ångerrätt ska hela den provision som utbetalats för affären återbetalas i sin helhet.</p>'
      + '<p>7.2 Detsamma gäller om kundavtalet annulleras, hävs eller återkallas, om det visar sig ogiltigt, eller om affären grundats på vilseledande information eller på annat sätt strider mot Arbetsgivarens policy.</p>'
      + '<p>7.3 Vid felaktigt utbetald ersättning har Arbetsgivaren rätt att återkräva beloppet.</p>'
      + '<p>7.4 <strong>Kvittning.</strong> Kvittning mot Arbetstagarens innestående ersättning får ske endast i enlighet med lagen (1970:215) om arbetsgivares kvittningsrätt och efter skriftlig underrättelse till Arbetstagaren.</p>')
    + cl(8,"Förmåner",
        '<p>8.1 Följande förmåner gäller för anställningen:</p><p>'+nl(or(d.anFormaner,"Inga särskilda förmåner har avtalats."))+'</p>'
      + '<p>8.2 Utrustning som tillhandahålls av Arbetsgivaren förblir Arbetsgivarens egendom, ska vårdas väl och användas i enlighet med Arbetsgivarens IT-policy samt återlämnas enligt avsnitt 19.</p>')
    + cl(9,"Anställningens upphörande",
        (prov
        ? '<p>9.1 Under provanställningen gäller vad som anges i punkt 2.2.</p>'
        + '<p>9.2 Efter övergång till tillsvidareanställning gäller en ömsesidig uppsägningstid om en (1) månad, om inte längre uppsägningstid följer av 11 § lagen (1982:80) om anställningsskydd, i vilket fall lagens bestämmelser gäller.</p>'
        : '<p>9.1 För anställningen gäller en ömsesidig uppsägningstid om '+esc(uppsag)+', om inte längre uppsägningstid följer av 11 § lagen (1982:80) om anställningsskydd, i vilket fall lagens bestämmelser gäller.</p>')
      + '<p>9.'+(prov?3:2)+' Uppsägning ska ske skriftligen.</p>'
      + '<p>9.'+(prov?4:3)+' Arbetsgivaren äger rätt att under uppsägningstiden befria Arbetstagaren från arbetsplikt. Arbetstagarens skyldigheter enligt avsnitten 10, 13 och 14 gäller under hela uppsägningstiden oavsett arbetsbefrielse.</p>'
      + '<p>9.'+(prov?5:4)+' Avskedande kan ske enligt 18 § lagen (1982:80) om anställningsskydd om Arbetstagaren grovt åsidosatt sina åligganden mot Arbetsgivaren.</p>');
  pages.push(pageWrap(p5, true, metaTop));

  /* ---------- PAGE 9: 10–12 ---------- */
  var p6 = '<h2 class="sec">Sekretess och kundskydd</h2>'
    + cl(10,"Sekretess",
        '<p>10.1 Med konfidentiell information avses all information som Arbetstagaren tar del av genom anställningen och vars obehöriga användning kan medföra skada för Arbetsgivaren, oavsett om informationen lämnas muntligen, skriftligen, grafiskt, digitalt eller i annan form. Hit hör bland annat kundregister, prospektlistor, avtalsvillkor, prismodeller, provisionsvillkor, försäljningsstrategier, leverantörsavtal och interna arbetsrutiner.</p>'
      + '<p>10.2 Arbetstagaren förbinder sig att inte använda konfidentiell information för annat ändamål än anställningen och att inte avslöja, kopiera, reproducera eller vidarebefordra sådan information till tredje part, samt att vidta alla skäliga åtgärder för att förhindra att så sker.</p>'
      + '<p>10.3 Sekretessåtagandet gäller under anställningen och utan tidsbegränsning även därefter.</p>'
      + '<p>10.4 Varje dokumenterad överträdelse medför ett vite om '+kr(sekVite)+'. Överträdelsen kan därutöver utgöra brott mot lagen (2018:558) om företagshemligheter.</p>'
      + '<p>10.5 <strong>Undantag.</strong> Sekretessåtagandet inskränker inte Arbetstagarens rätt att rapportera missförhållanden enligt lagen (2021:890) om skydd för personer som rapporterar om missförhållanden, att lämna uppgifter till behörig myndighet eller domstol, att fullgöra en lagstadgad skyldighet eller att i övrigt utöva sina rättigheter enligt tvingande lag eller grundlag.</p>')
    + cl(11,"Kundskydd efter anställningen",
        '<p>11.1 Arbetstagaren förbinder sig att varken under anställningstiden eller under '+ordman(kundMan)+' månader efter anställningens upphörande kontakta, bearbeta eller söka påverka kunder eller prospekt som Arbetstagaren fått kännedom om eller etablerat relation till genom sin anställning under de sista '+ordman(kundMan)+' månaderna av anställningen, i syfte att förmå dessa att övergå till en med Arbetsgivaren konkurrerande verksamhet.</p>'
      + '<p>11.2 Åtagandet gäller även vid indirekt kontakt genom tredje part, digitala plattformar eller sociala nätverk.</p>'
      + '<p>11.3 Varje dokumenterad överträdelse medför ett vite om '+kr(kundVite)+' per kund som kontaktas.</p>'
      + '<p>11.4 <strong>Klargörande.</strong> Denna bestämmelse utgör ett kundskydd och inte ett konkurrensförbud. Den hindrar inte Arbetstagaren från att ta anställning hos eller bedriva verksamhet i konkurrerande företag, utan begränsar endast bearbetningen av Arbetsgivarens kunder och prospekt enligt ovan.</p>')
    + cl(12,"Förbud mot värvning av personal",
        '<p>12.1 Arbetstagaren förbinder sig att varken direkt eller indirekt värva eller söka förmå anställda, uppdragstagare eller samarbetspartner hos Arbetsgivaren att avsluta sitt engagemang hos Arbetsgivaren.</p>'
      + '<p>12.2 Åtagandet gäller under anställningstiden samt '+ordman(rekMan)+' månader efter anställningens upphörande.</p>'
      + '<p>12.3 Varje dokumenterad överträdelse medför ett vite om '+kr(rekVite)+'.</p>');
  pages.push(pageWrap(p6, true, metaTop));

  /* ---------- PAGE 10: 13–16 ---------- */
  var p7 = '<h2 class="sec">Lojalitet och försäljningsansvar</h2>'
    + cl(13,"Bisysslor",
        '<p>13.1 Arbetstagaren får inte utan Arbetsgivarens skriftliga förhandsgodkännande bedriva egen näringsverksamhet eller inneha anställning, uppdrag eller konsultuppdrag vid sidan av anställningen.</p>'
      + '<p>13.2 Förbudet omfattar hela anställningstiden inklusive uppsägningstiden.</p>'
      + '<p>13.3 Arbetstagaren ska på Arbetsgivarens begäran lämna de upplysningar som behövs för att bedöma om en bisyssla är förenlig med anställningen.</p>')
    + cl(14,"Lojalitetsplikt",
        '<p>14.1 Arbetstagaren ska agera lojalt, ansvarsfullt och professionellt i samtliga situationer där Arbetsgivarens anseende eller affärsverksamhet kan påverkas. Lojalitetsplikten gäller även utanför ordinarie arbetstid i sammanhang som berör Arbetsgivaren eller dess intressen.</p>'
      + '<p>14.2 <strong>Förbud mot konkurrenshämmande användning av information.</strong> Arbetstagaren får inte, vare sig under eller efter anställningen, använda information som Arbetstagaren tillägnat sig genom anställningen — såsom kunddata, prismodeller, kalkyler, affärsvillkor, säljmetodik eller leverantörsuppgifter — på ett sätt som leder till skada eller kommersiell nackdel för Arbetsgivaren eller som ger en konkurrerande verksamhet en fördel.</p>'
      + '<p>14.3 Varje dokumenterad överträdelse av punkt 14.2 medför ett vite om '+kr(konkVite)+'.</p>'
      + '<p>14.4 Dokumenterat brott mot lojalitetsplikten kan utgöra sakliga skäl för uppsägning enligt 7 § respektive grund för avskedande enligt 18 § lagen (1982:80) om anställningsskydd.</p>')
    + cl(15,"Förbud mot fiktiv försäljning",
        '<p>15.1 Det är förbjudet för Arbetstagaren att registrera eller rapportera fiktiva kunder eller avtalsrelationer, att simulera eller förfalska säljaktiviteter i CRM-systemet samt att manipulera försäljningsstatistik eller affärsdokumentation.</p>'
      + '<p>15.2 Överträdelse medför skyldighet att i sin helhet återbetala provision som utbetalats för sådana affärer samt utgör grund för omedelbart avskedande enligt 18 § lagen (1982:80) om anställningsskydd.</p>'
      + '<p>15.3 Arbetsgivaren äger därutöver rätt att göra polisanmälan vid misstanke om brott samt att kräva ersättning för styrkt skada.</p>')
    + cl(16,"Ansvar vid otillbörlig försäljning",
        '<p>16.1 Reklamerar en kund ett avtal till följd av vilseledande information, aggressiv eller påträngande försäljningsteknik eller bristfällig rådgivning från Arbetstagaren, ska utbetald provision återbetalas.</p>'
      + '<p>16.2 Detsamma gäller vid åsidosättande av rutiner för kundens samtycke och vid tecknande av icke auktoriserade avtal eller överenskommelser.</p>'
      + '<p>16.3 Arbetstagaren ansvarar i sådana fall även för Arbetsgivarens styrkta merkostnader för rättelse och kundsupport. Ansvar utöver återbetalning av provisionen förutsätter att Arbetstagaren agerat uppsåtligen eller grovt vårdslöst.</p>');
  pages.push(pageWrap(p7, true, metaTop));

  /* ---------- PAGE 11: 17–20 ---------- */
  var p8 = '<h2 class="sec">IT-säkerhet, avslut och rättigheter</h2>'
    + cl(17,"IT-säkerhet och systemanvändning",
        '<p>17.1 Arbetstagaren får endast använda Arbetsgivarens system, konton och digitala resurser för arbetsrelaterade ändamål.</p>'
      + '<p>17.2 Det är förbjudet att lagra företagsdata på privata enheter eller i personliga molntjänster, att exportera eller överföra företagsinformation till egna lagringsutrymmen, att dela inloggningsuppgifter, att installera icke godkänd programvara samt att söka kringgå säkerhetssystem, skyddsmekanismer eller loggningsfunktioner.</p>'
      + '<p>17.3 Arbetstagaren ska följa Arbetsgivarens lösenordspolicy och omgående rapportera misstänkta säkerhetsincidenter och potentiella dataläckage.</p>'
      + '<p>17.4 Arbetsgivaren har rätt att i enlighet med dataskyddsförordningen (EU) 2016/679 och sin IT-policy kontrollera användningen av e-post, chattverktyg, CRM-system och annan IT-utrustning som tillhör Arbetsgivaren. Kontrollen sker i syfte att säkerställa regelefterlevnad och informationssäkerhet.</p>'
      + '<p>17.5 Överträdelser kan utgöra dataintrång enligt 4 kap. 9 c § brottsbalken.</p>')
    + cl(18,"Inspelning och personuppgifter",
        '<p>18.1 Arbetsgivaren spelar in samtal, chattar och möten som genomförs via Arbetsgivarens system. Ändamålet är att säkerställa kvalitet i kommunikationen med kund, att utvärdera arbetsprestation samt att använda materialet i utbildnings- och coachningssyfte.</p>'
      + '<p>18.2 Behandlingen sker med stöd av Arbetsgivarens berättigade intresse enligt artikel 6.1 f i dataskyddsförordningen (EU) 2016/679.</p>'
      + '<p>18.3 Inspelat material får inte under några omständigheter användas för privata ändamål eller spridas utanför verksamheten.</p>'
      + '<p>18.4 Arbetstagaren informeras genom detta avtal om behandlingen och har de rättigheter som följer av dataskyddsförordningen, däribland rätten till information och registerutdrag.</p>')
    + cl(19,"Avslut och återlämnande",
        '<p>19.1 Vid anställningens upphörande ska Arbetstagaren medverka i ett strukturerat avslutssamtal och genomföra en fullständig överlämning av pågående ärenden.</p>'
      + '<p>19.2 All arbetsrelaterad utrustning, nycklar, passerkort, dokument och digitala konton ska återlämnas i fullgott skick senast sista anställningsdagen.</p>'
      + '<p>19.3 Arbetstagaren ska skriftligen intyga att ingen företagsinformation kopierats, sparats eller överförts till privata enheter eller tjänster, samt att all åtkomst till Arbetsgivarens system upphört.</p>'
      + '<p>19.4 Återlämnas inte egendom som tillhör Arbetsgivaren äger Arbetsgivaren rätt att kvitta egendomens värde mot innestående ersättning i enlighet med lagen (1970:215) om arbetsgivares kvittningsrätt.</p>')
    + cl(20,"Immateriella rättigheter",
        '<p>20.1 Samtliga arbetsresultat, handlingar, material och immateriella rättigheter som skapas eller bearbetas av Arbetstagaren inom ramen för anställningen tillhör Arbetsgivaren.</p>'
      + '<p>20.2 Professionella nätverkskontakter och kunduppgifter som etablerats i tjänsten utgör Arbetsgivarens affärsinformation. Arbetstagaren får inte efter anställningens upphörande exportera eller överta sådana kontaktuppgifter i syfte att bearbeta dem kommersiellt.</p>');
  pages.push(pageWrap(p8, true, metaTop));

  /* ---------- PAGE 12: 21–23(24) + underskrifter ---------- */
  var tvistTxt;
  if(d.tvist === "skilje"){
    tvistTxt = '<p>22.2 Leder förhandling inte till en lösning inom trettio (30) dagar ska tvisten slutligt avgöras genom skiljedom enligt Regler för Förenklat Skiljeförfarande vid Stockholms Handelskammares Skiljedomsinstitut. Säte för förfarandet är Stockholm.</p>';
  } else {
    var ting = d.tvist === "domstol_sthlm" ? "Stockholms tingsrätt" : "Göteborgs tingsrätt";
    tvistTxt = '<p>22.2 Leder förhandling inte till en lösning inom trettio (30) dagar ska tvisten avgöras av allmän domstol med '+ting+' som första instans.</p>';
  }

  var viteRows = ''
    + '<tr><td>Sekretessbrott (avsnitt 10)</td><td>Per dokumenterad överträdelse</td><td class="num">'+kr(sekVite)+'</td></tr>'
    + '<tr><td>Otillåten kundkontakt (avsnitt 11)</td><td>Per kund som kontaktas</td><td class="num">'+kr(kundVite)+'</td></tr>'
    + '<tr><td>Värvning av personal (avsnitt 12)</td><td>Per dokumenterad överträdelse</td><td class="num">'+kr(rekVite)+'</td></tr>'
    + '<tr><td>Konkurrenshämmande användning av information (punkt 14.2)</td><td>Per dokumenterad överträdelse</td><td class="num">'+kr(konkVite)+'</td></tr>'
    + '<tr><td>Fiktiv försäljning (avsnitt 15)</td><td>Återbetalning av provision samt avskedande</td><td class="num">—</td></tr>';

  var ovrigtSec = or(d.anOvrigt,"") ? cl(24,"Övriga villkor",'<p>'+nl(d.anOvrigt)+'</p>') : "";

  var p9 = '<h2 class="sec">Viten och tvistlösning</h2>'
    + cl(21,"Sammanställning av viten",
        '<p>21.1 Följande viten gäller enligt detta avtal:</p>'
      + '<table class="grid2"><thead><tr><th style="width:46%">Överträdelse</th><th>Beräkning</th><th style="width:20%;text-align:right">Vite</th></tr></thead><tbody>'
      + viteRows + '</tbody></table>'
      + '<p>21.2 Vite utgår per dokumenterad överträdelse. Har Arbetsgivaren lidit skada som överstiger vitesbeloppet äger Arbetsgivaren rätt till ersättning för den styrkta skadan i den del den överstiger vitet.</p>')
    + cl(22,"Tvistlösning och tillämplig lag",
        '<p>22.1 Tvist med anledning av detta avtal ska i första hand lösas genom förhandling mellan parterna.</p>'
      + tvistTxt
      + '<p>22.3 Svensk rätt ska tillämpas på avtalet, däribland lagen (1982:80) om anställningsskydd, lagen (2018:558) om företagshemligheter, dataskyddsförordningen (EU) 2016/679 med kompletterande svensk dataskyddslagstiftning samt brottsbalken.</p>'
      + '<p>22.4 <strong>Kollektivavtal.</strong> Arbetsgivaren är inte bunden av något kollektivavtal. Blir Arbetsgivaren framdeles bunden av kollektivavtal som omfattar anställningen, gäller det avtalets villkor framför detta avtal i den mån villkoren strider mot varandra. Arbetstagaren ska underrättas skriftligen om så sker.</p>')
    ;

  var p10 = '<h2 class="sec">Avtalets omfattning och underskrifter</h2>'
    + cl(23,"Avtalets omfattning och ändringar",
        '<p>23.1 Detta avtal utgör den fullständiga överenskommelsen mellan parterna avseende anställningen. Tidigare muntliga eller skriftliga överenskommelser som strider mot detta avtal upphör att gälla vid undertecknandet.</p>'
      + '<p>23.2 Ändringar och tillägg ska för att vara giltiga vara skriftliga och undertecknade av båda parter.</p>'
      + '<p>23.3 Avtalet har upprättats i två likalydande exemplar, varav parterna tagit var sitt.</p>')
    ;

  var signBlock = '<div class="sign">'
      + '<div><span class="lbl">Ort och datum</span><div class="val">'+esc(or(d.signOrt,""))+' '+esc(or(svDatum(d.signDatum),""))+'</div>'
        + '<div class="line"></div><span class="lbl">Underskrift, Arbetsgivaren</span>'
        + '<div class="name" style="margin-top:2mm">'+esc(tecknareNamn.toUpperCase())+'</div>'
        + '<div class="lbl" style="text-transform:none;letter-spacing:0;font-size:7pt;margin-top:.6mm">'+esc(tecknareTitel)+', '+esc(ag)+'</div></div>'
      + '<div><span class="lbl">Ort och datum</span><div class="val">'+esc(or(d.signOrt,""))+' '+esc(or(svDatum(d.signDatum),""))+'</div>'
        + '<div class="line"></div><span class="lbl">Underskrift, Arbetstagaren</span>'
        + '<div class="name" style="margin-top:2mm">'+esc(at.toUpperCase())+'</div>'
        + '<div class="lbl" style="text-transform:none;letter-spacing:0;font-size:7pt;margin-top:.6mm">Personnummer '+esc(pnr)+'</div></div>'
    + '</div>';

  var ovrigtLong = or(d.anOvrigt,"").length > 180;
  pages.push(pageWrap(p9, true, metaTop));
  if(ovrigtLong){
    pages.push(pageWrap(p10 + ovrigtSec, true, metaTop));
    pages.push(pageWrap('<h2 class="sec">Underskrifter</h2>' + signBlock, true, metaTop));
  } else {
    pages.push(pageWrap(p10 + ovrigtSec + signBlock, true, metaTop));
  }

  $("contract").innerHTML = pages.join("");

  /* footers */
  var els = document.querySelectorAll(".page");
  for(var i=0;i<els.length;i++){
    var f = els[i].querySelector(".foot");
    f.innerHTML = '<span>Anställningsavtal &middot; ' + esc(ag) + ' &middot; ' + esc(at) + '</span>'
                + '<span>Sida ' + (i+1) + ' av ' + els.length + '</span>';
  }
  checkOverflow();
  markMissing();
}

function tocRow(n,t){ return '<div><span>'+n+'</span>'+esc(t)+'</div>'; }
function cl(n,title,body){
  return '<h3 class="cl"><span class="n">'+n+'.</span>'+esc(title)+'</h3><div class="tight">'+body+'</div>';
}
var TRAPPA = [
  {fran:5,  till:9,  pasl:200},
  {fran:10, till:14, pasl:500},
  {fran:15, till:19, pasl:700},
  {fran:20, till:29, pasl:1000}
];
function trappaTable(motesNr){
  var rows = "";
  TRAPPA.forEach(function(t){
    rows += '<tr><td>' + t.fran + '\u2013' + t.till + ' aff\u00e4rer</td>'
          + '<td class="num">' + kr(t.pasl) + '</td></tr>';
  });
  rows += '<tr><td>30 aff\u00e4rer eller fler</td>'
        + '<td class="num">Fastst\u00e4lls enligt punkt 5.' + motesNr + '</td></tr>';
  return '<table class="grid2"><thead><tr><th style="width:58%">Antal aff\u00e4rer per kalenderm\u00e5nad</th>'
    + '<th style="width:42%;text-align:right">P\u00e5slag per aff\u00e4r</th></tr></thead><tbody>'
    + rows + '</tbody></table>';
}

function pkgTable(){
  var rows = "";
  paket.forEach(function(p){
    var v = p.typ === "procent"
      ? (Number(p.varde)||0).toLocaleString("sv-SE") + " % av ordervärdet"
      : kr(p.varde);
    rows += '<tr><td>'+esc(or(p.namn,"—"))+'</td><td class="num">'+esc(p.bind)+' mån</td><td class="num">'+v+'</td></tr>';
  });
  if(!rows) rows = '<tr><td colspan="3">Ingen provisionsplan har angetts.</td></tr>';
  return '<table class="grid2"><thead><tr><th style="width:52%">Paket / tjänst</th>'
    + '<th style="width:22%;text-align:right">Bindningstid</th>'
    + '<th style="width:26%;text-align:right">Provision</th></tr></thead><tbody>'+rows+'</tbody></table>';
}

/* ---------------- validation + overflow ---------------- */
function markMissing(){
  var reqIds = ["agNamn","agOrg","atNamn","atPnr","anTilltrade","anBefattning"];
  reqIds.forEach(function(id){
    var el = $(id); if(!el) return;
    var w = el.closest(".field");
    if(!w) return;
    if(!or(el.value,"")) w.classList.add("missing"); else w.classList.remove("missing");
  });
}
function checkOverflow(){
  var bad = [];
  var els = document.querySelectorAll(".page");
  for(var i=0;i<els.length;i++){
    if(els[i].scrollHeight > els[i].clientHeight + 4) bad.push(i+1);
  }
  var w = $("overflowWarn");
  if(bad.length){
    w.style.display = "block";
    w.innerHTML = "<strong>Texten får inte plats på sida " + bad.join(", ") + ".</strong> Korta ned fältet Förmåner eller Övriga villkor, eller ta bort ett provisionspaket, så att inget klipps bort i PDF:en.";
  } else { w.style.display = "none"; }
}

/* ---------------- zoom ---------------- */
var zoom = 0.7;
function applyZoom(){
  $("stage").style.transform = "scale("+zoom+")";
  $("stage").style.height = (document.getElementById("contract").offsetHeight * zoom) + "px";
  $("zoomLabel").textContent = Math.round(zoom*100) + " %";
}
$("zoomIn").addEventListener("click", function(){ zoom = Math.min(1.2, zoom+0.1); applyZoom(); });
$("zoomOut").addEventListener("click", function(){ zoom = Math.max(0.35, zoom-0.1); applyZoom(); });

/* ---------------- saved contracts ---------------- */
var KEY = "clicknet_avtal_v1";
function loadSaved(){ try{ return JSON.parse(store.get(KEY) || "[]"); }catch(e){ return []; } }
function writeSaved(list){ store.set(KEY, JSON.stringify(list)); renderSaved(); }
function renderSaved(){
  var list = loadSaved(), h = "";
  if(!list.length){ $("savedList").innerHTML = '<div class="empty">Inga sparade avtal ännu.</div>'; return; }
  list.forEach(function(it,i){
    h += '<div class="item"><span class="nm">'+esc(it.namn||"Namnlöst")+'</span>'
       + '<span class="dt">'+esc(it.sparad)+'</span>'
       + '<button class="btn small" data-load="'+i+'" type="button">Öppna</button>'
       + '<button class="btn small danger" data-rm="'+i+'" type="button">Ta bort</button></div>';
  });
  $("savedList").innerHTML = h;
}
$("savedList").addEventListener("click", function(e){
  var l = e.target.getAttribute("data-load"), r = e.target.getAttribute("data-rm");
  var list = loadSaved();
  if(l!==null){ setForm(list[+l].data); }
  if(r!==null){ if(confirm("Ta bort sparat avtal?")){ list.splice(+r,1); writeSaved(list); } }
});
$("btnSave").addEventListener("click", function(){
  var d = getForm();
  var list = loadSaved();
  list.unshift({ namn: or(d.atNamn,"Namnlöst") + " – " + or(d.anBefattning,""), sparad: new Date().toLocaleDateString("sv-SE"), data: d });
  writeSaved(list.slice(0,60));
  var b = $("btnSave"); var t = b.textContent; b.textContent = "Sparat"; setTimeout(function(){ b.textContent = t; }, 1400);
});
$("btnExport").addEventListener("click", function(){
  var blob = new Blob([JSON.stringify({ aktuellt:getForm(), sparade:loadSaved() }, null, 2)], {type:"application/json"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "clicknet-avtal-" + new Date().toISOString().slice(0,10) + ".json";
  a.click();
});
$("btnNew").addEventListener("click", function(){
  if(confirm("Rensa formuläret och börja om?")){
    var f = JSON.parse(JSON.stringify(DEFAULTS));
    f.refNr = nyRef();
    f.signDatum = new Date().toISOString().slice(0,10);
    setForm(f);
  }
});
$("btnPdf").addEventListener("click", function(){
  var miss = document.querySelectorAll(".req.missing").length;
  if(miss && !confirm("Några obligatoriska fält är tomma. Vill du skapa PDF ändå?")) return;
  window.print();
});

function nyRef(){
  var d = new Date();
  return "CN-" + d.getFullYear() + String(d.getMonth()+1).padStart(2,"0")
    + String(d.getDate()).padStart(2,"0") + "-" + String(Math.floor(Math.random()*900)+100);
}

/* ---------------- wiring ---------------- */
document.querySelectorAll("[data-card] > h2").forEach(function(h){
  h.addEventListener("click", function(){ h.parentElement.classList.toggle("collapsed"); });
});
FIELDS.forEach(function(k){
  var el = $(k); if(!el) return;
  el.addEventListener("input", function(){ syncConditional(); render(); });
  el.addEventListener("change", function(){ syncConditional(); render(); });
});
$("grundlonPa").addEventListener("change", function(){ syncConditional(); render(); });
$("anForm").addEventListener("change", function(){
  $("anUppsagning").value = $("anForm").value === "prov" ? "14 dagar" : "1 månad";
  syncConditional(); render();
});

/* init */
(function init(){
  var f = JSON.parse(JSON.stringify(DEFAULTS));
  f.refNr = nyRef();
  f.signDatum = new Date().toISOString().slice(0,10);
  f.anUppsagning = "14 dagar";
  setForm(f);
  renderSaved();
  applyZoom();
  window.addEventListener("resize", applyZoom);
  setTimeout(applyZoom, 200);
})();
