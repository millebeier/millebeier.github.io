// Browser: Aufgaben (vom Nutzer, 17.11.2026). Hinter dem Kalender-Knopf zwei Kästen Kalenner/Aufgaben, anlegen mit Fir/bis,
// abhaken (gilt für alle) und zurückholen, automatische Aufgaben mit 💡 und Erklärung, „+ Aufgab“ an Bestellung und Termin
// mit Link dorthin (auch nach dem Ändern der Bestellung), Startseite nur mit meinen Aufgaben, „nicht geschickt“ nach 24 h.
const pw = await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.mjs");
let fehler = 0;
const ist = (was, a, b) => { const ok = typeof b === "function" ? b(a) : JSON.stringify(a) === JSON.stringify(b); console.log(ok ? "✓" : "✗", was, ok ? "" : "→ " + JSON.stringify(a)); if (!ok) fehler++; };
const warte = ms => new Promise(r => setTimeout(r, ms));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const seitenfehler = []; p.on("pageerror", e => seitenfehler.push(e.message));
p.on("dialog", d => d.accept());
await p.route(/workers\.dev/, r => r.abort());
await p.addInitScript(() => { window.OHNE_ALTIMPORT = true; });
await p.goto(new URL("../index.html", import.meta.url).href);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem("millebeier_v1", JSON.stringify({ code: "x", ich: "Laurent" })); });
await p.reload();
await p.evaluate(() => {
  const h = heuteLux();
  eintragen([{ art: "abfuellung", sorte: "NEIPA", n: 100 },
    { art: "livraison", kunde: "Ferro Forum", kontakt: "Laurent", aus: "Lager", datum: plusTage(h, 5), posten: [{ sorte: "NEIPA", n: 12 }], betrag: 36, rechnung: true },
    { art: "termin", tid: "t-auf-01", typ: "braudag", titel: "Braudag", datum: plusTage(h, 2), bier: "NEIPA", wer: ["Laurent"] }]);
});
const txt = sel => p.locator(sel).innerText();

// Kalender-Knopf: Kalenner vorausgewählt, daneben Aufgaben
await p.click("#kalBtn");
ist("Kalender-Knopf: zwei Kästen, Kalenner gewählt", await p.evaluate(() => [...document.querySelectorAll("[data-kber]")].map(x => x.dataset.kber + (x.classList.contains("an") ? "*" : ""))), ["kalender*", "aufgaben"]);
ist("Kalender darunter wie bisher", await txt("#t-kalender"), t => t.includes("Braudag") && t.includes("+ Neien Termin"));
await p.click('[data-kber="aufgaben"]');
ist("Aufgaben: leer", await txt("#t-kalender"), t => t.includes("Näischt ze maachen") && t.includes("näischt op"));
ist("ohne 💡 keine Erklärung", await p.locator(".aleg").count(), 0);
ist("Fir: Ech vorne und gewählt", await p.evaluate(() => [...document.querySelectorAll("[data-afuer]")].map(x => x.textContent + (x.classList.contains("an") ? "*" : ""))), ["Ech*", "Jeff", "Marc", "Claude", "All"]);

// Anlegen mit Enter (für mich) und mit + (für Marc, bis morgen)
await p.locator('#aNeu [data-af="text"]').type("Etiketten bestellen");
await p.keyboard.press("Enter"); await warte(200);
ist("Enter legt an", await txt("#t-kalender"), t => t.includes("✓ Agedroen: Etiketten bestellen") && t.includes("fir Laurent"));
await p.locator('#aNeu [data-af="text"]').type("Hopfen kafen");
await p.click('[data-afuer="Marc"]'); await p.click('[data-afuer="Laurent"]');
await p.click('[data-af="bisauf"]');
await p.evaluate(() => { const d = document.querySelector('[data-af="bis"]'); d.value = plusTage(heuteLux(), -1); d.dispatchEvent(new Event("input", { bubbles: true })); });
ist("Text bleibt beim Aufklappen von „bis“", await p.locator('#aNeu [data-af="text"]').inputValue(), "Hopfen kafen");
await p.click('#aNeu [data-af="ok"]'); await warte(200);
const zeilen = () => p.evaluate(() => [...document.querySelectorAll("#t-kalender .aufz .atx")].map(x => x.innerText.replace(/\s+/g, " ")));
ist("Überfällige zuerst, für Marc, „war bis gëschter“", await zeilen(), z => z[0].startsWith("Hopfen kafen") && z[0].includes("war bis gëschter") && z[0].includes("fir Marc"));
ist("Kasten zählt: 2 op · 1 iwwerfälleg", await txt('[data-kber="aufgaben"]'), t => t.includes("2 op · 1 iwwerfälleg"));
await p.click('[data-asicht="meng"]');
ist("Just meng: nur meine", await zeilen(), z => z.length === 1 && z[0].startsWith("Etiketten"));
await p.click('[data-asicht="op"]');

