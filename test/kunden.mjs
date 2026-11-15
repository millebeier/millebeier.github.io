// Browser: Stammclienten — anlegen, Vorschläge beim Tippen (Verkafen + Bestellung, kein Ausklappmenü),
// antippen zeigt Adresse/Telefon/E-Mail, Bestellung merkt sich den Client, früherer Käufer → „An d'Adressbuch“, ändern, löschen.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
p.on("dialog", d => d.accept());
await p.route(/workers\.dev/, r => r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); window.OHNE_ALTIMPORT = true; EIN = { code: "x", ich: "Laurent" }; TAB = "livraisons"; render(); });

// Anlegen
ist("Adressbuch leer", await p.locator("#kBuch").innerText(), t => t.includes("Stammclienten (0)"));
await p.click("#kNeu");
await p.fill("#kName", "Ferro Forum"); await p.fill("#kAdr", "1, rue de l'Usine"); await p.fill("#kOrt", "L-3895 Foetz");
await p.fill("#kTel", "+352 621 123 456"); await p.fill("#kMail", "info@ferroforum"); await p.click("#kOk"); await warte(100);
ist("falsche E-Mail abgelehnt", await p.locator("#kMeld").innerText(), t => t.includes("E-Mail"));
await p.fill("#kMail", "info@ferroforum.lu"); await warte(900); await p.click("#kOk"); await warte(200);
ist("angelegt", await p.evaluate(() => Z.kunden.map(k => [k.name, k.ort, k.tel, k.mail])), [["Ferro Forum", "L-3895 Foetz", "+352 621 123 456", "info@ferroforum.lu"]]);
ist("nach dem Speichern aufgeklappt", await p.locator("#kAuf").innerText(), "Zouklappen ▴");
ist("Liste zeigt Kontakt mit Links", await p.evaluate(() => [...document.querySelectorAll("#kBuch a")].map(a => a.getAttribute("href"))), ["tel:+352621123456", "mailto:info@ferroforum.lu"]);

// Kein Ausklappmenü mehr
ist("kein datalist", await p.evaluate(() => document.querySelectorAll("datalist, [list]").length), 0);

// Bestellung: tippen → Vorschlag → antippen → Info, Bestellung merkt kid
await p.click("#lAuf");
await p.click("#lKunde"); await p.keyboard.type("fer");
ist("Vorschlag beim Tippen", await p.evaluate(() => [...document.querySelectorAll("#lVorschlag button")].map(b => b.textContent)), ["📇 Ferro Forum"]);
await p.click("#lVorschlag button");
ist("Name eingefüllt, Info sichtbar", [await p.inputValue("#lKunde"), await p.locator("#lKundeInfo").innerText()], v => v[0] === "Ferro Forum" && v[1].includes("rue de l'Usine") && v[1].includes("L-3895 Foetz") && v[1].includes("+352 621 123 456") && v[1].includes("info@ferroforum.lu"));
ist("Vorschläge weg nach Antippen", await p.locator("#lVorschlag button").count(), 0);
await p.evaluate(() => eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 50 }]));
await p.fill("#lN0", "6"); await p.click("#lOk"); await warte(200);
ist("Bestellung mit kid", await p.evaluate(() => { const L = Z.livraisons[0]; return [L.kunde, L.kid === Z.kunden[0].kid]; }), ["Ferro Forum", true]);

// Verkafen: früherer Käufer (kein Stammclient) erscheint, mit „An d'Adressbuch“
await p.evaluate(() => { eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: "Paul Weber", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3 }]); TAB = "verkaufen"; FORM = null; render(); });
await p.click("#vKaeufer"); await p.keyboard.type("we");
ist("früherer Käufer als Vorschlag (Wortanfang)", await p.evaluate(() => [...document.querySelectorAll("#vVorschlag button")].map(b => b.textContent)), ["Paul Weber"]);
await p.click("#vVorschlag button");
ist("Hinweis + Knopf An d'Adressbuch", await p.locator("#vKundeInfo").innerText(), t => t.includes("nach net am Adressbuch") && t.includes("+ An d'Adressbuch"));
await p.click("#vKundeInfo [data-insbuch]"); await warte(200);
ist("Formular vorbelegt im Reiter Bestellungen", [await p.evaluate(() => TAB), await p.inputValue("#kName")], ["livraisons", "Paul Weber"]);
await p.fill("#kTel", "691 222 333"); await p.click("#kOk"); await warte(200);
ist("Paul jetzt Stammclient", await p.evaluate(() => Z.kunden.map(k => k.name)), ["Ferro Forum", "Paul Weber"]);

// Ändern und Löschen
await warte(900);
await p.click(`[data-ked="${await p.evaluate(() => Z.kunden.find(k => k.name === "Paul Weber").kid)}"]`);
await p.fill("#kOrt", "L-1234 Luxembourg"); await p.click("#kOk"); await warte(200);
ist("geändert, nicht doppelt", await p.evaluate(() => Z.kunden.filter(k => k.name === "Paul Weber").map(k => k.ort)), ["L-1234 Luxembourg"]);
await warte(900);
await p.click(`[data-kweg="${await p.evaluate(() => Z.kunden.find(k => k.name === "Paul Weber").kid)}"]`); await warte(200);
ist("gelöscht", await p.evaluate(() => Z.kunden.map(k => k.name)), ["Ferro Forum"]);
ist("Verkauf bleibt", await p.evaluate(() => Z.kaeufer.some(k => k.name === "Paul Weber")), true);
ist("keine Seitenfehler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Kunden: alles bestanden");
process.exit(fehler ? 1 : 0);
