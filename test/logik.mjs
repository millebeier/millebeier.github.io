// Prüft die Rechenlogik aus index.html (Block zwischen den Marken „Logik“ und „Oberfläche“).
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const a = html.indexOf("/* === Logik ===");
const b = html.indexOf("/* === Oberfläche ===");
if (a < 0 || b < 0) { console.error("Marken nicht gefunden"); process.exit(1); }
const L = new Function(html.slice(a, b) + "; return {rechne, gueltig, euro, verteile, erinnerung, csv, beschreibe, hat, LAGER, STANDARD, proSorte, exportBlaetter, anteil, dateienVon, altImport, altKorrekturen, bierText, postenText, frei, zuWenig, preisVon, fassKey, artikelVon, autoAufgaben, aufgabenStand, aidVon};")();

let fehler = 0, n = 0;
const ist = (was, wert, soll) => { n++; const ok = JSON.stringify(wert) === JSON.stringify(soll); if (!ok) { fehler++; console.log(`✗ ${was}: ${JSON.stringify(wert)} statt ${JSON.stringify(soll)}`); } };

let t = 1000, k = 0;
const E = (art, x) => ({ id: "id-" + String(++k).padStart(6, "0"), zeit: t += 1000, art, durch: "Laurent", ...x });

// Ablauf: abfüllen, verteilen, verkaufen, bezahlen
const ein = [
  E("abfuellung", { sorte: "NEIPA", n: 48 }),
  E("abfuellung", { sorte: "Brown Porter", n: 24 }),
  E("bewegung", { sorte: "NEIPA", n: 12, von: "Lager", an: "Jeff" }),
  E("bewegung", { sorte: "NEIPA", n: 12, von: "Lager", an: "Marc" }),
  E("bewegung", { sorte: "Brown Porter", n: 6, von: "Lager", an: "Jeff" }),
];
const v1 = E("verkauf", { verkaeufer: "Jeff", kaeufer: "Paul", posten: [{ sorte: "NEIPA", n: 4 }, { sorte: "Brown Porter", n: 2 }], betrag: 18 });
const v2 = E("verkauf", { verkaeufer: "Marc", kaeufer: "Anne", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 15 }); // Rabatt
const z1 = E("zahlung", { ref: v2.id, betrag: 15 });
const v3 = E("verkauf", { verkaeufer: "Jeff", kaeufer: "paul ", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6 });
ein.push(v1, v2, z1, v3);
let Z = L.rechne(ein);
ist("Lager NEIPA", L.hat(Z, "Lager", "NEIPA"), 24);
ist("Jeff NEIPA", L.hat(Z, "Jeff", "NEIPA"), 6);
ist("Jeff Porter", L.hat(Z, "Jeff", "Brown Porter"), 4);
ist("Marc NEIPA", L.hat(Z, "Marc", "NEIPA"), 6);
ist("Flaschen", Z.flaschen, { abgefuellt: 72, verkauft: 14, abgang: 0, da: 58 });
ist("Kasse", Z.kasse, 15);
ist("Offen", Z.offen, 24);
ist("Umsatz", Z.umsatz, 39);
ist("Paul zusammengefasst (Groß/klein, Leerzeichen)", Z.kaeufer.map(x => [x.name, x.offen]), [["Paul", 24], ["Anne", 0]]);
ist("Jeff Person", Z.personen.Jeff, { verkauft: 8, umsatz: 24, bezahlt: 0, offen: 24 });
ist("Marc Person", Z.personen.Marc, { verkauft: 6, umsatz: 15, bezahlt: 15, offen: 0 });
ist("White IPA trotzdem in der Liste", Z.sortenNamen, ["NEIPA", "White IPA", "Brown Porter"]);

// Teilzahlung verteilt auf älteste zuerst
const paul = Z.kaeufer.find(x => x.name === "Paul");
const vt = L.verteile(paul.verkaeufe, 20);
ist("Verteilen", vt.zahlungen.map(z => [z.ref, z.betrag]), [[v1.id, 18], [v3.id, 2]]);
ist("Verteilen Rest", vt.rest, 0);
ist("Verteilen zu viel", L.verteile(paul.verkaeufe, 30).rest, 6);
ein.push(...vt.zahlungen.map(z => E("zahlung", z)));
Z = L.rechne(ein);
ist("nach Teilzahlung offen", Z.offen, 4);
ist("nach Teilzahlung Kasse", Z.kasse, 35);
ist("Erinnerung", L.erinnerung(Z.kaeufer.find(x => x.name === "Paul")), "Moien Paul, vir den Millebéier (2x NEIPA) stinn nach 4 € op. Merci & Prost! 🍺");

// Rückgängig: Verkauf weg → Flaschen zurück, seine Zahlung zählt nicht mehr
const s1 = E("storno", { ref: v2.id });
Z = L.rechne([...ein, s1]);
ist("Storno: Marc hat wieder 12", L.hat(Z, "Marc", "NEIPA"), 12);
ist("Storno: Kasse ohne Annes 15", Z.kasse, 20);
ist("Storno: storniert gemerkt", Z.storniert.has(v2.id), true);
// Rückgängig vom Rückgängig wird ignoriert
Z = L.rechne([...ein, s1, E("storno", { ref: s1.id })]);
ist("Storno vom Storno zählt nicht", L.hat(Z, "Marc", "NEIPA"), 12);
// doppelte IDs zählen einmal (Ausgang + Server)
Z = L.rechne([...ein, ...ein]);
ist("doppelt gesendet zählt einmal", Z.flaschen.verkauft, 14);

// Abgang
Z = L.rechne([...ein, E("abgang", { sorte: "NEIPA", n: 2, wer: "Jeff", grund: "getrunken" })]);
ist("Abgang", [L.hat(Z, "Jeff", "NEIPA"), Z.flaschen.abgang, Z.flaschen.da], [4, 2, 56]);

