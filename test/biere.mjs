// Browser: Bier anlegen (mit Abfüllung), ändern, archivieren, zurückholen, löschen (zwei Rückfragen); Verlauf mit rotem ✕.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
const fragen = []; let antworten = [];
p.on("dialog", d => { fragen.push(d.message()); d[antworten.length ? (antworten.shift() ? "accept" : "dismiss") : "accept"](); });
await p.route(/workers\.dev/, r => r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); EIN = { code: "x", ich: "Laurent" }; TAB = "bestand"; render(); });

await p.click("#bierNeu");
await p.fill("#biName", "Rusty"); await p.fill("#biStil", "Red Ale"); await p.fill("#biBrau", "2026-02-06");
await p.fill("#biAlk", "5,6"); await p.fill("#biLiter", "156"); await p.fill("#biPreis", "3"); await p.fill("#biFl", "288");
await p.click("#biOk"); await warte(200);
ist("angelegt mit 288 im Lager", await p.evaluate(() => [Z.cfg.sorten.some(c => c.name === "Rusty"), hat(Z, "Lager", "Rusty")]), [true, 288]);
ist("Liste zeigt Eigenschaften", await p.locator("#bBiere").innerText(), s => s.includes("Rusty") && s.includes("Red Ale · 5,6 % · 3 €/Fl · gebraut 6.2.2026 · 156 L"));
await p.click("#bierNeu"); await p.fill("#biName", "rusty"); await p.click("#biOk");
ist("doppelter Name abgelehnt", await p.locator("#biMeld").innerText(), s => s.includes("gëtt et schonn"));
await p.click("#biZu"); await warte(900);

await p.click('[data-bed="Rusty"]');
ist("Ändern: Felder vorbelegt", [await p.inputValue("#biAlk"), await p.inputValue("#biBrau"), await p.locator("#biName").count()], ["5,6", "2026-02-06", 0]);
await p.fill("#biPreis", "3,5"); await p.click("#biOk"); await warte(200);
ist("Preis geändert", await p.evaluate(() => Z.cfg.sorten.find(c => c.name === "Rusty").preis), 3.5);

await p.click('[data-barch="Rusty"]'); await warte(200);
ist("archiviert: nicht mehr verkaufbar", await p.evaluate(() => vSorten().some(s => s.name === "Rusty")), false);
await p.click("#archivAuf");
ist("im Archiv sichtbar", await p.locator("#bBiere").innerText(), s => s.includes("Archiv (1)") && s.includes("Zréckhuelen"));
await p.click('[data-bzr="Rusty"]'); await warte(200);
ist("zurückgeholt", await p.evaluate(() => vSorten().some(s => s.name === "Rusty")), true);

await warte(900);
antworten = [true, false];
await p.click('[data-bweg="Rusty"]'); await warte(200);
ist("Löschen: zweite Frage verneint → bleibt", await p.evaluate(() => Z.sortenNamen.includes("Rusty")), true);
ist("Löschen: zwei Fragen gestellt", fragen.slice(-2).map(f => f.split("\n")[0]), ["Rusty komplett läschen?", "Bass de sécher? Rusty gëtt elo geläscht."]);
await warte(900);
antworten = [true, true];
await p.click('[data-bweg="Rusty"]'); await warte(200);
ist("Löschen: beide bejaht → weg", await p.evaluate(() => Z.sortenNamen.includes("Rusty")), false);

await p.click('[data-tab="verlauf"]');
ist("Verlauf: rotes ✕", await p.evaluate(() => { const k = document.querySelector("[data-storno]"); return [k.textContent, getComputedStyle(k).color]; }), ["✕", "rgb(227, 20, 27)"]);
antworten = [true];
await p.locator("[data-storno]").first().click(); await warte(200);
ist("Löschen des Löschens holt Bier zurück", await p.evaluate(() => Z.sortenNamen.includes("Rusty")), true);

await p.click('[data-tab="uebersicht"]');
ist("Iwwersiicht: rotes Dreieck", await p.evaluate(() => { const td = document.querySelector("tr.klick td"); const st = getComputedStyle(td, "::before"); return [st.content, st.color]; }), ['"▶"', "rgb(227, 20, 27)"]);
ist("keine Seitenfehler", seitenfehler, []);
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Biere: alles bestanden");
process.exit(fehler ? 1 : 0);
