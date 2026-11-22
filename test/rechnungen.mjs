// Browser: Rechnung maachen (Fassung 20.11.2026 b) — Haken beim Verkaufen/Bestellen (aus), Fenster mit freier Position,
// Kopieren, PDF (Inhalt geprüft), Deelen = verschickt, Ändern behält die Nummer, Nummern fortlaufend auf zwei Handys,
// ohne Verbindung keine neue Nummer, Ausstoend mit zwei Bereichen, Startseite, 💡-Aufgaben.
// PDF-Teil braucht jsPDF 2.5.1 lokal: JSPDF_JS=/pfad/zu/jspdf.umd.min.js (sonst übersprungen, Rückgabe 0 mit Hinweis).
import { readFileSync, existsSync } from "node:fs";
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
import worker from "../worker.js";
import { fakeD1 } from "./fake-d1.mjs";

const JSPDF_JS = process.env.JSPDF_JS || "";
if (!JSPDF_JS || !existsSync(JSPDF_JS)) { console.log("– übersprungen: JSPDF_JS fehlt (npm install jspdf@2.5.1, Pfad zu dist/jspdf.umd.min.js)"); process.exit(0); }
const URL_W = "https://worker.test/";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/const WORKER_URL = "[^"]*";/, `const WORKER_URL = "${URL_W}";`);
const DB = fakeD1(), env = { DB, CODE: "hopfen" };
let SERVER_AN = true, fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); if (!ok) { fehler++; console.log("✗", was, "→", JSON.stringify(a)); } else console.log("✓", was); };
const warte = ms => new Promise(r => setTimeout(r, ms));
const browser = await pw.chromium.launch();
async function handy(ich) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "https://app.test" });
  const p = await ctx.newPage();
  p.konsole = [];
  p.on("pageerror", e => p.konsole.push(String(e)));
  p.on("dialog", d => d.accept());
  await p.route("https://app.test/**", r => {
    const pfad = new URL(r.request().url()).pathname;
    if (pfad.endsWith(".png")) return r.fulfill({ body: readFileSync(new URL(".." + pfad, import.meta.url)), contentType: "image/png" });
    r.fulfill({ body: html, contentType: "text/html" });
  });
  await p.route(/cdnjs\.cloudflare\.com/, r => r.request().url().includes("jspdf") ? r.fulfill({ body: readFileSync(JSPDF_JS), contentType: "text/javascript" }) : r.abort());
  await p.route(URL_W, async r => {
    if (!SERVER_AN) return r.abort("internetdisconnected");
    const req = r.request();
    const res = await worker.fetch(new Request(URL_W, { method: req.method(), body: req.postData() }), env);
    r.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() });
  });
  // Teilen nachgebaut: merkt sich die Dateien, „Abbrechen“ über window.TEILEN_ABBRUCH
  await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; window.GETEILT = [];
    navigator.canShare = () => true;
    navigator.share = async d => { if (window.TEILEN_ABBRUCH) throw Object.assign(new Error("abgebrochen"), { name: "AbortError" }); window.GETEILT.push(d.files.map(f => f.name)); }; });
  await p.goto("https://app.test/index.html");
  await p.fill("#sCode", "hopfen"); await p.click("#sCodeOk"); await p.click(`[data-ich="${ich}"]`); await warte(300);
  return p;
}
const pdfText = async p => p.evaluate(async () => { const f = [...DATEN.entries()].filter(([k]) => k.startsWith("rech-")).pop()[1]; return new TextDecoder("latin1").decode(await f.arrayBuffer()); });

const A = await handy("Laurent");
const J = await A.evaluate(() => heuteLux().slice(0, 4));
await A.evaluate(() => eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 100 }, { art: "bewegung", sorte: "NEIPA", n: 20, von: "Lager", an: "Laurent" }, { art: "bewegung", sorte: "NEIPA", n: 10, von: "Lager", an: "Jeff" },
  { art: "kunde", v: 2, kid: "k-ferro1", firma: "FerroForum", name: "Muster", vorname: "Max", adresse: "1, rue de l'Exemple", ort: "L-4335 Esch-sur-Alzette", mail: "compta@ferroforum.lu", tel: "+352 621 000 000", notiz: "" }]));
await warte(900);

