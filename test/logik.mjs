// Prüft die Rechenlogik aus index.html (Block zwischen den Marken „Logik“ und „Oberfläche“).
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const a = html.indexOf("/* === Logik ===");
const b = html.indexOf("/* === Oberfläche ===");
if (a < 0 || b < 0) { console.error("Marken nicht gefunden"); process.exit(1); }
const L = new Function(html.slice(a, b) + "; return {rechne, gueltig, euro, verteile, erinnerung, csv, beschreibe, hat, LAGER, STANDARD, proSorte, exportBlaetter, anteil, dateienVon};")();

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
  ist("Export: Blätter", bl.map(b => b.name), ["NEIPA", "Brown Porter", "Livraisons", "Stock"]);
  ist("Export: Summe NEIPA ohne geplant", bl[0].summe.slice(0, 6), ["Total", "", "", 27, "", 66]);
  ist("Export: Livraisons", bl[2].zeilen.map(z => [z[1], z[6], z[7], z[8]]), [["Ferro Forum", "Jo", "gemaach", "Nee"], ["BEST", "geplangt", "", "–"]]);
  ist("Export: Stock Lager", bl[3].zeilen[0].slice(0, 3), ["Lager", 66, 0]);
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
  ist("archiviert: aus, bleibt in Liste und Excel", [Y.cfg.sorten[3].aus, Y.cfg.sorten[3].archiv, Y.sortenNamen.includes("Rusty"), L.exportBlaetter(Y, () => "").some(b => b.name === "Rusty")], [true, true, true, true]);
  ist("Excel-Info mit Eigenschaften", L.exportBlaetter(Y, () => "").find(b => b.name === "Rusty").info[0], "Red Ale · Braugang vum 6.2.2026 · Alk: 5,6 % · Quantitéit: 156 L · Haltbar bis 1.2.2027 · ARCHIVÉIERT");
  Y = L.rechne([rusty, ab, bp, arch, B("bierstatus", { name: "Rusty", status: "aktiv" })]);
  ist("aus dem Archiv zurück", Y.cfg.sorten[3].aus, false);
  const weg = B("bierstatus", { name: "Rusty", status: "weg" });
  Y = L.rechne([rusty, ab, bp, weg]);
  ist("gelöscht: überall weg", [Y.cfg.sorten.some(c => c.name === "Rusty"), Y.sortenNamen.includes("Rusty"), L.exportBlaetter(Y, () => "").some(b => b.name === "Rusty"), Y.flaschen.da], [false, false, false, 0]);
  Y = L.rechne([rusty, ab, bp, weg, B("bier", { name: "Rusty", preis: 3 })]);
  ist("neu angelegt nach Löschen: wieder da", Y.sortenNamen.includes("Rusty"), true);
  ist("Bier ungültig: Lager als Name", L.gueltig({ ...rusty, name: "Lager" }), false);
  ist("Bier ungültig: Alkohol zu hoch", L.gueltig({ ...rusty, alk: 55 }), false);
  ist("Verlauf-Text", L.beschreibe(rusty), "🍺 Béier: Rusty · Red Ale · 5,6 % · 3 € · gebraut 6.2.2026");
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

console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `Alle ${n} Prüfungen bestanden`);
process.exit(fehler ? 1 : 0);
