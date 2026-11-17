// Browser: Livraison planen → geliwwert → Rechnung → bezuelt; Liste pro Bier; Excel-Export (Datei wird gelesen).
// Excel-Teil braucht SheetJS 0.18.5 lokal: XLSX_JS=/pfad/zu/xlsx.full.min.js (sonst übersprungen).
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
const XLSX_JS = process.env.XLSX_JS || "";
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));

const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
p.on("dialog", d => d.accept());
await p.route(/workers\.dev/, r => r.abort());
await p.route(/cdnjs\.cloudflare\.com/, r => XLSX_JS && existsSync(XLSX_JS) ? r.fulfill({ body: readFileSync(XLSX_JS), contentType: "text/javascript" }) : r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); EIN = { code: "x", ich: "Marc" }; render(); });
await p.evaluate(() => eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 100 }, { art: "abfuellung", sorte: "Brown Porter", n: 50 }]));
await warte(100);

await p.click('[data-tab="livraisons"]');
await p.click("#lAuf");
ist("Huelen aus: Vorgabe eigener Name, Auswahl erst nach Änneren", [await p.locator("#lAusText").innerText(), await p.locator("#lAus").count()], ["Marc", 0]);
await p.click("#lAusAendern");
ist("Änneren zeigt Auswahl", await p.evaluate(() => [...document.querySelectorAll("#lAus option")].map(o => o.value)), ["Lager", "Jeff", "Marc", "Claude", "Laurent"]);
await p.selectOption("#lAus", "Lager");
await p.fill("#lFirma", "Ferro Forum");
await p.fill("#lDatum", "2026-12-05");
await p.fill("#lAnlass", "Oarbechterkiermes");
await p.fill("#lN0", "24"); await p.fill("#lN2", "12");
ist("Betrag automatisch 36 × 3", await p.inputValue("#lBetrag"), "108");
await p.fill("#lBetrag", "90");
await p.click("#lOk"); await warte(200);
ist("geplant angezeigt", await p.locator("#lListe").innerText(), s => s.includes("Ferro Forum") && s.includes("5.12.2026") && s.includes("Geplangt (1)"));
ist("Reiter zeigt 1 geplante", await p.locator('[data-tab="livraisons"]').innerText(), s => s.includes("1"));
ist("Lager noch voll", await p.evaluate(() => hat(Z, "Lager", "NEIPA")), 100);

await p.click("[data-geliwwert]"); await warte(200);
ist("geliwwert: aus dem Lager", await p.evaluate(() => [hat(Z, "Lager", "NEIPA"), hat(Z, "Lager", "Brown Porter")]), [76, 38]);
ist("geliwwert: Rechnung offen, Betrag offen", await p.locator("#lListe").innerText(), s => s.includes("Rechnung nach ze maachen") && s.includes("90 € op"));
ist("steht unter Ausstoend", await p.evaluate(() => Z.kaeufer.find(k => k.name === "Ferro Forum").offen), 90);
await p.click("[data-rechnung]"); await warte(900);
await p.click("[data-lbezuelt]"); await p.click("#zahlWahl [data-wie=\"bank\"]"); await warte(200);
ist("Rechnung gemaach und bezuelt", await p.locator("#lListe").innerText(), s => s.includes("Rechnung gemaach") && s.includes("✓ bezuelt"));
ist("Kasse", await p.evaluate(() => Z.kasse), 90);

// zweite Livraison nur planen
await p.click("#lAuf"); await p.fill("#lFirma", "BEST"); await p.fill("#lDatum", "2026-12-20"); await p.click('[data-lplus="0"]'); await p.click("#lOk"); await warte(200);

