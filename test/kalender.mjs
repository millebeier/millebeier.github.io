// Browser: Kalender (📅 neben dem Zahnrad) — Termin anlegen, Vorschlag nach dem Braudag (+7/+14, Datum änderbar),
// Liste mit geplanten Bestellungen (nur App), Kommend/Alles/Just meng, ändern, löschen, Abo-Link aus dem Code, Zuklappen.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
const { createHash } = await import("node:crypto");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
p.on("dialog", d => d.accept());
await p.route(/workers\.dev/, r => r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); window.OHNE_ALTIMPORT = true; EIN = { code: "hopfen", ich: "Laurent" }; TAB = "verkaufen"; render(); });
const H = await p.evaluate(() => heuteLux());
const plus = n => { const x = new Date(H + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const setze = async (sel, v) => p.$eval(sel, (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, v);

ist("📅 im Kopf neben dem Zahnrad", await p.evaluate(() => { const k = document.querySelector("#kalBtn"); return !!k && k.nextElementSibling.id === "zahnrad" && !k.classList.contains("versteckt"); }), true);
await p.evaluate(d => eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 50 },
  { art: "livraison", kunde: "Reimen David", kontakt: "Laurent", aus: "Lager", datum: d, posten: [{ sorte: "NEIPA", n: 4 }], betrag: 12, rechnung: false },
  { art: "termin", tid: "t-alt-001", typ: "reunioun", titel: "Al Reunioun", datum: "2026-01-10", wer: ["Jeff"] }]), plus(1));
ist("Zahl am 📅: Bestellung morgen", await p.locator("#kalBtn .badge").innerText(), "1");
await p.click("#kalBtn");
ist("Kalender offen, Knopf markiert", await p.evaluate(() => [TAB, document.querySelector("#kalBtn").classList.contains("an")]), ["kalender", true]);
ist("Bestellung steht drin (nur App)", await p.locator("#t-kalender").innerText(), t => t.includes("Bestellung Reimen David") && t.includes("aus de Bestellungen"));
ist("Vergaangenes nicht bei Kommend", await p.locator("#t-kalender").innerText(), t => !t.includes("Al Reunioun"));
await p.click('[data-ksicht="alles"]');
ist("Alles: auch Vergaangenes", await p.locator("#t-kalender").innerText(), t => t.includes("Al Reunioun"));
await p.click('[data-ksicht="kommend"]');

// Neuer Braudag mit Vorschlag
await p.click("#tNeu");
ist("Braudag vorgewählt, alle dabei", await p.evaluate(() => [KALFORM.typ, document.querySelector("#tTitel").value, KALFORM.wer.slice().sort(), document.querySelectorAll("[data-twer].an").length]), ["braudag", "Braudag", ["Claude", "Jeff", "Laurent", "Marc"], 4]);
ist("Haken am Anfang leer", await p.evaluate(() => [...document.querySelectorAll("[data-tfan]")].map(c => c.checked)), [false, false]);
ist("Afëllen mit Bierflasche", await p.evaluate(() => !!document.querySelector('[data-ttyp="abfuellen"] svg.tflasche') && !!document.querySelector(".tfolge svg.tflasche")), true);
ist("Vorschlag +7/+14 ab heute", [await p.inputValue('[data-tfd="0"]'), await p.inputValue('[data-tfd="1"]')], [plus(7), plus(14)]);
await setze("#tDatum", plus(2));
ist("Datum ändern → Vorschlag zieht mit", [await p.inputValue('[data-tfd="0"]'), await p.inputValue('[data-tfd="1"]')], [plus(9), plus(16)]);
await setze('[data-tfd="1"]', plus(20));
await setze("#tDatum", plus(3));
ist("selbst geändertes Datum bleibt", [await p.inputValue('[data-tfd="0"]'), await p.inputValue('[data-tfd="1"]')], [plus(10), plus(20)]);
await p.check('[data-tfan="0"]'); await p.check('[data-tfan="1"]');
await p.selectOption("#tBier", "NEIPA");
await p.click('[data-twer="Marc"]'); await p.click('[data-twer="Claude"]');
await setze("#tUhr", "10:00"); await setze("#tBis", "09:00");
await p.click("#tOk"); await warte(100);
ist("Bis vor Zäit abgelehnt", await p.locator("#tMeld").innerText(), t => t.includes("Bis"));
await setze("#tBis", "16:00"); await setze("#tWou", "bei Laurent");
ist("mitten im Eintrag", await p.evaluate(() => mittenImEintrag()), true);
await warte(900); await p.click("#tOk"); await warte(200);
const ts = await p.evaluate(() => Z.termine.map(t => [t.typ, t.datum, t.uhr || "", t.bier || "", (t.wer || []).join("+")]));
ist("Braudag + Ëmschlauchen + Afëllen gespeichert", ts.filter(t => t[0] !== "reunioun"),
  [["braudag", plus(3), "10:00", "NEIPA", "Jeff+Laurent"], ["umschlauchen", plus(10), "", "NEIPA", "Jeff+Laurent"], ["abfuellen", plus(20), "", "NEIPA", "Jeff+Laurent"]]);
