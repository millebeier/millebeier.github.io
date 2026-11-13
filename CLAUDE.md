# millebeier

Bestands- und Kassen-App für **Millebeier**, die kleine Brauerei von Laurent, Jeff, Marc und Claude
(Luxemburg). Deutsch, Du-Form. Angelegt 13.11.2026.

## Was die App macht
Flaschen werden abgefüllt (→ Lager), an die vier verteilt, von ihnen verkauft. Jeder trägt auf seinem
Handy ein, wer wie viele Flaschen gekauft hat und ob bezahlt ist. Die App zeigt Bestand (Lager und je
Person), Verkauft, Kasse und Offen. **Geld geht immer sofort in die Millebeier-Kasse** (vom Nutzer) —
es gibt also nur eine Schuld: Käufer → Kasse. Kein Pfand. Sorten zum Start: NEIPA, White IPA,
Brown Porter, 3 € je Flasche; Sorten, Preise und Leute sind in der App (⚙️) für alle änderbar.

## Aufbau
- `index.html` — Einzeldatei, kein Build, kein Framework. GitHub Pages.
- `worker.js` — Cloudflare Worker + D1 (Binding `DB`, Secret `CODE`). Speichert nur Einträge,
  rechnet nichts. Tabelle `eintraege` legt er selbst an.
- **Datenmodell = Buchungsliste.** Nichts wird überschrieben; jeder Eintrag
  `{id, zeit, art, durch, …}` mit `art` ∈ abfuellung, bewegung (von/an, „Lager“ ist ein Halter),
  abgang (getrunken/verschenkt/kaputt/sonst), verkauf (verkaeufer, kaeufer, posten[], betrag),
  zahlung (ref = Verkauf), einstellungen (sorten, leute; die letzte gilt), storno (ref).
  `rechne()` baut daraus den ganzen Stand. Rückgängig = storno, nie löschen; ein storniertes
  Verkauf nimmt seine Zahlungen mit. Storno eines Storno zählt nicht.
- **`durch` = wer eingetragen hat** (nicht `von` — das ist bei `bewegung` die Herkunft; die
  Verwechslung war der erste Fehler).
- Bestand hängt am **Namen** — Leute nicht umbenennen, wenn sie Flaschen haben.
- Offline: neue Einträge liegen in `millebeier_v1_ausgang`, bis der Worker sie hat; Einfügen ist
  idempotent (`INSERT OR IGNORE` über die id).
- `WORKER_URL` leer = Probe-Modus (alles nur im localStorage des Handys).
- Käufernamen: gleiche Schreibweise ohne Groß/klein wird zusammengefasst, beim Eintragen der
  bekannte Name übernommen.
- iPhone-Regeln wie in den anderen Apps des Nutzers: kein `viewport-fit=cover`, Kasten mit
  fokussiertem Feld nie neu bauen (`tipptIn`), Zahlenfelder mit `inputmode`, Teilen über
  `navigator.share`.
- **`FASSUNG`** unten in `index.html` bei jeder Änderung hochzählen.

## Testen — vor jedem Push alle drei, jeder mit eigenem Rückgabewert
- `node test/logik.mjs` — schneidet `Logik`…`Oberfläche` aus der HTML (Gegenprobe gemacht).
- `node test/worker.mjs` — Worker mit nachgebauter D1.
- `node test/oberflaeche.mjs` — Playwright, zwei Handys gegen den echten Worker-Code, offline.

## Ideen, nicht gebaut
Ausgaben (Malz, Hopfen, Flaschen) → Gewinn; Reservierungen; Kisten-Preis; Kassensturz (Ist-Betrag
in der Kasse gegen App).