// Haken standardmäßig aus (vom Nutzer): Bestellung und Verkaufen
await A.click('[data-tab="livraisons"]'); await A.click("#lAuf");
ist("Bestellung: Haken Rechnung standardmäßig aus", await A.isChecked("#lRechnung"), false);
await A.click("#lZu"); await warte(900);
await A.click('[data-tab="verkaufen"]');
ist("Verkafen: Haken „🧾 Rechnung maachen“ da und aus", [await A.locator("#vRechnung").count(), await A.isChecked("#vRechnung")], [1, false]);

// Verkauf mit Haken → Meldung mit Knopf, steht unter Ausstoend oben
await A.fill("#vName", "Kalbusch"); await A.fill("#vN0", "12");
await A.click('[data-bez="spaeter"]'); await A.check("#vRechnung"); await A.click("#vSpeichern"); await warte(400);
ist("Meldung: Rechnung unter Ausstoend + Knopf", [await A.locator("#vMeldung").innerText(), await A.locator('#vMeldung [data-rech]').count()], v => v[0].includes("Rechnung") && v[1] === 1);
ist("Verkauf trägt rechnung: true", await A.evaluate(() => Z.verkaeufe.find(v => v.kaeufer === "Kalbusch").rechnungWunsch), true);
await A.click('[data-tab="offen"]'); await warte(200);
ist("Ausstoend: Bereich „Rechnung nach ze maachen“ oben", await A.locator("#t-offen .card").first().innerText(), t => t.includes("Rechnung nach ze maachen (1)") && t.includes("Kalbusch"));
ist("Ausstoend: Zahl am Reiter zählt fehlende Rechnung mit", await A.locator('[data-tab="offen"] .badge').innerText(), "2");

// Gelieferte Bestellung mit Haken (Client mit Adresse)
await A.evaluate(() => { const L = eintragen([{ art: "livraison", kunde: "FerroForum", kid: "k-ferro1", kontakt: "Laurent", aus: "Lager", datum: "2026-11-18", posten: [{ sorte: "NEIPA", n: 24 }], betrag: 60, rechnung: true, anlass: "Journée Patrimoine" }])[0];
  window.LIV = L.id; });
await warte(100);
await A.evaluate(() => eintragen([{ art: "zahlung", ref: Z.livraisons[0].lid, vor: true, betrag: 20, wie: "wero" }]));
await warte(100);
await A.evaluate(() => { const L = Z.livraisons[0]; eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: L.kunde, kid: L.kid, posten: L.posten, betrag: L.betrag, aus: L.aus, liv: L.id }]); });
await warte(400);
await A.click('[data-tab="livraisons"]'); await warte(200);
ist("Bestellungen: Knopf „🧾 Rechnung maachen“ an der gelieferten", await A.locator("#lListe [data-rech]").innerText(), "🧾 Rechnung maachen");
await A.click("#lListe [data-rech]"); await warte(300);
ist("Fenster: Adresse aus dem Client", await A.inputValue("#rAdr"), "FerroForum\nÀ l'attention de Max Muster\n1, rue de l'Exemple\nL-4335 Esch-sur-Alzette");
ist("Fenster: Mail, Telefon, Anlass vorbelegt", [await A.inputValue("#rMail"), await A.inputValue("#rTel"), await A.inputValue("#rAnlass")], ["compta@ferroforum.lu", "+352 621 000 000", "Journée Patrimoine"]);
ist("Fenster: Nummer erst beim PDF, Position aus der Bestellung", await A.locator("#rechKarte").innerText(), t => t.includes("Nummer kënnt beim PDF") && t.includes("24 btls.") && t.includes("NEIPA") && t.includes("2,50"));
ist("Fenster: Total, scho bezuelt, Rescht", await A.locator("#rSumme").innerText(), t => t.includes("60 €") && t.includes("20 €") && t.includes("40 €"));
await A.click('[data-kop="rMail"]'); await warte(200);
ist("Kopéieren: Mail in der Zwischenablage", [await A.evaluate(() => navigator.clipboard.readText()), await A.locator('[data-kop="rMail"]').innerText()], ["compta@ferroforum.lu", "✓ Kopéiert"]);
await A.click("#rPlus"); await A.keyboard.type("Tireuse + transport");
await A.fill('[data-rf="preis"]', "75");
ist("freie Position zählt im Total", await A.locator("#rSumme").innerText(), t => t.includes("135 €") && t.includes("115 €"));
await warte(900); await A.click("#rPlus"); await warte(100);
await A.fill('[data-rf="txt"] >> nth=1', "Glieser"); await A.click('[data-rfweg="1"]');
ist("✕ nimmt eine freie Position weg", await A.locator(".rfrei").count(), 1);
await A.fill("#rAdr", "FerroForum\nÀ l'attention de Max Muster\n3, rue Neie Wee\nL-4335 Esch-sur-Alzette");
await A.check("#rKunde");
await A.click("#rOk"); await warte(2500);
ist("PDF: Nummer " + J + "-001, Fenster zu, Anzeige offen", [await A.evaluate(() => Z.rechnungen.map(v => v.rech.nr)), await A.locator("#rechWahl").isVisible(), await A.locator("#ansicht").isVisible()], [[J + "-001"], false, true]);
ist("Anzeige: Kopf mit Nummer und „nach net verschéckt“", await A.locator("#ansichtInfo").innerText(), t => t.includes("Facture " + J + "-001") && t.includes("nach net verschéckt") && t.includes("compta@ferroforum.lu"));
const pdf = await pdfText(A);
ist("PDF-Inhalt: Nummer, Adresse, Positionen, Rescht, IBAN, 30 Tage", [J + "-001", "3, rue Neie Wee", "NEIPA", "Tireuse + transport", "115,00", "LU43 0019 8055 2021 9000", "Payable dans les 30 jours"].filter(x => !pdf.includes(x)), []);
ist("PDF: Bilder drin (Logo, Krug, QR)", (pdf.match(/\/Subtype \/Image/g) || []).length >= 3, true);
ist("freie Position erhöht den geschuldeten Betrag", await A.evaluate(() => { const v = Z.rechnungen[0]; return [v.betrag, v.ware, v.offen, Z.offen]; }), [135, 60, 115, 151]);
ist("Adresse beim Client gespeichert", await A.evaluate(() => { const K = Z.kunden.find(k => k.kid === "k-ferro1"); return [K.adresse, K.ort, K.firma, K.mail]; }), ["3, rue Neie Wee", "L-4335 Esch-sur-Alzette", "FerroForum", "compta@ferroforum.lu"]);
ist("Bestand unverändert durch die freie Position", await A.evaluate(() => hat(Z, "Lager", "NEIPA")), 46);

