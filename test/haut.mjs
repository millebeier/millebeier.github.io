// Browser: Startseite „Haut“ und Reiter unten (vom Nutzer, 17.11.2026). Beim Öffnen die Startseite, Logo führt zurück,
// drei Knöpfe springen in Verkafen / Ausstoend (Just meng) / Bestellungen (Just meng), Karten zeigen nur, was mich betrifft.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
await p.route(/workers\.dev/, r => r.abort());
await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; });
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem("millebeier_v1", JSON.stringify({ code: "x", ich: "Laurent", tab: "kunden" })); });
await p.reload();
ist("beim Öffnen die Startseite (nicht der letzte Reiter)", await p.evaluate(() => TAB), "haut");
ist("Begrüßung mit Namen und Datum", await p.locator(".hallo").innerText(), t => t.includes("Moien Laurent") && /\d+\. [A-ZÄË][a-zäë]+/.test(t));
ist("unten ist Haut markiert (ganz links)", await p.evaluate(() => [...document.querySelectorAll("#nav button.an")].map(b => b.dataset.tab).concat(document.querySelector("#nav button").dataset.tab)), ["haut", "haut"]);
ist("kein 🏠 mehr oben", await p.locator("#hautBtn").count(), 0);
ist("Leer: keine Flaschen, nichts geplant, keiner schuldet", await p.locator("#t-haut").innerText(),
  t => t.includes("keng Fläschen") && t.includes("Näischt fir dech an de nächste 7 Deeg") && t.includes("Keen ass dir eppes schëlleg"));

await p.evaluate(() => {
  const h = heuteLux();
  eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 100 }, { art: "bewegung", sorte: "NEIPA", n: 30, von: "Lager", an: "Laurent" },
    { art: "bewegung", sorte: "White IPA", n: 0 || 1, von: "Lager", an: "Jeff" },
    { art: "livraison", kunde: "Reimen David", kontakt: "Laurent", aus: "Laurent", datum: plusTage(h, 3), posten: [{ sorte: "NEIPA", n: 10 }], betrag: 30, rechnung: false },
    { art: "livraison", kunde: "Fremd", kontakt: "Jeff", aus: "Jeff", datum: plusTage(h, 2), posten: [{ sorte: "White IPA", n: 1 }], betrag: 3, rechnung: false },
    { art: "termin", tid: "t-haut-01", typ: "braudag", titel: "Braudag", datum: plusTage(h, 1), uhr: "09:00", bier: "NEIPA", wer: ["Laurent"] },
    { art: "termin", tid: "t-haut-02", typ: "reunioun", titel: "Reunioun", datum: plusTage(h, 20) },
    { art: "termin", tid: "t-haut-03", typ: "stand", titel: "Stand Jeff", datum: plusTage(h, 2), wer: ["Jeff"] },
    { art: "verkauf", verkaeufer: "Laurent", kaeufer: "Paul Weber", posten: [{ sorte: "NEIPA", n: 4 }], betrag: 12 },
    { art: "verkauf", verkaeufer: "Jeff", kaeufer: "Anne", posten: [{ sorte: "White IPA", n: 1 }], betrag: 3 }]);
  render();
});
const txt = await p.locator("#t-haut").innerText();
ist("Du hues fräi: 30 − 4 verkauft − 10 reserviert = 16, 🚚 10", txt, t => /NEIPA\s+16\s*🚚 10/.test(t));
ist("Deng nächst Deeg: nur meine — Braudag, meine Bestellung; nicht Jeffs Stand/Bestellung, nichts in 20 Tagen", await p.locator("#hKal").innerText(),
  t => t.includes("Deng nächst Deeg") && t.includes("Braudag · NEIPA") && t.includes("Muer · 09:00") && t.includes("Bestellung Reimen David") && !t.includes("Stand Jeff") && !t.includes("Fremd") && !t.includes("Reunioun"));
ist("Nach op bei dir: nur meine Käufer", txt, t => t.includes("Paul Weber") && t.includes("12 €") && !t.includes("Anne"));
ist("Reihenfolge der Karten (vom Nutzer, Fassung e)", await p.evaluate(() => [...document.querySelectorAll("#t-haut .card h2")].map(h => h.firstChild.textContent.trim())),
  ["✅ Fir dech ze maachen", "📅 Deng nächst Deeg", "💶 Nach op bei dir", "🍺 Du hues zur Verfügung"]);
ist("Knöpfe oben: Verkafen · Fläschen · Bestellungen (Fassung k)", await p.evaluate(() => [...document.querySelectorAll(".hgross button")].map(x => x.dataset.hgeh)), ["verkaufen", "huelen", "livraisons"]);
ist("Zahl nur an Bestellungen: 1 von mir", await p.evaluate(() => [...document.querySelectorAll(".hgross .badge")].map(x => x.textContent)), ["1"]);

