# millebeier

Bestands- und Kassen-App für **Millebéier** (so geschrieben wie im Logo; Repo, Dateien und Speicherschlüssel ohne é), die kleine Brauerei von Laurent, Jeff, Marc und Claude
(Luxemburg). **App-Texte auf Luxemburgisch** (vom Nutzer, 13.11.2026). **Reiter nach dem Ablauf** (vom Nutzer gewählt): Stock · Verkafen · Livraisons · Ausstoend · Iwwersiicht · Verlaf (Handy 3 je Reihe, ab 600 px 6); mit dem Nutzer und in Code/Doku Deutsch, Du-Form. Angelegt 13.11.2026.

## Was die App macht
Flaschen werden abgefüllt (→ Lager), an die vier verteilt, von ihnen verkauft. Jeder trägt auf seinem
Handy ein, wer wie viele Flaschen gekauft hat und ob bezahlt ist. Die App zeigt Bestand (Lager und je
Person), Verkauft, Kasse und Offen. **Geld geht immer sofort in die Millebéier-Kasse** (vom Nutzer) —
es gibt also nur eine Schuld: Käufer → Kasse. Kein Pfand. Sorten zum Start: NEIPA, White IPA,
Brown Porter, 3 € je Flasche; Sorten, Preise und Leute sind in der App (⚙️) für alle änderbar.

## Bisher: Excel-Tabelle
Vor der App lief alles über `Iwwersiicht_Commanden_Clients_2026.xlsx` (Dropbox, vom Nutzer am 14.11.2026 hochgeladen):
ein Blatt je Brauvorgang (Brown Porter 23.01., Rusty 06.02., NEIPA 28.07., Porter 30.09.) mit Spalten Virnumm/Numm,
Kontakt (Kürzel JF, MW, CW, LR = Jeff, Marc, Claude Wilwert „Willy“, Laurent; vom Nutzer bestätigt),
Unzuel, Béier (Preis), geliwwert?, Recetten, Remarquen, bezuel?; dazu „LIVRAISONS CLIENTS“ für Firmen/Vereine
(Ferro Forum, Rock Solid, Café Millebières, BEST, Brennerdag) mit livré/facture/payé. Fässer 30 l = 180 €, 20 l =
150 €; Vereine 2,50 €/Fl; Geschenkpacks 12 €/4, 18 €/6. Zuerst wurde die Geschichte nicht übernommen (zu viele
Unklarheiten, z. B. Brown Porter 310 Zeilen-Flaschen bei 288 gebraut) — Startstand = Zählung; dann doch, siehe unten.
Der Excel-Export der App bildet dieses Format nach (s. u.).
**Alte Verkäufe doch übernommen** (vom Nutzer, 14.11.2026), aber **ohne Geld**: `altImport()` (feste ids `alt26-…`,
Knopf ⚙️ „📜 Al Verkéf 2026“, einmalig, verschwindet danach; springt in die Iwwersiicht mit offenem Archiv).
**Seit Fassung j von selbst** (vom Nutzer: Knopf übersehen): nach dem ersten erfolgreichen Abgleich, wenn `alt26-bier-bp`
weder beim Server noch im Ausgang ist (Prüfung gegen `SERVER`, nicht gegen `Z`). Tests mit leeren Daten setzen
`window.OHNE_ALTIMPORT = true` (addInitScript); `oberflaeche.mjs` prüft das Selbst-Einspielen mit zwei Handys.
Archivierte Biere „Brown Porter 01/2026“, „Rusty 02/2026“ mit ihren Fässern (seit Fassung i Gebinde, nicht eigene Biere) (Namen mit Monat, vom Nutzer —
heute gibt es wieder ein Brown Porter). Verkäufe mit `alt: true` → `Z.altVerkaeufe`: zählen im Bestand und pro Bier
(Recetten zur Info), **nie** in Kasse, Ausstoend, Umsatz je Person, Käuferliste (vom Nutzer: „gar nicht in die Kasse“).
Kürzel JF Jeff, MW Marc, CW/Claude Claude, LR Laurent — **vom Nutzer bestätigt**. Gambrinuskelle = Verkauf zu 3 €
(vom Nutzer). Brown Porter 310 abgefüllt (= Zeilensumme, Vermerk am Bier), Testflaschen 78 + BTS 3 verschenkt,
4 „nach doheem“ bei Claude — **seit Fassung n fort verbucht** (vom Nutzer; schon eingespielte Stände korrigiert
`altKorrekturen()` einmalig: storno von `alt26-bp-cw` + Abgang `alt26-bp-cw-fort`); Ferro Forum 2,50 €/Fl (aus dem Livraisons-Blatt), Oarbechterkiermes/Brennerdag/
Laurent/Willy ohne Preis = 0 € mit Vermerk. BEST (Livraisons-Blatt, 24 Rusty + 12 Porter am 17.05.) = Marc Gloden
(gleiche Menge, gleicher Tag), nicht doppelt. NEIPA 28.07. nicht übernommen (ist das aktuelle). Übrig im Lager:
2 BP-Fässer, 1 Rusty-20-l-Fass — **bleiben aktuell** (vom Nutzer): Fässer archivierter Biere bietet `artikelListe`
beim Verkaufen/Livraison und „Fläsche beweegen“ an, solange jemand welche hat. Alte Zeilen ohne Datum: „ouni Datum“, im Excel leer.

