// Browser: Dateien je Bier — Etikett (PDF) mit Vorschaubild, Foto, große Datei in Stücken, zweites Handy liest
// alles (Byte für Byte), Anzeige (PDF-Seiten als Bild), Ersetzen, Löschen. Echter Worker-Code, nachgebaute D1.
// pdf.js 3.11.174 lokal: PDFJS_DIR=/pfad/zu/pdfjs-dist/build (sonst ohne Vorschau/Anzeige-Prüfung).
import { readFileSync, existsSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import worker from "../worker.js";
import { fakeD1 } from "./fake-d1.mjs";
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
const PDFJS_DIR = process.env.PDFJS_DIR || "";
const mitPdfjs = PDFJS_DIR && existsSync(PDFJS_DIR + "/pdf.min.js");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const env = { DB: fakeD1(), CODE: "hopfen" };
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const b = await pw.chromium.launch();
// Beispieldateien: ein PDF (von Chromium gedruckt), ein PNG, 1,5 MB Zufall
const hilf = await b.newPage();
await hilf.setContent("<h1 style='font:60px sans-serif;color:#c00'>RUSTY Etikett</h1><p>Seite 1</p><div style='page-break-before:always'>Seite 2</div>");
const pdf = await hilf.pdf({ format: "A6" });
await hilf.setContent("<div style='width:400px;height:300px;background:linear-gradient(red,blue)'></div>");
const png = await hilf.screenshot({ clip: { x: 0, y: 0, width: 400, height: 300 } });
const gross = randomBytes(1500 * 1024);
await hilf.close();
const sha = buf => createHash("sha256").update(buf).digest("hex");

async function handy(ich) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.seitenfehler = []; p.on("pageerror", e => p.seitenfehler.push(e.message));
  p.on("dialog", d => d.accept());
  // Dauerhafter Empfänger: nimmt man ihn je Upload neu, schaltet Playwright das Abfangen zu spät wieder ein.
  p.auswahl = []; p.on("filechooser", fc => p.auswahl.push(fc));
  await p.route("https://app.test/**", r => r.fulfill({ body: html, contentType: "text/html" }));
  await p.route(/workers\.dev/, async r => {
    const res = await worker.fetch(new Request("https://w/", { method: "POST", body: r.request().postData() }), env);
    r.fulfill({ status: res.status, body: await res.text(), contentType: "application/json" });
  });
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js/, r => {
    const datei = r.request().url().split("/").pop();
    return mitPdfjs ? r.fulfill({ body: readFileSync(PDFJS_DIR + "/" + datei), contentType: "text/javascript" }) : r.abort();
  });
  await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; }); // Tests rechnen mit leeren Daten
  await p.goto("https://app.test/index.html");
  await p.evaluate(ich => { EIN = { code: "hopfen", ich }; render(); abgleichen(); }, ich);
  return p;
}
const hoch = async (p, feld, name, mimeType, buffer) => {
  await warte(900); // Doppeltipp-Schutz: derselbe Knopf innerhalb 800 ms zählt nicht (ein Mensch wählt nicht so schnell)
  p.auswahl.length = 0;
  await p.click(`#bierDok [data-hoch="${feld}"]`);
  for (let i = 0; i < 100 && !p.auswahl.length; i++) await warte(50);
  if (!p.auswahl.length) throw new Error("keine Dateiauswahl für " + feld);
  await p.auswahl.shift().setFiles({ name, mimeType, buffer });
  await p.waitForFunction(() => !UPLOAD, null, { timeout: 30000 });
  await warte(300);
};

const A = await handy("Laurent");
await A.evaluate(() => { TAB = "bestand"; render(); });
await A.click("#bierNeu"); await A.fill("#biName", "Rusty"); await A.fill("#biPreis", "3"); await A.click("#biOk"); await warte(300);
ist("nach Anlegen: Dokumente sichtbar", await A.locator("#bierDok").innerText(), s => s.includes("Etikett") && s.includes("Rezept") && s.includes("Brauprotokoll") && s.includes("ANER DATEIEN"));

