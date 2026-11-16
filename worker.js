/*
 * Millebeier – Cloudflare Worker
 *
 * Speichert die Einträge der App in einer D1-Datenbank. Mehr nicht: gerechnet wird in der App.
 * Einrichten (einmalig, im Cloudflare-Dashboard):
 *   1. Storage & Databases → D1 → Datenbank „millebeier“ anlegen.
 *   2. Workers & Pages → Worker „millebeier“ anlegen, diesen Code einfügen, Deploy.
 *   3. Worker → Settings → Bindings → D1 database: Name  DB  → Datenbank „millebeier“.
 *   4. Worker → Settings → Variables and Secrets → Secret  CODE  = euer gemeinsamer Code.
 * Die Tabelle legt der Worker beim ersten Aufruf selbst an.
 *
 * Anfragen: POST, Text mit JSON  {code, aktion: "liste"}  oder  {code, aktion: "neu", eintraege: [...]}
 * → Antwort {eintraege: [...alle...]}.
 * Dateien (seit 14.11.2026): in Stücken (Base64-Text, je höchstens 1,4 MB) in der Tabelle `teile`.
 *   {code, aktion: "teil_hoch", fid, nr, daten} → {ok: true}
 *   {code, aktion: "teil_holen", fid, nr}       → {daten}
 * Welche Dateien es gibt (Name, Bier, Feld, Anzahl Stücke), steht als normaler Eintrag (art "datei") in `eintraege`.
 * Kalender (seit 16.11.2026): GET /kalender/<schlüssel>.ics → alle Termine (art "termin") als iCalendar zum Abonnieren.
 *   Schlüssel = die ersten 32 Zeichen von SHA-256("millebeier-kalender:" + CODE) in Hex — die App rechnet ihn genauso.
 *   Wer den Code ändert, ändert damit auch den Kalender-Link. Bestellungen kommen bewusst nicht in den Kalender (vom Nutzer).
 */

