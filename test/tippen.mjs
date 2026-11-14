// Doppeltipp-Zoom-Sperre (touchend) mit nachgebautem iPhone: −/+ zählt jeden Tipp, verschiedene Knöpfe
// schnell hintereinander gehen durch, zweiter Tipp an derselben Stelle wird abgefangen, zwei Finger bleiben frei.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const b = await pw.chromium.launch();
const ctx = await b.newContext({ ...pw.devices["iPhone 13"] });
const p = await ctx.newPage();
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
p.on("dialog", d => d.accept());
await p.route(/workers\.dev/, r => r.abort());
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { EIN = { code: "x", ich: "Laurent" }; TAB = "verkaufen"; render(); });
for (let i = 0; i < 4; i++) await p.tap('[data-plus="0"]');
ist("4 schnelle Tipps auf + zählen", await p.inputValue("#vN0"), "4");
await p.tap("#vKaeufer"); await p.keyboard.type("Ann");
ist("Tippen im Feld", await p.inputValue("#vKaeufer"), "Ann");
await p.tap('[data-bez="bar"]'); await p.tap("#vSpeichern"); await p.waitForTimeout(400);
await p.tap('#frageWahl [data-wahl="trotzdem"]'); await p.waitForTimeout(200); // Laurent hat nichts, Lager auch nicht
ist("Bezuelt und gleich Speichern", await p.evaluate(() => Z.verkaeufe.length), 1);
const touch = (punkte, liegen = []) => p.evaluate(([punkte, liegen]) => {
  const ziel = document.querySelector("#fuss");
  const t = (id, x, y) => new Touch({ identifier: id, target: ziel, clientX: x, clientY: y });
  let letztes;
  punkte.forEach(([x, y], i) => {
    letztes = new TouchEvent("touchend", { bubbles: true, cancelable: true, changedTouches: [t(i + 1, x, y)], touches: i === punkte.length - 1 ? liegen.map(([x, y], j) => t(9 + j, x, y)) : [] });
    ziel.dispatchEvent(letztes);
  });
  return letztes.defaultPrevented;
}, [punkte, liegen]);
await p.waitForTimeout(400);
ist("Doppeltipp an derselben Stelle abgefangen", await touch([[50, 50], [55, 52]]), true);
await p.waitForTimeout(400);
ist("schnell an anderer Stelle durchgelassen", await touch([[50, 50], [200, 300]]), false);
await p.waitForTimeout(400);
ist("Zwei-Finger-Geste in Ruhe gelassen", await touch([[50, 50], [52, 50]], [[150, 150]]), false);
ist("keine Fehler", seitenfehler, []);
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Tippen: alles bestanden");
process.exit(fehler ? 1 : 0);
