// Browser: Reiter „Client“ — anlegen (Firma/Numm/Virnumm/Telefon/E-Mail/Adress), Liste alphabetisch mit nur dem Namen
// (Firma geht vor), rotes ▶ klappt Kontakt auf, darin ▶ Akeef (Verkéf + Bestellungen ab elo), Sich, Vorschléi beim Tippen
// (Verkafen + Bestellung, kee Ausklappmenü), „+ Bei d'Clienten“ féiert an de Reiter, änneren, läschen, Verlaf am Zahnrad.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
p.on("dialog", d => d.accept());
await p.route(/workers\.dev/, r => r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); window.OHNE_ALTIMPORT = true; EIN = { code: "x", ich: "Laurent" }; TAB = "verkaufen"; render(); });
const liste = () => p.evaluate(() => [...document.querySelectorAll("#kListe .kz > .kz-kopf")].map(b => b.textContent.trim()));

// Reiter und Verlauf
ist("Reiter Client statt Verlaf", await p.evaluate(() => [...document.querySelectorAll("nav [data-tab]")].map(b => b.textContent).slice(-1)), ["Client"]);
ist("kee Stammclienten méi bei Bestellungen", await p.evaluate(() => !!document.querySelector("#kBuch")), false);
await p.click("#zahnrad"); await p.click("#eVerlauf");
ist("Verlaf iwwer d'Zahnrad", await p.locator("#t-verlauf").innerText(), t => t.includes("Verlaf"));
await p.click("#vlZurueck");
ist("Zréck an d'Astellungen", await p.evaluate(() => TAB), "einst");

// Anlegen
await p.click('[data-tab="kunden"]');
ist("leer", await p.locator("#kListe").innerText(), t => t.includes("Client (0)") && t.includes("Nach keen Client"));
await p.click("#kNeu");
await p.click("#kOk"); await warte(100);
ist("Firma, Numm oder Virnumm néideg", await p.locator("#kMeld").innerText(), t => t.includes("Firma, Numm oder Virnumm"));
await p.fill("#kFirma", "Ferro Forum"); await p.fill("#kName", "Muller"); await p.fill("#kVorname", "Jeff");
await p.fill("#kAdr", "1, rue de l'Usine"); await p.fill("#kOrt", "L-3895 Foetz");
await p.fill("#kTel", "+352 621 123 456"); await p.fill("#kMail", "info@ferroforum"); await warte(900); await p.click("#kOk"); await warte(100);
ist("falsch E-Mail ofgeleent", await p.locator("#kMeld").innerText(), t => t.includes("E-Mail"));
await p.fill("#kMail", "info@ferroforum.lu"); await warte(900); await p.click("#kOk"); await warte(200);
ist("ugeluecht mat v:2", await p.evaluate(() => Z.kunden.map(k => [k.v, k.firma, k.name, k.vorname, k.ort, k.label])), [[2, "Ferro Forum", "Muller", "Jeff", "L-3895 Foetz", "Ferro Forum"]]);
ist("no dem Späicheren opgeklappt, Links", await p.evaluate(() => [...document.querySelectorAll("#kListe a")].map(a => a.getAttribute("href"))), ["tel:+352621123456", "mailto:info@ferroforum.lu"]);
ist("Kontaktpersoun ze gesinn", await p.locator("#kListe").innerText(), t => t.includes("Jeff Muller") && t.includes("rue de l'Usine"));
ist("Rechnungsadress", await p.evaluate(() => rechnungsAdresse(Z.kunden[0])), ["Ferro Forum", "À l'attention de Jeff Muller", "1, rue de l'Usine", "L-3895 Foetz"]);