// Einstellungen: letzte gilt, storniert → vorige
const c1 = E("einstellungen", { sorten: [{ name: "NEIPA", preis: 3.5 }, { name: "Stout", preis: 4 }], leute: ["Jeff", "Marc", "Claude", "Laurent", "Tom"] });
Z = L.rechne([...ein, c1]);
ist("Einstellungen", [Z.cfg.sorten.map(s => s.preis), Z.cfg.leute.length], [[3.5, 4], 5]);
ist("alte Sorte mit Bestand bleibt sichtbar", Z.sortenNamen, ["NEIPA", "Stout", "Brown Porter"]);
Z = L.rechne([...ein, c1, E("storno", { ref: c1.id })]);
ist("Einstellungen zurück", Z.cfg.sorten.length, 3);

// Ungültiges wird ignoriert
Z = L.rechne([...ein, { id: "kaputt-1", zeit: 1, art: "verkauf", verkaeufer: "Jeff", kaeufer: "X", posten: [], betrag: 3 },
  E("bewegung", { sorte: "NEIPA", n: 3, von: "Jeff", an: "Jeff" }), E("abfuellung", { sorte: "NEIPA", n: -5 }),
  E("zahlung", { ref: "gibtsnicht", betrag: 100 })]);
ist("Ungültiges ignoriert", [Z.flaschen.da, Z.kasse], [58, 35]);

ist("Artikel vor Verkäufern", [L.beschreibe({ art: "abgang", n: 2, sorte: "NEIPA", wer: "Jeff", grund: "kaputt" }), L.beschreibe({ art: "abgang", n: 1, sorte: "NEIPA", wer: "Lager", grund: "kaputt" })], ["🗑️ 2 × NEIPA beim Jeff: futti", "🗑️ 1 × NEIPA am Lager: futti"]);
ist("euro", [L.euro(3), L.euro(4.5), L.euro(0.1 + 0.2)], ["3 €", "4,50 €", "0,30 €"]);
const c = L.csv(L.rechne(ein), t => "T" + t);
ist("CSV Kopf", c.split("\r\n")[0], '﻿"Datum";"Verkeefer";"Keefer";"NEIPA";"White IPA";"Brown Porter";"Fläschen";"Betrag";"Bezuelt";"Op"');
ist("CSV Zeilen", c.trim().split("\r\n").length, 4);

// Livraisons: geplant → geliwwert (Verkauf aus dem Lager) → Rechnung → bezahlt
{
  let k2 = 0, t2 = 5000;
  const F = (art, x) => ({ id: "lv-" + String(++k2).padStart(5, "0"), zeit: t2 += 1000, art, durch: "Marc", ...x });
  const basis = [F("abfuellung", { sorte: "NEIPA", n: 100 }), F("abfuellung", { sorte: "Brown Porter", n: 50 }),
    F("bewegung", { sorte: "NEIPA", n: 10, von: "Lager", an: "Jeff" })];
  const L1 = F("livraison", { kunde: "Ferro Forum", kontakt: "Marc", aus: "Lager", datum: "2026-12-05", posten: [{ sorte: "NEIPA", n: 24 }, { sorte: "Brown Porter", n: 12 }], betrag: 90, rechnung: true, anlass: "Kiermes", notiz: "" });
  let Y = L.rechne([...basis, L1]);
  ist("Livraison geplant: Lager unverändert", L.hat(Y, "Lager", "NEIPA"), 90);
  ist("Livraison geplant", Y.livraisons.map(l => [l.kunde, !!l.verkauf]), [["Ferro Forum", false]]);
  ist("geplant zählt nicht als verkauft", Y.flaschen.verkauft, 0);
  const v = F("verkauf", { verkaeufer: "Marc", kaeufer: "Ferro Forum", posten: L1.posten, betrag: 90, aus: "Lager", liv: L1.id });
  Y = L.rechne([...basis, L1, v]);
  ist("geliwwert: aus dem Lager", [L.hat(Y, "Lager", "NEIPA"), L.hat(Y, "Lager", "Brown Porter"), L.hat(Y, "Marc", "NEIPA")], [66, 38, 0]);
  ist("geliwwert: Marc hat verkauft", [Y.personen.Marc.verkauft, Y.personen.Marc.offen], [36, 90]);
  ist("geliwwert: verknüpft", Y.livraisons[0].verkauf && Y.livraisons[0].verkauf.id, v.id);
  ist("Anteil nach Listenpreis (gleich 3 €)", [L.anteil(Y.cfg, L1.posten, 90, L1.posten[0]), L.anteil(Y.cfg, L1.posten, 90, L1.posten[1])], [60, 30]);
  const r = F("rechnung", { ref: v.id }), z = F("zahlung", { ref: v.id, betrag: 90 });
  Y = L.rechne([...basis, L1, v, r, z]);
  ist("Rechnung und bezahlt", [Y.livraisons[0].verkauf.rechnungGemacht, Y.livraisons[0].verkauf.offen, Y.kasse], [true, 0, 90]);
  // Verkauf rückgängig → wieder geplant, Flaschen zurück
  Y = L.rechne([...basis, L1, v, F("storno", { ref: v.id })]);
  ist("Lieferung rückgängig: wieder geplant", [!!Y.livraisons[0].verkauf, L.hat(Y, "Lager", "NEIPA")], [false, 90]);
  // Pro Sorte: normaler Verkauf, Livraison, Abgang, geplante Livraison
  const L2 = F("livraison", { kunde: "BEST", kontakt: "Jeff", aus: "Jeff", datum: "2026-12-20", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 15, rechnung: false });
  const vj = F("verkauf", { verkaeufer: "Jeff", kaeufer: "Paul", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6 });
  const ab = F("abgang", { sorte: "NEIPA", n: 1, wer: "Jeff", grund: "verschenkt" });
  Y = L.rechne([...basis, L1, v, r, vj, ab, L2]);
  const ps = L.proSorte(Y, "NEIPA");
  ist("pro Sorte: Zeilen", ps.map(x => [x.kunde, x.n, x.recetten, x.geliwwert, x.bezuelt]), [
    ["Paul", 2, 6, "Jo", "Nee"], ["verschenkt / Prouf", 1, 0, "–", "–"], ["Ferro Forum", 24, 60, "Jo", "Nee"], ["BEST", 6, 15, "geplangt 20.12.2026", "–"]]);
  ist("pro Sorte: Rechnung und Anlass", [ps[2].rechnung, ps[2].remarque], ["gemaach", "Kiermes"]);
  const bl = L.exportBlaetter(Y, t => "T");
  ist("Export: Blätter", bl.map(b => b.name), ["NEIPA", "Brown Porter", "Bestellungen", "Clienten", "Stock", "Ze maachen"]);
  ist("Export: Summe NEIPA ohne geplant", bl[0].summe.slice(0, 7), ["Total", "", "", 27, "Fläschen", "", 66]);
  ist("Export: Livraisons", bl[2].zeilen.map(z => [z[1], z[6], z[7], z[8]]), [["Ferro Forum", "Jo", "gemaach", "Nee"], ["BEST", "geplangt", "", "–"]]);
  ist("Export: Stock Lager", bl[4].zeilen[0].slice(0, 3), ["Lager", 66, 0]);
  ist("Livraison ungültig ohne Datum", L.gueltig({ ...L2, datum: "20.12." }), false);
}

