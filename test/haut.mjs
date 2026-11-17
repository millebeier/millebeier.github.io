// Browser: Startseite „Haut“ und Reiter unten (vom Nutzer, 17.11.2026). Beim Öffnen die Startseite, Logo führt zurück,
// drei Knöpfe springen in Verkafen / Ausstoend (Just meng) / Bestellungen (Just meng), Karten zeigen nur, was mich betrifft.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 812 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
await p.route(/workers\.dev/, r => r.abort());
await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; });
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem("millebeier_v1", JSON.stringify({ code: "x", ich: "Laurent", tab: "kunden" })); });
await p.reload();
ist("beim Öffnen die Startseite (nicht der letzte Reiter)", await p.evaluate(() => TAB), "haut");
ist("Begrüßung mit Namen und Datum", await p.locator(".hallo").innerText(), t => t.includes("Moien Laurent") && /\d+\. [A-ZÄË][a-zäë]+/.test(t));
ist("kein Reiter markiert", await p.locator("#nav button.an").count(), 0);
ist("Leer: keine Flaschen, nichts geplant, keiner schuldet", await p.locator("#t-haut").innerText(),
  t => t.includes("keng Fläschen") && t.includes("Näischt an de nächste 7 Deeg") && t.includes("Keen ass dir eppes schëlleg"));

await p.evaluate(() => {
  const h = heuteLux();
  eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 100 }, { art: "bewegung", sorte: "NEIPA", n: 30, von: "Lager", an: "Laurent" },
    { art: "bewegung", sorte: "White IPA", n: 0 || 1, von: "Lager", an: "Jeff" },
    { art: "livraison", kunde: "Reimen David", kontakt: "Laurent", aus: "Laurent", datum: plusTage(h, 3), posten: [{ sorte: "NEIPA", n: 10 }], betrag: 30, rechnung: false },
    { art: "livraison", kunde: "Fremd", kontakt: "Jeff", aus: "Jeff", datum: plusTage(h, 2), posten: [{ sorte: "White IPA", n: 1 }], betrag: 3, rechnung: false },
    { art: "termin", tid: "t-haut-01", typ: "braudag", titel: "Braudag", datum: plusTage(h, 1), uhr: "09:00", bier: "NEIPA", wer: ["Laurent"] },
    { art: "termin", tid: "t-haut-02", typ: "reunioun", titel: "Reunioun", datum: plusTage(h, 20) },
    { art: "verkauf", verkaeufer: "Laurent", kaeufer: "Paul Weber", posten: [{ sorte: "NEIPA", n: 4 }], betrag: 12 },
    { art: "verkauf", verkaeufer: "Jeff", kaeufer: "Anne", posten: [{ sorte: "White IPA", n: 1 }], betrag: 3 }]);
  render();
});
const txt = await p.locator("#t-haut").innerText();
ist("Du hues fräi: 30 − 4 verkauft − 10 reserviert = 16, 🚚 10", txt, t => /NEIPA\s+16\s*🚚 10/.test(t));
ist("Déi nächst Deeg: Braudag morgen und Bestellungen, nichts in 20 Tagen", txt, t => t.includes("Braudag · NEIPA") && t.includes("Muer · 09:00") && t.includes("Bestellung Reimen David") && !t.includes("Reunioun"));
ist("Nach op bei dir: nur meine Käufer", txt, t => t.includes("Paul Weber") && t.includes("12 €") && !t.includes("Anne"));
ist("Zahlen an den Knöpfen: 1 offen, 1 Bestellung von mir", await p.evaluate(() => [...document.querySelectorAll(".hgross .badge")].map(x => x.textContent)), ["1", "1"]);

// Knöpfe
await p.click('.hgross [data-hgeh="offen"]');
ist("Ausstoend auf Just meng", await p.evaluate(() => [TAB, NUR_MEINE, document.querySelector('#nav [data-tab="offen"]').classList.contains("an")]), ["offen", true, true]);
await p.click("#zurHaut"); await warte(100);
ist("Logo führt zur Startseite", await p.evaluate(() => TAB), "haut");
await p.click('.hgross [data-hgeh="livraisons"]');
ist("Bestellungen auf Just meng", await p.evaluate(() => [TAB, L_NUR_MEINE]), ["livraisons", true]);
ist("… zeigt nur meine", await p.locator("#lListe").innerText(), t => t.includes("Reimen David") && !t.includes("Fremd"));
await p.click("#zurHaut"); await warte(900);
await p.click('.hgross [data-hgeh="verkaufen"]');
ist("Verkafen offen", await p.locator("#t-verkaufen").isVisible(), true);
await p.click("#zurHaut"); await warte(900);
await p.click('.hklick[data-hgeh="kalender"]');
ist("Karte Déi nächst Deeg → Kalender", await p.evaluate(() => TAB), "kalender");

// Reiter unten
ist("Reiter unten am Bildschirm, alle Namen passen", await p.evaluate(() => { const n = document.querySelector("#nav"), r = n.getBoundingClientRect();
  return Math.abs(r.bottom - innerHeight) < 2 && getComputedStyle(n).position === "fixed" && [...n.querySelectorAll("button")].every(x => x.scrollWidth <= x.clientWidth + 1); }), true);
ist("Reiter mit Symbol und Namen", await p.evaluate(() => [...document.querySelectorAll("#nav button")].map(x => x.querySelector("i") && x.textContent.replace(x.querySelector("i").textContent, "").replace(/\d+$/, ""))),
  ["Stock", "Verkafen", "Bestellungen", "Ausstoend", "Iwwersiicht", "Client"]);
await p.click('[data-tab="bestand"]');
ist("Reiter wechselt", await p.evaluate(() => [TAB, document.querySelector('#nav [data-tab="bestand"]').classList.contains("an")]), ["bestand", true]);
ist("Inhalt endet nicht unter den Reitern", await p.evaluate(() => { scrollTo(0, document.body.scrollHeight); const f = document.querySelector("#fuss").getBoundingClientRect(); return f.bottom <= document.querySelector("#nav").getBoundingClientRect().top + 1; }), true);
ist("keine Seitenfehler", seitenfehler, []);
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Startseite: alles bestanden");
process.exit(fehler ? 1 : 0);