// Zwee weider: Persoun ouni Firma, an eng mat A
for (const [n, v] of [["Weber", "Anne"], ["Arendt", "Paul"]]) {
  await warte(900); await p.click("#kNeu"); await p.fill("#kName", n); await p.fill("#kVorname", v); await warte(900); await p.click("#kOk"); await warte(200);
}
await p.evaluate(() => { K_AUF.clear(); renderKunden(); });
ist("alphabetesch, nëmmen den Numm (Firma virun)", await liste(), ["▶Arendt Paul", "▶Ferro Forum", "▶Weber Anne"]);
await warte(900); await p.click("#kNeu"); await p.fill("#kName", "weber"); await p.fill("#kVorname", "anne"); await warte(900); await p.click("#kOk"); await warte(100);
ist("duebel ofgeleent", await p.locator("#kMeld").innerText(), t => t.includes("gëtt et schonn"));
await p.click("#kZu");
ist("zou: keng Kontaktdaten", await p.locator("#kListe").innerText(), t => !t.includes("rue de l'Usine"));

// Automatesch zouklappen: kuerz an aner Reiter bleift op, no méi wéi 5 min net am Reiter Client geet alles zou
await p.evaluate(() => { K_AUF.add(Z.kunden[0].kid); K_AKEEF.add(Z.kunden[0].kid); renderKunden(); });
await p.click('[data-tab="bestand"]'); await p.click('[data-tab="kunden"]');
ist("kuerz ewech: bleift op", await p.evaluate(() => K_AUF.size), 1);
await p.click('[data-tab="bestand"]'); await p.evaluate(() => { ZU_WEG.kunden = Date.now() - 6 * 60 * 1000; }); await p.click('[data-tab="kunden"]');
ist("no 6 min: alles zou", await p.evaluate(() => [K_AUF.size, K_AKEEF.size, document.querySelectorAll("#kListe .kz-inhalt").length]), [0, 0, 0]);
// Datselwecht am Stock (Archiv vun de Béieren) an an der Iwwersiicht (Zort ▶ an Archiv)
await p.evaluate(() => { ARCHIV_AUF = true; ARCHIV_UEB = true; OFFEN_SORTE = "NEIPA"; });
await p.click('[data-tab="bestand"]'); await p.click('[data-tab="uebersicht"]'); await p.click('[data-tab="bestand"]');
ist("kuerz ewech: Stock/Iwwersiicht bleiwen op", await p.evaluate(() => [ARCHIV_AUF, ARCHIV_UEB, OFFEN_SORTE]), [true, true, "NEIPA"]);
await p.click('[data-tab="kunden"]'); await p.evaluate(() => { ZU_WEG.bestand = ZU_WEG.uebersicht = Date.now() - 6 * 60 * 1000; });
await p.click('[data-tab="bestand"]');
ist("no 6 min: Stock-Archiv zou", await p.evaluate(() => ARCHIV_AUF), false);
await p.click('[data-tab="uebersicht"]');
ist("no 6 min: Iwwersiicht zou", await p.evaluate(() => [ARCHIV_UEB, OFFEN_SORTE]), [false, ""]);
await p.click('[data-tab="kunden"]');

// Sich
await p.fill("#kSuche", "fer"); await warte(100);
ist("Sich", await liste(), ["▶Ferro Forum"]);
await p.fill("#kSuche", "jeff"); await warte(100);
ist("Sich no Kontaktpersoun", await liste(), ["▶Ferro Forum"]);
await p.fill("#kSuche", ""); await warte(100);

// Bestellung: Firma/Numm/Virnumm, tippen → Virschlag → Info, kid gëtt gespäichert
await p.evaluate(() => eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 80 }, { art: "bewegung", sorte: "NEIPA", n: 30, von: "Lager", an: "Laurent" }]));
await p.click('[data-tab="livraisons"]'); await p.click("#lAuf");
ist("dräi Felder", await p.evaluate(() => ["lFirma", "lName", "lVorname"].map(id => !!document.getElementById(id))), [true, true, true]);
await p.click("#lName"); await p.keyboard.type("mul");
ist("Virschlag och iwwer d'Kontaktpersoun", await p.evaluate(() => [...document.querySelectorAll("#lVorschlag button")].map(b => b.textContent)), ["📇 Ferro Forum"]);
await p.click("#lVorschlag button");
ist("Felder ausgefëllt", [await p.inputValue("#lFirma"), await p.inputValue("#lName"), await p.inputValue("#lVorname")], ["Ferro Forum", "Muller", "Jeff"]);
ist("Info mat Adress, keen Haken", [await p.locator("#lKundeInfo").innerText(), await p.locator("#lNeuK").count()], v => v[0].includes("Jeff Muller") && v[0].includes("L-3895 Foetz") && v[1] === 0);
ist("kee datalist", await p.evaluate(() => document.querySelectorAll("datalist, [list]").length), 0);
await p.fill("#lN0", "6"); await p.click("#lOk"); await warte(200);
ist("Bestellung mat kid", await p.evaluate(() => { const L = Z.livraisons[0]; return [L.kunde, L.kid === Z.kunden.find(k => k.firma === "Ferro Forum").kid]; }), ["Ferro Forum", true]);

