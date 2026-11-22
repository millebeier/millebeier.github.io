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

// Ohne Braudatum: abgelehnt (Pflichtfeld)
await p.click("#bierNeu"); await p.fill("#biName", "Ouni Datum"); await p.fill("#biPreis", "3"); await p.click("#biOk"); await warte(200);
ist("ohne Braudatum abgelehnt", [await p.locator("#biMeld").innerText(), await p.evaluate(() => Z.cfg.sorten.some(c => c.name.startsWith("Ouni")))], v => v[0].includes("Braudatum feelt") && v[1] === false);
await p.click("#biZu"); await warte(900);
await p.click("#bierNeu");
await p.fill("#biName", "Rusty"); await p.fill("#biStil", "Red Ale"); await p.fill("#biBrau", "2026-02-06");
await p.fill("#biAlk", "5,6"); await p.fill("#biLiter", "156"); await p.fill("#biPreis", "3"); await p.fill("#biFl", "288");
await p.click("#biOk"); await warte(200);
ist("nach dem Anlegen gleich Dokumente", await p.locator("#bierDok").innerText(), s => s.includes("Etikett") && s.includes("Brauprotokoll"));
await p.click("#biZu"); await warte(100);
ist("Name bekommt das Braudatum", await p.evaluate(() => Z.cfg.sorten.map(c => c.name).includes("Rusty (06.02.2026)")), true);
ist("angelegt mit 288 im Lager", await p.evaluate(() => [Z.cfg.sorten.some(c => c.name === "Rusty (06.02.2026)"), hat(Z, "Lager", "Rusty (06.02.2026)")]), [true, 288]);
ist("Liste zeigt Eigenschaften", await p.locator("#bBiere").innerText(), s => s.includes("Rusty (06.02.2026)") && s.includes("Red Ale · 5,6 % · 3 €/Fl · gebraut 6.2.2026 · 156 L"));
await p.click("#bierNeu"); await p.fill("#biName", "rusty"); await p.fill("#biBrau", "2026-02-06"); await p.click("#biOk");
ist("doppelter Name abgelehnt", await p.locator("#biMeld").innerText(), s => s.includes("gëtt et schonn"));
await p.click("#biZu"); await warte(900);

await p.click('[data-bed="Rusty (06.02.2026)"]');
ist("Ändern: Felder vorbelegt", [await p.inputValue("#biAlk"), await p.inputValue("#biBrau"), await p.locator("#biName").count()], ["5,6", "2026-02-06", 0]);
await p.fill("#biPreis", "3,5"); await p.click("#biOk"); await warte(200);
ist("Preis geändert", await p.evaluate(() => Z.cfg.sorten.find(c => c.name === "Rusty (06.02.2026)").preis), 3.5);

// Mit Bestand: Archivieren geht nicht, Hinweis sagt wo
await p.click('[data-barch="Rusty (06.02.2026)"]'); await warte(200);
ist("Archivieren mit Bestand blockiert", [fragen[fragen.length - 1], await p.evaluate(() => Z.cfg.sorten.find(c => c.name === "Rusty (06.02.2026)").archiv)], v => v[0].includes("kann nach net archivéiert ginn") && v[0].includes("Fläschen: Lager 288") && !v[1]);
await p.evaluate(() => eintragen([{ art: "abgang", sorte: "Rusty (06.02.2026)", n: 288, wer: "Lager", grund: "sonst" }])); await warte(900);
await p.click('[data-barch="Rusty (06.02.2026)"]'); await warte(200);
ist("archiviert: nicht mehr verkaufbar", await p.evaluate(() => vSorten().some(s => s.name === "Rusty (06.02.2026)")), false);
await p.click("#archivAuf");
ist("im Archiv sichtbar", await p.locator("#bBiere").innerText(), s => s.includes("Archiv (1)") && s.includes("Zréckhuelen"));
await p.click('[data-bzr="Rusty (06.02.2026)"]'); await warte(200);
ist("zurückgeholt", await p.evaluate(() => vSorten().some(s => s.name === "Rusty (06.02.2026)")), true);

await warte(900);
antworten = [true, false];
await p.click('[data-bweg="Rusty (06.02.2026)"]'); await warte(200);
ist("Löschen: zweite Frage verneint → bleibt", await p.evaluate(() => Z.sortenNamen.includes("Rusty (06.02.2026)")), true);
ist("Löschen: zwei Fragen gestellt", fragen.slice(-2).map(f => f.split("\n")[0]), ["Rusty (06.02.2026) komplett läschen?", "Bass de sécher? Rusty (06.02.2026) gëtt elo geläscht."]);
await warte(900);
antworten = [true, true];
await p.click('[data-bweg="Rusty (06.02.2026)"]'); await warte(200);
ist("Löschen: beide bejaht → weg", await p.evaluate(() => Z.sortenNamen.includes("Rusty (06.02.2026)")), false);

