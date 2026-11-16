// Worker mit nachgebauter D1 (Map statt SQL).
import worker from "../worker.js";
import { fakeD1 } from "./fake-d1.mjs";
let fehler = 0;
const ist = (was, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) { fehler++; console.log("✗", was, JSON.stringify(a), "statt", JSON.stringify(b)); } };
const env = { DB: fakeD1(), CODE: "hopfen" };
const post = async (body, e = env) => { const r = await worker.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(body) }), e); return [r.status, await r.json(), r.headers.get("access-control-allow-origin")]; };
const e1 = { id: "aaaaaaaa-1", zeit: 2, art: "abfuellung", sorte: "NEIPA", n: 24 };
const e0 = { id: "aaaaaaaa-0", zeit: 1, art: "abfuellung", sorte: "NEIPA", n: 1 };
let [s, j, cors] = await post({ code: "falsch", aktion: "liste" });
ist("falscher Code", [s, j.fehler, cors], [401, "Falsche Code.", "*"]);
[s, j] = await post({ code: "hopfen", aktion: "neu", eintraege: [e1, e0] });
ist("neu", [s, j.eintraege.map(e => e.id)], [200, ["aaaaaaaa-0", "aaaaaaaa-1"]]);
[s, j] = await post({ code: " hopfen ", aktion: "neu", eintraege: [e1] });
ist("doppelt gesendet", j.eintraege.length, 2);
[s, j] = await post({ code: "hopfen", aktion: "neu", eintraege: [{ ...e1, id: "x" }] });
ist("kaputte id", s, 400);
[s, j] = await post({ code: "hopfen", aktion: "neu", eintraege: [{ ...e1, id: "bbbbbbbb", art: "Böse Art!" }] });
ist("falsche Art", s, 400);
[s, j] = await post({ code: "hopfen", aktion: "neu", eintraege: [{ ...e1, id: "cccccccc", art: "livraison" }] });
ist("neue Art livraison", [s, j.eintraege.length], [200, 3]);
[s, j] = await post({ code: "hopfen", aktion: "liste" });
ist("liste", [s, j.eintraege.length], [200, 3]);
[s, j] = await post({ code: "hopfen", aktion: "liste" }, { DB: env.DB });
ist("ohne CODE", s, 500);
[s, j] = await post({ code: "hopfen", aktion: "teil_hoch", fid: "datei-abc-123", nr: 0, daten: "SGFsbG8=" });
ist("Stück hoch", [s, j.ok], [200, true]);
[s, j] = await post({ code: "hopfen", aktion: "teil_holen", fid: "datei-abc-123", nr: 0 });
ist("Stück holen", [s, j.daten], [200, "SGFsbG8="]);
[s, j] = await post({ code: "hopfen", aktion: "teil_holen", fid: "datei-abc-123", nr: 1 });
ist("fehlendes Stück", s, 404);
[s, j] = await post({ code: "hopfen", aktion: "teil_hoch", fid: "../boese", nr: 0, daten: "x" });
ist("böse fid", s, 400);
[s, j] = await post({ code: "falsch", aktion: "teil_holen", fid: "datei-abc-123", nr: 0 });
ist("Stück nur mit Code", s, 401);
[s, j] = await post({ code: "hopfen", aktion: "liste" });
ist("Stücke nicht in der Liste", j.eintraege.length, 3);
// Kalender (seit 16.11.2026): Termine als .ics, Schlüssel aus dem Code, Bestellungen nicht
const { createHash } = await import("node:crypto");
const schl = createHash("sha256").update("millebeier-kalender:hopfen").digest("hex").slice(0, 32);
await post({ code: "hopfen", aktion: "neu", eintraege: [
  { id: "term-0001", zeit: 10, art: "termin", tid: "t-brau-1", typ: "braudag", titel: "Braudag", datum: "2026-11-21", uhr: "09:00", bier: "NEIPA", wer: ["Laurent", "Jeff"], wou: "bei Laurent, Beyren" },
  { id: "term-0002", zeit: 11, art: "termin", tid: "t-afel-1", typ: "abfuellen", titel: "Afëllen", datum: "2026-12-05" },
  { id: "term-0003", zeit: 12, art: "termin", tid: "t-weg-1", typ: "reunioun", titel: "Reunioun", datum: "2026-12-06" },
  { id: "term-0004", zeit: 13, art: "termin", tid: "t-weg-1", weg: true },
  { id: "term-0005", zeit: 14, art: "termin", tid: "t-brau-1", typ: "braudag", titel: "Braudag (verluecht)", datum: "2026-11-22", uhr: "10:00", bis: "16:30", bier: "NEIPA", wer: ["Laurent"] },
  { id: "liv-00001", zeit: 15, art: "livraison", kunde: "Reimen David", kontakt: "Laurent", aus: "Lager", datum: "2026-11-23", posten: [{ sorte: "NEIPA", n: 4 }], betrag: 12, rechnung: false },
  { id: "term-0006", zeit: 16, art: "termin", tid: "t-stor-1", typ: "stand", titel: "Stand", datum: "2026-12-07" },
  { id: "stor-0001", zeit: 17, art: "storno", ref: "term-0006" }] });