// Client vun enger geplangter Bestellung (nach keen Verkaf) gëtt och virgeschloen (gemellt: „rei…“ → Reimen David)
await warte(900); await p.click("#lAuf"); await p.fill("#lName", "Reimen David"); await p.fill("#lN0", "2"); await p.click("#lOk"); await warte(200);
await warte(900); await p.click("#lAuf"); await p.click("#lFirma"); await p.keyboard.type("rei");
ist("Virschlag aus geplangter Bestellung", await p.evaluate(() => [...document.querySelectorAll("#lVorschlag button")].map(b => b.textContent)), ["Reimen David"]);
await p.click("#lZu");
// Opgedeelt an änneren: bleift opgedeelt (gemellt: kënnt als „Reimen David“ ganz an Numm zréck)
const rid = await p.evaluate(() => Z.livraisons.find(L => L.kunde === "Reimen David").id);
await warte(900); await p.click(`[data-led="${rid}"]`);
ist("ale Bestellung: ganzen Text an Numm", [await p.inputValue("#lName"), await p.inputValue("#lVorname")], ["Reimen David", ""]);
await p.fill("#lName", "Reimen"); await p.fill("#lVorname", "David"); await p.click("#lOk"); await warte(200);
const rid2 = await p.evaluate(() => Z.livraisons.find(L => L.kunde === "Reimen David").id);
await warte(900); await p.click(`[data-led="${rid2}"]`);
ist("no dem Späicheren bleift et opgedeelt", [await p.inputValue("#lName"), await p.inputValue("#lVorname")], ["Reimen", "David"]);
await p.click("#lZu");
await warte(900); await p.click("#lAuf"); await p.click("#lVorname"); await p.keyboard.type("rei");
await p.click("#lVorschlag button");
ist("Virschlag fëllt déi gespäichert Opdeelung", [await p.inputValue("#lFirma"), await p.inputValue("#lName"), await p.inputValue("#lVorname")], ["", "Reimen", "David"]);
await p.check("#lNeuK"); await p.fill("#lN0", "1"); await p.click("#lOk"); await warte(200);
ist("Client mat Haken ugeluecht", await p.evaluate(() => Z.kunden.filter(k => k.label === "Reimen David").length), 1);
// Zweemol dee selwechte Client? Haken nach eng Kéier mat demselwechten Numm → keen zweeten
await warte(900); await p.click("#lAuf"); await p.fill("#lName", "reimen"); await p.fill("#lVorname", "david"); await warte(100);
ist("bekannt: kee Haken méi", await p.locator("#lNeuK").count(), 0);
await p.click("#lZu");

// Verkafen ouni Haken: keen Client
await p.click('[data-tab="verkaufen"]');
await p.fill("#vVorname", "Tom"); await warte(100);
ist("Haken ugebueden", await p.locator("#vNeuK").count(), 1);
ist("Kontaktfelder zou", await p.locator("#vTel").count(), 0);
await p.click('[data-plus="0"]'); await p.click('[data-bez="bar"]'); await p.click("#vSpeichern"); await warte(200);
ist("Verkaf un Tom, keen Client", await p.evaluate(() => [Z.verkaeufe.some(v => v.kaeufer === "Tom"), Z.kunden.some(k => k.label === "Tom")]), [true, false]);

