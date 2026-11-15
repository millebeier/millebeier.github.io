// Browser: zwei Handys gegen den echten Worker-Code mit nachgebauter D1.
// Aufruf: node test/oberflaeche.mjs   (Playwright global oder per PLAYWRIGHT=… Pfad)
import { readFileSync } from "node:fs";
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
import worker from "../worker.js";
import { fakeD1 } from "./fake-d1.mjs";

const URL_W = "https://worker.test/";
let html = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/const WORKER_URL = "[^"]*";/, `const WORKER_URL = "${URL_W}";`);
const icon = readFileSync(new URL("../bilder/icon-180.png", import.meta.url));
const DB = fakeD1();
let SERVER_AN = true;
const env = { DB, CODE: "hopfen" };

let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); if (!ok) { fehler++; console.log("✗", was, "→", JSON.stringify(a)); } else console.log("✓", was); };

const browser = await pw.chromium.launch();
async function handy() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.konsole = [];
  p.on("pageerror", e => p.konsole.push(String(e)));
  p.on("console", m => { if (m.type() === "error") p.konsole.push(m.text()); });
  p.on("dialog", d => d.accept(p.antwort));
  await p.route("https://app.test/**", r => r.request().url().endsWith(".png")
    ? r.fulfill({ body: icon, contentType: "image/png" }) : r.fulfill({ body: html, contentType: "text/html" }));
  await p.route(URL_W, async r => {
    if (!SERVER_AN) return r.abort("internetdisconnected");
    const req = r.request();
    const res = await worker.fetch(new Request(URL_W, { method: req.method(), body: req.postData() }), env);
    r.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() });
  });
  await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; }); // Tests rechnen mit leeren Daten
  await p.goto("https://app.test/index.html");
  return p;
}
const txt = (p, s) => p.locator(s).innerText();
const warte = ms => new Promise(r => setTimeout(r, ms));

// Handy A: Laurent
const A = await handy();
await A.fill("#sCode", "falsch"); await A.click("#sCodeOk");
await A.waitForSelector(".meldung.fehler");
ist("falscher Code wird gemeldet", await txt(A, "#sMeld"), s => s.includes("stëmmt net"));
await A.fill("#sCode", "hopfen"); await A.click("#sCodeOk");
await A.click('[data-ich="Laurent"]');
ist("Verkaufen offen", await A.locator("#t-verkaufen").isVisible(), true);

ist("Fußzeile mit Artikel", await txt(A, "#fuss"), s => s.includes("Du bass de Laurent"));
// Bestand: abfüllen und zuteilen
await A.click('[data-tab="bestand"]');
await A.click('[data-m="abfuellung"]');
await A.selectOption("#bSorte", "NEIPA"); await A.fill("#bN", "48"); await A.click("#bOk");
await A.click('[data-m="bewegung"]');
await A.selectOption("#bVon", "Lager"); await A.selectOption("#bAn", "Laurent"); await A.selectOption("#bSorte", "NEIPA");
await A.fill("#bN", "12"); await A.click("#bOk");
await warte(900); // ein Mensch braucht länger als die 800-ms-Sperre für denselben Knopf
await A.selectOption("#bAn", "Jeff"); await A.fill("#bN", "12"); await A.click("#bOk");
await warte(300);
ist("Tabelle zeigt Lager 24", await txt(A, "#bTabelle"), s => /Lager\s+24/.test(s));

// Verkaufen, Tippen zeichenweise während Abgleich
await A.click('[data-tab="verkaufen"]');
await A.click("#vKaeufer");
for (const c of "Paul") { await A.keyboard.type(c); await A.evaluate(() => abgleichen()); await warte(50); }
ist("Tippen übersteht Abgleich", [await A.inputValue("#vKaeufer"), await A.evaluate(() => document.activeElement.id)], ["Paul", "vKaeufer"]);
for (let i = 0; i < 3; i++) await A.click('[data-plus="0"]');
ist("Betrag automatisch", await A.inputValue("#vBetrag"), "9");
await A.click("#vSpeichern");
ist("ohne Bezahlt-Wahl: Hinweis", await txt(A, "#vMeldung"), s => s.includes("Wéi bezuelt?"));
await A.click('[data-bez="spaeter"]'); await A.click("#vSpeichern");
ist("Verkauf eingetragen", await txt(A, "#vMeldung"), s => s.includes("Paul") && s.includes("9 €"));
ist("Formular leer", await A.inputValue("#vKaeufer"), "");
// zweiter Verkauf mit Rabatt, bezahlt
await A.fill("#vKaeufer", "Anne"); await A.click('[data-plus="0"]'); await A.click('[data-plus="0"]');
await A.fill("#vBetrag", "5"); await A.click('[data-bez="bar"]'); await A.click("#vSpeichern");
// mehr verkaufen als da → Nachfrage (wird bestätigt)
await A.fill("#vKaeufer", "paul"); await A.fill("#vN0", "20"); await A.click('[data-bez="spaeter"]'); await A.click("#vSpeichern");
await A.waitForSelector("#frageWahl:not(.versteckt)"); await A.click('#frageWahl [data-wahl="trotzdem"]');
await warte(400);
ist("Name in bekannter Schreibweise", await A.evaluate(() => Z.kaeufer.map(k => k.name)), ["Paul", "Anne"]);
// den letzten Verkauf rückgängig
await A.click('#zahnrad'); await A.click('#eVerlauf');
await A.locator("[data-storno]").first().click();
await warte(300);
ist("Rückgängig wirkt", await A.evaluate(() => [Z.offen, hat(Z, "Laurent", "NEIPA")]), [9, 7]);