// Biere: anlegen mit Eigenschaften, Preis ändern, archivieren, löschen, wieder anlegen
{
  let k3 = 0, t3 = 90000;
  const B = (art, x) => ({ id: "bi-" + String(++k3).padStart(5, "0"), zeit: t3 += 1000, art, durch: "Laurent", ...x });
  const rusty = B("bier", { name: "Rusty", preis: 3, stil: "Red Ale", braudatum: "2026-02-06", alk: 5.6, liter: 156, mhd: "2027-02-01", notiz: "" });
  const ab = B("abfuellung", { sorte: "Rusty", n: 288 });
  let Y = L.rechne([rusty, ab]);
  ist("Bier angelegt", Y.cfg.sorten.map(c => c.name), ["NEIPA", "White IPA", "Brown Porter", "Rusty"]);
  ist("Bier im Lager", L.hat(Y, "Lager", "Rusty"), 288);
  ist("Eigenschaften", [Y.cfg.sorten[3].meta.alk, Y.cfg.sorten[3].meta.braudatum], [5.6, "2026-02-06"]);
  const bp = B("bier", { name: "Brown Porter", preis: 3.5, alk: 5.1 });
  Y = L.rechne([rusty, ab, bp]);
  ist("Altbestand-Sorte bekommt Preis und Eigenschaften", [Y.cfg.sorten[2].preis, Y.cfg.sorten[2].meta.alk], [3.5, 5.1]);
  const arch = B("bierstatus", { name: "Rusty", status: "archiv" });
  Y = L.rechne([rusty, ab, bp, arch]);
  ist("archiviert: aus, bleibt in Liste und Excel", [Y.cfg.sorten[3].aus, Y.cfg.sorten[3].archiv, Y.sortenNamen.includes("Rusty"), L.exportBlaetter(Y, () => "").some(b => b.name === "Rusty (06.02.2026)")], [true, true, true, true]);
  ist("Excel-Info mit Eigenschaften", L.exportBlaetter(Y, () => "").find(b => b.name === "Rusty (06.02.2026)").info[0], "Red Ale · Braugang vum 6.2.2026 · Alk: 5,6 % · Quantitéit: 156 L · Haltbar bis 1.2.2027 · ARCHIVÉIERT");
  Y = L.rechne([rusty, ab, bp, arch, B("bierstatus", { name: "Rusty", status: "aktiv" })]);
  ist("aus dem Archiv zurück", Y.cfg.sorten[3].aus, false);
  const weg = B("bierstatus", { name: "Rusty", status: "weg" });
  Y = L.rechne([rusty, ab, bp, weg]);
  ist("gelöscht: überall weg", [Y.cfg.sorten.some(c => c.name === "Rusty"), Y.sortenNamen.includes("Rusty"), L.exportBlaetter(Y, () => "").some(b => b.name === "Rusty (06.02.2026)"), Y.flaschen.da], [false, false, false, 0]);
  Y = L.rechne([rusty, ab, bp, weg, B("bier", { name: "Rusty", preis: 3 })]);
  ist("neu angelegt nach Löschen: wieder da", Y.sortenNamen.includes("Rusty"), true);
  ist("Bier ungültig: Lager als Name", L.gueltig({ ...rusty, name: "Lager" }), false);
  ist("Bier ungültig: Alkohol zu hoch", L.gueltig({ ...rusty, alk: 55 }), false);
  ist("Verlauf-Text", L.beschreibe(rusty), "🍺 Béier: Rusty · Red Ale · 5,6 % · 3 € · gebraut 6.2.2026");
  // Braudatum hinter dem Namen (Fassung r)
  Y = L.rechne([rusty, ab]);
  ist("Anzeige mit Braudatum", [L.bierText("Rusty"), L.postenText([{ sorte: "Rusty", n: 2 }, { sorte: "Rusty Keg 20l", n: 1 }])], ["Rusty (06.02.2026)", "2 × Rusty (06.02.2026), 1 × Rusty (06.02.2026) (Fass 20 l)"]);
  ist("Excel-Blatt heißt mit Datum", L.exportBlaetter(Y, () => "").map(b => b.name).includes("Rusty (06.02.2026)"), true);
  ist("Name mit Datum oder Monat bleibt", [L.bierText("NEIPA (28.07.2026)"), L.bierText("Brown Porter 01/2026")], ["NEIPA (28.07.2026)", "Brown Porter 01/2026"]);
  ist("ohne Braudatum nichts dahinter", L.bierText("White IPA"), "White IPA");
  // Datum nachtragen oder ändern: Bestand bleibt, Anzeige folgt dem aktuellen Datum
  {
    const B = (id, x) => ({ id, zeit: Date.parse("2026-11-14T10:00:00Z") + id.length, durch: "Laurent", ...x });
    const ohne = [B("w1", { art: "bier", name: "White IPA", preis: 3 }), B("w2", { art: "abfuellung", sorte: "White IPA", n: 50 }), B("w3", { art: "bewegung", sorte: "White IPA", n: 10, von: "Lager", an: "Jeff" })];
    let Q = L.rechne([...ohne, B("w4xx", { art: "bier", name: "White IPA", preis: 3, braudatum: "2026-09-26" })]);
    ist("Datum nachgetragen: Bestand bleibt, Anzeige mit Datum", [L.hat(Q, "Lager", "White IPA"), L.hat(Q, "Jeff", "White IPA"), L.bierText("White IPA")], [40, 10, "White IPA (26.09.2026)"]);
    const mit = [B("n1", { art: "bier", name: "NEIPA (28.07.2026)", preis: 3, braudatum: "2026-07-28" }), B("n2", { art: "abfuellung", sorte: "NEIPA (28.07.2026)", n: 120 })];
    Q = L.rechne([...mit, B("n3xx", { art: "bier", name: "NEIPA (28.07.2026)", preis: 3, braudatum: "2026-07-29" })]);
    ist("Datum geändert: Bestand bleibt, Anzeige neues Datum", [L.hat(Q, "Lager", "NEIPA (28.07.2026)"), L.bierText("NEIPA (28.07.2026)"), Q.cfg.sorten.filter(c => c.name === "NEIPA (28.07.2026)").length], [120, "NEIPA (29.07.2026)", 1]);
  }
}