// Verkafen mat Haken: neie Client mat Telefon, kid um Verkaf
await warte(900);
await p.fill("#vName", "Weber"); await p.fill("#vVorname", "Lisa"); await p.check("#vNeuK"); await warte(100);
ist("Haken → Kontaktfelder op", await p.locator("#vTel").count(), 1);
await p.fill("#vTel", "691 555 666"); await p.fill("#vOrt", "L-5410 Beyren");
await p.click('[data-plus="0"]'); await p.click('[data-plus="0"]'); await p.click('[data-bez="spaeter"]'); await p.click("#vSpeichern"); await warte(200);
const lisa = await p.evaluate(() => { const K = Z.kunden.find(k => k.label === "Weber Lisa"); const v = Z.verkaeufe.find(v => v.kaeufer === "Weber Lisa"); return K && v && [K.tel, K.ort, v.kid === K.kid]; });
ist("Client ugeluecht, Verkaf verbonnen", lisa, ["691 555 666", "L-5410 Beyren", true]);
ist("Meldung", await p.locator("#vMeldung").innerText(), t => t.includes("neie Client"));
await warte(900);
await p.fill("#vVorname", "Lisa"); await p.fill("#vName", "Weber"); await warte(100);
ist("elo bekannt: Kontaktkaart, keen Haken", [await p.locator("#vKundeInfo").innerText(), await p.locator("#vNeuK").count()], v => v[0].includes("691 555 666") && v[1] === 0);
await p.fill("#vVorname", ""); await p.fill("#vName", "");

// Fréiere Keefer: Text kënnt onverännert an d'Feld, selwer opdeelen, ale Numm bleift als alias
await p.evaluate(() => eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: "Marc Gloden", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3 }]));
await warte(900);
await p.click("#vName"); await p.keyboard.type("glo");
ist("fréiere Keefer (Wuertufank)", await p.evaluate(() => [...document.querySelectorAll("#vVorschlag button")].map(b => b.textContent)), ["Marc Gloden"]);
await p.click("#vVorschlag button");
ist("onverännert an d'Feld, an deem getippt gouf", [await p.inputValue("#vFirma"), await p.inputValue("#vName"), await p.inputValue("#vVorname")], ["", "Marc Gloden", ""]);
await p.fill("#vName", "Gloden"); await p.fill("#vVorname", "Marc"); await p.fill("#vFirma", "BEST");
await p.check("#vNeuK"); await p.click('[data-plus="0"]'); await p.click('[data-bez="bar"]'); await p.click("#vSpeichern"); await warte(200);
ist("Client BEST mat alias", await p.evaluate(() => { const K = Z.kunden.find(k => k.label === "BEST"); return K && [K.name, K.vorname, K.alias]; }), ["Gloden", "Marc", ["Marc Gloden"]]);
ist("alen Akaf weist elo den aktuellen Numm", await p.evaluate(() => Z.verkaeufe.filter(v => v.kaeuferText === "Marc Gloden").map(v => v.kaeufer)), ["BEST"]);
ist("Ausstoend/Keefer: kee „Marc Gloden“ méi", await p.evaluate(() => Z.kaeufer.map(k => k.name).includes("Marc Gloden")), false);

// Akeef
await p.click('[data-tab="kunden"]');
const kid = n => p.evaluate(n => Z.kunden.find(k => k.label === n).kid, n);
await p.evaluate(() => { K_AUF.clear(); K_AKEEF.clear(); renderKunden(); });
await p.click(`[data-kauf="${await kid("Ferro Forum")}"]`);
ist("Akeef zou", await p.locator("#kListe").innerText(), t => t.includes("Akeef (1)") && !t.includes("geplangt"));
await p.click(`[data-kakeef="${await kid("Ferro Forum")}"]`);
ist("Akeef: geplangt Bestellung", await p.locator("#kListe").innerText(), t => t.includes("geplangt"));
await warte(900); await p.click(`[data-kauf="${await kid("BEST")}"]`); await p.click(`[data-kakeef="${await kid("BEST")}"]`);
ist("Akeef BEST: alen an neien Akaf", await p.locator("#kListe").innerText(), t => t.includes("Akeef (2)"));

