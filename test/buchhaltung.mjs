// Browser: Buchhaltung (Fassung 22.11.2026 a) — Zeitraum, Filter, Kassenbuch mit fester Nummer (auch storniert), Verkéf mit Bier-Anteil,
// Rechnungsjournal inkl. storniert, Ausstoend zum Stichtag, Stock Anfang/Ende, Ännerungen, Druck-PDF der Liste, Sammel-PDF der
// Rechnungen (ANNULÉE), Zahltag im Zahlungsfenster. PDF-Teil braucht JSPDF_JS (sonst übersprungen, Rückgabe 0), Excel-Teil XLSX_JS.
import { readFileSync, existsSync } from "node:fs";
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
import worker from "../worker.js";
import { fakeD1 } from "./fake-d1.mjs";

const JSPDF_JS = process.env.JSPDF_JS || "", XLSX_JS = process.env.XLSX_JS || "";
if (!JSPDF_JS || !existsSync(JSPDF_JS)) { console.log("– übersprungen: JSPDF_JS fehlt"); process.exit(0); }
const URL_W = "https://worker.test/";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/const WORKER_URL = "[^"]*";/, `const WORKER_URL = "${URL_W}";`);
const DB = fakeD1(), env = { DB, CODE: "hopfen" };
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); if (!ok) { fehler++; console.log("✗", was, "→", JSON.stringify(a)); } else console.log("✓", was); };
const warte = ms => new Promise(r => setTimeout(r, ms));
const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const konsole = []; p.on("pageerror", e => konsole.push(String(e))); p.on("dialog", d => d.accept());
await p.route("https://app.test/**", r => { const pfad = new URL(r.request().url()).pathname;
  if (pfad.endsWith(".png")) return r.fulfill({ body: readFileSync(new URL(".." + pfad, import.meta.url)), contentType: "image/png" });
  r.fulfill({ body: html, contentType: "text/html" }); });
await p.route(/cdnjs\.cloudflare\.com/, r => { const u = r.request().url();
  if (u.includes("jspdf")) return r.fulfill({ body: readFileSync(JSPDF_JS), contentType: "text/javascript" });
  if (u.includes("xlsx") && XLSX_JS && existsSync(XLSX_JS)) return r.fulfill({ body: readFileSync(XLSX_JS), contentType: "text/javascript" });
  r.abort(); });
await p.route(URL_W, async r => { const req = r.request(); const res = await worker.fetch(new Request(URL_W, { method: req.method(), body: req.postData() }), env);
  r.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() }); });
