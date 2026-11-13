# millebeier

Bestands- und Kassen-App für **Millebéier** (so geschrieben wie im Logo; Repo, Dateien und Speicherschlüssel ohne é), die kleine Brauerei von Laurent, Jeff, Marc und Claude
(Luxemburg). **App-Texte auf Luxemburgisch** (vom Nutzer, 13.11.2026). **Reiter nach dem Ablauf** (vom Nutzer gewählt): Stock · Verkafen · Ausstoend · Iwwersiicht · Verlaf; mit dem Nutzer und in Code/Doku Deutsch, Du-Form. Angelegt 13.11.2026.

## Was die App macht
Flaschen werden abgefüllt (→ Lager), an die vier verteilt, von ihnen verkauft. Jeder trägt auf seinem
Handy ein, wer wie viele Flaschen gekauft hat und ob bezahlt ist. Die App zeigt Bestand (Lager und je
Person), Verkauft, Kasse und Offen. **Geld geht immer sofort in die Millebéier-Kasse** (vom Nutzer) —
es gibt also nur eine Schuld: Käufer → Kasse. Kein Pfand. Sorten zum Start: NEIPA, White IPA,
Brown Porter, 3 € je Flasche; Sorten, Preise und Leute sind in der App (⚙️) für alle änderbar.

## Aufbau
- `index.html` — Einzeldatei, kein Build, kein Framework. GitHub Pages: Organisation `millebeier`, Repo `millebeier.github.io` → https://millebeier.github.io/ (wie beim FC Koeppchen, vom Nutzer 13.11.2026).
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
- `WORKER_URL` = https://millebeier.rjtp6r9s9h.workers.dev/ (Cloudflare-Konto des Nutzers, eingerichtet 13.11.2026). Leer = Probe-Modus (alles nur im localStorage des Handys). Die Domain ist in der Cloud-Umgebung nicht freigegeben — prüfen kann nur der Nutzer.
- Käufernamen: gleiche Schreibweise ohne Groß/klein wird zusammengefasst, beim Eintragen der
  bekannte Name übernommen.
- Logo vom Nutzer (13.11.2026): `bilder/icon-180.png` (Home-Bildschirm, schwarzer Grund), `icon-512.png`, `logo-96.png` (Kopf, durchsichtig).
- **Doppeltipp-Schutz** (vom Nutzer, 13.11.2026), drei Stufen: `*{touch-action:manipulation}` (kein Zoom — nur auf Knöpfen reichte nicht, am iPhone gemeldet; Zwei-Finger-Zoom bleibt); Klick-Wächter im Capture: derselbe Knopf (id + data + Text) innerhalb 800 ms wird verschluckt, −/+ ausgenommen; `eintragen()` speichert denselben Inhalt innerhalb 3 s nicht zweimal (gibt dann `[]` zurück — Aufrufer müssen das abfangen). Tests in `oberflaeche.mjs`, Gegenprobe gemacht. Tests, die denselben Knopf zweimal drücken, müssen > 800 ms warten.
- **Artikel vor Namen** (vom Nutzer: „Du bass de Laurent“): Verkäufer (alle Männer) über `de()`/`beim()` („de Jeff“, „beim Jeff“, „d'Lager“, „am Lager“); Käufer können Frauen sein (d'Anne) → Sätze mit Käufernamen ohne Artikel bauen („Paul: 4 € bezuelt?“). Kommt eine Verkäuferin dazu, braucht `de()` eine Liste.
- **Name im Kopf** ganz weiß, nur der Akzent auf dem é rot wie im Logo: weißes „e“ mit rotem Strich darüber (`.akz::after`), weil sich ein Akzent nicht einzeln einfärben lässt.
- **Farben wie im Logo** (vom Nutzer, 13.11.2026): schwarz, weiß, Rot `--akzent` (#e3141b) für Knöpfe und markierte Reiter, Kopf mit rotem Strich und grauer Linie wie der Logo-Ring. Grün (bezahlt) und Gelb (offen) bleiben als Bedeutungsfarben.
- iPhone-Regeln wie in den anderen Apps des Nutzers: kein `viewport-fit=cover`, Kasten mit
  fokussiertem Feld nie neu bauen (`tipptIn`), Zahlenfelder mit `inputmode`, Teilen über
  `navigator.share`.
- **`FASSUNG`** unten in `index.html` bei jeder Änderung hochzählen — daran hängt auch das **automatische Update** (vom Nutzer, 13.11.2026): beim Öffnen und bei jeder Rückkehr holt `updatePruefen()` die Seite mit `cache:"reload"`, steht dort eine andere FASSUNG, lädt die App neu; mitten im Eintrag (`mittenImEintrag`) stattdessen roter Knopf oben. Je Zielfassung ein Versuch in 5 min (`millebeier_v1_update`), gegen Schleifen bei altem CDN-Stand. Ohne Hochzählen kommt kein Update an. (Die Apps in panini-wm-2026 haben das nicht.)

## Testen — vor jedem Push alle drei, jeder mit eigenem Rückgabewert
- `node test/logik.mjs` — schneidet `Logik`…`Oberfläche` aus der HTML (Gegenprobe gemacht).
- `node test/worker.mjs` — Worker mit nachgebauter D1.
- `node test/oberflaeche.mjs` — Playwright, zwei Handys gegen den echten Worker-Code, offline.

## Ideen, nicht gebaut
Ausgaben (Malz, Hopfen, Flaschen) → Gewinn; Reservierungen; Kisten-Preis; Kassensturz (Ist-Betrag
in der Kasse gegen App).
