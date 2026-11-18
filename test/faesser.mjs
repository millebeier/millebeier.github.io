// Browser: Fässer als Gebinde eines Biers, Reservierung durch geplante Livraisons mit Warnung, Zahlungsarten.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
const fragen = []; let antworten = [];
p.on("dialog", d => { fragen.push(d.message()); (antworten.length ? antworten.shift() : true) ? d.accept() : d.dismiss(); });
await p.route(/workers\.dev/, r => r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); EIN = { code: "x", ich: "Marc" }; TAB = "bestand"; render(); });

// Bier mit Flaschen und Fässern anlegen
await p.click("#bierNeu");
await p.fill("#biName", "Hopfenkönig"); await p.fill("#biBrau", "2026-10-01"); await p.fill("#biPreis", "3"); await p.fill("#biP20", "140");
await p.fill("#biFl", "120"); await p.fill("#biF20", "3"); await p.fill("#biF30", "2");
await p.click("#biOk"); await warte(200);
ist("Meldung nennt Fässer", await p.locator("#biMeld").innerText(), s => s.includes("120 Fläschen") && s.includes("3 × Fass 20 l") && s.includes("2 × Fass 30 l"));
await p.click("#biZu"); await warte(100);
ist("kein eigenes Fass-Bier", await p.evaluate(() => Z.cfg.sorten.map(c => c.name).filter(n => n.includes("Hopfen"))), ["Hopfenkönig (01.10.2026)"]);
ist("Bier-Karte zeigt Fässer", await p.locator("#bBiere").innerText(), s => s.includes("120 Fl. · 3 × 20 l · 2 × 30 l do") && s.includes("140 €/Fass 20 l") && s.includes("180 €/Fass 30 l"));
ist("Stock: Fass-Tabelle", await p.locator("#bTabelle").innerText(), s => s.includes("🛢️ Fässer") && s.includes("Hopfenkönig\n01.10.26\n20 l"));
await p.click('[data-abs="huelen"]');
ist("Fläschen: Fass wählbar", await p.evaluate(() => [...document.querySelectorAll("#bSorte option")].map(o => o.textContent).filter(t => t.startsWith("Hopfenkönig (01.10.2026)"))), ["Hopfenkönig (01.10.2026)", "Hopfenkönig (01.10.2026) · Fass 20 l", "Hopfenkönig (01.10.2026) · Fass 30 l"]);

// Livraison mit Fass planen → reserviert
await p.click('[data-tab="livraisons"]');
await p.click("#lAuf"); await p.click("#lAusAendern"); await p.selectOption("#lAus", "Lager"); await p.fill("#lFirma", "Ferro Forum"); await p.fill("#lDatum", "2026-12-05");
const zeilen = await p.evaluate(() => lArtikel().map(x => x.label));
ist("Livraison: Fässer zur Auswahl", zeilen.filter(l => l.startsWith("Hopfenkönig (01.10.2026)")), ["Hopfenkönig (01.10.2026)", "Hopfenkönig (01.10.2026) · Fass 20 l", "Hopfenkönig (01.10.2026) · Fass 30 l"]);
const idx = l => zeilen.indexOf(l);
await p.fill(`#lN${idx("Hopfenkönig (01.10.2026)")}`, "100"); await p.fill(`#lN${idx("Hopfenkönig (01.10.2026) · Fass 20 l")}`, "2");
ist("Betrag mit Fasspreis", await p.inputValue("#lBetrag"), "580");
await p.click("#lOk"); await warte(200);
ist("reserviert", await p.evaluate(() => [frei(Z, "Lager", "Hopfenkönig (01.10.2026)"), frei(Z, "Lager", "Hopfenkönig (01.10.2026) Keg 20l"), hat(Z, "Lager", "Hopfenkönig (01.10.2026)")]), [20, 1, 120]);
ist("Stock zeigt Reservierung", (await p.evaluate(() => { TAB = "bestand"; render(); return document.querySelector("#bTabelle").innerText; })), s => s.includes("Reservéiert fir geplangt Bestellungen") && s.includes("100 × Hopfenkönig (01.10.2026)"));
// Variante A (vom Nutzer, Fassung h): groß frei, gelb darunter reserviert — Stock, Pro Zort, Pro Persoun
const lagerZeile = await p.evaluate(() => { const tr = [...document.querySelectorAll("#bTabelle tr")].find(r => r.cells[0] && r.cells[0].textContent.includes("Lager"));
  const i = [...document.querySelectorAll("#bTabelle tr th")].findIndex(th => th.textContent.includes("Hopfenkönig")); return tr.cells[i].innerText.replace(/\s+/g, " "); });
