// Browser: Reiter „Client“ — anlegen (Firma/Numm/Virnumm/Telefon/E-Mail/Adress), Liste alphabetisch mit nur dem Namen
// (Firma geht vor), rotes ▶ klappt Kontakt auf, darin ▶ Akeef (Verkéf + Bestellungen ab elo), Sich, Vorschléi beim Tippen
// (Verkafen + Bestellung, kee Ausklappmenü), „+ Bei d'Clienten“ féiert an de Reiter, änneren, läschen, Verlaf am Zahnrad.
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
await p.evaluate(() => { localStorage.clear(); window.OHNE_ALTIMPORT = true; EIN = { code: "x", ich: "Laurent" }; TAB = "verkaufen"; render(); });
const liste = () => p.evaluate(() => [...document.querySelectorAll("#kListe .kz > .kz-kopf")].map(b => b.textContent.trim()));

// Reiter und Verlauf
ist("Reiter Client statt Verlaf", await p.evaluate(() => [...document.querySelectorAll("nav [data-tab]")].map(b => b.textContent).slice(-1)), ["Client"]);
ist("kee Stammclienten méi bei Bestellungen", await p.evaluate(() => !!document.querySelector("#kBuch")), false);
await p.click("#zahnrad"); await p.click("#eVerlauf");
ist("Verlaf iwwer d'Zahnrad", await p.locator("#t-verlauf").innerText(), t => t.includes("Verlaf"));
await p.click("#vlZurueck");
ist("Zréck an d'Astellungen", await p.evaluate(() => TAB), "einst");

// Anlegen
await p.click('[data-tab="kunden"]');
ist("leer", await p.locator("#kListe").innerText(), t => t.includes("Client (0)") && t.includes("Nach keen Client"));
await p.click("#kNeu");
await p.click("#kOk"); await warte(100);
ist("Firma oder Numm néideg", await p.locator("#kMeld").innerText(), t => t.includes("Firma oder Numm"));
await p.fill("#kFirma", "Ferro Forum"); await p.fill("#kName", "Muller"); await p.fill("#kVorname", "Jeff");
await p.fill("#kAdr", "1, rue de l'Usine"); await p.fill("#kOrt", "L-3895 Foetz");
await p.fill("#kTel", "+352 621 123 456"); await p.fill("#kMail", "info@ferroforum"); await warte(900); await p.click("#kOk"); await warte(100);
ist("falsch E-Mail ofgeleent", await p.locator("#kMeld").innerText(), t => t.includes("E-Mail"));
await p.fill("#kMail", "info@ferroforum.lu"); await warte(900); await p.click("#kOk"); await warte(200);
ist("ugeluecht mat v:2", await p.evaluate(() => Z.kunden.map(k => [k.v, k.firma, k.name, k.vorname, k.ort, k.label])), [[2, "Ferro Forum", "Muller", "Jeff", "L-3895 Foetz", "Ferro Forum"]]);
ist("no dem Späicheren opgeklappt, Links", await p.evaluate(() => [...document.querySelectorAll("#kListe a")].map(a => a.getAttribute("href"))), ["tel:+352621123456", "mailto:info@ferroforum.lu"]);
ist("Kontaktpersoun ze gesinn", await p.locator("#kListe").innerText(), t => t.includes("Jeff Muller") && t.includes("rue de l'Usine"));
ist("Rechnungsadress", await p.evaluate(() => rechnungsAdresse(Z.kunden[0])), ["Ferro Forum", "À l'attention de Jeff Muller", "1, rue de l'Usine", "L-3895 Foetz"]);

// Zwee weider: Persoun ouni Firma, an eng mat A
for (const [n, v] of [["Weber", "Anne"], ["Arendt", "Paul"]]) {
  await warte(900); await p.click("#kNeu"); await p.fill("#kName", n); await p.fill("#kVorname", v); await warte(900); await p.click("#kOk"); await warte(200);
}
await p.evaluate(() => { K_AUF.clear(); renderKunden(); });
ist("alphabetesch, nëmmen den Numm (Firma virun)", await liste(), ["▶Arendt Paul", "▶Ferro Forum", "▶Weber Anne"]);
await warte(900); await p.click("#kNeu"); await p.fill("#kName", "weber"); await p.fill("#kVorname", "anne"); await warte(900); await p.click("#kOk"); await warte(100);
ist("duebel ofgeleent", await p.locator("#kMeld").innerText(), t => t.includes("gëtt et schonn"));
await p.click("#kZu");
ist("zou: keng Kontaktdaten", await p.locator("#kListe").innerText(), t => !t.includes("rue de l'Usine"));

// Sich
await p.fill("#kSuche", "fer"); await warte(100);
ist("Sich", await liste(), ["▶Ferro Forum"]);
await p.fill("#kSuche", "jeff"); await warte(100);
ist("Sich no Kontaktpersoun", await liste(), ["▶Ferro Forum"]);
await p.fill("#kSuche", ""); await warte(100);

