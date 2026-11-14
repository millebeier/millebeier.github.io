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
await p.fill("#lKunde", "Ferro Forum");
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
await p.click("#lAuf"); await p.fill("#lKunde", "BEST"); await p.fill("#lDatum", "2026-12-20"); await p.click('[data-lplus="0"]'); await p.click("#lOk"); await warte(200);

// Liste pro Bier in der Iwwersiicht
await p.click('[data-tab="uebersicht"]');
await p.click('tr[data-sorte="NEIPA"]');
const detail = await p.locator("#t-uebersicht").innerText();
ist("pro Bier: Ferro Forum und geplante BEST", detail, s => s.includes("NEIPA: wien huet wat wiem verkaaft") && s.includes("Ferro Forum") && s.includes("BEST") && s.includes("20.12.2026 · beim Marc · geplangt"));
await p.click('tr[data-sorte="NEIPA"]');
ist("zuklappen", await p.locator("#t-uebersicht").innerText(), s => !s.includes("NEIPA: wien huet wat wiem"));

// Excel
if (XLSX_JS && existsSync(XLSX_JS)) {
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("[data-excel]")]);
  const pfad = await dl.path();
  const require = createRequire(XLSX_JS);
  const X = require(XLSX_JS);
  const wb = X.read(readFileSync(pfad), { cellNF: true });
  ist("Excel: Blätter", wb.SheetNames, ["NEIPA", "Brown Porter", "Livraisons", "Stock"]);
  const neipa = X.utils.sheet_to_json(wb.Sheets.NEIPA, { header: 1, defval: "" });
  const kopf = neipa.findIndex(r => r[0] === "Datum");
  ist("Excel NEIPA: Kopf", neipa[kopf].slice(0, 9), ["Datum", "Client", "Kontakt", "Unzuel", "Gebinde", "Präis", "Recetten", "geliwwert?", "bezuel?"]);
  ist("Excel NEIPA: Ferro Forum", neipa[kopf + 1].slice(0, 10), ["5.12.2026", "Ferro Forum", "Marc", 24, "Fläsch", 2.5, 60, "Jo", "Jo", "Iwwerweisung"]);
  ist("Excel NEIPA: BEST geplant", neipa[kopf + 2].slice(1, 8), ["BEST", "Marc", 1, "Fläsch", 3, 3, "geplangt 20.12.2026"]);
  ist("Excel NEIPA: Total ohne geplant", neipa[neipa.length - 1].slice(0, 7), ["Total", "", "", 24, "Fläschen", "", 60]);
  ist("Excel: Euro-Format", wb.Sheets.NEIPA[X.utils.encode_cell({ r: kopf + 1, c: 5 })].z, '#,##0.00 "€"');
  const liv = X.utils.sheet_to_json(wb.Sheets.Livraisons, { header: 1, defval: "" });
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
  ist("alter Worker: Livraison wartet mit Hinweis", [await p2.evaluate(() => AUSGANG.map(e => e.art)), await p2.locator("#sync").innerText()], v => v[0].join() === "livraison" && v[1].includes("Worker muss aktualiséiert"));
  await p2.close();
}
ist("keine Seitenfehler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Livraisons: alles bestanden");
process.exit(fehler ? 1 : 0);
