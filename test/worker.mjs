// Worker mit nachgebauter D1 (Map statt SQL).
import worker from "../worker.js";
function fakeD1() {
  const rows = new Map();
  const st = sql => ({
    sql, args: [],
    bind(...a) { return { ...this, args: a }; },
    async run() { if (sql.startsWith("INSERT OR IGNORE")) { const [id, zeit, daten] = this.args; if (!rows.has(id)) rows.set(id, { id, zeit, daten }); } return {}; },
    async all() { return { results: [...rows.values()].sort((a, b) => a.zeit - b.zeit || (a.id < b.id ? -1 : 1)) }; },
  });
  return { rows, prepare: st, async batch(l) { for (const s of l) await s.run(); return []; } };
}
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
[s, j] = await post({ code: "hopfen", aktion: "neu", eintraege: [{ ...e1, id: "bbbbbbbb", art: "boese" }] });
ist("falsche Art", s, 400);
[s, j] = await post({ code: "hopfen", aktion: "liste" });
ist("liste", [s, j.eintraege.length], [200, 2]);
[s, j] = await post({ code: "hopfen", aktion: "liste" }, { DB: env.DB });
ist("ohne CODE", s, 500);
const r = await worker.fetch(new Request("https://x/", { method: "OPTIONS" }), env);
ist("OPTIONS", r.status, 204);
console.log(fehler ? `${fehler} Fehler` : "Worker: alles bestanden");
process.exit(fehler ? 1 : 0);