// Handy B: Jeff sieht alles und kassiert
const B = await handy();
await B.fill("#sCode", "hopfen"); await B.click("#sCodeOk"); await B.click('[data-ich="Jeff"]');
await B.click('[data-tab="offen"]');
ist("Jeff sieht Pauls 9 €", await txt(B, "#t-offen"), s => s.includes("Paul") && s.includes("9 €"));
await B.click('[data-alles="0"]'); await B.click('#zahlWahl [data-wie="wero"]');
await warte(400);
ist("Bei Jeff alles bezahlt", await txt(B, "#t-offen"), s => s.includes("Alles bezuelt"));

// Offline: Eintrag wartet und geht später raus
SERVER_AN = false;
await B.click('[data-tab="verkaufen"]');
await B.fill("#vKaeufer", "Tom"); await B.click('[data-plus="0"]'); await B.click('[data-bez="bar"]'); await B.click("#vSpeichern");
await warte(300);
ist("offline: wartet", await txt(B, "#sync"), s => s.includes("nach net geschéckt"));
await B.reload(); await warte(300);
ist("offline: übersteht Neuladen", await B.evaluate(() => AUSGANG.length), 2);
SERVER_AN = true;
await B.evaluate(() => abgleichen()); await warte(400);
ist("wieder online: gesendet", await B.evaluate(() => AUSGANG.length), 0);

// A sieht den Stand von B
await A.evaluate(() => abgleichen()); await warte(300);
await A.click('[data-tab="uebersicht"]');
const u = await txt(A, "#t-uebersicht");
ist("Überblick bei Laurent: Kasse 17 €", u, s => s.includes("17 €") && s.includes("an der Kees"));
ist("Überblick: 6 verkauft, 42 da", await A.evaluate(() => [Z.flaschen.verkauft, Z.flaschen.da]), [6, 42]);
await A.screenshot({ path: "/tmp/claude-0/-home-user-panini-wm-2026/d92c0ce6-1931-5139-9414-8708d0c7e81c/scratchpad/ueberblick.png", fullPage: true });
await A.click('[data-tab="verkaufen"]');
await A.screenshot({ path: "/tmp/claude-0/-home-user-panini-wm-2026/d92c0ce6-1931-5139-9414-8708d0c7e81c/scratchpad/verkaufen.png", fullPage: true });