// Jede Art aus Kleinbuchstaben wird gespeichert — was sie bedeutet, prüft die App. So muss der Worker
// für neue Funktionen der App nicht neu eingefügt werden (seit 14.11.2026).
const ART = /^[a-z_]{2,24}$/;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function antwort(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Vergleich ohne Zeitunterschied je nach Übereinstimmung.
function gleich(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function tabelle(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS eintraege (id TEXT PRIMARY KEY, zeit INTEGER NOT NULL, daten TEXT NOT NULL, angekommen INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS teile (fid TEXT NOT NULL, nr INTEGER NOT NULL, daten TEXT NOT NULL, PRIMARY KEY (fid, nr))"),
  ]);
}
const FID = /^[A-Za-z0-9_-]{8,80}$/;

async function alle(db) {
  const { results } = await db.prepare("SELECT daten FROM eintraege ORDER BY zeit, id").all();
  const out = [];
  for (const r of results || []) { try { out.push(JSON.parse(r.daten)); } catch {} }
  return out;
}

function pruefe(e) {
  if (!e || typeof e !== "object" || Array.isArray(e)) return "kein Eintrag";
  if (typeof e.id !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(e.id)) return "id";
  if (typeof e.zeit !== "number" || !isFinite(e.zeit)) return "zeit";
  if (typeof e.art !== "string" || !ART.test(e.art)) return "art";
  if (JSON.stringify(e).length > 4000) return "zu groß";
  return "";
}

/* ---------- Kalender ---------- */
const TERMIN_ARTEN = { braudag: "🍺", umschlauchen: "🔄", hopfen: "🌿", abfuellen: "🍾", etikett: "🏷️", stand: "🎪", reunioun: "🗣️", aanescht: "📝" };
async function kalenderSchluessel(code) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("millebeier-kalender:" + String(code).trim()));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
// Aktuelle Termine: je tid der neueste nicht gelöschte Eintrag (Löschen = storno oder weg: true), wie in der App.
function termineAus(eintraege) {
  const storniert = new Set(eintraege.filter(e => e.art === "storno").map(e => e.ref));
  const m = new Map();
  for (const e of eintraege) if (e.art === "termin" && !storniert.has(e.id) && typeof e.tid === "string") m.set(e.tid, e);
  return [...m.values()].filter(t => !t.weg && /^\d{4}-\d{2}-\d{2}$/.test(t.datum || ""));
}
const icsText = t => String(t || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
// Zeilen über 75 Bytes falten (RFC 5545)
function falten(z) {
  const out = []; let rest = z;
  const enc = new TextEncoder();
  while (enc.encode(rest).length > 75) {
    let n = 75; while (enc.encode(rest.slice(0, n)).length > (out.length ? 74 : 75)) n--;
    if (/[\uD800-\uDBFF]/.test(rest[n - 1])) n--; // Emoji nicht zerreißen
    out.push(rest.slice(0, n)); rest = rest.slice(n);
  }
  out.push(rest);
  return out.join("\r\n ");
}
const VTIMEZONE = ["BEGIN:VTIMEZONE", "TZID:Europe/Luxembourg",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE"];
function kalenderIcs(termine) {
  const d = s => s.replace(/-/g, "");
  const naechsterTag = s => { const x = new Date(s + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10).replace(/-/g, ""); };
  const plus2h = z => { const [h, m] = z.split(":").map(Number); const t = Math.min(23 * 60 + 59, h * 60 + m + 120); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
  const z = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Millebeier//Kalenner//LB", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Millebéier", "X-WR-TIMEZONE:Europe/Luxembourg", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H", ...VTIMEZONE];
  for (const t of termine) {
    const stamp = new Date(t.zeit || 0).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    z.push("BEGIN:VEVENT", "UID:" + t.tid + "@millebeier", "DTSTAMP:" + stamp);
    if (/^\d{2}:\d{2}$/.test(t.uhr || "")) {
      const bis = /^\d{2}:\d{2}$/.test(t.bis || "") && t.bis > t.uhr ? t.bis : plus2h(t.uhr);
      z.push("DTSTART;TZID=Europe/Luxembourg:" + d(t.datum) + "T" + t.uhr.replace(":", "") + "00",
        "DTEND;TZID=Europe/Luxembourg:" + d(t.datum) + "T" + bis.replace(":", "") + "00");
    } else z.push("DTSTART;VALUE=DATE:" + d(t.datum), "DTEND;VALUE=DATE:" + naechsterTag(t.datum));
    z.push("SUMMARY:" + icsText(`${TERMIN_ARTEN[t.typ] || "📝"} ${t.titel || ""}${t.bier ? " · " + t.bier : ""}`));
    if (t.wou) z.push("LOCATION:" + icsText(t.wou));
    const besch = [Array.isArray(t.wer) && t.wer.length ? "Dobäi: " + t.wer.join(", ") : "", t.notiz || ""].filter(Boolean).join("\n");
    if (besch) z.push("DESCRIPTION:" + icsText(besch));
    z.push("END:VEVENT");
  }
  z.push("END:VCALENDAR");
  return z.map(falten).join("\r\n") + "\r\n";
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method === "GET") {
      const k = new URL(req.url).pathname.match(/^\/kalender\/([0-9a-f]{32})\.ics$/);
      if (k) {
        if (!env.DB || !env.CODE) return new Response("Kalenner net ageriicht.", { status: 500 });
        if (!gleich(k[1], await kalenderSchluessel(env.CODE))) {
          await new Promise(r => setTimeout(r, 700));
          return new Response("Net fonnt.", { status: 404 });
        }
        await tabelle(env.DB);
        return new Response(kalenderIcs(termineAus(await alle(env.DB))), {
          headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store",
            "Content-Disposition": 'inline; filename="millebeier.ics"' },
        });
      }
    }
    if (req.method !== "POST") return antwort({ ok: true, app: "millebeier", db: !!env.DB, code: !!env.CODE, dateien: true, kalender: true });
    if (!env.DB) return antwort({ fehler: "Server: Datebank net verbonnen (Binding DB feelt)." }, 500);
    if (!env.CODE) return antwort({ fehler: "Server: kee Code ageriicht (Secret CODE feelt)." }, 500);

    let b;
    try { b = JSON.parse(await req.text()); } catch { return antwort({ fehler: "Ongëlteg Ufro." }, 400); }
    if (!b || typeof b.code !== "string" || !gleich(b.code.trim(), String(env.CODE).trim())) {
      await new Promise(r => setTimeout(r, 700)); // Raten bremsen
      return antwort({ fehler: "Falsche Code." }, 401);
    }

    await tabelle(env.DB);

    if (b.aktion === "neu") {
      if (!Array.isArray(b.eintraege) || b.eintraege.length > 50) return antwort({ fehler: "Ongëlteg Agaben." }, 400);
      for (const e of b.eintraege) {
        const f = pruefe(e);
        if (f) return antwort({ fehler: "Ongëlteg Agab: " + f }, 400);
      }
      const jetzt = Date.now();
      const st = env.DB.prepare("INSERT OR IGNORE INTO eintraege (id, zeit, daten, angekommen) VALUES (?, ?, ?, ?)");
      if (b.eintraege.length) await env.DB.batch(b.eintraege.map(e => st.bind(e.id, Math.round(e.zeit), JSON.stringify(e), jetzt)));
      return antwort({ eintraege: await alle(env.DB) });
    }
    if (b.aktion === "liste") return antwort({ eintraege: await alle(env.DB) });
    if (b.aktion === "teil_hoch") {
      if (typeof b.fid !== "string" || !FID.test(b.fid) || !Number.isInteger(b.nr) || b.nr < 0 || b.nr > 200 ||
          typeof b.daten !== "string" || !b.daten.length || b.daten.length > 1400000) return antwort({ fehler: "Ongëltegt Stéck." }, 400);
      await env.DB.prepare("INSERT OR REPLACE INTO teile (fid, nr, daten) VALUES (?, ?, ?)").bind(b.fid, b.nr, b.daten).run();
      return antwort({ ok: true });
    }
    if (b.aktion === "teil_holen") {
      if (typeof b.fid !== "string" || !FID.test(b.fid) || !Number.isInteger(b.nr)) return antwort({ fehler: "Ongëlteg Ufro." }, 400);
      const r = await env.DB.prepare("SELECT daten FROM teile WHERE fid = ? AND nr = ?").bind(b.fid, b.nr).first();
      if (!r) return antwort({ fehler: "Stéck net fonnt." }, 404);
      return antwort({ daten: r.daten });
    }
    return antwort({ fehler: "Onbekannt Aktioun." }, 400);
  },
};