// Bestellung: tippen → Virschlag → Info, kid gëtt gespäichert
await p.evaluate(() => eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 50 }]));
await p.click('[data-tab="livraisons"]'); await p.click("#lAuf");
await p.click("#lKunde"); await p.keyboard.type("fer");
ist("Virschlag beim Tippen", await p.evaluate(() => [...document.querySelectorAll("#lVorschlag button")].map(b => b.textContent)), ["📇 Ferro Forum"]);
await p.click("#lVorschlag button");
ist("Info mat Adress", await p.locator("#lKundeInfo").innerText(), t => t.includes("Jeff Muller") && t.includes("L-3895 Foetz"));
ist("kee datalist", await p.evaluate(() => document.querySelectorAll("datalist, [list]").length), 0);
await p.fill("#lN0", "6"); await p.click("#lOk"); await warte(200);
ist("Bestellung mat kid", await p.evaluate(() => { const L = Z.livraisons[0]; return [L.kunde, L.kid === Z.kunden.find(k => k.firma === "Ferro Forum").kid]; }), ["Ferro Forum", true]);

// Verkafen un d'Anne (per Virschlag) → kid um Verkaf
await p.click('[data-tab="verkaufen"]');
await p.click("#vKaeufer"); await p.keyboard.type("ann");
ist("Virschlag Persoun", await p.evaluate(() => [...document.querySelectorAll("#vVorschlag button")].map(b => b.textContent)), ["📇 Weber Anne"]);
await p.evaluate(() => { const K = Z.kunden.find(k => k.name === "Weber"); eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: K.label, kid: K.kid, posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6 }]); });

// Akeef
await p.click('[data-tab="kunden"]');
const kid = n => p.evaluate(n => Z.kunden.find(k => k.label === n).kid, n);
await p.click(`[data-kauf="${await kid("Ferro Forum")}"]`);
ist("Akeef zou", await p.locator("#kListe").innerText(), t => t.includes("Akeef (1)") && !t.includes("geplangt"));
await p.click(`[data-kakeef="${await kid("Ferro Forum")}"]`);
ist("Akeef: geplangt Bestellung", await p.locator("#kListe").innerText(), t => t.includes("6") && t.includes("geplangt"));
await warte(900); await p.click(`[data-kauf="${await kid("Weber Anne")}"]`); await p.click(`[data-kakeef="${await kid("Weber Anne")}"]`);
ist("Akeef: Verkaf op", await p.evaluate(() => [...document.querySelectorAll(".kauf")].map(d => d.textContent)), a => a.some(t => t.includes("6,00") && t.includes("op") || t.includes("6 €") && t.includes("op")));

// Fréiere Keefer → „+ Bei d'Clienten“
await p.evaluate(() => { eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: "Marc Gloden", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3 }]); TAB = "verkaufen"; FORM = null; render(); });
await p.click("#vKaeufer"); await p.keyboard.type("glo");
ist("fréiere Keefer (Wuertufank)", await p.evaluate(() => [...document.querySelectorAll("#vVorschlag button")].map(b => b.textContent)), ["Marc Gloden"]);
await p.click("#vVorschlag button");
ist("Knäppchen Bei d'Clienten", await p.locator("#vKundeInfo").innerText(), t => t.includes("nach net bei de Clienten") && t.includes("+ Bei d'Clienten"));
await p.click("#vKundeInfo [data-insbuch]"); await warte(200);
ist("Formular am Reiter Client", [await p.evaluate(() => TAB), await p.inputValue("#kFirma")], ["kunden", "Marc Gloden"]);
await p.click("#kOk"); await warte(200);
ist("Marc elo Client", await liste(), a => a.some(t => t.includes("Marc Gloden")));
await p.click(`[data-kakeef="${await kid("Marc Gloden")}"]`);
ist("Akeef vum fréiere Keefer iwwer den Numm", await p.locator("#kListe").innerText(), t => t.includes("Akeef (1)"));

// Änneren a läschen
await warte(900); await p.click(`[data-kauf="${await kid("Arendt Paul")}"]`); await p.click(`[data-ked="${await kid("Arendt Paul")}"]`);
await p.fill("#kOrt", "L-1234 Luxembourg"); await p.click("#kOk"); await warte(200);
ist("geännert, net duebel", await p.evaluate(() => Z.kunden.filter(k => k.name === "Arendt").map(k => k.ort)), ["L-1234 Luxembourg"]);
await warte(900); await p.click(`[data-kweg="${await kid("Weber Anne")}"]`); await warte(200);
ist("geläscht", await p.evaluate(() => Z.kunden.map(k => k.label)), ["Arendt Paul", "Ferro Forum", "Marc Gloden"]);
ist("Verkaf bleift", await p.evaluate(() => Z.kaeufer.some(k => k.name === "Weber Anne")), true);

// Al Clienten (Fassung c, nëmmen „name“) ginn zu Firma
await p.evaluate(() => eintragen([{ art: "kunde", kid: "alt-kunde-1", name: "Café Millebières", ort: "Beyren" }]));
ist("ale Client = Firma", await p.evaluate(() => { const K = Z.kunden.find(k => k.kid === "alt-kunde-1"); return [K.firma, K.name, K.label]; }), ["Café Millebières", "", "Café Millebières"]);
ist("keng Säitefeeler", seitenfehler, []);
await p.screenshot({ path: process.env.BILD || "/dev/null", fullPage: true }).catch(() => {});
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Kunden: alles bestanden");
process.exit(fehler ? 1 : 0);