// Einstellungen: Preis ändern gilt für alle
await A.click('[data-tab="bestand"]');
await A.click('[data-bed="Brown Porter"]');
await A.fill("#biPreis", "3,50"); await A.click("#biOk"); await warte(300);
await B.evaluate(() => abgleichen()); await warte(300);
ist("neuer Preis bei Jeff", await B.evaluate(() => Z.cfg.sorten[2].preis), 3.5);
// Doppeltipp: Speichern zweimal schnell → ein Verkauf; Abfüllen doppelt → einmal; −/+ zählt jeden Tipp.
await A.click('[data-tab="verkaufen"]');
const vorher = await A.evaluate(() => Z.verkaeufe.length);
await A.fill("#vKaeufer", "Doppelt"); await A.click('[data-plus="0"]'); await A.click('[data-plus="0"]');
ist("−/+ zählt beide Tipps", await A.inputValue("#vN0"), "2");
await A.click('[data-bez="bar"]');
await A.dblclick("#vSpeichern");
await A.click("#vSpeichern");
await warte(300);
ist("Doppeltipp: ein Verkauf", await A.evaluate(() => Z.verkaeufe.length - 0), vorher + 1);
ist("Doppeltipp: keine Fehlermeldung", await txt(A, "#vMeldung"), s => s.includes("Agedroen"));
await A.click('[data-tab="bestand"]');
await A.click('[data-m="abfuellung"]');
const abf = await A.evaluate(() => Z.flaschen.abgefuellt);
await A.fill("#bN", "5"); await A.dblclick("#bOk"); await warte(300);
ist("Doppeltipp: einmal abgefüllt", await A.evaluate(() => Z.flaschen.abgefuellt), abf + 5);
await warte(900);
await A.fill("#bN", "5"); await A.click("#bOk"); await warte(300);
ist("gleicher Inhalt nach 1 s: Sicherheitsnetz hält", await A.evaluate(() => Z.flaschen.abgefuellt), abf + 5);
await warte(3100);
await A.fill("#bN", "5"); await A.click("#bOk"); await warte(300);
ist("gleicher Inhalt nach 4 s: zählt (gewollt zweimal)", await A.evaluate(() => Z.flaschen.abgefuellt), abf + 10);
// Neue Fassung: ohne laufenden Eintrag lädt die App selbst neu, mitten im Eintrag nur ein Knopf.
html = html.replace(/const FASSUNG = "[^"]+";/, 'const FASSUNG = "TEST-NEU";');
await A.click('#zahnrad'); await A.click('#eVerlauf');
await Promise.all([A.waitForEvent("load"), A.evaluate(() => updatePruefen())]);
ist("neue Fassung von selbst geladen", await txt(A, "#fuss"), s => s.includes("TEST-NEU"));
await B.click('[data-tab="verkaufen"]');
await B.fill("#vKaeufer", "Lisa");
await B.evaluate(() => document.activeElement.blur());
await B.evaluate(() => updatePruefen());
ist("mitten im Eintrag: Knopf statt Neuladen", [await B.locator("#neu").isVisible(), await B.inputValue("#vKaeufer")], [true, "Lisa"]);
await Promise.all([B.waitForEvent("load"), B.click("#neu")]);
ist("Knopf lädt neu", await txt(B, "#fuss"), s => s.includes("TEST-NEU"));
await B.evaluate(() => updatePruefen()); await warte(300);
ist("gleiche Fassung: nichts passiert", await B.locator("#neu").isVisible(), false);
// Alte Verkäufe kommen von selbst (einmal), wenn ein Handy ohne Schalter abgleicht — auch mit zwei Handys nicht doppelt
{
  const C = await handy(); const D2 = await handy();
  await C.evaluate(() => { window.OHNE_ALTIMPORT = false; }); await D2.evaluate(() => { window.OHNE_ALTIMPORT = false; });
  await Promise.all([C.evaluate(() => { EIN = { code: "hopfen", ich: "Claude" }; abgleichen(); }), D2.evaluate(() => { EIN = { code: "hopfen", ich: "Jeff" }; abgleichen(); })]);
  await warte(1500);
  await C.evaluate(() => abgleichen()); await warte(500);
  ist("alte Verkäufe von selbst da", await C.evaluate(() => [Z.sorten["Rusty 02/2026"] && Z.sorten["Rusty 02/2026"].verkauft, Z.altVerkaeufe.length]), [285, 25]);
  ist("nicht doppelt beim Server", [...DB.rows.keys()].filter(k => k.startsWith("alt26-")).length, (await C.evaluate(() => altImport().length)));
  const kasseVorher = await A.evaluate(() => Z.kasse);
  ist("Kasse unberührt", await C.evaluate(() => Z.kasse), kasseVorher);
  // Euer Fall: beim Server liegt noch der alte Import (4 Fl. zu Claude umgebucht) → einmalige Korrektur
  DB.rows.delete("alt26-bp-cw-fort");
  DB.rows.set("alt26-bp-cw", { id: "alt26-bp-cw", zeit: Date.parse("2026-01-24T12:00:00Z"), daten: JSON.stringify({ id: "alt26-bp-cw", zeit: Date.parse("2026-01-24T12:00:00Z"), durch: "Excel-Import", art: "bewegung", sorte: "Brown Porter 01/2026", n: 4, von: "Lager", an: "Claude" }) });
  await Promise.all([C.evaluate(() => abgleichen()), D2.evaluate(() => abgleichen())]); await warte(1200);
  await C.evaluate(() => abgleichen()); await warte(500);
  ist("Korrektur: Claude hat kein altes Porter mehr", await C.evaluate(() => [hat(Z, "Claude", "Brown Porter 01/2026"), Z.sorten["Brown Porter 01/2026"].abgang]), [0, 85]);
  ist("Korrektur genau einmal beim Server", ["alt26-bp-cw-storno", "alt26-bp-cw-fort"].map(k => DB.rows.has(k)), [true, true]);
  ist("alte Fässer beim Verkaufen angeboten", await C.evaluate(() => artikelListe("Lager", {}).filter(x => x.fass).map(x => x.label)), ["Brown Porter 01/2026 · Fass 30 l", "Rusty 02/2026 · Fass 20 l"]);
  await C.close(); await D2.close();
}
ist("keine Fehler in der Konsole", [...A.konsole, ...B.konsole].filter(s => !s.includes("ERR_INTERNET_DISCONNECTED") && !s.includes("Failed to load resource")), []);

await browser.close();
console.log(fehler ? `${fehler} Fehler` : "Oberfläche: alles bestanden");
process.exit(fehler ? 1 : 0);