// Teilen: abgebrochen = nicht verschickt; geteilt = verschickt, Mail kopiert
await A.evaluate(() => navigator.clipboard.writeText("+352 621 000 000")); // vorher Telefon kopiert
await A.evaluate(() => { window.TEILEN_ABBRUCH = true; }); await A.click("#ansichtTeilen"); await warte(300);
ist("abgebrochen: nicht verschickt", await A.evaluate(() => !!Z.rechnungen[0].rech.verschickt), false);
await A.evaluate(() => { window.TEILEN_ABBRUCH = false; }); await warte(900); await A.click("#ansichtTeilen"); await warte(400);
ist("geteilt: Datei, verschickt, Zwischenablage bleibt (Telefon)", [await A.evaluate(() => GETEILT), await A.evaluate(() => !!Z.rechnungen[0].rech.verschickt), await A.evaluate(() => navigator.clipboard.readText())],
  v => v[0].length === 1 && /^Facture_\d{4}-001_FerroForum\.pdf$/.test(v[0][0][0]) && v[1] && v[2] === "+352 621 000 000");
await warte(900); await A.click('#ansichtInfo [data-aikop="compta@ferroforum.lu"]'); await warte(200);
ist("Kopf: 📋 Mail kopiert", await A.evaluate(() => navigator.clipboard.readText()), "compta@ferroforum.lu");
ist("Kopf: verschéckt", await A.locator("#ansichtInfo").innerText(), t => t.includes("verschéckt") && !t.includes("nach net"));
await A.click("#ansichtZu"); await warte(200);
ist("Bestellungen: Chip mit Nummer statt „nach ze maachen“", await A.locator("#lListe").innerText(), t => t.includes("🧾 " + J + "-001") && !t.includes("Rechnung nach ze maachen"));

// Ändern behält die Nummer
await A.click("#lListe [data-rechz]"); await warte(1500);
await A.click("#aiAendern"); await warte(300);
ist("Ändern: Fenster mit gespeicherten Angaben", [await A.inputValue("#rAdr"), await A.inputValue('[data-rf="preis"]'), await A.locator("#rechKarte").innerText()],
  v => v[0].includes("3, rue Neie Wee") && v[1] === "75" && v[2].includes("Facture N° " + J + "-001") && v[2].includes("📨 verschéckt"));