// Dateien je Bier: feste Felder nehmen die neueste, „anner“ sammelt; Löschen per storno
{
  let k4 = 0, t4 = 200000;
  const D = x => ({ id: "da-" + String(++k4).padStart(5, "0"), zeit: t4 += 1000, art: "datei", durch: "Laurent", groesse: 1000, teile: 1, typ: "application/pdf", ...x });
  const e1 = D({ fid: "fid-etikett-1", name: "etikett-alt.pdf", bier: "Rusty", feld: "etikett" });
  const e2 = D({ fid: "fid-etikett-2", name: "etikett-neu.pdf", bier: "Rusty", feld: "etikett" });
  const a1 = D({ fid: "fid-anner-001", name: "foto.jpg", bier: "Rusty", feld: "anner" });
  const a2 = D({ fid: "fid-anner-002", name: "zoll.pdf", bier: "Rusty", feld: "anner" });
  const g1 = D({ fid: "fid-allgem-01", name: "hygiene.pdf", bier: "", feld: "anner" });
  let Y = L.rechne([e1, e2, a1, a2, g1]);
  let d = L.dateienVon(Y, "Rusty");
  ist("Etikett: neueste gilt", d.etikett.name, "etikett-neu.pdf");
  ist("Aner: neueste zuerst", d.anner.map(x => x.name), ["zoll.pdf", "foto.jpg"]);
  ist("Anzahl", [d.anzahl, d.rezept], [3, null]);
  ist("allgemein getrennt", L.dateienVon(Y, "").anner.map(x => x.name), ["hygiene.pdf"]);
  Y = L.rechne([e1, e2, a1, a2, g1, { id: "da-st-1", zeit: t4 += 1000, art: "storno", ref: e2.id }]);
  ist("neueste gelöscht → alte wieder da", L.dateienVon(Y, "Rusty").etikett.name, "etikett-alt.pdf");
  ist("Datei ungültig: böse fid", L.gueltig({ ...e1, fid: "../x" }), false);
  ist("Datei ungültig: falsches Feld", L.gueltig({ ...e1, feld: "foto" }), false);
}

