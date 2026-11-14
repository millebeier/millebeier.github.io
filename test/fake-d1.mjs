// Nachgebaute D1 für die Tests: Tabellen eintraege und teile, nur die Befehle, die worker.js benutzt.
export function fakeD1() {
  const rows = new Map(), teile = new Map();
  const stmt = sql => ({
    sql, args: [],
    bind(...a) { return { ...this, args: a }; },
    async run() {
      if (sql.startsWith("INSERT OR IGNORE INTO eintraege")) { const [id, zeit, daten] = this.args; if (!rows.has(id)) rows.set(id, { id, zeit, daten }); }
      else if (sql.startsWith("INSERT OR REPLACE INTO teile")) { const [fid, nr, daten] = this.args; teile.set(fid + "#" + nr, daten); }
      return {};
    },
    async all() { return { results: [...rows.values()].sort((a, b) => a.zeit - b.zeit || (a.id < b.id ? -1 : 1)) }; },
    async first() { const [fid, nr] = this.args; const d = teile.get(fid + "#" + nr); return d == null ? null : { daten: d }; },
  });
  return { rows, teile, prepare: stmt, async batch(l) { for (const s of l) await s.run(); return []; } };
}