// Abhaken und zurückholen
await p.click('.aufz:has-text("Etiketten bestellen") [data-ahak]');
ist("abgehakt: weg aus Op", await zeilen(), z => !z.some(x => x.startsWith("Etiketten")));
await p.click('[data-asicht="erl"]');
ist("Erleedegt: ✓ vum Laurent", await zeilen(), z => z.some(x => x.startsWith("Etiketten bestellen") && x.includes("✓ vum Laurent")));
await p.click('.aufz:has-text("Etiketten bestellen") [data-azrk]');
await p.click('[data-asicht="op"]');
ist("zurückgeholt: wieder offen", await zeilen(), z => z.some(x => x.startsWith("Etiketten")));
ist("Verlauf kennt Abhaken", await p.evaluate(() => Z.aktiv.filter(e => e.art === "aufgabe").map(e => beschreibe(e, Z))), v => v.some(x => x.startsWith("☑️ Ofgehaakt: Etiketten")) && v.some(x => x.startsWith("↩️ Erëm op: Etiketten")));

// „+ Aufgab“ an der Bestellung: eine Zeile Knöpfe, Formular darunter, Link zurück
await p.evaluate(() => { TAB = "livraisons"; render(); });
ist("Bestellung: Knöpfe in einer Zeile", await p.evaluate(() => { const z = document.querySelector("#lListe .knopfe.einz"); return z.children.length === 4 && [...z.children].every(c => c.getBoundingClientRect().top === z.children[0].getBoundingClientRect().top && c.scrollWidth <= c.clientWidth + 1); }), true);
await p.click("[data-lauf]");
ist("Formular unter der Bestellung, Feld bereit", await p.evaluate(() => [!!document.querySelector(".liv .aform"), document.activeElement === document.querySelector(".liv .aform input"), document.querySelector(".liv .atitel").textContent]), [true, true, "✅ Nei Aufgab fir d'Bestellung Ferro Forum"]);
await p.locator(".liv .aform input").type("Fässer ofhuelen");
await p.click('.liv .aform [data-af="ok"]'); await warte(200);
ist("gespeichert, Formular zu", await txt("#lListe"), t => t.includes("✓ Aufgab agedroen: Fässer ofhuelen") && !t.includes("Nei Aufgab fir"));
// Bestellung ändern → Link bleibt
await p.evaluate(() => { const L = Z.livraisons[0]; eintragen([{ art: "storno", ref: L.id }, { art: "livraison", kunde: L.kunde, kontakt: L.kontakt, aus: L.aus, datum: plusTage(L.datum, 1), posten: L.posten, betrag: L.betrag, rechnung: true, vorher: L.id }]); });
await p.click("#kalBtn"); await p.click('[data-kber="aufgaben"]');
ist("Link zur Bestellung, auch nach dem Ändern", await zeilen(), z => z.some(x => x.startsWith("Fässer ofhuelen") && x.includes("🚚 Ferro Forum ›")));
await p.click('.aufz:has-text("Fässer ofhuelen") [data-alink]');
ist("Link führt zur Bestellung", await p.evaluate(() => [TAB, !!document.querySelector(`#lListe [data-lid="${Z.livraisons[0].lid}"]`)]), ["livraisons", true]);

// „+ Aufgab“ am Termin
await p.click("#kalBtn");
await p.click('[data-ter="t-auf-01"]');
ist("Termin: Knöpfe in einer Zeile", await p.evaluate(() => { const z = document.querySelector(".ter .knopfe.einz"); return [...z.children].map(c => c.textContent).join("|") + "|" + [...z.children].every(c => c.getBoundingClientRect().top === z.children[0].getBoundingClientRect().top); }), "✎ Änneren|✕ Läschen|+ Aufgab|true");
await p.click('[data-tauf="t-auf-01"]');
await p.locator(".ter .aform input").type("Hopfen mathuelen");
await p.click('.ter .aform [data-afuer="All"]');
await p.click('.ter .aform [data-af="ok"]'); await warte(200);
ist("Meldung im Kalender", await txt("#t-kalender"), t => t.includes("✓ Aufgab agedroen: Hopfen mathuelen"));
await p.click('[data-kber="aufgaben"]');
await p.click('.aufz:has-text("Hopfen mathuelen") [data-alink]');
ist("Link führt zum Termin, aufgeklappt", await p.evaluate(() => [TAB, KAL_BEREICH, KAL_AUF.has("t-auf-01")]), ["kalender", "kalender", true]);

// Automatische Aufgaben: Bestellung geliefert mit Rechnung → „Rechnung maachen“ mit 💡 und Erklärung
await p.evaluate(() => { const L = Z.livraisons[0]; eintragen([{ art: "verkauf", verkaeufer: L.kontakt, kaeufer: L.kunde, posten: L.posten, betrag: L.betrag, aus: L.aus, liv: L.id }]); });
await p.click('[data-kber="aufgaben"]');
ist("💡 Rechnung maachen + Erklärung", [await zeilen(), await p.locator(".aleg").count()], ([z, n]) => z.some(x => x.startsWith("💡 Rechnung maachen: Ferro Forum")) && n === 1);
await p.click('.aufz:has-text("Rechnung maachen") [data-ahak]');
ist("abgehakt: weg (kommt nach 14 Tagen wieder)", await zeilen(), z => !z.some(x => x.includes("Rechnung maachen")));
await p.evaluate(() => { const a = AUSGANG.find(x => x.art === "aufgabe" && x.auto && x.erledigt); a.zeit -= 15 * 86400000; neuRechnen(); render(); });
ist("nach 15 Tagen wieder da, „nach eng Kéier“", await zeilen(), z => z.some(x => x.includes("Rechnung maachen") && x.includes("nach eng Kéier")));