// Alte Verkäufe aus der Excel-Tabelle: archiviert, nicht in Kasse/Ausstoend, Zahlen wie in der Tabelle
{
  const alt = L.altImport();
  ist("Import: alle Einträge gültig", alt.filter(e => !L.gueltig(e)).map(e => e.id), []);
  ist("Import: ids eindeutig", new Set(alt.map(e => e.id)).size, alt.length);
  const Y = L.rechne(alt);
  ist("Import: nichts in Kasse/Ausstoend/Personen", [Y.kasse, Y.offen, Y.kaeufer.length, Y.umsatz, Y.personen.Jeff.verkauft], [0, 0, 0, 0, 0]);
  ist("Import: alle archiviert", Y.cfg.sorten.filter(c => c.name.includes("2026")).every(c => c.archiv), true);
  const bp = Y.sorten["Brown Porter 01/2026"], ru = Y.sorten["Rusty 02/2026"];
  ist("Brown Porter: 310 ofgefëllt, 225 verkaaft, 85 fort, 0 do", [bp.abgefuellt, bp.verkauft, bp.abgang, L.hat(Y, "Claude", "Brown Porter 01/2026"), bp.da], [310, 225, 85, 0, 0]);
  ist("Rusty: 288 = 285 verkaaft + 3 fort", [ru.abgefuellt, ru.verkauft, ru.abgang, ru.da], [288, 285, 3, 0]);
  ist("Fässer: 2 BP-Keg und 1 Rusty-20l-Keg noch am Lager", [L.hat(Y, "Lager", "Brown Porter 01/2026 Keg 30l"), L.hat(Y, "Lager", "Rusty 02/2026 Keg 30l"), L.hat(Y, "Lager", "Rusty 02/2026 Keg 20l")], [2, 0, 1]);
  const z = L.proSorte(Y, "Rusty 02/2026");
  ist("pro Bier Rusty mit Fässern: Zeilen und Recetten", [z.length, z.reduce((a, r) => a + r.recetten, 0), z.filter(r => r.geb !== "Fläsch").map(r => r.geb + ":" + r.recetten).sort()], [11, 957, ["Fass 20 l:150", "Fass 30 l:180"]]);
  ist("Gambrinuskelle als Verkauf zu 3 €", z.find(r => r.kunde === "Gambrinuskelle").recetten, 72);
  ist("alte Zeile: bezuel? –, Bemerkung", [z.find(r => r.kunde === "Rock Solid").bezuelt, z.find(r => r.kunde === "Rock Solid").remarque, z.find(r => r.kunde === "Rock Solid").datum], ["–", "2,50 €/Fl", "2026-05-09"]);
  ist("Excel: ein Blatt je altes Bier, Fässer darin", L.exportBlaetter(Y, () => "").map(b => b.name).filter(n => n.includes("2026")), ["Brown Porter 01/2026", "Rusty 02/2026"]);
  ist("Excel Rusty: Fass-Info", L.exportBlaetter(Y, () => "").find(b => b.name === "Rusty 02/2026").info.filter(i => i.startsWith("Fass")), ["Fass 20 l — ofgefëllt: 2 · verkaaft: 1 · fort: 0 · nach do: 1", "Fass 30 l — ofgefëllt: 1 · verkaaft: 1 · fort: 0 · nach do: 0"]);
  ist("alte Zeile ohne Datum: im Excel leer statt erfundenem Tag", L.exportBlaetter(Y, () => "ERFUNDEN").find(b => b.name === "Rusty 02/2026").zeilen.find(r => r[1] === "Brennerdag")[0], "");
  // Korrektur für schon eingespielten alten Stand (mit Umbuchung zu Claude)
  const altStand = [...alt.filter(e => e.id !== "alt26-bp-cw-fort"), { id: "alt26-bp-cw", zeit: Date.parse("2026-01-24T12:00:00Z"), durch: "Excel-Import", art: "bewegung", sorte: "Brown Porter 01/2026", n: 4, von: "Lager", an: "Claude" }];
  ist("alter Stand: 4 bei Claude", L.hat(L.rechne(altStand), "Claude", "Brown Porter 01/2026"), 4);
  const korr = L.altKorrekturen(new Set(altStand.map(e => e.id)));
  const Yk = L.rechne([...altStand, ...korr]);
  ist("Korrektur: Claude 0, fort 85, Fässer bleiben", [L.hat(Yk, "Claude", "Brown Porter 01/2026"), Yk.sorten["Brown Porter 01/2026"].abgang, Yk.sorten["Brown Porter 01/2026"].da, L.hat(Yk, "Lager", "Brown Porter 01/2026 Keg 30l"), L.hat(Yk, "Lager", "Rusty 02/2026 Keg 20l")], [0, 85, 0, 2, 1]);
  ist("Korrektur nur einmal", L.altKorrekturen(new Set([...altStand, ...korr].map(e => e.id))), []);
  ist("frischer Import braucht keine Korrektur", L.altKorrekturen(new Set(alt.map(e => e.id))), []);
  ist("doppelt importiert = einmal", L.rechne([...alt, ...alt]).sorten["Rusty 02/2026"].verkauft, 285);
  // neben neuen Verkäufen: Kasse nur aus den neuen
  const neuV = { id: "neu-1", zeit: Date.now(), art: "verkauf", verkaeufer: "Jeff", kaeufer: "Paul", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6 };
  const neuZ = { id: "neu-2", zeit: Date.now() + 1, art: "zahlung", ref: "neu-1", betrag: 6 };
  const Y2 = L.rechne([...alt, neuV, neuZ]);
  ist("mit neuen Verkäufen: Kasse nur neu", [Y2.kasse, Y2.personen.Jeff.verkauft, Y2.kaeufer.map(k => k.name)], [6, 2, ["Paul"]]);
}