await A.fill('[data-rf="preis"]', "80"); await A.click("#rOk"); await warte(2000);
ist("Ändern: dieselbe Nummer, neuer Betrag", await A.evaluate(() => [Z.rechnungen.map(v => v.rech.nr), Z.rechnungen[0].betrag, Z.liste.filter(e => e.art === "rechnung").length]), [[J + "-001"], 140, 2]);
ist("Verlauf: geännert", await A.evaluate(() => beschreibe(Z.liste.filter(e => e.art === "rechnung").pop(), Z)), t => t.includes(`Rechnung ${J}-001 geännert`) && t.includes("140 €"));
await A.click("#ansichtZu"); await warte(300);

// Ausstoend: Bereich 1 nur noch Kalbusch, Bereich 2 mit Nummer und „zënter n Deeg“
await A.click('[data-tab="offen"]'); await warte(200);
ist("Ausstoend: Nummer an der offenen Rechnung", await A.locator("#t-offen").innerText(), t => t.includes("Rechnung nach ze maachen (1)") && t.includes("🧾 " + J + "-001") && t.includes("Rechnung vun haut") && t.includes("fräi Positiounen"));
// Startseite: meine fehlende Rechnung
await A.click('#nav [data-tab="haut"]'); await warte(200);
ist("Startseite: Nach op bei dir mit 🧾", await A.locator("#hOp").innerText(), t => t.includes("Rechnung maachen: Kalbusch"));
ist("💡-Aufgabe Rechnung maachen öffnet das Fenster", await A.evaluate(() => aufStand().op.filter(a => a.typ === "rechnung").map(a => [a.text, a.link.typ])), [["Rechnung maachen: Kalbusch", "rech"]]);

// Zweites Handy: fortlaufende Nummer; ohne Verbindung keine neue Nummer
const B = await handy("Jeff");
await B.evaluate(() => eintragen([{ art: "verkauf", verkaeufer: "Jeff", kaeufer: "Café Millebières", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 18, rechnung: true }]));
await warte(600);
await B.click('[data-tab="offen"]'); await warte(200);
const vidB = await B.evaluate(() => Z.verkaeufe.find(v => v.kaeufer === "Café Millebières").id);
await B.click(`#t-offen [data-rech="${vidB}"]`); await warte(300);
ist("ohne Client: Haken heißt „Als neie Client späicheren“", await B.locator("#rechKarte").innerText(), t => t.includes("Als neie Client späicheren"));
SERVER_AN = false;
await B.click("#rOk"); await warte(1500);
ist("offline: keine Nummer, Hinweis", [await B.evaluate(() => Z.rechnungen.length), await B.locator("#rMeld").innerText()], v => v[0] === 1 && v[1].includes("online"));
SERVER_AN = true; await warte(900);
await B.click("#rOk"); await warte(2500);
ist("zweites Handy: " + J + "-002", await B.evaluate(() => Z.rechnungen.map(v => v.rech.nr)), [J + "-001", J + "-002"]);
const pdfB = await pdfText(B);
ist("PDF ohne Vorauszahlung: ganzer Betrag zu überweisen, Verkaufsdatum", ["Date de vente", "18,00", "Café Millebières"].filter(x => !pdfB.includes(x.replace("é", "\xe9")) && !pdfB.includes(x)), []);
await B.click("#ansichtZu"); await warte(200);

// Alter Haken ohne Nummer bleibt „gemaach (ouni Nummer)“
await A.evaluate(() => { const v = Z.verkaeufe.find(x => x.kaeufer === "Kalbusch"); eintragen([{ art: "rechnung", ref: v.id }]); });
await warte(300); await A.click('[data-tab="offen"]'); await warte(200);
ist("alte Rechnung ohne Nummer", await A.locator("#t-offen").innerText(), t => t.includes("Rechnung gemaach (ouni Nummer)") && !t.includes("Rechnung nach ze maachen ("));
// Excel-Blatt Rechnungen
ist("Excel: Blatt Rechnungen", await A.evaluate(() => { const b = exportBlaetter(Z, zeitText).find(x => x.name === "Rechnungen"); return b.zeilen.map(z => [z[0], z[4], z[5]]); }), [[J + "-001", 140, 80], [J + "-002", 18, 0]]);