// Geplante Bestellung ändern: Datum und Menge korrigieren
await warte(900);
const bestId = await p.evaluate(() => Z.livraisons.find(L => L.kunde === "BEST").id);
await p.click(`[data-led="${bestId}"]`); await warte(200);
await p.evaluate(() => { L_NEU = false; LFORM = null; renderLForm(); });
await p.evaluate(() => { document.body.style.minHeight = "4000px"; window.scrollTo(0, 0); });
await warte(900); await p.click("#lAuf"); await warte(1000);
ist("Nei Bestellung: rutscht erop, Iwwerschrëft net ënnert dem Kapp", await p.evaluate(() => { const t = document.querySelector("#lForm h2").getBoundingClientRect().top, k = document.querySelector("header").getBoundingClientRect().bottom; return t >= k && t < k + 60; }), true);
await p.evaluate(() => { document.body.style.minHeight = ""; });
await p.evaluate(() => { L_NEU = false; LFORM = null; renderLForm(); window.scrollTo(0, 0); });
await warte(900); await p.click(`[data-led="${bestId}"]`); await warte(200);
await warte(1000);
ist("Bestellung änneren: Iwwerschrëft net ënnert dem Kapp", await p.evaluate(() => document.querySelector("#lForm h2").getBoundingClientRect().top >= document.querySelector("header").getBoundingClientRect().bottom), true);
ist("Formular vorbelegt", [await p.locator("#lForm h2").innerText(), await p.inputValue("#lFirma"), await p.inputValue("#lDatum"), await p.locator("#lOk").innerText()], ["Bestellung änneren", "BEST", "2026-12-20", "Späicheren"]);
await p.evaluate(() => { document.body.style.minHeight = "4000px"; });
await p.click("#lZu"); await warte(300);
ist("Ofbriechen: ganz no uewen", await p.evaluate(() => window.scrollY), 0);
await p.evaluate(() => { document.body.style.minHeight = ""; });
await warte(900); await p.click(`[data-led="${bestId}"]`); await warte(200);
await p.fill("#lDatum", "2026-12-21");
const iN = await p.evaluate(() => lArtikel().findIndex(x => x.key === "NEIPA"));
await p.fill(`#lN${iN}`, "4");
ist("Betrag rechnet neu", await p.inputValue("#lBetrag"), "12");
await p.click("#lOk"); await warte(300);
ist("geändert: nur noch eine BEST, neue Werte", await p.evaluate(() => Z.livraisons.filter(L => L.kunde === "BEST").map(L => [L.datum, L.posten[0].n, L.betrag])), [["2026-12-21", 4, 12]]);
ist("Reservierung angepasst", await p.evaluate(() => reserviertBei(Z, "Marc", "NEIPA")), 4);
ist("Meldung", await p.locator("#lMeld").innerText(), t => t.includes("Geännert: BEST"));
ist("gelieferte Bestellung ohne Änneren", await p.evaluate(() => { const L = Z.livraisons.find(x => x.kunde === "Ferro Forum"); return !!document.querySelector(`[data-led="${L.id}"]`); }), false);

// All / Just meng: Bestellung von Jeff (Kontakt Jeff, aus Lager) nur bei All
await p.evaluate(() => eintragen([{ art: "livraison", kunde: "Rock Solid", kontakt: "Jeff", aus: "Lager", datum: "2026-12-30", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 18, rechnung: false }]));
await warte(300);
const kunden = async () => (await p.locator("#lListe").innerText());
ist("All: alle Bestellungen", await kunden(), t => t.includes("Rock Solid") && t.includes("BEST") && t.includes("Ferro Forum"));
await p.click('[data-lmeine="1"]');
ist("Just meng (Marc): ohne Jeffs Bestellung", await kunden(), t => !t.includes("Rock Solid") && t.includes("BEST") && t.includes("Ferro Forum"));
await p.click('[data-lmeine="0"]');
ist("zurück auf All", await kunden(), t => t.includes("Rock Solid"));
await p.evaluate(() => eintragen([{ art: "storno", ref: Z.livraisons.find(L => L.kunde === "Rock Solid").id }])); await warte(200);