// Fässer als Gebinde, Reservierungen, Zahlungsarten
{
  let k5 = 0, t5 = 300000;
  const E5 = (art, x) => ({ id: "fz-" + String(++k5).padStart(5, "0"), zeit: t5 += 1000, art, durch: "Jeff", ...x });
  const ne = E5("bier", { name: "NEIPA", preis: 3, preis20: 140 });
  const ab = [E5("abfuellung", { sorte: "NEIPA", n: 100 }), E5("abfuellung", { sorte: L.fassKey("NEIPA", 20), n: 3 }), E5("abfuellung", { sorte: L.fassKey("NEIPA", 30), n: 1 })];
  let Y = L.rechne([ne, ...ab]);
  ist("Fässer kein eigenes Bier", Y.cfg.sorten.some(c => c.name.includes("Keg")), false);
  ist("Fässer am Bier", L.artikelVon(Y, "NEIPA"), ["NEIPA", "NEIPA Keg 20l", "NEIPA Keg 30l"]);
  ist("Fasspreise: eigener und Vorgabe", [L.preisVon(Y.cfg, "NEIPA Keg 20l"), L.preisVon(Y.cfg, "NEIPA Keg 30l")], [140, 180]);
  ist("Flaschen-Summe ohne Fässer", Y.flaschen.da, 100);
  // Altbestand: Fass als eigenes Bier → Preis wandert ans Bier, Bier verschwindet aus der Liste
  const altF = E5("bier", { name: "NEIPA Keg 30l", preis: 175 });
  Y = L.rechne([ne, ...ab, altF]);
  ist("altes Fass-Bier: kein eigenes Bier, Preis am Bier", [Y.cfg.sorten.map(c => c.name).includes("NEIPA Keg 30l"), L.preisVon(Y.cfg, "NEIPA Keg 30l")], [false, 175]);
  // Reservierung durch geplante Livraison
  const L1 = E5("livraison", { kunde: "BEST", kontakt: "Jeff", aus: "Lager", datum: "2026-12-01", posten: [{ sorte: "NEIPA", n: 60 }, { sorte: "NEIPA Keg 20l", n: 2 }], betrag: 460, rechnung: true });
  Y = L.rechne([ne, ...ab, L1]);
  ist("reserviert", [L.frei(Y, "Lager", "NEIPA"), L.frei(Y, "Lager", "NEIPA Keg 20l"), L.hat(Y, "Lager", "NEIPA")], [40, 1, 100]);
  ist("zweite Livraison reicht nicht: Warnung", L.zuWenig(Y, "Lager", [{ sorte: "NEIPA", n: 50 }, { sorte: "NEIPA Keg 20l", n: 1 }]).map(p => [p.sorte, p.n, p.frei, p.res]), [["NEIPA", 50, 40, 60]]);
  const v1 = E5("verkauf", { verkaeufer: "Jeff", kaeufer: "BEST", posten: L1.posten, betrag: 460, aus: "Lager", liv: L1.id });
  Y = L.rechne([ne, ...ab, L1, v1]);
  ist("geliefert: Reservierung weg, Bestand runter", [L.frei(Y, "Lager", "NEIPA"), L.reserviertBei ? 0 : 0, L.hat(Y, "Lager", "NEIPA Keg 20l")], [40, 0, 1]);
  // Zahlungsarten
  const z1 = E5("zahlung", { ref: v1.id, betrag: 400, wie: "bank" }), z2 = E5("zahlung", { ref: v1.id, betrag: 60, wie: "bar" });
  Y = L.rechne([ne, ...ab, L1, v1, z1, z2]);
  ist("Kasse nach Art", Y.kasseNach, { bank: 400, bar: 60 });
  ist("bezuel? und Art getrennt", [L.proSorte(Y, "NEIPA")[0].bezuelt, L.proSorte(Y, "NEIPA")[0].wie], ["Jo", "Iwwerweisung, Bar"]);
  const blN = L.exportBlaetter(Y, () => "").find(b => b.name === "NEIPA");
  ist("Excel: Spalte „bezuelt per“", [blN.kopf[9], blN.zeilen[0][8], blN.zeilen[0][9]], ["bezuelt per", "Jo", "Iwwerweisung, Bar"]);
  ist("Zahlung: unbekannte Art ungültig", L.gueltig({ ...z1, wie: "paypal" }), false);
  ist("Verlauf: Zahlart", L.beschreibe(z2, Y), "✓ 60 € bezuelt per Bar: BEST (beim Jeff)");
}