await hoch(A, "etikett", "rusty-etikett.pdf", "application/pdf", pdf);
ist("Etikett hochgeladen", await A.evaluate(() => dateienVon(Z, "Rusty").etikett && dateienVon(Z, "Rusty").etikett.name), "rusty-etikett.pdf");
if (mitPdfjs) ist("Etikett: Vorschaubild (erste PDF-Seite)", await A.evaluate(() => { const i = document.querySelector("#bierDok [data-thumb] img"); return !!(i && i.src.startsWith("data:image/jpeg")); }), true);
await hoch(A, "anner", "foto.png", "image/png", png);
await hoch(A, "anner", "gross.bin", "application/octet-stream", gross);
const gd = await A.evaluate(() => dateienVon(Z, "Rusty").anner.find(d => d.name === "gross.bin"));
ist("große Datei in 3 Stücken", gd.teile, 3);
ist("Stücke beim Server", [...env.DB.teile.keys()].filter(k => k.startsWith(gd.fid + "#")).length, 3);

// Zweites Handy: sieht alles, lädt Vorschau vom Server, öffnet Byte für Byte gleich
const B = await handy("Jeff");
await B.waitForFunction(() => Z.dateien.length >= 3, null, { timeout: 10000 }); // erster Abgleich
await B.evaluate(() => { TAB = "bestand"; render(); });
ist("Bier-Karte zeigt Dateien", await B.locator("#bBiere").innerText(), s => s.includes("📎 Etikett · 2 aner"));
await B.click('[data-bed="Rusty"]'); await warte(800);
if (mitPdfjs) ist("Handy 2: Vorschaubild vom Server", await B.evaluate(() => [...document.querySelectorAll("#bierDok [data-thumb] img")].length), 2);
const hashB = await B.evaluate(async () => {
  const D = dateienVon(Z, "Rusty").anner.find(d => d.name === "gross.bin");
  const datei = await dateiDaten(D);
  const h = await crypto.subtle.digest("SHA-256", await datei.arrayBuffer());
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, "0")).join("");
});
ist("große Datei Byte für Byte gleich", hashB, sha(gross));
await B.click(`#bierDok [data-auf="${await B.evaluate(() => dateienVon(Z, "Rusty").etikett.fid)}"]`);
if (mitPdfjs) {
  await B.waitForFunction(() => document.querySelectorAll("#ansichtInhalt canvas").length === 2, null, { timeout: 20000 });
  ist("Anzeige: beide PDF-Seiten", await B.evaluate(() => document.querySelectorAll("#ansichtInhalt canvas").length), 2);
}
ist("Anzeige offen mit Name", [await B.locator("#ansicht").isVisible(), await B.locator("#ansichtName").innerText()], [true, "rusty-etikett.pdf"]);
await B.click("#ansichtZu");
ist("Anzeige zu", await B.locator("#ansicht").isVisible(), false);

// Ersetzen und Löschen
await hoch(B, "etikett", "rusty-etikett-v2.pdf", "application/pdf", pdf);
ist("Ersetzt: neues Etikett gilt", await B.evaluate(() => dateienVon(Z, "Rusty").etikett.name), "rusty-etikett-v2.pdf");
await warte(900);
await B.click(`#bierDok [data-dweg="${await B.evaluate(() => dateienVon(Z, "Rusty").anner.find(d => d.name === "foto.png").fid)}"]`); await warte(300);
ist("Foto gelöscht", await B.evaluate(() => dateienVon(Z, "Rusty").anner.map(d => d.name)), ["gross.bin"]);
await A.evaluate(() => abgleichen()); await warte(400);
ist("Handy 1 sieht Ersetzen und Löschen", await A.evaluate(() => [dateienVon(Z, "Rusty").etikett.name, dateienVon(Z, "Rusty").anner.length]), ["rusty-etikett-v2.pdf", 1]);
ist("zu groß wird abgelehnt", await A.evaluate(async () => { let m = ""; const alt = window.alert; window.alert = t => { m = t; }; await dateiHochladen(new File([new Uint8Array(11 * 1024 * 1024)], "riesig.bin"), "Rusty", "anner"); window.alert = alt; return m; }), s => s.includes("maximal 10 MB"));
ist("keine Seitenfehler", [...A.seitenfehler, ...B.seitenfehler], []);
if (!mitPdfjs) console.log("– PDF-Vorschau/Anzeige übersprungen (PDFJS_DIR nicht gesetzt)");
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Dateien: alles bestanden");
process.exit(fehler ? 1 : 0);