// Ëmbenennen: Bestellung a Verkaf weisen den neien Numm, näischt fält eraus
await warte(900); await p.click(`[data-ked="${await kid("BEST")}"]`);
await p.fill("#kFirma", "BEST Sàrl"); await p.click("#kOk"); await warte(200);
ist("ëmbenannt, alias huet den ale Firmennumm", await p.evaluate(() => Z.kunden.find(k => k.label === "BEST Sàrl").alias), a => a.includes("BEST"));
ist("Akeef nach ëmmer 2", await p.locator("#kListe").innerText(), t => t.includes("Akeef (2)"));
await warte(900); await p.click(`[data-ked="${await kid("BEST Sàrl")}"]`);
await p.fill("#kVorname", "Marcel"); await p.click("#kOk"); await warte(200);
ist("Virnumm geännert: ale Numm bleift als alias", await p.evaluate(() => Z.kunden.find(k => k.label === "BEST Sàrl").alias), a => a.includes("Marc Gloden") && a.includes("BEST"));
ist("Akeef bleift 2", await p.evaluate(() => kaeufeVon(Z, Z.kunden.find(k => k.label === "BEST Sàrl")).length), 2);
await warte(900); await p.click(`[data-ked="${await kid("Ferro Forum")}"]`);
await p.fill("#kFirma", "Ferro Forum Foetz"); await p.click("#kOk"); await warte(200);
ist("Bestellung weist neie Numm", await p.evaluate(() => Z.livraisons.map(L => L.kunde)), a => a.includes("Ferro Forum Foetz") && !a.includes("Ferro Forum"));
await p.click('[data-tab="livraisons"]');
ist("an der Lëscht vun de Bestellungen", await p.locator("#lListe").innerText(), t => t.includes("Ferro Forum Foetz"));
await warte(900); await p.click("[data-led]");
ist("Bestellung änneren: Felder vum Client", [await p.inputValue("#lFirma"), await p.inputValue("#lName"), await p.locator("#lKundeInfo").innerText()], v => v[0] === "Ferro Forum Foetz" && v[1] === "Muller" && v[2].includes("📇"));
await p.evaluate(() => { L_NEU = false; LFORM = null; TAB = "kunden"; render(); });

// Änneren a läschen
await warte(900); await p.click(`[data-kauf="${await kid("Arendt Paul")}"]`); await p.click(`[data-ked="${await kid("Arendt Paul")}"]`);
await p.fill("#kOrt", "L-1234 Luxembourg"); await p.click("#kOk"); await warte(200);
ist("geännert, net duebel", await p.evaluate(() => Z.kunden.filter(k => k.name === "Arendt").map(k => k.ort)), ["L-1234 Luxembourg"]);
await warte(900); await p.click(`[data-kauf="${await kid("Weber Lisa")}"]`); await p.click(`[data-kweg="${await kid("Weber Lisa")}"]`); await warte(200);
ist("geläscht", await p.evaluate(() => Z.kunden.map(k => k.label)), ["Arendt Paul", "BEST Sàrl", "Ferro Forum Foetz", "Reimen David", "Weber Anne"]);
ist("Verkaf bleift (mam gespäicherten Numm)", await p.evaluate(() => Z.kaeufer.some(k => k.name === "Weber Lisa")), true);

// Nëmmen Virnumm am Client-Reiter
await warte(900); await p.click("#kNeu"); await p.fill("#kVorname", "Jos"); await warte(900); await p.click("#kOk"); await warte(200);
ist("nëmmen Virnumm geet", await p.evaluate(() => Z.kunden.some(k => k.label === "Jos")), true);

// Al Clienten (Fassung c, nëmmen „name“) ginn zu Firma
await p.evaluate(() => eintragen([{ art: "kunde", kid: "alt-kunde-1", name: "Café Millebières", ort: "Beyren" }]));
ist("ale Client = Firma", await p.evaluate(() => { const K = Z.kunden.find(k => k.kid === "alt-kunde-1"); return [K.firma, K.name, K.label]; }), ["Café Millebières", "", "Café Millebières"]);
ist("keng Säitefeeler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Kunden: alles bestanden");
process.exit(fehler ? 1 : 0);
