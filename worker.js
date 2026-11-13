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
 * Anfragen: POST, Text mit JSON  {code, aktion: "liste"}  oder  {code, aktion: "neu", eintraege: [...]}.
 * Antwort immer: {eintraege: [...alle...]}.
 */

const ARTEN = ["abfuellung", "bewegung", "abgang", "verkauf", "zahlung", "einstellungen", "storno"];
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
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS eintraege (id TEXT PRIMARY KEY, zeit INTEGER NOT NULL, daten TEXT NOT NULL, angekommen INTEGER NOT NULL)"
  ).run();
}

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
  if (!ARTEN.includes(e.art)) return "art";
  if (JSON.stringify(e).length > 4000) return "zu groß";
  return "";
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method !== "POST") return antwort({ ok: true, app: "millebeier", db: !!env.DB, code: !!env.CODE });
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
    return antwort({ fehler: "Onbekannt Aktioun." }, 400);
  },
};