// Startseite: nur meine und „All“, nicht Marcs; abhaken dort
await p.click("#hautBtn");
ist("Startseite: Fir dech ze maachen", await txt("#hAuf"), t => t.includes("Etiketten bestellen") && t.includes("Hopfen mathuelen") && !t.includes("Hopfen kafen") && t.includes("💡 Rechnung maachen"));
ist("„Du hues zur Verfügung“", await txt("#t-haut"), t => t.includes("Du hues zur Verfügung") && !t.includes("Du hues fräi"));
await p.click('#hAuf .aufz:has-text("Etiketten bestellen") [data-ahak]');
ist("auf der Startseite abgehakt", await txt("#hAuf"), t => !t.includes("Etiketten bestellen"));
await p.click('#hAuf [data-hgeh="aufgaben"]');
ist("„alles ›“ → Aufgaben, Just meng", await p.evaluate(() => [TAB, KAL_BEREICH, AUF_SICHT]), ["kalender", "aufgaben", "meng"]);
await warte(900); await p.click("#kalBtn");
ist("Kalender-Knopf oben → wieder der Kalender", await p.evaluate(() => KAL_BEREICH), "kalender");

// Nicht geschickt seit > 24 h (offline im Test): nur auf diesem Handy, ohne Haken, Tipp öffnet den Sync-Text
await p.evaluate(() => { AUSGANG.forEach(e => e.zeit -= 2 * 86400000); neuRechnen(); TAB = "haut"; render(); });
ist("Startseite: Handy hat nicht geschickt", await txt("#hAuf"), t => /Däin Handy huet \d+ Agaben nach net geschéckt/.test(t));
await p.click('#hAuf .aufz:has-text("Däin Handy")');
ist("Tipp öffnet den Sync-Text", await p.locator("#syncInfo").isVisible(), true);

// „Jidderee muss“ (Fassung b): Auswahl erst bei mehreren, jeder hakt für sich ab
await p.evaluate(() => { SYNC_AUF = false; TAB = "kalender"; KAL_BEREICH = "aufgaben"; AUF_SICHT = "op"; render(); });
ist("eine Person: keine Auswahl", await p.locator("#aNeu .ajed").isVisible(), false);
await p.click('#aNeu [data-afuer="Jeff"]');
ist("zwei Personen: Auswahl da, Vorgabe „Een eleng“", [await p.locator("#aNeu .ajed").isVisible(), await p.getAttribute('#aNeu [data-ajed="0"]', "class")], v => v[0] && v[1].includes("an"));
await p.click('#aNeu [data-ajed="1"]');
await p.locator('#aNeu [data-af="text"]').type("Etiketten opklewen");
await p.click('#aNeu [data-af="ok"]'); await warte(200);
const jz = () => p.evaluate(() => { const z = [...document.querySelectorAll("#t-kalender .aufz")].find(x => x.innerText.includes("Etiketten opklewen")); return z ? z.innerText.replace(/\s+/g, " ") : ""; });
ist("👥 und Stand 0 vu 2", await jz(), t => t.includes("👥 Etiketten opklewen") && t.includes("jidderee") && t.includes("0 vu 2"));
await p.click('.aufz:has-text("Etiketten opklewen") [data-ahak]'); await warte(200);
ist("ich abgehakt: 1 vu 2, bleibt in Op, mein Kästchen ✓", [await jz(), await p.locator('.aufz:has-text("Etiketten opklewen") .abox.an').count()], v => v[0].includes("1 vu 2") && v[0].includes("✓ Laurent") && v[1] === 1);
await p.click('[data-asicht="meng"]');
ist("Just meng: bei mir weg", await jz(), "");
await p.evaluate(() => { EIN.ich = "Jeff"; eintragen([{ art: "aufhak", aid: Z.aufgaben.find(a => a.text === "Etiketten opklewen").aid }]); EIN.ich = "Laurent"; render(); });
await p.click('[data-asicht="erl"]');
ist("alle durch: unter Erleedegt", await jz(), t => t.includes("Etiketten opklewen"));
await p.click('[data-asicht="op"]');
// Excel-Blatt
ist("Excel: Blatt Ze maachen", await p.evaluate(() => { const bl = exportBlaetter(Z, zeitText).find(x => x.name === "Ze maachen"); return bl.zeilen.map(r => r[0] + "|" + r[3]); }),
  z => z.includes("Hopfen kafen|op") && z.includes("Etiketten bestellen|erleedegt") && z.some(x => x.startsWith("💡 Rechnung maachen")));
ist("keine Seitenfehler", seitenfehler, []);
await b.close();
console.log(fehler ? `${fehler} Fehler` : "Aufgaben: alles bestanden");
process.exit(fehler ? 1 : 0);