// „Fläschen“ direkt auf der Startseite (Fassung k): erst die vier Absichten, dann das Formular
ist("Knopf heißt „Mäi Stock“ (vom Nutzer, Fassung m), mit Bild", await p.evaluate(() => { const b = document.querySelector('.hgross [data-hgeh="huelen"]'); return [b.lastChild.textContent.trim(), !!b.querySelector("svg")]; }), ["Mäi Stock", true]);
await p.click('.hgross [data-hgeh="huelen"]');
ist("vier Absichten auf der Startseite", await p.evaluate(() => [TAB, [...document.querySelectorAll("#hHuelen [data-abs]")].map(b => b.dataset.abs)]), ["haut", ["huelen", "zreck", "ginn", "fort"]]);
await p.click('#hHuelen [data-abs="huelen"]');
ist("Kasten auf der Startseite: Lager ➜ ich, Seite bleibt", await p.evaluate(() => [TAB, [...document.querySelectorAll("#hHuelen .pk b")].map(x => x.textContent)]), ["haut", ["📦 Lager", "👤 Laurent"]]);
await p.selectOption("#hSorte", "NEIPA"); await p.fill("#hN", "4");
ist("Vorschau auf der Startseite", await p.locator("#hVor").innerText(), t => t.includes("Laurent 30") && t.includes("Lager 66"));
await p.click("#hOk"); await warte(200);
ist("gebucht, Kasten zu, Meldung, noch auf der Startseite", await p.evaluate(() => [TAB, hat(Z, "Laurent", "NEIPA"), !!document.querySelector("#hHuelen .pk"), document.querySelector("#t-haut .meldung").textContent.includes("Lager → Laurent")]), ["haut", 30, false, true]);
// Net verkaaft direkt auf der Startseite (Anlass: 3 selbst getrunken)
await warte(900); await p.click('.hgross [data-hgeh="huelen"]'); await p.click('#hHuelen [data-abs="fort"]');
await p.selectOption("#hSorte", "NEIPA"); await p.fill("#hN", "3"); await p.click("#hOk"); await warte(200);
ist("Net verkaaft auf der Startseite: 3 gedronk, bleibt auf der Startseite", await p.evaluate(() => [TAB, hat(Z, "Laurent", "NEIPA"), Z.aktiv.filter(e => e.art === "abgang").map(e => e.grund)]), ["haut", 27, ["getrunken"]]);
await warte(900); await p.click('.hgross [data-hgeh="huelen"]'); await p.click('#hHuelen [data-abs="zreck"]'); await p.click("#hZreck");
ist("‹ aner Saach → wieder die vier Absichten", await p.locator("#hHuelen [data-abs]").count(), 4);
await p.click("#hZu");
ist("Zoumaachen", await p.locator("#hHuelen .card").count(), 0);
// „Alles ›“ bei Nach op bei dir → Ausstoend auf All; bei Du hues zur Verfügung → Stock
await p.click('#hOp [data-hgeh="offen"]');
ist("Nach op bei dir „Alles ›“ → Ausstoend All", await p.evaluate(() => [TAB, NUR_MEINE]), ["offen", false]);
await p.click("#zurHaut"); await warte(100);
await p.click('#hStock [data-hgeh="bestand"]');
ist("Du hues zur Verfügung „Alles ›“ → Stock", await p.evaluate(() => TAB), "bestand");
await p.click("#zurHaut"); await warte(100);
ist("Logo führt zur Startseite", await p.evaluate(() => TAB), "haut");
await p.click('.hgross [data-hgeh="livraisons"]');
ist("Bestellungen auf Just meng", await p.evaluate(() => [TAB, L_NUR_MEINE]), ["livraisons", true]);
ist("… zeigt nur meine", await p.locator("#lListe").innerText(), t => t.includes("Reimen David") && !t.includes("Fremd"));
await p.click("#zurHaut"); await warte(900);
await p.click('.hgross [data-hgeh="verkaufen"]');
ist("Verkafen offen", await p.locator("#t-verkaufen").isVisible(), true);
await p.click("#zurHaut"); await warte(900);
await p.click('#hKal [data-hgeh="kalender"]');
ist("„Alles ›“ bei Deng nächst Deeg → Kalender", await p.evaluate(() => [TAB, KAL_BEREICH]), ["kalender", "kalender"]);
// Einträge auf der Startseite führen direkt hin (vom Nutzer, Fassung 23.11. a)
await p.click("#zurHaut"); await warte(900);
await p.locator("#hKal .hklick", { hasText: "Bestellung Reimen David" }).click(); await warte(400);
ist("Deng nächst Deeg: Bestellung antippen → genau diese Bestellung, leuchtet", await p.evaluate(() => { const el = document.querySelector(".liv.leucht"); return [TAB, el && el.innerText.includes("Reimen David")]; }), ["livraisons", true]);
await p.click("#zurHaut"); await warte(900);
await p.locator("#hKal .hklick", { hasText: "Braudag" }).click(); await warte(400);
ist("Deng nächst Deeg: Termin antippen → Kalender, Termin aufgeklappt", await p.evaluate(() => [TAB, KAL_AUF.has("t-haut-01")]), ["kalender", true]);
await p.click("#zurHaut"); await warte(900);
await p.evaluate(() => { const L = Z.livraisons.find(x => x.kunde === "Reimen David"); eintragen([{ art: "aufgabe", aid: "a-haut-link", text: "Flaschen fir Reimen ofhuelen", fuer: ["Laurent"], ref: { typ: "liv", id: L.lid } }]); render(); });
{ const t = p.locator("#hAuf .atx.hklick", { hasText: "Flaschen fir Reimen" });
  ist("Aufgabe mit Link: ganzer Text antippbar", await t.count(), 1);
  await t.click({ position: { x: 20, y: 8 } }); await warte(400);
  ist("Aufgabentext antippen → Bestellung", await p.evaluate(() => TAB), "livraisons"); }