// Geplante Bestellung mit Haken: „Rechnung nach net geschéckt“ neben „Nach net bezuelt“ (vom Nutzer, 20.11.)
await A.evaluate(() => eintragen([{ art: "livraison", kunde: "BTS", kontakt: "Laurent", aus: "Lager", datum: "2026-12-26", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 18, rechnung: true },
  { art: "livraison", kunde: "Ouni", kontakt: "Laurent", aus: "Lager", datum: "2026-12-27", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 18 }]));
await warte(300); await A.click('[data-tab="livraisons"]'); await warte(200);
ist("geplant mit Haken: Hinweis, ohne Haken keiner", await A.evaluate(() => [...document.querySelectorAll("#lListe .liv")].filter(x => !x.querySelector(".ok")).map(x => [x.querySelector("b").textContent, !!x.querySelector(".rgef")])),
  v => JSON.stringify(v.filter(x => ["BTS", "Ouni"].includes(x[0]))) === JSON.stringify([["BTS", true], ["Ouni", false]]));
// Eigener Flaschenpreis (vom Nutzer, 20.11.): Preis antippen, 2,50 eintippen → Betrag rechnet, auf der Rechnung genau 2,50
await A.click('[data-tab="verkaufen"]'); await warte(200);
const iN = await A.evaluate(() => vArtikel().findIndex(x => x.key === "NEIPA"));
await A.fill("#vName", "Weber"); await A.fill(`#vN${iN}`, "6");
await A.click(`[data-vpr="${iN}"]`); await warte(100);
ist("Preis antippen: Feld mit 3", await A.inputValue(".prfeld"), "3");
await A.fill(".prfeld", "2,5"); await A.press(".prfeld", "Enter"); await warte(200);
ist("eigener Preis: gelb, amplaz, Betrag 15", [await A.locator(".prk.an").innerText(), await A.locator(".posten").nth(iN).innerText(), await A.inputValue("#vBetrag")],
  v => v[0].startsWith("2,50 €") && v[1].includes("amplaz 3 €") && v[2] === "15");