const get = async p => { const r = await worker.fetch(new Request("https://x" + p), env); return [r.status, r.headers.get("content-type"), await r.text()]; };
let [ks, kt, ics] = await get("/kalender/" + schl + ".ics");
ist("Kalender da", [ks, kt], [200, "text/calendar; charset=utf-8"]);
ist("zwei Termine (geändert, gelöscht, storniert, keine Bestellung)", (ics.match(/BEGIN:VEVENT/g) || []).length, 2);
ist("neueste Fassung mit Uhrzeit bis", [ics.includes("DTSTART;TZID=Europe/Luxembourg:20261122T100000"), ics.includes("DTEND;TZID=Europe/Luxembourg:20261122T163000")], [true, true]);
ist("ganzer Tag", [ics.includes("DTSTART;VALUE=DATE:20261205"), ics.includes("DTEND;VALUE=DATE:20261206")], [true, true]);
ist("Titel mit Bier, Komma escaped", [ics.includes("SUMMARY:🍺 Braudag (verluecht) · NEIPA"), ics.includes("Dobäi: Laurent")], [true, true]);
ist("neue Fassung ohne Ort", (await get("/kalender/" + schl + ".ics"))[2].includes("LOCATION:"), false);
ist("keine Bestellung", ics.includes("Reimen"), false);
ist("CRLF und Zeilen ≤ 75 Bytes", ics.split("\r\n").every(z => new TextEncoder().encode(z).length <= 75) && !/[^\r]\n/.test(ics), true);
ist("UID je Termin", ics.includes("UID:t-brau-1@millebeier"), true);
[ks] = await get("/kalender/" + "0".repeat(32) + ".ics");
ist("falscher Schlüssel", ks, 404);
[ks] = await get("/kalender/abc.ics");
ist("kaputter Pfad → normale Antwort", ks, 200);
const lang = { id: "term-0007", zeit: 18, art: "termin", tid: "t-lang-1", typ: "stand", titel: "Stand; Chrëschtmaart, Gréiwemaacher mat ganz laangem Titel fir d'Faltung ze testen 🎪🎪", datum: "2026-12-12", wou: "Place du Marché, Grevenmacher" };
await post({ code: "hopfen", aktion: "neu", eintraege: [lang] });
ics = (await get("/kalender/" + schl + ".ics"))[2];
const entfaltet = ics.replace(/\r\n /g, "");
ist("lange Zeile gefaltet und wieder ganz", entfaltet.includes("SUMMARY:🎪 Stand\\; Chrëschtmaart\\, Gréiwemaacher mat ganz laangem Titel fir d'Faltung ze testen 🎪🎪"), true);
ist("Ort mit Komma escaped", entfaltet.includes("LOCATION:Place du Marché\\, Grevenmacher"), true);
ist("gefaltet: jede Zeile ≤ 75 Bytes", ics.split("\r\n").every(z => new TextEncoder().encode(z).length <= 75), true);
const r = await worker.fetch(new Request("https://x/", { method: "OPTIONS" }), env);
ist("OPTIONS", r.status, 204);
console.log(fehler ? `${fehler} Fehler` : "Worker: alles bestanden");
process.exit(fehler ? 1 : 0);