ist("Meldung", await p.locator("#t-kalender .meldung").innerText(), t => t.includes("Agedroen") && t.includes("Ëmschlauchen"));
ist("Reihenfolge in der Liste", await p.evaluate(() => [...document.querySelectorAll(".ter .tinh > b")].map(x => x.textContent.trim())),
  ["🚚 Bestellung Reimen David", "🍺 Braudag · NEIPA", "🔄 Ëmschlauchen · NEIPA", "Afëllen · NEIPA"]);

// Vorschlag abwählen; Art wechseln ändert den Titel nur, solange man ihn nicht selbst getippt hat
await warte(900); await p.click("#tNeu");
await p.uncheck('[data-tfan="0"]'); await p.uncheck('[data-tfan="1"]');
ist("abgewählt → Datum gesperrt", await p.evaluate(() => document.querySelector('[data-tfd="0"]').disabled), true);
await p.click('[data-ttyp="stand"]');
ist("Art wechseln: Titel folgt, Vorschlag weg", [await p.inputValue("#tTitel"), await p.locator(".tfolge").count()], ["Stand / Fest", 0]);
await p.fill("#tTitel", "Chrëschtmaart"); await p.click('[data-ttyp="reunioun"]');
ist("selbst getippter Titel bleibt", await p.inputValue("#tTitel"), "Chrëschtmaart");
await p.click('[data-ttyp="stand"]'); await p.click('[data-twer="Laurent"]'); await p.click('[data-twer="Jeff"]'); await p.click('[data-twer="Claude"]');
await p.selectOption("#tBier", "__neu");
ist("neues Bier: Feld zum Eintippen", [await p.locator("#tBierNeu").count(), await p.evaluate(() => document.activeElement.id)], [1, "tBierNeu"]);
await p.keyboard.type("Hazy Pale (Test)");
await setze("#tDatum", plus(5)); await warte(900); await p.click("#tOk"); await warte(200);
ist("Stand ohne mich, mit eingetipptem Bier", await p.evaluate(() => { const t = Z.termine.find(t => t.typ === "stand"); return [t.wer, t.bier]; }), [["Marc"], "Hazy Pale (Test)"]);
const stand = await p.evaluate(() => Z.termine.find(t => t.typ === "stand").tid);
await p.click(`[data-ter="${stand}"]`); await p.click(`[data-ted="${stand}"]`);
ist("Ändern: eingetipptes Bier steht im Feld", [await p.inputValue("#tBier"), await p.inputValue("#tBierNeu")], ["__neu", "Hazy Pale (Test)"]);
await p.selectOption("#tBier", "NEIPA");
ist("Auswahl statt Eintippen: Feld weg", await p.locator("#tBierNeu").count(), 0);
await p.click("#tZu");
await p.click(`[data-ter="${stand}"]`);

// Filter mit kleinen Symbolen
ist("Filterleiste: All + 8 Arten + Bestellungen", await p.locator(".tfilter button").count(), 10);
await p.click('[data-kfil="braudag"]');
ist("nur Braudag", await p.evaluate(() => [...document.querySelectorAll(".ter .tinh > b")].map(x => x.textContent.trim())), ["🍺 Braudag · NEIPA"]);
await p.click('[data-kfil="bestellung"]');
ist("Braudag + Bestellungen", await p.evaluate(() => [...document.querySelectorAll(".ter .tinh > b")].map(x => x.textContent.trim())), ["🚚 Bestellung Reimen David", "🍺 Braudag · NEIPA"]);
ist("All aus, zwei Symbole an", await p.evaluate(() => [document.querySelector('[data-kfil=""]').classList.contains("an"), document.querySelectorAll(".tfilter button.an").length]), [false, 2]);
await p.click('[data-kfil="braudag"]'); await p.click('[data-kfil="bestellung"]');
ist("alles abgewählt = All", await p.evaluate(() => [document.querySelector('[data-kfil=""]').classList.contains("an"), document.querySelectorAll(".ter").length]), [true, 5]);
await p.click('[data-kfil="reunioun"]');
ist("leerer Filter: Hinweis", await p.locator("#t-kalender").innerText(), t => t.includes("Näischt fir dëse Filter"));
await p.click('[data-kfil=""]');