// Reiter unten
ist("Reiter unten am Bildschirm, alle Namen passen", await p.evaluate(() => { const n = document.querySelector("#nav"), r = n.getBoundingClientRect();
  return Math.abs(r.bottom - innerHeight) < 2 && getComputedStyle(n).position === "fixed" && [...n.querySelectorAll("button")].every(x => x.scrollWidth <= x.clientWidth + 1); }), true);
// Home-Bildschirm wie am iPhone (Fassung g): navigator.standalone = true, ohne display-mode — vom Nutzer gemeldet: Ränder in der Rundung
{
  const q = await b.newPage({ viewport: { width: 375, height: 812 } });
  await q.route(/workers\.dev/, r => r.abort());
  await q.addInitScript(() => { window.OHNE_ALTIMPORT = true; Object.defineProperty(navigator, "standalone", { get: () => true }); });
  await q.goto(new URL("../index.html", import.meta.url).href);
  await q.evaluate(() => localStorage.setItem("millebeier_v1", JSON.stringify({ code: "x", ich: "Laurent" })));
  await q.reload();
  ist("iPhone-App: Abstand unten und links/rechts, alle Namen passen", await q.evaluate(() => {
    const n = document.querySelector("#nav"), k = [...n.querySelectorAll("button")], cs = getComputedStyle(n);
    return [document.documentElement.classList.contains("app"), cs.paddingBottom, k[0].getBoundingClientRect().left >= 14 && innerWidth - k[5].getBoundingClientRect().right >= 14,
      k.every(x => x.scrollWidth <= x.clientWidth + 1)]; }), [true, "22px", true, true]);
  await q.close();
}
ist("Reiter mit Symbol und Namen", await p.evaluate(() => [...document.querySelectorAll("#nav button")].map(x => x.querySelector("i") && x.textContent.replace(x.querySelector("i").textContent, "").replace(/\d+$/, ""))),
  ["Haut", "Stock", "Verkafen", "Bestellungen", "Ausstoend", "Iwwersiicht"]);