// Liste pro Bier in der Iwwersiicht
await p.click('[data-tab="uebersicht"]');
await p.click('tr[data-sorte="NEIPA"]');
const detail = await p.locator("#t-uebersicht").innerText();
ist("pro Bier: Ferro Forum und geplante BEST", detail, s => s.includes("NEIPA: wien huet wat wiem verkaaft") && s.includes("Ferro Forum") && s.includes("BEST") && s.includes("21.12.2026 · beim Marc · geplangt"));
await p.click('tr[data-sorte="NEIPA"]');
ist("zuklappen", await p.locator("#t-uebersicht").innerText(), s => !s.includes("NEIPA: wien huet wat wiem"));

// Excel
if (XLSX_JS && existsSync(XLSX_JS)) {
  await p.evaluate(() => { eintragen([{ art: "kunde", v: 2, kid: "k-ferro-01", firma: "Ferro Forum", name: "Muller", vorname: "Jeff",
    adresse: "1, rue de l'Usine\nBâtiment B", ort: "L-3895 Foetz", tel: "+352 621 123 456", mail: "info@ferroforum.lu", notiz: "Rechnung per Mail" },
    { art: "kunde", v: 2, kid: "k-best-001", firma: "BEST", name: "", vorname: "" }]); render(); });
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("[data-excel]")]);
  const pfad = await dl.path();
  const require = createRequire(XLSX_JS);
  const X = require(XLSX_JS);
  const wb = X.read(readFileSync(pfad), { cellNF: true });
  ist("Excel: Blätter", wb.SheetNames, ["NEIPA", "Brown Porter", "Bestellungen", "Clienten", "Stock", "Ze maachen"]);
  const kl = X.utils.sheet_to_json(wb.Sheets.Clienten, { header: 1, defval: "" });
  const kk = kl.findIndex(r => r[0] === "Firma");
  ist("Excel Clienten: Kopf", kl[kk], ["Firma", "Numm", "Virnumm", "Adress", "Uertschaft", "Telefon", "E-Mail", "Remarque", "Akeef", "Total", "dovun op", "geplangt", "Leschten Akaf"]);
  ist("Excel Clienten: alphabetisch, BEST mit geplanter Bestellung", kl[kk + 1].slice(0, 1).concat(kl[kk + 1].slice(8, 12)), ["BEST", 1, 0, 0, 12]);
  ist("Excel Clienten: Ferro Forum ganz", kl[kk + 2], ["Ferro Forum", "Muller", "Jeff", "1, rue de l'Usine, Bâtiment B", "L-3895 Foetz", "+352 621 123 456", "info@ferroforum.lu", "Rechnung per Mail", 1, 90, 0, 0, "5.12.2026"]);
  const neipa = X.utils.sheet_to_json(wb.Sheets.NEIPA, { header: 1, defval: "" });
  const kopf = neipa.findIndex(r => r[0] === "Datum");
  ist("Excel NEIPA: Kopf", neipa[kopf].slice(0, 9), ["Datum", "Client", "Kontakt", "Unzuel", "Gebinde", "Präis", "Recetten", "geliwwert?", "bezuel?"]);
  ist("Excel NEIPA: Ferro Forum", neipa[kopf + 1].slice(0, 10), ["5.12.2026", "Ferro Forum", "Marc", 24, "Fläsch", 2.5, 60, "Jo", "Jo", "Iwwerweisung"]);
  ist("Excel NEIPA: BEST geplant", neipa[kopf + 2].slice(1, 8), ["BEST", "Marc", 4, "Fläsch", 3, 12, "geplangt 21.12.2026"]);
  ist("Excel NEIPA: Total ohne geplant", neipa[neipa.length - 1].slice(0, 7), ["Total", "", "", 24, "Fläschen", "", 60]);
  ist("Excel: Euro-Format", wb.Sheets.NEIPA[X.utils.encode_cell({ r: kopf + 1, c: 5 })].z, '#,##0.00 "€"');
  const liv = X.utils.sheet_to_json(wb.Sheets.Bestellungen, { header: 1, defval: "" });
  ist("Excel Livraisons", liv.filter(r => r[1] === "Ferro Forum" || r[1] === "BEST").map(r => [r[1], r[6], r[7], r[8], r[9]]), [["Ferro Forum", "Jo", "gemaach", "Jo", "Iwwerweisung"], ["BEST", "geplangt", "nach ze maachen", "–", ""]]);
  // Altbestand mit zwei gleich aussehenden Bieren: Export klappt trotzdem, Blattnamen eindeutig
  await p.evaluate(() => eintragen([{ art: "bier", name: "NEIPA", preis: 3, braudatum: "2026-07-28" }, { art: "bier", name: "NEIPA (28.07.2026)", preis: 3, braudatum: "2026-07-28" }, { art: "abfuellung", sorte: "NEIPA (28.07.2026)", n: 5 }]));
  await warte(900);
  const [dl2] = await Promise.all([p.waitForEvent("download"), p.click("[data-excel]")]);
  const wb2 = X.read(readFileSync(await dl2.path()));
  ist("Excel: gleiche Namen → eindeutige Blätter", wb2.SheetNames.filter(n => n.startsWith("NEIPA")), ["NEIPA (28.07.2026)", "NEIPA (28.07.2026) (2)"]);
} else console.log("– Excel-Teil übersprungen (XLSX_JS nicht gesetzt)");
// Alter Worker (kennt „livraison“ nicht): normale Verkäufe dürfen nicht hängen bleiben.
{
  const p2 = await b.newPage();
  p2.on("pageerror", e => seitenfehler.push(e.message));
  const db = [];
  await p2.route(/workers\.dev/, async r => {
    const q = JSON.parse(r.request().postData() || "{}");
    if (q.aktion === "neu") {
      if (q.eintraege.some(e => !["abfuellung", "bewegung", "abgang", "verkauf", "zahlung", "einstellungen", "storno"].includes(e.art)))
        return r.fulfill({ status: 400, body: JSON.stringify({ fehler: "Ongëlteg Agab: art" }), contentType: "application/json" });
      for (const e of q.eintraege) if (!db.some(x => x.id === e.id)) db.push(e);
    }
    r.fulfill({ body: JSON.stringify({ eintraege: db }), contentType: "application/json" });
  });
  await p2.addInitScript(() => { window.OHNE_ALTIMPORT = true; }); // nur der Test-Eintrag, keine alten Verkäufe
  await p2.goto(new URL("../index.html", import.meta.url).href);
  await p2.evaluate(() => { localStorage.clear(); EIN = { code: "x", ich: "Jeff" }; render(); });
  await p2.evaluate(() => {
    eintragen([{ art: "livraison", kunde: "X", kontakt: "Jeff", aus: "Lager", datum: "2026-12-01", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3, rechnung: false }]);
    eintragen([{ art: "verkauf", verkaeufer: "Jeff", kaeufer: "Paul", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6 }]);
  });
  await warte(800);
  ist("alter Worker: Verkauf kommt trotzdem an", db.map(e => e.art), ["verkauf"]);
  ist("alter Worker: Livraison wartet mit Hinweis", [await p2.evaluate(() => AUSGANG.map(e => e.art)), await p2.evaluate(() => document.querySelector("#syncInfo").textContent)], v => v[0].join() === "livraison" && v[1].includes("Worker muss aktualiséiert"));
  await p2.close();
}
// Vorauszahlung (vom Nutzer, Fassung h): kein eigener Knopf, die Bezahl-Zeile an der geplanten Bestellung antippen
{
  const p3 = await b.newPage({ viewport: { width: 390, height: 844 } });
  p3.on("dialog", d => d.accept());
  await p3.route(/workers\.dev/, r => r.abort());
  await p3.addInitScript(() => { window.OHNE_ALTIMPORT = true; });
  await p3.goto(new URL("../index.html", import.meta.url).href);
  await p3.evaluate(() => { localStorage.clear(); localStorage.setItem("millebeier_v1", JSON.stringify({ code: "x", ich: "Laurent" })); });
  await p3.reload();
  await p3.evaluate(() => { eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 100 },
    { art: "livraison", kunde: "TC Smash", kontakt: "Laurent", aus: "Lager", datum: plusTage(heuteLux(), 3), posten: [{ sorte: "NEIPA", n: 24 }], betrag: 72, rechnung: false }]);
    TAB = "livraisons"; render(); });
  ist("Vorauszahlung: Zeile statt Knopf, Knöpfe bleiben in einer Zeile", await p3.evaluate(() => [document.querySelector("[data-lvor]").textContent.trim(), document.querySelector("#lListe .knopfe.einz").children.length]), ["💶 Nach net bezuelt ›", 4]);
  await p3.click("[data-lvor]");
  ist("Fenster: Wéivill? mit ganzem Betrag", [await p3.locator("#zahlBetrag").isVisible(), await p3.inputValue("#zahlWieviel")], [true, "72"]);
  await p3.fill("#zahlWieviel", "30");
  await p3.click('#zahlWahl [data-wie="bar"]'); await warte(200);
  ist("Acompte: 30 € Bar — 42 € op", await p3.locator("[data-lvor]").innerText(), t => t.includes("30 € Acompte · Bar — 42 € op"));
  ist("in der Kasse", await p3.evaluate(() => Z.kasse), 30);
  await warte(900); await p3.click("[data-lvor]");
  ist("Rest vorbelegt", await p3.inputValue("#zahlWieviel"), "42");
  await p3.fill("#zahlWieviel", "50");
  await p3.click('#zahlWahl [data-wie="wero"]');
  ist("zu viel: abgelehnt, Fenster bleibt", [await p3.locator("#zahlWahl").isVisible(), await p3.evaluate(() => Z.kasse)], [true, 30]);
  await p3.fill("#zahlWieviel", "42"); await warte(900);
  await p3.click('#zahlWahl [data-wie="wero"]'); await warte(200);
  ist("ganz bezahlt: grüne Zeile, nicht mehr antippbar", [await p3.locator("#lListe .chip.ok").innerText(), await p3.locator("[data-lvor]").count()], [ "✓ 72 € bezuelt · Bar, WERO", 0]);
  ist("Aufgabe: huet scho bezuelt — nach liwweren", await p3.evaluate(() => aufStand().op.map(a => a.text)), t => t.includes("TC Smash huet scho bezuelt — nach liwweren"));
  // Löschen fragt nach; „Nee“ lässt alles stehen
  await p3.click("[data-lweg]");
  ist("Löschen fragt nach (schon bezahlt)", await p3.locator("#frageWahl").innerText(), t => t.includes("72 € bezuelt") && t.includes("zréckbezuelt"));
  await p3.click('#frageWahl [data-wahl="nee"]'); await warte(200);
  ist("„Nee“: Bestellung bleibt", await p3.evaluate(() => [Z.livraisons.length, Z.kasse]), [1, 72]);
  // Liefern: angerechnet, nichts unter Ausstoend
  await p3.click("[data-geliwwert]"); await warte(200);
  ist("geliefert: bezahlt, nichts offen", await p3.evaluate(() => [Z.verkaeufe[0].offen, Z.offen, Z.kasse, aufStand().op.some(a => a.typ === "liwweren")]), [0, 0, 72, false]);
  await p3.close();
}
ist("Reiter heißt Bestellungen", await p.evaluate(() => document.querySelector('[data-tab="livraisons"]').textContent.includes("Bestellungen")), true);
ist("keine Seitenfehler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Livraisons: alles bestanden");
process.exit(fehler ? 1 : 0);