// ---------- Aufgaben (vom Nutzer, 17.11.2026) ----------
{
  const H = "2026-11-17", T = Date.parse("2026-11-17T10:00:00Z"), TAG = 86400000;
  let z = T - 40 * TAG, i = 0;
  const A = (art, x, zeit) => ({ id: "auf-" + String(++i).padStart(5, "0"), zeit: zeit ?? (z += 1000), art, durch: "Laurent", ...x });
  const bier = A("bier", { name: "NEIPA", preis: 3, mhd: "2026-12-01" });
  const ab = A("abfuellung", { sorte: "NEIPA", n: 40 });
  const zuJeff = A("bewegung", { sorte: "NEIPA", n: 10, von: "Lager", an: "Jeff" });
  // offen seit 35 Tagen (Jeff → Paul), offen seit 5 Tagen (Laurent → Anne)
  const alt = A("verkauf", { verkaeufer: "Jeff", kaeufer: "Paul", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6, datum: "2026-10-13" });
  const neu = A("verkauf", { verkaeufer: "Laurent", kaeufer: "Anne", posten: [{ sorte: "NEIPA", n: 2 }], betrag: 6, datum: "2026-11-12" });
  // Bestellung geliefert, Rechnung offen; Bestellung übermorgen, zu wenig im Lager; Bestellung von gestern, nicht geliefert
  const l1 = A("livraison", { kunde: "Ferro Forum", kontakt: "Marc", aus: "Lager", datum: "2026-11-10", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 18, rechnung: true });
  const v1 = A("verkauf", { verkaeufer: "Marc", kaeufer: "Ferro Forum", posten: [{ sorte: "NEIPA", n: 6 }], betrag: 18, aus: "Lager", liv: l1.id }, T - 7 * TAG);
  const l2 = A("livraison", { kunde: "BEST", kontakt: "Laurent", aus: "Lager", datum: "2026-11-19", posten: [{ sorte: "NEIPA", n: 30 }], betrag: 90, rechnung: false });
  const l3 = A("livraison", { kunde: "Rock Solid", kontakt: "Claude", aus: "Lager", datum: "2026-11-16", posten: [{ sorte: "NEIPA", n: 1 }], betrag: 3, rechnung: false });
  const br = A("termin", { tid: "t-brau-01", typ: "braudag", titel: "Braudag", datum: "2026-11-05", bier: "IPA" });
  const eig = A("aufgabe", { aid: "a-eigen-01", text: "Etiketten bestellen", fuer: ["Laurent"], bis: "2026-11-16" });
  const eig2 = A("aufgabe", { aid: "a-eigen-02", text: "Malz kafen", fuer: ["All"] });
  const ein = [bier, ab, zuJeff, alt, neu, l1, v1, l2, l3, br, eig, eig2];
  let Y = L.rechne(ein);
  const auto = L.autoAufgaben(Y, H);
  const typen = auto.map(a => a.typ).sort();
  ist("Auto: alle Arten", typen, ["afuellen", "erinnern", "fehlt", "geliwwert", "leer", "mhd", "rechnung"]);
  const von = t => auto.find(a => a.typ === t);
  ist("Rechnung: Text, für Kontakt, Link zur Bestellung", [von("rechnung").text, von("rechnung").fuer, von("rechnung").ref], ["Rechnung maachen: Ferro Forum", ["Marc"], { typ: "liv", id: l1.id }]);
  ist("Erinnern: nur ab 30 Tagen, für den Verkäufer", [von("erinnern").text, von("erinnern").sub, von("erinnern").fuer, auto.filter(a => a.typ === "erinnern").length], ["Paul erënneren · 6 €", "op zënter 35 Deeg", ["Jeff"], 1]);
  // Lager 24 (31 reserviert), Jeff 8, Laurent −2 → zusammen −1 frei
  ist("Leer: nichts mehr frei", [von("leer").text, von("leer").sub, von("leer").fuer], ["Keen NEIPA méi do", "just nach 0 fräi", ["All"]]);
  ist("Leer: unter 24 frei", L.autoAufgaben(L.rechne([...ein, A("abfuellung", { sorte: "NEIPA", n: 10 })]), H).find(a => a.typ === "leer").text, "Gläich keen NEIPA méi do");
  ist("Fehlt: Bestellung in 2 Tagen, Rock Solid (früher) zuerst bedient", [von("fehlt").text, von("fehlt").fuer, von("fehlt").bis], ["Fir d'Bestellung BEST feelen 7 NEIPA", ["Laurent"], "2026-11-19"]);
  ist("Nicht geliefert: gestern", [von("geliwwert").text, von("geliwwert").fuer, von("geliwwert").wieder], ["Bestellung Rock Solid (16.11.) nach net als geliwwert markéiert", ["Claude"], 7]);
  ist("Haltbar bis", von("mhd").text, "NEIPA nach haltbar bis 1.12. · 30 Fläschen do");
  ist("Afëllen plangen", [von("afuellen").text, von("afuellen").ref], ["Afëllen fir IPA plangen", { typ: "termin", id: "t-brau-01" }]);
  // Gegenproben: Afëllen-Termin da → weg; Rechnung gemacht → weg; bezahlt → weg
  const gegen = L.autoAufgaben(L.rechne([...ein, A("termin", { tid: "t-afue-01", typ: "abfuellen", titel: "Afëllen", datum: "2026-11-20", bier: "ipa " }),
    A("rechnung", { ref: v1.id }), A("zahlung", { ref: alt.id, betrag: 6 })]), H).map(a => a.typ).sort();
  ist("Gegenprobe: erledigte Sachen verschwinden von selbst", gegen, ["fehlt", "geliwwert", "leer", "mhd"]);
  ist("Fehlt am Liefertag: eigene aid", L.autoAufgaben(Y, "2026-11-19").find(a => a.typ === "fehlt").aid !== von("fehlt").aid, true);
  // Liste: überfällige eigene zuerst
  let S = L.aufgabenStand(Y, H, T);
  ist("Liste: Überfälliges zuerst", S.op[0].text, "Bestellung Rock Solid (16.11.) nach net als geliwwert markéiert");
  ist("Liste: eigene drin, keine erledigten", [S.op.some(a => a.aid === "a-eigen-01"), S.erl.length], [true, 0]);
  // Abhaken: eigene → erledigt; Rechnung → 14 Tage weg, danach wieder; Leer → nie wieder
  const hak = (a, zeit) => A("aufgabe", { aid: a.aid, text: a.text, fuer: a.fuer, ...(a.auto ? { auto: true } : {}), erledigt: true }, zeit);
  const ein2 = [...ein, hak({ aid: "a-eigen-01", text: "Etiketten bestellen", fuer: ["Laurent"] }, T - TAG), hak(von("rechnung"), T - TAG), hak(von("leer"), T - TAG), hak(von("geliwwert"), T - 8 * TAG)];
  Y = L.rechne(ein2);
  S = L.aufgabenStand(Y, H, T);
  ist("Abgehakt: eigene, Rechnung und Leer weg; nicht geliefert nach 7 Tagen wieder da",
    ["a-eigen-01", von("rechnung").aid, von("leer").aid, von("geliwwert").aid].map(aid => S.op.some(a => a.aid === aid)), [false, false, false, true]);
  ist("… und als „nochmal“ markiert", S.op.find(a => a.aid === von("geliwwert").aid).nochmal, true);
  ist("Erledigt-Liste", S.erl.map(a => a.text).sort(), ["Etiketten bestellen", "Keen NEIPA méi do", "Rechnung maachen: Ferro Forum"]);
  S = L.aufgabenStand(Y, "2026-12-02", T + 15 * TAG);
  ist("Nach 15 Tagen: Rechnung wieder da, Leer nicht", [S.op.some(a => a.aid === von("rechnung").aid), S.op.some(a => a.typ === "leer")], [true, false]);
  // Neue Abfüllung → Leer kann neu kommen (andere aid)
  const nachAb = L.autoAufgaben(L.rechne([...ein2, A("abfuellung", { sorte: "NEIPA", n: 1 })]), H).find(a => a.typ === "leer");
  ist("Leer nach neuer Abfüllung: neue aid", nachAb && nachAb.aid !== von("leer").aid, true);
  // Bestellung ändern: lid bleibt, Aufgabe hängt weiter dran
  const l2b = A("livraison", { ...l2, id: undefined, datum: "2026-11-20", vorher: l2.id });
  const Y3 = L.rechne([...ein, A("storno", { ref: l2.id }), { ...l2b, id: "auf-l2b" }]);
  ist("Geänderte Bestellung behält lid", Y3.livraisons.find(x => x.id === "auf-l2b").lid, l2.id);
  ist("Gültig: Aufgabe ohne Text nein, weg ja", [L.gueltig({ id: "x", zeit: 1, art: "aufgabe", aid: "a-eigen-09", fuer: ["All"] }), L.gueltig({ id: "x", zeit: 1, art: "aufgabe", aid: "a-eigen-09", weg: true })], [false, true]);
  ist("Verlauf: Aufgabe", L.beschreibe(eig, Y), "✅ Aufgab: Etiketten bestellen · fir Laurent · bis 16.11.2026");
  const bl = L.exportBlaetter(Y, t => "x", H).find(b => b.name === "Ze maachen");
  ist("Excel: Ze maachen mit offenen und erledigten", [bl.zeilen.some(r => r[0] === "Malz kafen" && r[3] === "op"), bl.zeilen.some(r => r[0] === "Etiketten bestellen" && r[3] === "erleedegt" && r[4] === "Laurent")], [true, true]);
}