await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; navigator.canShare = () => true; navigator.share = async () => {}; });
await p.goto("https://app.test/index.html");
await p.fill("#sCode", "hopfen"); await p.click("#sCodeOk"); await p.click('[data-ich="Laurent"]'); await warte(300);
const J = await p.evaluate(() => heuteLux().slice(0, 4));
// Daten mit festen Zeiten: Vorjahr und dieses Jahr
await p.evaluate(J => {
  const t = d => Date.parse(d + "T10:00:00Z"); let i = 0;
  const E = (d, x) => ({ id: "bu-" + String(++i).padStart(3, "0"), zeit: t(d) + i, durch: "Laurent", ...x });
  const V = (J - 1) + "-12-10";
  const liste = [
    E(V, { art: "abfuellung", sorte: "NEIPA", n: 100 }), E(V, { art: "abfuellung", sorte: "White IPA", n: 50 }),
    E(V, { art: "verkauf", verkaeufer: "Laurent", kaeufer: "Vorjoer", posten: [{ sorte: "NEIPA", n: 10 }], betrag: 30, aus: "Lager" }),
    E(J + "-01-15", { art: "verkauf", verkaeufer: "Laurent", kaeufer: "Kalbusch", posten: [{ sorte: "NEIPA", n: 12 }, { sorte: "White IPA", n: 6 }], betrag: 54, aus: "Lager" }),
    E(J + "-02-01", { art: "verkauf", verkaeufer: "Jeff", kaeufer: "Café", posten: [{ sorte: "White IPA", n: 10 }], betrag: 30, aus: "Lager", rechnung: true }),
    E(J + "-03-01", { art: "verkauf", verkaeufer: "Marc", kaeufer: "Weg", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6, aus: "Lager" }),
    E(J + "-03-05", { art: "abgang", sorte: "NEIPA", n: 3, wer: "Lager", grund: "getrunken" }),
  ];
  const v = id => liste.find(e => e.id === id);
  liste.push(E(J + "-01-16", { art: "zahlung", ref: "bu-004", betrag: 54, wie: "sumup" }));
  liste.push(E(J + "-03-02", { art: "zahlung", ref: "bu-006", betrag: 6, wie: "bar" }));
  liste.push(E(J + "-03-03", { art: "storno", ref: "bu-006" }));
  liste.push(E(J + "-02-02", { art: "rechnung", ref: "bu-005", nr: J + "-001", datum: J + "-02-02", adresse: "Café\nRue 1" }));
  liste.push(E(J + "-03-01", { art: "rechnung", ref: "bu-006", nr: J + "-002", datum: J + "-03-01", adresse: "Weg" }));
  liste.push(E(J + "-04-01", { art: "zahlung", ref: "bu-005", betrag: 30, wie: "wero", datum: J + "-03-28" }));
  AUSGANG.push(...liste); merke(SP_AUSGANG, AUSGANG); neuRechnen(); render(); abgleichen();
}, +J);
await warte(800);
// Öffnen über das Zahnrad
await p.click("#zahnrad"); await warte(200); await p.click("#eBuch"); await warte(300);
ist("Buchhaltung offen, Zahnrad markiert", [await p.locator("#t-buch").isVisible(), await p.locator("#zahnrad.an").count()], [true, 1]);
ist("Résumé dëst Joer: ohne Vorjahr, ohne gelöschten Verkauf", await p.locator("#buInhalt").innerText(), t => t.includes("84 €") && t.includes("Verkaaft") && t.includes("Agaangen") && t.includes("SumUp") && t.includes("WERO") && !t.includes("Vorjoer"));
ist("Résumé: Zahlen", await p.evaluate(() => { const R = buchDaten(Z, BUCH).resume; return [R.verkauft, R.agaangen, R.op, R.rechnungen, R.jeWie]; }), [84, 84, 30, 1, { sumup: 54, wero: 30 }]); // 30 = Vorjahr, unbezahlt, zum Stichtag noch offen
ist("Gratis je Bier (getrunken 3)", await p.evaluate(() => buchDaten(Z, BUCH).resume.jeBier.NEIPA.gratis), 3);
// Zuelungen: feste Nummern, storniert bleibt sichtbar, nicht im Total
await p.click('[data-bus="zuelungen"]'); await warte(200);
const zt = await p.locator("#buInhalt").innerText();
ist("Zuelungen: Nummern, STORNIERT sichtbar, Total ohne storniert", zt, t => t.includes(`Z-${J}-001`) && t.includes(`Z-${J}-002`) && t.includes(`Z-${J}-003`) && t.includes("STORNIERT") && t.includes("84,00"));
ist("Zuelungen: anderer Zahltag (28.3.) und Rechnungsnummer", zt, t => t.includes("28.3." + J) && t.includes("Facture " + J + "-001"));
await p.selectOption("#buWie", "sumup"); await warte(300);
ist("Filter SumUp: nur eine Zahlung, Total 54", await p.locator("#buInhalt").innerText(), t => t.includes(`Z-${J}-001`) && !t.includes(`Z-${J}-003`) && t.includes("54,00") && t.includes("Zuelaart: SumUp"));
// Druck-PDF der gefilterten Liste
await p.click("#buPdf"); await warte(2000);
const pdf1 = await p.evaluate(async () => { const f = [...DATEN.entries()].filter(([k]) => k.startsWith("buch-")).pop()[1]; return [f.name, new TextDecoder("latin1").decode(await f.arrayBuffer())]; });
ist("PDF der Liste: Name, Titel, Filter, Summe", pdf1, ([n, t]) => /^Millebeier_Zuelungen_/.test(n) && t.includes("Zuelungen") && t.includes("SumUp") && t.includes("54,00") && t.includes(`Z-${J}-001`) && !t.includes(`Z-${J}-003`));
await p.click("#ansichtZu"); await warte(200);
await p.selectOption("#buWie", ""); await warte(200);
// Verkéf mit Bier-Filter: nur der Anteil
await p.click('[data-bus="verkeef"]'); await warte(200);
await p.selectOption("#buBier", "White IPA"); await warte(300);
ist("Verkéf White IPA: Kalbusch nur Anteil 18, Café 30, Total 48", [await p.locator("#buInhalt").innerText(), await p.evaluate(() => buchDaten(Z, BUCH).resume.verkauft)], ([t, s]) => t.includes("Kalbusch") && t.includes("18,00") && t.includes("Café") && s === 48);
await p.selectOption("#buBier", ""); await warte(200);
// Rechnungen: lückenlos, storniert
await p.click('[data-bus="rechnungen"]'); await warte(200);
ist("Rechnungen: beide Nummern, 002 STORNIERT", await p.locator("#buInhalt").innerText(), t => t.includes(J + "-001") && t.includes(J + "-002") && t.includes("STORNIERT"));
// Ausstoend zum Stichtag: am 20.3. war Café noch offen (bezahlt am 28.3.)
await p.click('[data-bus="ausstoend"]'); await warte(200);
await p.fill("#buBis", J + "-03-20"); await p.dispatchEvent("#buBis", "change"); await warte(300);
ist("Ausstoend am 20.3.: Café 30 offen", await p.locator("#buInhalt").innerText(), t => t.includes("Café") && t.includes("30,00") && !t.includes("Kalbusch"));
await p.click('[data-bup="joer"]'); await warte(300);
ist("Ausstoend Ende Jahr: nur der offene Verkauf vom Vorjahr", await p.locator("#buInhalt").innerText(), t => t.includes("Vorjoer") && !t.includes("Café"));
// Stock: Anfang = nach Vorjahr
await p.click('[data-bus="stock"]'); await warte(200);
ist("Stock NEIPA: Anfang 90, verkauft 12, gedronk 3, Ende 75 (gelöschter Verkauf zählt nicht)", await p.evaluate(() => { const s = buchDaten(Z, BUCH).stock.find(x => x.key === "NEIPA"); return [s.anfang, s.verkauft, s.getrunken, s.ende]; }), [90, 12, 3, 75]);
// Ännerungen
await p.click('[data-bus="aenner"]'); await warte(200);
ist("Ännerungen: Löschung mit wer", await p.locator("#buInhalt").innerText(), t => t.includes("geläscht") && t.includes("Laurent") && t.includes("Weg"));
// Lescht Joer
await p.click('[data-bup="lescht"]'); await p.click('[data-bus="verkeef"]'); await warte(300);
ist("Lescht Joer: Vorjahres-Verkauf", await p.locator("#buInhalt").innerText(), t => t.includes("Vorjoer"));
await p.click('[data-bup="joer"]'); await warte(200);
// Sammel-PDF der Rechnungen
await p.click("#buRech"); await warte(2500);
const pdf2 = await p.evaluate(async () => { const f = [...DATEN.entries()].filter(([k]) => k.startsWith("buch-")).pop()[1]; return new TextDecoder("latin1").decode(await f.arrayBuffer()); });
ist("Sammel-PDF: beide Rechnungen, ANNULÉE, 2 Seiten", pdf2, t => t.includes(J + "-001") && t.includes(J + "-002") && t.includes("ANNUL") && (t.match(/\/Type \/Page\b/g) || []).length === 2);
await p.click("#ansichtZu"); await warte(200);
// Excel der Liste (wenn SheetJS da)
if (XLSX_JS && existsSync(XLSX_JS)) {
  await p.click('[data-bus="zuelungen"]'); await warte(200); await p.click("#buXls"); await warte(1500);
  ist("Excel der Liste", await p.evaluate(async () => { const f = [...DATEN.entries()].filter(([k]) => k.startsWith("buch-")).pop()[1]; const wb = XLSX.read(new Uint8Array(await f.arrayBuffer()), { type: "array" });
    const z = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }); return [f.name.endsWith(".xlsx"), z[2][0], z[z.length - 1][6]]; }), [true, "Nr", 84]);
  await p.click("#ansichtZu"); await warte(200);
}
// Verschenkt mit Bemerkung (vom Nutzer, 22.11.): Feld bei „Verschenkt / Prouf“, gespeichert als notiz
await p.click('[data-tab="bestand"]'); await warte(300);
await p.click('[data-abs="fort"]'); await warte(200);
await p.selectOption("#bSorte", "NEIPA"); await p.fill("#bN", "2");
await p.click('[data-grund="verschenkt"]'); await warte(200);
ist("Verschenkt: Feld für Name/Bemerkung", await p.getAttribute("#bNotiz", "placeholder"), t => t.includes("Fir wien"));
await p.fill("#bNotiz", "Proufflaschen fir de Café"); await p.click("#bOk"); await warte(500);
ist("Abgang mit notiz", await p.evaluate(() => { const e = Z.liste.filter(x => x.art === "abgang").pop(); return [e.grund, e.n, e.notiz]; }), ["verschenkt", 2, "Proufflaschen fir de Café"]);
await warte(900); await p.click('[data-abs="fort"]'); await warte(200);
await p.click('[data-grund="kaputt"]'); await warte(200);
ist("Futti: kein Bemerkungsfeld", await p.locator("#bNotiz").count(), 0);
// Buchhaltung → Gratis mit Grund-Filter
await p.click("#zahnrad"); await warte(200); await p.click("#eBuch"); await warte(300);
await p.click('[data-bus="gratis"]'); await warte(200);
ist("Gratis: alle Gründe, Total 5", await p.locator("#buInhalt").innerText(), t => t.includes("selwer gedronk") && t.includes("verschenkt") && t.includes("Proufflaschen fir de Café") && /Total\s+5/.test(t));
await p.click('[data-bug="verschenkt"]'); await warte(200);
ist("Gratis nur verschenkt: Total 2", await p.locator("#buInhalt").innerText(), t => !t.includes("selwer gedronk") && /Total\s+2/.test(t) && t.includes("Grond: verschenkt"));
await p.click("#buPdf"); await warte(2000);
ist("PDF Gratis mit Bemerkung", await p.evaluate(async () => { const f = [...DATEN.entries()].filter(([k]) => k.startsWith("buch-")).pop()[1]; return new TextDecoder("latin1").decode(await f.arrayBuffer()); }), t => t.includes("Proufflaschen") && t.includes("verschenkt"));
await p.click("#ansichtZu"); await warte(200);
// Zahltag im Zahlungsfenster
await p.evaluate(() => eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: "Spéit", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3, aus: "Lager" }])); await warte(400);
await p.click('[data-tab="offen"]'); await warte(200);
await p.click('[data-alles]'); await warte(200);
ist("Zahlungsfenster: Datum heute vorbelegt", await p.inputValue("#zahlDatum"), await p.evaluate(() => heuteLux()));
await p.fill("#zahlDatum", J + "-01-02"); await p.click('#zahlWahl [data-wie="bank"]'); await warte(400);
ist("Zahlung mit anderem Zahltag gespeichert", await p.evaluate(() => { const e = Z.liste.filter(x => x.art === "zahlung").pop(); return [e.datum, e.wie]; }), [J + "-01-02", "bank"]);
ist("keine Seitenfehler", konsole, []);
await browser.close();
console.log(fehler ? `${fehler} Prüfung(en) fehlgeschlagen` : "alles gut");
process.exit(fehler ? 1 : 0);