ist("Stock: Lager zeigt frei + 🚚 reserviert", lagerZeile, "20 🚚 100");
ist("Stock: Tabelle passt ohne seitlich zu scrollen", await p.evaluate(() => [...document.querySelectorAll("#bTabelle .tabwrap")].every(w => w.scrollWidth <= w.clientWidth)), true);
ist("Stock: Kopf zweizeilig (Name / Datum)", await p.evaluate(() => [...document.querySelector("#bTabelle table").querySelectorAll("th")].some(th => th.innerHTML.includes("Hopfenkönig<br><small>01.10.26</small>"))), true);
ist("Stock: Fräi / + 🚚 res. / = Total", await p.evaluate(() => [...document.querySelectorAll("#bTabelle tr")].map(r => r.cells[0] && r.cells[0].textContent.trim()).filter(t => /Fräi|res\.|Total/.test(t || ""))), ["Fräi", "+ 🚚 res.", "= Total"]);
const uebA = await p.evaluate(() => { TAB = "uebersicht"; render(); const tr = document.querySelector('#t-uebersicht tr[data-sorte="Hopfenkönig (01.10.2026)"]'); return tr.cells[4].innerText.replace(/\s+/g, " "); });
ist("Pro Zort: Nach do frei + 🚚", uebA, "20 🚚 100");
ist("Pro Persoun: Lager frei + 🚚", await p.evaluate(() => { const tr = [...document.querySelectorAll("#t-uebersicht tr")].find(r => r.cells[0] && r.cells[0].textContent.trim() === "Lager"); return tr.cells[1].innerText.replace(/\s+/g, " "); }), s => s.startsWith("20") && s.includes("🚚 100"));
await p.evaluate(() => { TAB = "bestand"; render(); });

// Zweite Livraison, die nicht mehr reicht → Warnung, abgelehnt → nichts geplant
await p.evaluate(() => { TAB = "livraisons"; render(); });
await warte(900);
await p.click("#lAuf"); await p.click("#lAusAendern"); await p.selectOption("#lAus", "Lager"); await p.fill("#lFirma", "BEST"); await p.fill("#lDatum", "2026-12-10");
const z2 = await p.evaluate(() => lArtikel().map(x => x.label));
await p.fill(`#lN${z2.indexOf("Hopfenkönig (01.10.2026)")}`, "30");
antworten = [false];
await p.click("#lOk"); await warte(200);
ist("Warnung nennt frei und reserviert", fragen[fragen.length - 1], s => typeof s === "string" && s.includes("Net genuch fräi") && s.includes("de Lager huet 120") === false && s.includes("d'Lager huet 120") && s.includes("100 reservéiert") && s.includes("fräi 20"));
ist("abgelehnt: nicht geplant", await p.evaluate(() => Z.livraisons.length), 1);
await warte(900);
antworten = [true];
await p.click("#lOk"); await warte(200);
ist("bestätigt: trotzdem geplant", await p.evaluate(() => Z.livraisons.length), 2);

// Liefern und mit Zahlungsart bezahlen; Abbrechen zahlt nicht
await p.evaluate(() => { TAB = "livraisons"; render(); });
await p.locator("[data-geliwwert]").first().click(); await warte(200);
await p.click("[data-lbezuelt]"); await p.click("#zahlZu"); await warte(200);
ist("Abbrechen: nichts bezahlt", await p.evaluate(() => Z.kasse), 0);
await warte(900);
await p.click("[data-lbezuelt]");
ist("Fenster zeigt vier Arten", await p.evaluate(() => [...document.querySelectorAll("#zahlWahl [data-wie]")].map(b => b.textContent)), ["WERO", "SumUp", "Iwwerweisung", "Bar"]);
await p.click('#zahlWahl [data-wie="sumup"]'); await warte(200);
ist("bezahlt per SumUp", await p.evaluate(() => Z.kasseNach), { sumup: 580 });