## Aufbau
- `index.html` — Einzeldatei, kein Build, kein Framework. GitHub Pages: Organisation `millebeier`, Repo `millebeier.github.io` → https://millebeier.github.io/ (wie beim FC Koeppchen, vom Nutzer 13.11.2026).
- `worker.js` — Cloudflare Worker + D1 (Binding `DB`, Secret `CODE`). **Seit 14.11.2026 (Dateien) vom Nutzer neu
  einzufügen** — ohne den neuen Worker schlägt das Hochladen mit 400 fehl (Hinweis in der App). Speichert nur Einträge,
  rechnet nichts. Tabelle `eintraege` legt er selbst an. **Seit 14.11.2026 nimmt er jede Art `^[a-z_]{2,24}$`** —
  neue Eintragsarten brauchen kein Neu-Einfügen mehr (die Fassung davor kannte nur die ersten sieben).
  Lehnt der Server ein Bündel ab (400), schickt die App einzeln; Abgelehntes bleibt im Ausgang mit Hinweis
  „Worker muss aktualiséiert ginn“, der Rest geht durch (Test mit altem Worker, Gegenprobe gemacht).
- **Datenmodell = Buchungsliste.** Nichts wird überschrieben; jeder Eintrag
  `{id, zeit, art, durch, …}` mit `art` ∈ abfuellung, bewegung (von/an, „Lager“ ist ein Halter),
  abgang (getrunken/verschenkt/kaputt/sonst), verkauf (verkaeufer, kaeufer, posten[], betrag),
  zahlung (ref = Verkauf), einstellungen (sorten, leute; die letzte gilt), storno (ref),
  livraison (kunde, kontakt, aus, datum YYYY-MM-DD, posten, betrag, rechnung, anlass?, notiz?), rechnung (ref = Verkauf),
  bier (name, preis, stil?, braudatum?, alk?, liter?, mhd?, notiz?), bierstatus (name, status aktiv|archiv|weg).
  **Biere** (vom Nutzer, 14.11.2026): angelegt und geändert unter **Stock → Eis Béieren** (nicht mehr in ⚙️; die
  Sortenliste aus `einstellungen` bleibt Grundlage für Altbestand und wird beim Speichern der Leute unverändert
  mitgeschickt — `Z.basisSorten`). Name nicht änderbar (Bestand hängt dran). Beim Anlegen optional Flaschen → `abfuellung`.
  **Archiv** = nicht mehr verkaufbar, bleibt in Iwwersiicht (📦) und Excel. **Erst wenn nichts mehr da ist** (vom Nutzer,
  Fassung o): liegt noch etwas (Flaschen/Fässer bei irgendwem) oder ist eine Livraison geplant, kommt ein Hinweis mit
  „wo“ (`restVon`) und es wird nicht archiviert. Der Import der alten Biere archiviert trotzdem (alte Fässer liegen noch). **Läschen** = zwei Rückfragen, verschwindet
  überall (`Z.geloescht`), Verkäufe bleiben im Verlauf und in der Kasse; zurück über den Verlauf oder neues Anlegen.
  Excel-Blatt je Bier zeigt die Eigenschaften (Braugang, Alk, Liter, Haltbar, ARCHIVÉIERT).
  **Dateien je Bier** (vom Nutzer, 14.11.2026): im Bier-Bearbeiten „📎 Dokumenter“ mit festen Feldern Etikett, Rezept,
  Brauprotokoll (je die neueste gilt, „Ersetzen“ lädt neu; ✕ = storno, dann gilt wieder die vorige) und „Aner Dateien“
  (beliebig viele). Nach „Béier uleeën“ springt die App gleich ins Bearbeiten. Eintrag `datei` (fid, name, typ, groesse,
  teile, bier, feld, thumb); der Inhalt liegt **nicht** in `eintraege`, sondern als Base64-Stücke à 1 000 000 Zeichen in
  der D1-Tabelle `teile` (Worker `teil_hoch`/`teil_holen`), Vorschaubild als Stück `<fid>-t` (JPEG 240 px; PDFs über
  pdf.js 3.11.174 von cdnjs, erst bei Bedarf geladen). Der Eintrag kommt erst, wenn alle Stücke oben sind. Max. 10 MB.
  Öffnen in eigener Anzeige (`#ansicht`: Bild bzw. alle PDF-Seiten als Canvas; **Tabellen** .ods/.xlsx/.xls/.csv über
  SheetJS `sheet_to_html` (vom Nutzer: Brauprotokoll als .ods), Datum ohne eigenes Format → TT.MM.JJJJ; „⬆️ Deelen“) — **nicht** per blob-URL,
  das gibt im Home-Bildschirm eine weiße Seite (Lehre aus pizza.html). `renderDok` baut nur bei Änderung neu
  (Signatur), sonst ging ein Tipp verloren, der in den Neuaufbau nach einem Abgleich fiel. Gelöschte Dateien bleiben
  als Stücke in D1 (zurückholbar über den Verlauf).
  **Livraison** (vom Nutzer, 14.11.2026): geplant, bis ein Verkauf mit `liv` = ihre id existiert („Geliwwert ✓“ legt ihn an,
  Flaschen aus `aus`, meist Lager — Verkauf hat dafür optional `aus`). Verkauf rückgängig → wieder geplant. Rechnung
  „gemaach“ = Eintrag `rechnung`. Geplantes zählt nirgends als verkauft.
  **Pro Bier** (`proSorte`): Verkäufe, Abgänge, geplante Livraisons je Sorte; Betrag eines Mehrsorten-Verkaufs nach
  Listenpreis aufgeteilt (`anteil`). In der Iwwersiicht Sorte antippen. **Excel-Export** (`exportBlaetter` → SheetJS
  0.18.5 von cdnjs, erst beim Tippen geladen): je Sorte ein Blatt wie die alte Tabelle, dazu Livraisons und Stock;
  Teilen-Leiste wie die anderen Dateien.
  **Fässer = Gebinde eines Biers** (vom Nutzer, 14.11.2026: „nicht als eigenständiges Bier“): Schlüssel im Bestand
  `fassKey(bier, 20|30)` = „<Bier> Keg 20l/30l“ — genau so hießen die früher als eigenes Bier angelegten Fässer, darum
  ordnet sich Altbestand von selbst zu (`zerlege`); alte Fass-„bier“-Einträge liefern nur noch den Fasspreis.
  Bier hat `preis20`/`preis30` (Vorgabe 150/180). `sortenNamen` = nur Biere; `fassNamen(Z, bier)` = Fässer mit
  Bewegung; `artikelVon` = beides. Flaschen-Summen (`Z.flaschen`, je Person) **nie** mit Fässern mischen — Fässer
  stehen daneben („10 + 3 F.“). Iwwersiicht: Fass-Zeilen 🛢️ unter dem Bier; Stock: eigene Fass-Tabelle; Excel:
  Spalte „Gebinde“, Fass-Info oben, Stock-Blatt mit Fass-Spalten. Verkaufen/Livraison zeigen Fässer nur, wenn der
  Halter welche hat (`artikelListe`).
  **Reserviert** (vom Nutzer): geplante Livraisons belegen den Bestand bei `aus` (`Z.reserviert`, `frei()`); beim
  Planen, Verkaufen, Weitergeben und Fort Warnung mit „huet X, dovun Y reservéiert → fräi Z“ (`zuWenig`, `fehltText`),
  bestätigen geht trotzdem. Stock zeigt „🚚 Reservéiert fir geplangt Livraisons“.
  **Verkaufen ohne eigenen Bestand** (vom Nutzer, Fassung m): statt Warnung Fenster „feelt: … — woher?“
  (`fehlendesHolen`, `frageWaehlen`): „📦 Aus dem Lager huelen“ / „Vum Jeff huelen“ (nur wer für alles Fehlende genug
  **frei** hat) → Umbuchung(en) `bewegung` + Verkauf in einem `eintragen`; „Trotzdeem androen“ = wie früher (Minus);
  Ofbriechen = nichts. Ausstoend markiert Verkäufe aus Livraisons mit „🚚 Livraisoun <Datum>“.
  Gemeldet 14.11.: „Livraison bezahlt, Ausstoend zeigt noch offen“ — am nachgebauten iPhone nicht nachstellbar
  (Kasse und Ausstoend stimmen); vermutet: doppelt eingetragen (Livraison + Verkauf) oder zweites Handy vor Abgleich.
  **Zahlungsarten** (vom Nutzer): `zahlung.wie` ∈ wero|sumup|bank|bar (WERO, SumUp, Iwwerweisung, Bar); Verkaufen hat
  vier Knöpfe + „Bezillt méi spéit“, Ausstoend/Livraisons ein Auswahlfenster (`zahlartWaehlen`, Abbrechen = nichts).
  `Z.kasseNach` je Art (Iwwersiicht unter „an der Kees“). **Art eigens sichtbar** (vom Nutzer): Liste pro Bier zeigt
  in „bezuel?“ direkt WERO/SumUp/…, Excel hat eigene Spalte „bezuelt per“ (Bier-Blätter und Livraisons; `wieListe`).
  Alte Zahlungen ohne Art = „ouni Aart“. **Knöpfe mit Bild + Name** (Bilder vom Nutzer, 14.11.2026, zugeschnitten auf
  240×96: `bilder/zahl-wero.jpg`, `zahl-sumup.png`, `zahl-bank.png` (Spuerkeess-Logo, Rot #de0000), `zahl-bar.jpg`
  (Ausschnitt der Geldscheine)); gewählt = grüner Rahmen + ✓.
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
- **Doppeltipp-Schutz** (vom Nutzer, 13.11.2026), vier Stufen: `html`/`*{touch-action:manipulation}` (wie in der Koeppchen-App — **reichte hier am iPhone nicht**, Fassung n, Ursache unbekannt); deshalb `touchend`-Wächter: zweiter Ein-Finger-Tipp < 350 ms und < 40 px vom ersten wird abgefangen (−/+ bekommt ihn per `click()`, Eingabefelder ausgenommen, zwei Finger frei — **nie `user-scalable=no`**, der Nutzer will Zwei-Finger-Zoom; Test `test/tippen.mjs`, Gegenprobe gemacht); Klick-Wächter im Capture: derselbe Knopf (id + data + Text) innerhalb 800 ms wird verschluckt, −/+ ausgenommen; `eintragen()` speichert denselben Inhalt innerhalb 3 s nicht zweimal (gibt dann `[]` zurück — Aufrufer müssen das abfangen). Tests in `oberflaeche.mjs`, Gegenprobe gemacht. Tests, die denselben Knopf zweimal drücken, müssen > 800 ms warten.
- **Artikel vor Namen** (vom Nutzer: „Du bass de Laurent“): Verkäufer (alle Männer) über `de()`/`beim()` („de Jeff“, „beim Jeff“, „d'Lager“, „am Lager“); Käufer können Frauen sein (d'Anne) → Sätze mit Käufernamen ohne Artikel bauen („Paul: 4 € bezuelt?“). Kommt eine Verkäuferin dazu, braucht `de()` eine Liste.
- **Verlauf: rotes ✕ = Läschen** (= storno, Text „Dësen Agab läschen?“, „geläscht vum …“), vom Nutzer: ↶ war unklar.
  **Iwwersiicht: rotes ▶/▼** vor jeder Sorte (vom Nutzer: Dreieck war zu klein).
  **Pro Zort zeigt nur aktuelle Biere**; archivierte (und Sorten ohne Eintrag) stehen gesammelt in einer Zeile
  „📦 Archiv (n)“ mit ihren Summen (Total bleibt vollständig), aufklappbar, darin je Bier kleiner und eingerückt,
  wieder mit ▶ zu den Verkäufen (vom Nutzer, 14.11.2026). Archiv zuklappen schließt ein offenes Archiv-Bier mit.
  Kopf: Name `white-space:nowrap` — bei langem Status (offline) brach er sonst als „Millebé / ier“ um.
- **Name im Kopf** ganz weiß, nur der Akzent auf dem é rot wie im Logo: weißes „e“ mit rotem Strich darüber (`.akz::after`), weil sich ein Akzent nicht einzeln einfärben lässt.
- **Farben wie im Logo** (vom Nutzer, 13.11.2026): schwarz, weiß, Rot `--akzent` (#e3141b) für Knöpfe und markierte Reiter, Kopf mit rotem Strich und grauer Linie wie der Logo-Ring. Grün (bezahlt) und Gelb (offen) bleiben als Bedeutungsfarben.
- iPhone-Regeln wie in den anderen Apps des Nutzers: kein `viewport-fit=cover`, Kasten mit
  fokussiertem Feld nie neu bauen (`tipptIn`), Zahlenfelder mit `inputmode`, Teilen über
  `navigator.share`.
- **`FASSUNG`** unten in `index.html` bei jeder Änderung hochzählen — daran hängt auch das **automatische Update** (vom Nutzer, 13.11.2026): beim Öffnen und bei jeder Rückkehr holt `updatePruefen()` die Seite mit `cache:"reload"`, steht dort eine andere FASSUNG, lädt die App neu; mitten im Eintrag (`mittenImEintrag`) stattdessen roter Knopf oben. Je Zielfassung ein Versuch in 5 min (`millebeier_v1_update`), gegen Schleifen bei altem CDN-Stand. Ohne Hochzählen kommt kein Update an. (Die Apps in panini-wm-2026 haben das nicht.)

## Neuanfang (14.11.2026, vom Nutzer)
`tools/neustart.sql` im D1-Dashboard (Console) ausführen: löscht alle Einträge außer Biere/bierstatus/Dateien/
einstellungen/`alt26-…`; Löschungen (storno) bleiben nur, wenn ihr Ziel bleibt. An einer nachgebauten SQLite-DB
geprüft (Gegenprobe gemacht). Die Datenbank ist von der Cloud-Umgebung aus nicht erreichbar — ausführen kann nur der
Nutzer. Rückweg: D1 Time Travel (Restore auf einen Zeitpunkt davor).

## Testen — vor jedem Push alle acht, jeder mit eigenem Rückgabewert
- `node test/logik.mjs` — schneidet `Logik`…`Oberfläche` aus der HTML (Gegenprobe gemacht).
- `node test/worker.mjs` — Worker mit nachgebauter D1.
- `node test/oberflaeche.mjs` — Playwright, zwei Handys gegen den echten Worker-Code, offline.
- `node test/tippen.mjs` — nachgebautes iPhone: Doppeltipp-Zoom-Sperre, −/+, schnelle Knopffolgen.
- `XLSX_JS=…/xlsx.full.min.js node test/livraisons.mjs` — Livraison planen/liefern/Rechnung/bezahlen, Liste pro Bier,
  Excel-Export (Datei wird mit SheetJS zurückgelesen), alter Worker. cdnjs ist in der Cloud-Umgebung gesperrt:
  SheetJS 0.18.5 per `npm install xlsx@0.18.5` in den Scratchpad, Pfad über `XLSX_JS`; ohne wird der Excel-Teil übersprungen.
- `XLSX_JS=… PDFJS_DIR=…/pdfjs-dist/build node test/dateien.mjs` (mit XLSX_JS auch .ods-Anzeige) — Dateien: PDF mit Vorschau, Foto, 1,5 MB in 3 Stücken (Byte für
  Byte auf dem zweiten Handy, Gegenprobe gemacht), Anzeige, Ersetzen, Löschen, > 10 MB abgelehnt. pdf.js per
  `npm install pdfjs-dist@3.11.174` in den Scratchpad. `test/fake-d1.mjs` = gemeinsame nachgebaute D1. Achtung beim
  Testen: derselbe Knopf zweimal < 800 ms zählt einmal (Doppeltipp-Schutz) — Tests müssen warten wie ein Mensch.
- `node test/faesser.mjs` — Bier mit Fässern, Fass-Zeilen, Reservierung + Warnung (Gegenprobe gemacht), Zahlungsarten.
- `node test/biere.mjs` — Bier anlegen/ändern/archivieren/zurückholen/löschen (zwei Rückfragen, Gegenprobe gemacht),
  rotes ✕ im Verlauf, rotes Dreieck.

## Ideen, nicht gebaut
Allgemeine Dateien ohne Bier (Logik kann `bier: ""` schon);
Excel-Datei, die sich ständig selbst aktualisiert (vom Nutzer gefragt 14.11.2026, Wege besprochen, noch offen);
Ausgaben (Malz, Hopfen, Flaschen) → Gewinn; Daueraufträge (in der alten Tabelle rot); Reservierungen; Kisten-Preis; Kassensturz (Ist-Betrag
in der Kasse gegen App).