// ---------- Vorauszahlung an der Bestellung (vom Nutzer, Fassung h) ----------
{
  const H = "2026-11-17", T = Date.parse("2026-11-17T10:00:00Z");
  let z = T - 5 * 86400000, i = 0;
  const A = (art, x) => ({ id: "vor-" + String(++i).padStart(5, "0"), zeit: (z += 1000), art, durch: "Laurent", ...x });
  const ab = A("abfuellung", { sorte: "NEIPA", n: 100 });
  const L1 = A("livraison", { kunde: "TC Smash", kontakt: "Laurent", aus: "Lager", datum: "2026-11-20", posten: [{ sorte: "NEIPA", n: 24 }], betrag: 72, rechnung: true });
  const L2 = A("livraison", { kunde: "Barthel Steve", kontakt: "Jeff", aus: "Lager", datum: "2026-11-15", posten: [{ sorte: "NEIPA", n: 12 }], betrag: 36, rechnung: false });
  const z1 = A("zahlung", { ref: L1.id, vor: true, betrag: 72, wie: "wero" });
  const z2 = A("zahlung", { ref: L2.id, vor: true, betrag: 30, wie: "bar" });
  let ein = [ab, L1, L2, z1, z2];
  let Y = L.rechne(ein);
  const l = k => Y.livraisons.find(x => x.kunde === k);
  ist("Vorauszahlung: an der Bestellung", [l("TC Smash").vorbezahlt, l("TC Smash").vorWie, l("Barthel Steve").vorbezahlt], [72, ["wero"], 30]);
  ist("Vorauszahlung: sofort in der Kasse, je Art", [Y.kasse, Y.kasseNach], [102, { wero: 72, bar: 30 }]);
  ist("Vorauszahlung: nicht unter Ausstoend", [Y.offen, Y.kaeufer.length], [0, 0]);
  const auto = L.autoAufgaben(Y, H);
  const liw = auto.filter(a => a.typ === "liwweren");
  ist("Erinnerung: bezahlt, nach liwweren", liw.map(a => [a.text, a.sub, a.fuer[0], !!a.rot]), [
    ["Barthel Steve huet scho bezuelt — nach liwweren", "30 € Acompte per Bar · geplangt 15.11.", "Jeff", true],
    ["TC Smash huet scho bezuelt — nach liwweren", "72 € per WERO · geplangt 20.11.", "Laurent", false]]);
  ist("Lieferdatum vorbei + bezahlt: kein zweites „nach net als geliwwert markéiert“", auto.some(a => a.typ === "geliwwert"), false);
  ist("Verlauf: Virauszuelung", L.beschreibe(z1, Y), "💶 Virauszuelung 72 € per WERO: TC Smash");
  // Bestellung ändern: Zahlung bleibt (lid)
  const L1b = { ...A("livraison", { kunde: "TC Smash", kontakt: "Laurent", aus: "Lager", datum: "2026-11-21", posten: [{ sorte: "NEIPA", n: 24 }], betrag: 72, rechnung: true, vorher: L1.id }) };
  ein = [...ein, A("storno", { ref: L1.id }), L1b];
  Y = L.rechne(ein);
  ist("Geänderte Bestellung behält die Vorauszahlung", [l("TC Smash").vorbezahlt, Y.kasse], [72, 102]);
  // Liefern: angerechnet, Rest offen; Erinnerung weg
  const v1 = A("verkauf", { verkaeufer: "Laurent", kaeufer: "TC Smash", posten: [{ sorte: "NEIPA", n: 24 }], betrag: 72, aus: "Lager", liv: L1b.id });
  const v2 = A("verkauf", { verkaeufer: "Jeff", kaeufer: "Barthel Steve", posten: [{ sorte: "NEIPA", n: 12 }], betrag: 36, aus: "Lager", liv: L2.id });
  Y = L.rechne([...ein, v1, v2]);
  const vk = k => Y.verkaeufe.find(x => x.kaeufer === k);
  ist("Geliefert: Vorauszahlung angerechnet", [vk("TC Smash").offen, vk("TC Smash").wie, vk("Barthel Steve").offen, Y.offen, Y.kasse], [0, ["wero"], 6, 6, 102]);
  ist("Geliefert: Erinnerung weg", L.autoAufgaben(Y, H).some(a => a.typ === "liwweren"), false);
  // Bestellung gelöscht: Geld fällt aus der Kasse
  Y = L.rechne([...ein, A("storno", { ref: L2.id })]);
  ist("Gelöscht: Vorauszahlung zählt nicht mehr", Y.kasse, 72);
  const bl = L.exportBlaetter(L.rechne([ab, L1, L2, z1, z2]), t => "x", H).find(b => b.name === "Bestellungen");
  ist("Excel: vor der Lieferung bezahlt", bl.zeilen.map(r => [r[1], r[8], r[9]]), [["Barthel Steve", "Acompte 30 €", "Bar"], ["TC Smash", "Jo (am Viraus)", "WERO"]]);
}

console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `Alle ${n} Prüfungen bestanden`);
process.exit(fehler ? 1 : 0);
