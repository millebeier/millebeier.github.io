// Prüft die Rechenlogik aus index.html (Block zwischen den Marken „Logik“ und „Oberfläche“).
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const a = html.indexOf("/* === Logik ===");
const b = html.indexOf("/* === Oberfläche ===");
if (a < 0 || b < 0) { console.error("Marken nicht gefunden"); process.exit(1); }
const L = new Function(html.slice(a, b) + "; return {rechne, gueltig, euro, verteile, erinnerung, csv, beschreibe, hat, LAGER, STANDARD};")();

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
ist("Erinnerung", L.erinnerung(Z.kaeufer.find(x => x.name === "Paul")), "Hallo Paul, für die Millebeier (2 × NEIPA) sind noch 4 € offen. Merci & Prost! 🍺");

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

ist("euro", [L.euro(3), L.euro(4.5), L.euro(0.1 + 0.2)], ["3 €", "4,50 €", "0,30 €"]);
const c = L.csv(L.rechne(ein), t => "T" + t);
ist("CSV Kopf", c.split("\r\n")[0], '﻿"Datum";"Verkäufer";"Käufer";"NEIPA";"White IPA";"Brown Porter";"Flaschen";"Betrag";"Bezahlt";"Offen"');
ist("CSV Zeilen", c.trim().split("\r\n").length, 4);

console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `Alle ${n} Prüfungen bestanden`);
process.exit(fehler ? 1 : 0);