await p.click('#zahnrad'); await p.click('#t-einst [data-zb="verlauf"]');
ist("Verlauf: rotes ✕", await p.evaluate(() => { const k = document.querySelector("[data-storno]"); return [k.textContent, getComputedStyle(k).color]; }), ["✕", "rgb(227, 20, 27)"]);
antworten = [true];
await p.locator("[data-storno]").first().click(); await warte(200);
ist("Löschen des Löschens holt Bier zurück", await p.evaluate(() => Z.sortenNamen.includes("Rusty (06.02.2026)")), true);

await p.click('[data-tab="uebersicht"]');
ist("Iwwersiicht: rotes Dreieck", await p.evaluate(() => { const td = document.querySelector("tr.klick td"); const st = getComputedStyle(td, "::before"); return [st.content, st.color]; }), ['"▶"', "rgb(227, 20, 27)"]);
// Iwwersiicht: archivierte Biere gesammelt unter „Archiv“, aufklappbar, darin wieder je Bier aufklappbar
await p.evaluate(() => { eintragen([{ art: "abfuellung", sorte: "Rusty (06.02.2026)", n: 10 }]); });
await warte(900);
await p.evaluate(() => { eintragen([{ art: "bierstatus", name: "Rusty (06.02.2026)", status: "archiv" }]); TAB = "uebersicht"; OFFEN_SORTE = ""; render(); });
const zeilenText = () => p.evaluate(() => [...document.querySelectorAll("#t-uebersicht tr.klick")].map(t => t.cells[0].textContent.trim()));
ist("oben nur aktuelle, Rusty unter Archiv", await zeilenText(), ["NEIPA", "White IPA", "Brown Porter", "📦 Archiv (1)"]);
await p.click("tr[data-archiv]");
ist("Archiv aufgeklappt", await zeilenText(), ["NEIPA", "White IPA", "Brown Porter", "📦 Archiv (1)", "Rusty (06.02.2026)"]);
await p.click('tr[data-sorte="Rusty (06.02.2026)"]');
ist("archiviertes Bier: Verkäufe aufgeklappt", await p.locator("#t-uebersicht").innerText(), s => s.includes("Rusty (06.02.2026): wien huet wat wiem verkaaft"));
ist("Total enthält Archiv", await p.evaluate(() => [+document.querySelector("#t-uebersicht tr.summe").cells[4].textContent.trim(), Z.flaschen.da, hat(Z, "Lager", "Rusty (06.02.2026)")]), v => v[0] === v[1] && v[2] > 0 && v[0] >= v[2]);
await p.click("tr[data-archiv]");
ist("Archiv zu → Rusty-Liste auch zu", [await zeilenText(), (await p.locator("#t-uebersicht").innerText()).includes("Rusty (06.02.2026): wien huet")], [["NEIPA", "White IPA", "Brown Porter", "📦 Archiv (1)"], false]);
// Alte Verkäufe einspielen (einmalig, Knopf in ⚙️)
await p.click("#zahnrad");
antworten = [true];
await p.click("#eAlt"); await warte(300);
ist("Import: gleich Iwwersiicht mit offenem Archiv", await p.evaluate(() => [TAB, [...document.querySelectorAll("#t-uebersicht tr.klick.klein")].map(t => t.cells[0].textContent.trim())]), v => v[0] === "uebersicht" && v[1].includes("Rusty 02/2026") && v[1].includes("Brown Porter 01/2026"));
await p.click("#zahnrad");
ist("Import: Knopf danach weg", await p.locator("#eAlt").count(), 0);
ist("Import: Kasse unverändert", await p.evaluate(() => [Z.kasse, Z.offen]), [0, 0]);
await p.evaluate(() => { TAB = "uebersicht"; ARCHIV_UEB = false; OFFEN_SORTE = ""; render(); });
ist("Import: im Archiv", await p.evaluate(() => document.querySelector("tr[data-archiv]").cells[0].textContent), s => /Archiv \((3|4)\)/.test(s)); // Fässer sind seit Fassung i kein eigenes Bier mehr
await p.evaluate(() => altEinspielen()); await warte(200);
ist("Import zweimal: nichts doppelt", await p.evaluate(() => Z.sorten["Rusty 02/2026"].verkauft), 285);
// Zweiter Sud mit anderem Braudatum = eigenes Bier; Knopf heißt „+ Neien Béier“
await p.evaluate(() => { TAB = "bestand"; BIERFORM = null; render(); });
ist("Knopf heißt + Neien Béier", await p.locator("#bierNeu").innerText(), "+ Neien Béier");
await warte(900);
await p.click("#bierNeu"); await p.fill("#biName", "Rusty"); await p.fill("#biBrau", "2027-03-15"); await p.fill("#biPreis", "3"); await p.click("#biOk"); await warte(300);
ist("zweiter Sud: eigenes Bier", await p.evaluate(() => Z.cfg.sorten.map(c => c.name).filter(n => n.startsWith("Rusty ("))), ["Rusty (06.02.2026)", "Rusty (15.03.2027)"]);
// Gleich aussehende Biere verhindern: neues „NEIPA (28.07.2026)“, dann altes „NEIPA“ auf denselben Tag setzen → abgelehnt
await warte(900);
await p.evaluate(() => { TAB = "bestand"; BIERFORM = null; render(); });
await p.click("#bierNeu"); await p.fill("#biName", "NEIPA"); await p.fill("#biBrau", "2026-07-28"); await p.fill("#biPreis", "3"); await p.click("#biOk"); await warte(300);
ist("neues NEIPA mit Datum neben altem NEIPA", await p.evaluate(() => Z.cfg.sorten.map(c => c.name).filter(n => n.startsWith("NEIPA"))), ["NEIPA", "NEIPA (28.07.2026)"]);
await p.click("#biZu"); await warte(900);
await p.click('[data-bed="NEIPA"]'); await p.fill("#biBrau", "2026-07-28"); await p.click("#biOk"); await warte(300);
ist("altes NEIPA auf gleichen Tag: abgelehnt", [await p.locator("#biMeld").innerText(), await p.evaluate(() => bierText("NEIPA"))], v => v[0].includes("gesäit aus wéi e Béier") && v[1] === "NEIPA");
await warte(900);
await p.fill("#biBrau", "2026-07-20"); await p.click("#biOk"); await warte(300);
ist("anderer Tag: erlaubt", await p.evaluate(() => bierText("NEIPA")), "NEIPA (20.07.2026)");
// Braudatum nachträglich korrigieren: Bestand bleibt, überall das neue Datum (auch Meldung und Rückfragen)
await warte(900);
await p.evaluate(() => { eintragen([{ art: "abfuellung", sorte: "NEIPA (28.07.2026)", n: 12 }]); TAB = "bestand"; BIERFORM = null; render(); });
await warte(900);
await p.click('[data-bed="NEIPA (28.07.2026)"]'); await p.fill("#biBrau", "2026-07-29"); await p.click("#biOk"); await warte(300);
ist("Datum korrigiert: Anzeige neu, Bestand bleibt", [await p.locator("#bierMeld").innerText(), await p.evaluate(() => [bierText("NEIPA (28.07.2026)"), hat(Z, "Lager", "NEIPA (28.07.2026)")])], v => v[0].includes("NEIPA (29.07.2026) gespäichert") && v[1][0] === "NEIPA (29.07.2026)" && v[1][1] === 12);
ist("Karte zeigt neues Datum", await p.locator("#bBiere").innerText(), t => t.includes("NEIPA (29.07.2026)") && !t.includes("NEIPA (28.07.2026)"));
await warte(900);
await p.click('[data-barch="NEIPA (28.07.2026)"]'); await warte(200);
ist("Rückfrage mit neuem Datum", fragen[fragen.length - 1], t => t.startsWith("NEIPA (29.07.2026) kann nach net archivéiert"));
// ---------- Fläschen (Fassung c, vom Nutzer): Absicht, Pfeil, ⇄, Vorschau, Gründe; Abfüllen beim Bier ändern ----------
{
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  const qf = []; q.on("pageerror", e => qf.push(e.message)); q.on("dialog", d => d.accept());
  await q.route(/workers\.dev/, r => r.abort());
  await q.addInitScript(() => { window.OHNE_ALTIMPORT = true; });
  await q.goto(new URL("../index.html", import.meta.url).href);
  await q.evaluate(() => { localStorage.clear(); localStorage.setItem("millebeier_v1", JSON.stringify({ code: "x", ich: "Laurent" })); });
  await q.reload();
  await q.evaluate(() => { eintragen([{ art: "bier", name: "IPA (01.11.2026)", preis: 3, braudatum: "2026-11-01" }, { art: "abfuellung", sorte: "IPA (01.11.2026)", n: 48 }]); TAB = "bestand"; render(); });
  const IPA = "IPA (01.11.2026)";
  ist("Überschrift „Eis Béieren am Stock“", await q.locator("#bBiere h2").first().innerText(), "Eis Béieren am Stock");
  ist("jede Absicht mit eigenem Bild (Fassung d)", await q.evaluate(() => [...document.querySelectorAll("[data-abs] i svg")].length), 4);
  ist("vier Absichten, kein Ofgefëllt mehr", await q.evaluate(() => [...document.querySelectorAll("[data-abs]")].map(b => b.dataset.abs)), ["huelen", "zreck", "ginn", "fort"]);
  await q.click('[data-abs="huelen"]');
  ist("Ech huele mer: Lager ➜ ich, Stand im Kasten", await q.evaluate(() => [...document.querySelectorAll("#bForm .pk b")].map(x => x.textContent)), ["📦 Lager", "👤 Laurent"]);
  await q.selectOption("#bSorte", IPA); await q.fill("#bN", "12");
  ist("Vorschau", await q.locator("#bVor").innerText(), t => t.includes("Lager 36") && t.includes("Laurent 12"));
  await q.click("#bOk"); await warte(200);
  ist("gebucht, danach wieder die vier Knöpfe mit Meldung", [await q.evaluate(() => hat(Z, "Laurent", "IPA (01.11.2026)")), await q.locator("[data-abs]").count(), await q.locator("#bForm .meldung").innerText()], v => v[0] === 12 && v[1] === 4 && v[2].includes("Lager → Laurent"));
  // Zréck an d'Lager + ⇄
  await q.click('[data-abs="zreck"]');
  ist("Zréck: ich ➜ Lager", await q.evaluate(() => [...document.querySelectorAll("#bForm .pk b")].map(x => x.textContent)), ["👤 Laurent", "📦 Lager"]);
  await q.click("#bTausch");
  ist("⇄ dreht um", await q.evaluate(() => [...document.querySelectorAll("#bForm .pk b")].map(x => x.textContent)), ["📦 Lager", "👤 Laurent"]);
  await q.click("#bZreck");
  // Engem anere ginn: ich ➜ jemand anderes, änneren
  await q.click('[data-abs="ginn"]'); await q.click('[data-aend="An"]'); await q.selectOption('[data-hw="An"]', "Marc");
  await q.selectOption("#bSorte", IPA); await q.fill("#bN", "2"); await q.click("#bOk"); await warte(200);
  ist("Engem anere ginn: Laurent → Marc", await q.evaluate(() => [hat(Z, "Laurent", "IPA (01.11.2026)"), hat(Z, "Marc", "IPA (01.11.2026)")]), [10, 2]);
  // Net verkaaft: Gründe als Knöpfe, Soss eppes mit Text
  await warte(900); await q.click('[data-abs="fort"]');
  ist("Net verkaaft: vu mengen", await q.locator("#bForm .pk b").innerText(), "👤 vu mengen: Laurent");
  await q.click('[data-grund="sonst"]'); await q.fill("#bNotiz", "fir den Tombola");
  await q.selectOption("#bSorte", IPA); await q.fill("#bN", "1");
  ist("Vorschau bei Fort", await q.locator("#bVor").innerText(), t => t.includes("Laurent 9"));
  await q.click("#bOk"); await warte(200);
  ist("Abgang mit Grund und Text", await q.evaluate(() => Z.aktiv.filter(e => e.art === "abgang").map(e => [e.grund, e.notiz, e.n])), [["sonst", "fir den Tombola", 1]]);
  // Abfüllen ändern beim Bier: 48 → 60 (+12), dann 60 → 50; Verlauf
  await q.click(`[data-bed="${IPA}"]`);
  ist("Ofgefëllt vorbelegt mit Total", await q.inputValue("#biFl"), "48");
  await q.fill("#biFl", "60");
  ist("Vorschau am Lager", await q.locator("#biVor").innerText(), t => t.includes("48") && t.includes("(+12)"));
  await q.click("#biOk"); await warte(200);
  ist("abgefüllt 60, Lager +12", await q.evaluate(() => [Z.sorten["IPA (01.11.2026)"].abgefuellt, hat(Z, "Lager", "IPA (01.11.2026)")]), [60, 48]);
  ist("Verlauf: Ofgefëllt geännert 48 → 60", await q.evaluate(() => Z.aktiv.filter(e => e.art === "abfuellung").map(e => beschreibe(e, Z))), v => v.length === 1 && v[0].includes("48 → 60"));
  await warte(900); await q.click(`[data-bed="${IPA}"]`); await q.fill("#biFl", "50"); await q.click("#biOk"); await warte(200);
  ist("weniger: Lager −10", await q.evaluate(() => [Z.sorten["IPA (01.11.2026)"].abgefuellt, hat(Z, "Lager", "IPA (01.11.2026)")]), [50, 38]);
  ist("Fläschen: keine Seitenfehler", qf, []);
  await q.close();
}
ist("keine Seitenfehler", seitenfehler, []);
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Biere: alles bestanden");
process.exit(fehler ? 1 : 0);