// Verkaufen: Bar; Iwwersiicht zeigt Kasse nach Art und Fass-Zeilen
await p.evaluate(() => { eintragen([{ art: "bewegung", sorte: "Hopfenkönig (01.10.2026)", n: 10, von: "Lager", an: "Marc" }]); TAB = "verkaufen"; FORM = null; render(); });
await p.fill("#vVorname", "Paul"); await p.click('[data-plus="' + (await p.evaluate(() => vArtikel().findIndex(x => x.key === "Hopfenkönig (01.10.2026)"))) + '"]');
await p.click('[data-bez="bar"]'); await p.click("#vSpeichern"); await warte(200);
ist("Verkauf bar", await p.locator("#vMeldung").innerText(), s => s.includes("bezuelt per Bar"));
await p.evaluate(() => { TAB = "uebersicht"; render(); });
const ueb = await p.locator("#t-uebersicht").innerText();
ist("Kasse nach Art", ueb, s => s.includes("SumUp 580 €") && s.includes("Bar 3 €"));
ist("Fass-Zeilen unter dem Bier", ueb, s => s.includes("🛢️ Fass 20 l") && s.includes("🛢️ Fass 30 l"));
ist("Pro Persoun: Flaschen und Fässer getrennt", await p.evaluate(() => [...document.querySelectorAll("#t-uebersicht table")].pop().innerText), t => /Marc\t9\t101 \+ 2 F\./.test(t) && /Lager\t-20 \+ 3 F\./.test(t) && t.includes("🚚 30")); // frei = 10 da − 30 reserviert (Variante A)
await p.evaluate(() => { OFFEN_SORTE = "Hopfenkönig (01.10.2026)"; render(); });
ist("Liste pro Bier: Zahlungsart sichtbar", await p.locator("#t-uebersicht").innerText(), t => t.includes("SumUp") && /Paul[\s\S]*Bar/.test(t));
// Verkaufen ohne eigenen Bestand: Fenster „woher nehmen?“ → aus dem Lager umbuchen
// Lager: 10 da, 30 für BEST reserviert → frei −20, darf nicht angeboten werden. Erst nachfüllen.
await p.evaluate(() => { eintragen([{ art: "abfuellung", sorte: "Hopfenkönig (01.10.2026)", n: 50 }]); EIN.ich = "Jeff"; TAB = "verkaufen"; FORM = null; render(); });
const lagerVor = await p.evaluate(() => [hat(Z, "Lager", "Hopfenkönig (01.10.2026)"), frei(Z, "Lager", "Hopfenkönig (01.10.2026)")]);
await p.fill("#vVorname", "Anne");
const iH = await p.evaluate(() => vArtikel().findIndex(x => x.key === "Hopfenkönig (01.10.2026)"));
await p.fill(`#vN${iH}`, "4"); await p.click('[data-bez="wero"]'); await warte(900);
await p.click("#vSpeichern");
await p.waitForSelector("#frageWahl:not(.versteckt)");
ist("Fenster: woher nehmen", [await p.locator("#frageTitel").innerText(), await p.evaluate(() => [...document.querySelectorAll("#frageKnoepfe button")].map(b => b.dataset.wahl))],
  v => v[0].includes("feelt: 4 × Hopfenkönig (01.10.2026)") && v[1][0] === "q:Lager" && v[1].includes("q:Marc") && v[1].at(-1) === "trotzdem");
await p.click('#frageWahl [data-wahl="q:Lager"]'); await warte(300);
ist("aus dem Lager umgebucht und verkauft", await p.evaluate(() => [hat(Z, "Lager", "Hopfenkönig (01.10.2026)"), hat(Z, "Jeff", "Hopfenkönig (01.10.2026)"), Z.kaeufer.some(k => k.name === "Anne")]), [lagerVor[0] - 4, 0, true]);
ist("Meldung nennt Umbuchung", await p.locator("#vMeldung").innerText(), s => s.includes("vum Lager ëmgebucht"));
await warte(900);
await p.fill("#vVorname", "Tom"); await p.fill(`#vN${iH}`, "2"); await p.click('[data-bez="bar"]'); await warte(900);
await p.click("#vSpeichern"); await p.waitForSelector("#frageWahl:not(.versteckt)"); await p.click("#frageZu"); await warte(200);
ist("Ofbriechen: nichts verkauft", await p.evaluate(() => Z.kaeufer.some(k => k.name === "Tom")), false);
ist("keine Seitenfehler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Fässer: alles bestanden");
process.exit(fehler ? 1 : 0);