await A.click('[data-bez="spaeter"]'); await A.click("#vSpeichern"); await warte(400);
const vW = await A.evaluate(() => { const v = Z.verkaeufe.find(x => x.kaeufer === "Weber"); return { id: v.id, posten: v.posten, betrag: v.betrag, wunsch: v.rechnungWunsch }; });
ist("gespeichert: posten mit preis 2,5, Betrag 15, ohne Rechnungswunsch", [vW.posten, vW.betrag, vW.wunsch], [[{ sorte: "NEIPA", n: 6, preis: 2.5 }], 15, false]);
ist("Listenpreis unverändert", await A.evaluate(() => preisVon(Z.cfg, "NEIPA")), 3);
// Rechnung nodréiglech: grauer Knopf unter Ausstoend, Fenster mit genauem Preis
await A.click('[data-tab="offen"]'); await warte(200);
ist("Ausstoend: „Rechnung nodréiglech“ beim Verkauf ohne Haken", await A.locator(`#t-offen .knopf.klein[data-rech="${vW.id}"]`).innerText(), "🧾 Rechnung nodréiglech");
await A.click(`#t-offen .knopf.klein[data-rech="${vW.id}"]`); await warte(300);
ist("Fenster: Stückpreis 2,50 genau", await A.locator("#rechKarte .rpos").innerText(), t => t.includes("6 btls.") && t.includes("2,50") && t.includes("15 €"));
await A.click("#rOk"); await warte(2500);
ist("nodréiglech: Nummer " + J + "-003", await A.evaluate(id => Z.vkNachId.get(id).rech && Z.vkNachId.get(id).rech.nr, vW.id), J + "-003");
ist("PDF: 2,50 €", (await pdfText(A)).includes("2,50"), true);
await A.click("#ansichtZu"); await warte(200);
await A.click('[data-tab="offen"]'); await warte(200);
ist("danach kein grauer Knopf mehr, Chip mit Nummer", [await A.locator(`#t-offen .knopf.klein[data-rech="${vW.id}"]`).count(), await A.locator("#t-offen").innerText()], v => v[0] === 0 && v[1].includes("🧾 " + J + "-003"));
// Bestellung: Preis ändern, beim Ändern wieder da; geliefert ohne Haken → nodréiglech
await A.click('[data-tab="livraisons"]'); await warte(900); await A.click("#lAuf"); await warte(200);
const iL = await A.evaluate(() => lArtikel().findIndex(x => x.key === "NEIPA"));
await A.fill("#lFirma", "Rock Solid"); await A.fill("#lDatum", "2026-11-19"); await A.fill(`#lN${iL}`, "10");
await A.click(`[data-lpr="${iL}"]`); await A.fill(".prfeld", "2,4"); await A.press(".prfeld", "Enter"); await warte(200);
ist("Bestellung: Betrag 24", await A.inputValue("#lBetrag"), "24");
await A.click("#lOk"); await warte(400);
const lRS = await A.evaluate(() => Z.livraisons.find(L => L.kunde === "Rock Solid").id);
await warte(900); await A.click(`[data-led="${lRS}"]`); await warte(300);
ist("Bestellung ändern: eigener Preis wieder da", await A.locator(`[data-lpr="${iL}"]`).innerText(), t => t.startsWith("2,40 €"));
await A.click("#lZu"); await warte(900);
await A.evaluate(id => { const L = Z.livraisons.find(x => x.id === id); eintragen([{ art: "verkauf", verkaeufer: L.kontakt, kaeufer: L.kunde, posten: L.posten, betrag: L.betrag, aus: L.aus, liv: L.id }]); }, lRS);
await warte(400);
ist("geliefert ohne Haken: „Rechnung nodréiglech“", await A.evaluate(id => { const L = Z.livraisons.find(x => x.id === id); const b = document.querySelector(`#lListe .knopf.klein[data-rech="${L.verkauf.id}"]`); return b && b.textContent; }, lRS), "🧾 Rechnung nodréiglech");
// Client → Akeef: 🧾 / Nummer
await A.click('#zahnrad'); await A.click('#t-einst [data-zb="kunden"]'); await warte(200);
await A.click('[data-kauf="k-ferro1"]'); await warte(900); await A.click('[data-kakeef="k-ferro1"]'); await warte(200);
ist("Client Akeef: Nummer an der Rechnung", await A.locator("#kListe").innerText(), t => t.includes("🧾 " + J + "-001"));
// Lieferdatum = Tag des „Geliwwert“, nicht der geplante (vom Nutzer, 20.11.); im Fenster änderbar
const rsV = await A.evaluate(() => Z.livraisons.find(L => L.kunde === "Rock Solid").verkauf.id);
await A.click('[data-tab="livraisons"]'); await warte(300);
await A.click(`#lListe [data-rech="${rsV}"]`); await warte(300);
ist("Fenster: Geliwwert den = heute (geplant war der 19.11.)", await A.inputValue("#rLiefer"), await A.evaluate(() => heuteLux()));
await A.fill("#rLiefer", "2026-11-17"); await A.click("#rOk"); await warte(2500);
ist("PDF: Livraison du 17.11.2026", (await pdfText(A)).includes("17.11.2026"), true);
ist("gespeichert: liefer", await A.evaluate(id => Z.vkNachId.get(id).rech.liefer, rsV), "2026-11-17");
await A.click("#ansichtZu"); await warte(200);
// Übersicht pro Bier: 🧾 auch für Käufer, die kein Client sind
await A.evaluate(() => eintragen([{ art: "verkauf", verkaeufer: "Laurent", kaeufer: "Schmit Pol", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3 }])); await warte(300);
await A.click('[data-tab="uebersicht"]'); await warte(200);
await A.click('tr[data-sorte="NEIPA"]'); await warte(300);
ist("Iwwersiicht: Nummer und 🧾 nodréiglech in der Liste", [await A.locator("#t-uebersicht").innerText(), await A.locator("#t-uebersicht .kaufrech").count()], v => v[0].includes("🧾 " + J + "-003") && v[1] >= 1);
const vid0 = await A.locator("#t-uebersicht .kaufrech").first().getAttribute("data-rech");
await A.locator("#t-uebersicht .kaufrech").first().click(); await warte(300);
ist("🧾 in der Iwwersiicht öffnet das Fenster", [await A.locator("#rechWahl").isVisible(), await A.evaluate(() => RFORM && RFORM.vid)], v => v[0] && v[1] === vid0);
await A.click("#rZu"); await warte(200);
ist("keine Seitenfehler", [...A.konsole, ...B.konsole].filter(t => !/ERR_|net::|Failed to load/.test(t)), []);
await browser.close();
console.log(fehler ? `${fehler} Prüfung(en) fehlgeschlagen` : "alles gut");
process.exit(fehler ? 1 : 0);