// Just meng
await p.click('[data-ksicht="meng"]');
ist("Just meng: ohne Stand von Marc", await p.locator("#t-kalender").innerText(), t => !t.includes("Chrëschtmaart") && t.includes("Braudag") && t.includes("Reimen"));
await p.click('[data-ksicht="kommend"]');

// Aufklappen, ändern, löschen
const brau = await p.evaluate(() => Z.termine.find(t => t.typ === "braudag").tid);
await p.click(`[data-ter="${brau}"]`);
ist("aufgeklappt: Ännern/Läschen", await p.locator(`[data-ted="${brau}"]`).count(), 1);
await p.click(`[data-ted="${brau}"]`);
ist("Ännern vorbelegt, kein Vorschlag", [await p.inputValue("#tTitel"), await p.inputValue("#tUhr"), await p.locator(".tfolge").count()], ["Braudag", "10:00", 0]);
await p.fill("#tTitel", "Braudag NEIPA #2"); await warte(900); await p.click("#tOk"); await warte(200);
ist("geändert, nicht doppelt", await p.evaluate(b => Z.termine.filter(t => t.tid === b).map(t => t.titel).concat([Z.termine.filter(t => t.typ === "braudag").length]), brau), ["Braudag NEIPA #2", 1]);
ist("im Verlauf", await p.evaluate(() => beschreibe(SERVER.concat(AUSGANG).filter(e => e.art === "termin").pop(), Z)), t => t.includes("📅") && t.includes("Braudag NEIPA #2"));
ist("bleibt nach dem Ändern aufgeklappt", await p.locator(`[data-tweg="${brau}"]`).count(), 1);
await p.click(`[data-tweg="${brau}"]`); await warte(200);
ist("gelöscht", await p.evaluate(b => Z.termine.some(t => t.tid === b), brau), false);

// Bestellung: Knopf führt zu den Bestellungen
const lid = await p.evaluate(() => "liv-" + Z.livraisons[0].id);
await p.click(`[data-ter="${lid}"]`); await p.click("[data-tliv]");
ist("→ Bestellungen", await p.evaluate(() => TAB), "livraisons");

// Abo-Link
await p.click("#kalBtn"); await warte(300);
const schl = createHash("sha256").update("millebeier-kalender:hopfen").digest("hex").slice(0, 32);
ist("Abo-Link mit Schlüssel aus dem Code", [await p.getAttribute("#tAbo", "href"), await p.inputValue("#tUrl")],
  [`webcal://millebeier.rjtp6r9s9h.workers.dev/kalender/${schl}.ics`, `https://millebeier.rjtp6r9s9h.workers.dev/kalender/${schl}.ics`]);

// Zuklappen nach 5 min
await p.evaluate(() => { KAL_AUF.add("x"); }); await p.click('[data-tab="bestand"]');
await p.evaluate(() => { ZU_WEG.kalender = Date.now() - 6 * 60 * 1000; }); await p.click("#kalBtn");
ist("nach 5 min zugeklappt", await p.evaluate(() => KAL_AUF.size), 0);
ist("Termin-Eintrag gültig, kaputter nicht", await p.evaluate(() => [gueltig({ id: "x", zeit: 0, art: "termin", tid: "t-ok-0001", typ: "braudag", titel: "B", datum: "2026-12-01" }),
  gueltig({ id: "x", zeit: 0, art: "termin", tid: "t-ok-0001", typ: "akafen", titel: "B", datum: "2026-12-01" }),
  gueltig({ id: "x", zeit: 0, art: "termin", tid: "t-ok-0001", typ: "braudag", titel: "B", datum: "2026-12-01", uhr: "9 Auer" })]), [true, false, false]);
ist("keine Seitenfehler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Kalender: alles bestanden");
process.exit(fehler ? 1 : 0);