await p.click('[data-tab="bestand"]');
ist("Reiter wechselt", await p.evaluate(() => [TAB, document.querySelector('#nav [data-tab="bestand"]').classList.contains("an")]), ["bestand", true]);
ist("Inhalt endet nicht unter den Reitern", await p.evaluate(() => { scrollTo(0, document.body.scrollHeight); const f = document.querySelector("#fuss").getBoundingClientRect(); return f.bottom <= document.querySelector("#nav").getBoundingClientRect().top + 1; }), true);
// 🏠 oben und kurzes Sync-Zeichen (Fassung b)
await p.click('#nav [data-tab="haut"]');
ist("Haut unten führt zur Startseite und ist markiert", await p.evaluate(() => [TAB, document.querySelector('#nav [data-tab="haut"]').classList.contains("an")]), ["haut", true]);
ist("Sync kurz: ⚠️ und Anzahl (offline im Test)", await p.locator("#sync").innerText(), s => /^⚠️ \d+$/.test(s));
ist("Langtext erst nach Antippen", await p.locator("#syncInfo").isVisible(), false);
await p.click("#sync");
ist("Antippen zeigt den ganzen Text", await p.locator("#syncInfo").innerText(), s => s.includes("nach net geschéckt") && s.includes("soubal d'Verbindung"));
await warte(900); await p.click("#sync");
ist("nochmal Antippen klappt zu", await p.locator("#syncInfo").isVisible(), false);
await p.click("#zahnrad");
ist("Zahnrad markiert, Haut nicht", await p.evaluate(() => [TAB, document.querySelector("#zahnrad").classList.contains("an"), document.querySelector('#nav [data-tab="haut"]').classList.contains("an")]), ["einst", true, false]);
ist("Zahnrad: vier Kästen, Astellungen markiert", await p.evaluate(() => [...document.querySelectorAll("#t-einst [data-zb]")].map(b => b.dataset.zb + (b.classList.contains("an") ? "*" : ""))), ["einst*", "kunden", "verlauf", "buch"]);
await p.click('#t-einst [data-zb="kunden"]');
ist("Client im Zahnrad: Zahnrad markiert, Kästen oben, Client markiert", await p.evaluate(() => [TAB, document.querySelector("#zahnrad").classList.contains("an"), [...document.querySelectorAll("#t-kunden [data-zb].an")].map(b => b.dataset.zb)]), ["kunden", true, ["kunden"]]);
await p.click('#t-kunden [data-zb="buch"]'); await warte(300);
ist("Buchhaltung: Kästen oben, Buchhaltung markiert", await p.evaluate(() => [TAB, [...document.querySelectorAll("#t-buch [data-zb].an")].map(b => b.dataset.zb)]), ["buch", ["buch"]]);
await p.click('[data-bus="stock"]'); await warte(300);
ist("Kästen bleiben beim Umschalten in der Buchhaltung", await p.locator("#t-buch [data-zb]").count(), 4);
await p.click('#t-buch [data-zb="einst"]'); await warte(300);
await p.click('#t-einst [data-zb="verlauf"]');
ist("im Verlauf bleibt das Zahnrad markiert", await p.evaluate(() => [TAB, document.querySelector("#zahnrad").classList.contains("an")]), ["verlauf", true]);
await p.click('#nav [data-tab="haut"]'); await warte(900);
ist("zurück auf der Startseite: Zahnrad nicht mehr markiert", await p.evaluate(() => document.querySelector("#zahnrad").classList.contains("an")), false);
ist("Kopf in einer Zeile (390 px)", await p.evaluate(() => document.querySelector(".kopf").getBoundingClientRect().height < 50), true);

// 5-Minuten-Regel beim Zurückkommen
const zurueck = minuten => p.evaluate(m => {
  Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
  HAUT_WEG = Date.now() - m * 60 * 1000;
  Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
  return TAB; }, minuten);
await p.click('[data-tab="uebersicht"]');
ist("2 min weg: bleibt im Reiter", await zurueck(2), "uebersicht");
ist("6 min weg: Startseite", await zurueck(6), "haut");
await p.click('[data-tab="verkaufen"]'); await p.fill("#vVorname", "Halb ausgefëllt"); await p.evaluate(() => document.activeElement.blur());
ist("6 min weg mitten im Eintrag: bleibt", await zurueck(6), "verkaufen");
// 5-Minuten-Regel auch für die Fläschen-Kästen (vom Nutzer gefragt, 18.11.)
await p.evaluate(() => { document.activeElement && document.activeElement.blur(); FORM = null; TAB = "haut"; render(); });
await warte(900); await p.click('.hgross [data-hgeh="huelen"]'); await p.click('#hHuelen [data-abs="huelen"]');
ist("Startseite: Fläschen-huelen-Kasten offen", await p.locator("#hHuelen .pk").count(), 2);
await zurueck(2);
ist("2 min weg: Kasten bleibt offen", await p.locator("#hHuelen .pk").count(), 2);
const weg6 = () => p.evaluate(() => { Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
  for (const r in ZU_WEG) if (ZU_WEG[r]) ZU_WEG[r] -= 6 * 60 * 1000; HAUT_WEG = Date.now() - 6 * 60 * 1000;
  Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
await weg6();
ist("6 min weg: Kasten zu", await p.evaluate(() => [TAB, document.querySelectorAll("#hHuelen .pk").length]), ["haut", 0]);
await p.evaluate(() => { TAB = "bestand"; render(); });
await p.click('[data-abs="zreck"]');
ist("Stock: Absicht offen", await p.locator("#bForm .pk").count(), 2);
await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
  for (const r in ZU_WEG) if (ZU_WEG[r]) ZU_WEG[r] -= 6 * 60 * 1000; HAUT_WEG = Date.now() - 6 * 60 * 1000;
  Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
await p.evaluate(() => { TAB = "bestand"; render(); });
ist("Stock nach 6 min: wieder die vier Knöpfe", await p.evaluate(() => [document.querySelectorAll("#bForm .pk").length, document.querySelectorAll("[data-abs]").length]), [0, 4]);
ist("keine Seitenfehler", seitenfehler, []);
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Startseite: alles bestanden");
process.exit(fehler ? 1 : 0);
